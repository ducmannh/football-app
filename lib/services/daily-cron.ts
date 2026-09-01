import { syncRealStandingsForSeason, ingestAllSeasons } from "./football-sync";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

/**
 * Tính toán số mili-giây còn lại cho tới đúng 06:00:00 Sáng ngày tiếp theo theo Giờ Việt Nam (UTC+7)
 */
export function getMsUntilNext6AMVietnam(): number {
  const now = new Date();
  
  // Thời gian hiện tại theo UTC
  const utcNow = now.getTime();
  
  // Chuyển đổi sang giờ Việt Nam (UTC + 7 tiếng)
  const vnOffsetMs = 7 * 60 * 60 * 1000;
  const vnDate = new Date(utcNow + vnOffsetMs);

  const vnYear = vnDate.getUTCFullYear();
  const vnMonth = vnDate.getUTCMonth();
  const vnDay = vnDate.getUTCDate();
  const vnHours = vnDate.getUTCHours();
  const vnMinutes = vnDate.getUTCMinutes();
  const vnSeconds = vnDate.getUTCSeconds();

  // Tạo mốc 06:00:00 sáng hôm nay theo giờ VN
  let targetVN = new Date(Date.UTC(vnYear, vnMonth, vnDay, 6, 0, 0, 0));

  // Nếu hiện tại đã quá 06:00:00 sáng VN thì đặt mục tiêu là 06:00:00 sáng ngày mai
  if (vnHours > 6 || (vnHours === 6 && (vnMinutes > 0 || vnSeconds > 0))) {
    targetVN = new Date(Date.UTC(vnYear, vnMonth, vnDay + 1, 6, 0, 0, 0));
  }

  // Quy đổi mốc targetVN về mốc UTC thật
  const targetUtcMs = targetVN.getTime() - vnOffsetMs;
  const diffMs = targetUtcMs - utcNow;

  return Math.max(diffMs, 1000);
}

/**
 * Hàm thực thi đồng bộ toàn diện:
 * 1. Bảng Xếp Hạng (Standings)
 * 2. Chi Tiết Câu Lạc Bộ & Đội Hình (Clubs & Squads)
 * 3. Chi Tiết Cầu Thủ & 10 Chỉ Số ESPN (Players & ESPN Metrics)
 * 4. Thống Kê Giải Đấu (Stats Hub / Top Scorers / Assists)
 */
export async function runDailyStandingsAndStatsSync(): Promise<{
  success: boolean;
  message: string;
  timestamp: string;
  standingsCount: number;
  teamsCount: number;
  playersCount: number;
  statsCount: number;
}> {
  const startTime = new Date();
  const vnTimeStr = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(startTime);

  console.log(`\n======================================================`);
  console.log(`⏰ [CRON JOB 06:00 SÁNG VN] BẮT ĐẦU TỰ ĐỘNG CẬP NHẬT TOÀN DIỆN TỪ ESPN...`);
  console.log(`📅 Thời gian kích hoạt: ${vnTimeStr}`);
  console.log(`======================================================\n`);

  try {
    const currentSeason = "2026/2027";

    // 1. Cập nhật Bảng Xếp Hạng thực tế từ ESPN
    console.log(`⏳ 1/4. Đang cào và cập nhật Bảng Xếp Hạng mùa ${currentSeason} từ ESPN...`);
    const standingsCount = await syncRealStandingsForSeason(currentSeason);
    console.log(`✅ 1/4. Đã cập nhật xong Bảng Xếp Hạng (${standingsCount} bản ghi).`);

    // 2. Cập nhật Chi Tiết Câu Lạc Bộ, Đội Hình & Cầu Thủ & 10 Chỉ Số ESPN
    console.log(`⏳ 2/4 & 3/4. Đang cào và cập nhật Chi Tiết CLB, Đội Hình & Thống Kê Cầu Thủ từ ESPN...`);
    await ingestAllSeasons({ clean: false, seasons: [currentSeason] });

    const teamsCount = await prisma.team.count();
    const playersCount = await prisma.player.count();
    const statsCount = await prisma.playerSeasonStat.count();
    console.log(`✅ 2/4. Đã cập nhật xong Chi Tiết CLB (${teamsCount} CLB).`);
    console.log(`✅ 3/4. Đã cập nhật xong Chi Tiết Cầu Thủ & 10 Chỉ Số ESPN (${playersCount} cầu thủ, ${statsCount} bản ghi).`);

    // 4. Revalidate toàn bộ bộ nhớ đệm (Cache)
    console.log(`⏳ 4/4. Đang làm mới bộ nhớ đệm (Cache Revalidation)...`);
    try {
      revalidateTag("standings", "max");
      revalidateTag("stats", "max");
      revalidateTag("matches", "max");
      revalidateTag("seasons", "max");
      revalidateTag("leagues", "max");
    } catch {
      // ignore
    }
    console.log(`✅ 4/4. Đã làm mới xong Cache hệ thống.`);

    const finishTimeStr = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date());

    console.log(`\n🎉 [CRON JOB HOÀN TẤT] Đồng bộ Bảng xếp hạng, CLB, Cầu thủ & Thống kê thành công lúc ${finishTimeStr}!\n`);

    return {
      success: true,
      message: `Đã tự động cập nhật Bảng xếp hạng (${standingsCount}), CLB (${teamsCount}), Cầu thủ (${playersCount}) và Thống kê (${statsCount}) thành công lúc ${finishTimeStr}`,
      timestamp: new Date().toISOString(),
      standingsCount,
      teamsCount,
      playersCount,
      statsCount,
    };
  } catch (error) {
    console.error(`❌ [CRON JOB LỖI] Cập nhật tự động thất bại:`, error);
    return {
      success: false,
      message: `Lỗi cập nhật tự động: ${String(error)}`,
      timestamp: new Date().toISOString(),
      standingsCount: 0,
      teamsCount: 0,
      playersCount: 0,
      statsCount: 0,
    };
  }
}

// Global flag to prevent duplicate timers in hot reload
let isSchedulerInitialized = false;

/**
 * Khởi động bộ lập lịch tự động chạy lúc 06:00:00 sáng hàng ngày theo giờ Việt Nam
 */
export function initDailyCronScheduler() {
  if (isSchedulerInitialized) return;
  isSchedulerInitialized = true;

  const initialDelayMs = getMsUntilNext6AMVietnam();
  const hoursUntil = (initialDelayMs / (1000 * 60 * 60)).toFixed(2);

  const nextRunVN = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date(Date.now() + initialDelayMs));

  console.log(`\n🚀 [CRON SCHEDULER ĐÃ KÍCH HOẠT]`);
  console.log(`⏰ Lần tự động cập nhật tiếp theo: ${nextRunVN} (còn khoảng ${hoursUntil} giờ).`);
  console.log(`🔁 Chu kỳ: 06:00:00 Sáng hàng ngày (Giờ Việt Nam UTC+7).\n`);

  setTimeout(async () => {
    // Chạy lần đầu tiên vào đúng 06:00 sáng
    await runDailyStandingsAndStatsSync();

    // Sau đó lặp lại đều đặn mỗi 24 tiếng (86,400,000 ms)
    setInterval(async () => {
      await runDailyStandingsAndStatsSync();
    }, 24 * 60 * 60 * 1000);
  }, initialDelayMs);
}
