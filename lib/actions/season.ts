"use server";

import { prisma } from "@/lib/prisma";
import { Season } from "@/types/football";
import { unstable_cache } from "next/cache";

export async function getSeasons(): Promise<Season[]> {
  try {
    try {
      const getCachedSeasons = unstable_cache(
        fetchSeasonsFromDB,
        ["curated-seasons-list-v4"],
        { revalidate: 3600, tags: ["seasons"] }
      );

      return await getCachedSeasons();
    } catch {
      return await fetchSeasonsFromDB();
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách mùa giải:", error);
    return [
      {
        id: "s2026-2027",
        name: "2026/2027",
        isCurrent: true,
        startDate: "2026-08-15",
        endDate: "2027-05-31",
      },
    ] as unknown as Season[];
  }
}

async function fetchSeasonsFromDB(): Promise<Season[]> {
  const list = await prisma.season.findMany({
    where: {
      name: "2026/2027",
    },
    orderBy: { name: "desc" },
  });

  if (list.length > 0) {
    return list as unknown as Season[];
  }

  const created = await prisma.season.upsert({
    where: { name: "2026/2027" },
    update: { isCurrent: true },
    create: {
      name: "2026/2027",
      isCurrent: true,
      startDate: new Date("2026-08-15"),
      endDate: new Date("2027-05-31"),
    },
  });

  return [created] as unknown as Season[];
}

export async function getCurrentSeason(): Promise<Season | null> {
  try {
    const current = await prisma.season.findFirst({
      where: { isCurrent: true },
    });
    if (current) return current as unknown as Season;

    const latest = await prisma.season.findFirst({
      orderBy: { name: "desc" },
    });
    return latest as unknown as Season;
  } catch (error) {
    console.error("Lỗi khi lấy mùa giải hiện tại:", error);
    return null;
  }
}
