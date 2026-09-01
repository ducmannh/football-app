import { NextResponse } from "next/server";
import { runDailyStandingsAndStatsSync } from "@/lib/services/daily-cron";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runDailyStandingsAndStatsSync();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: "Lỗi thực thi cron job cập nhật bảng xếp hạng & thống kê",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
