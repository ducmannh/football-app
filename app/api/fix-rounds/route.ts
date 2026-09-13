import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Sửa trực tiếp các vòng bị lệch hàng trăm
    const r119 = await prisma.$executeRawUnsafe(`UPDATE matches SET round = 'Vòng 5' WHERE round = 'Vòng 119'`);
    const r118 = await prisma.$executeRawUnsafe(`UPDATE matches SET round = 'Vòng 4' WHERE round = 'Vòng 118'`);
    const r106 = await prisma.$executeRawUnsafe(`UPDATE matches SET round = 'Vòng 4' WHERE round = 'Vòng 106'`);
    const r105 = await prisma.$executeRawUnsafe(`UPDATE matches SET round = 'Vòng 3' WHERE round = 'Vòng 105'`);

    // 2. Chuẩn hóa toàn bộ vòng đấu qua hàm standardizeAllMatchRounds
    const { standardizeAllMatchRounds } = await import("@/lib/services/football-sync");
    await standardizeAllMatchRounds();

    // 3. Kiểm tra lại số trận có vòng bất thường
    const remaining = await prisma.$queryRawUnsafe<any[]>(`
      SELECT round, count(*)::text as count 
      FROM matches 
      WHERE round ~ 'Vòng [0-9]{3}' 
      GROUP BY round
    `);

    return NextResponse.json({
      success: true,
      message: "Đã chuẩn hóa và khôi phục toàn bộ số vòng đấu thành công!",
      fixedSummary: {
        vong119: r119,
        vong118: r118,
        vong106: r106,
        vong105: r105,
      },
      remainingAnomalies: remaining,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Lỗi khi sửa vòng đấu:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
