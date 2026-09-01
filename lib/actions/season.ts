"use server";

import { prisma } from "@/lib/prisma";
import { Season } from "@/types/football";
import { unstable_cache } from "next/cache";

export async function getSeasons(): Promise<Season[]> {
  try {
    try {
      const getCachedSeasons = unstable_cache(
        fetchSeasonsFromDB,
        ["curated-seasons-list-v3"],
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
      {
        id: "s2025-2026",
        name: "2025/2026",
        isCurrent: false,
        startDate: "2025-08-15",
        endDate: "2026-05-31",
      },
    ] as unknown as Season[];
  }
}

async function fetchSeasonsFromDB(): Promise<Season[]> {
  const list = await prisma.season.findMany({
    where: {
      name: { in: ["2026/2027", "2025/2026"] },
    },
    orderBy: { name: "desc" },
  });

  if (list.length > 0) {
    return list as unknown as Season[];
  }

  // Tạo sẵn 2 mùa giải nếu bảng trống
  const defaults = [
    { name: "2026/2027", isCurrent: true, start: "2026-08-15", end: "2027-05-31" },
    { name: "2025/2026", isCurrent: false, start: "2025-08-15", end: "2026-05-31" },
  ];

  for (const d of defaults) {
    await prisma.season.upsert({
      where: { name: d.name },
      update: { isCurrent: d.isCurrent },
      create: {
        name: d.name,
        isCurrent: d.isCurrent,
        startDate: new Date(d.start),
        endDate: new Date(d.end),
      },
    });
  }

  const freshList = await prisma.season.findMany({
    where: {
      name: { in: ["2026/2027", "2025/2026"] },
    },
    orderBy: { name: "desc" },
  });

  return freshList as unknown as Season[];
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
