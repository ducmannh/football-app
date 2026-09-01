import { NextRequest, NextResponse } from "next/server";
import { getClubManager } from "@/lib/services/club-managers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const club = searchParams.get("club") || "";

  if (!club) {
    return NextResponse.json({ error: "Missing club parameter" }, { status: 400 });
  }

  const manager = getClubManager(club);

  return NextResponse.json({
    club,
    manager,
    updatedAt: new Date().toISOString(),
    source: "European Football Managers Official Database",
  });
}
