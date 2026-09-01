import { NextRequest, NextResponse } from "next/server";
import { ingestAllSeasons, cleanDatabase } from "@/lib/services/football-sync";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clean = searchParams.get("clean") === "true";

    const result = await ingestAllSeasons({ clean });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi đồng bộ dữ liệu (GET /api/sync):", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi hệ thống khi đồng bộ dữ liệu",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let clean = false;
    try {
      const body = await request.json();
      clean = body?.clean === true;
    } catch {
      const searchParams = request.nextUrl.searchParams;
      clean = searchParams.get("clean") === "true";
    }

    const result = await ingestAllSeasons({ clean });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi đồng bộ dữ liệu (POST /api/sync):", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi hệ thống khi đồng bộ dữ liệu",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await cleanDatabase();
    return NextResponse.json(
      {
        success: true,
        message: "Đã xóa sạch dữ liệu trong cơ sở dữ liệu.",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi khi xóa dữ liệu (DELETE /api/sync):", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi khi xóa dữ liệu",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
