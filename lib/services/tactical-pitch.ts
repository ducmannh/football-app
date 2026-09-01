/**
 * Thuật toán phân bổ đội hình chuẩn FIFA / Sofascore / FotMob
 * Đảm bảo 11 vị trí trên sân có không gian thoáng, phân bổ chuẩn xác theo sơ đồ (4-2-3-1, 4-3-3, 3-4-2-1, 3-5-2, 5-4-1, 4-4-2)
 */

export interface PitchCoordinate {
  x: number;
  y: number;
}

export function getExactPositionCoordinates(
  posAbbr: string = "",
  posName: string = "",
  formation: string = "4-2-3-1",
  indexInLineup: number = 0
): PitchCoordinate {
  const abbr = posAbbr.toUpperCase().trim();
  const name = posName.toLowerCase().trim();
  const form = (formation || "4-2-3-1").trim();

  // 1. Goalkeeper
  if (abbr === "G" || abbr === "GK" || name.includes("goal") || indexInLineup === 0) {
    return { x: 7, y: 50 };
  }

  // 2. Defenders
  if (abbr === "LB" || name.includes("left back")) {
    return { x: 18, y: 15 };
  }
  if (abbr === "LWB" || (abbr === "LM" && name.includes("wing back"))) {
    return { x: 25, y: 15 };
  }
  if (abbr === "CD-L" || abbr === "LCB" || name.includes("center left def")) {
    return { x: 16, y: form.startsWith("3") || form.startsWith("5") ? 28 : 38 };
  }
  if (abbr === "CD" || abbr === "CB" || name.includes("center def")) {
    return { x: 15, y: 50 };
  }
  if (abbr === "CD-R" || abbr === "RCB" || name.includes("center right def")) {
    return { x: 16, y: form.startsWith("3") || form.startsWith("5") ? 72 : 62 };
  }
  if (abbr === "RB" || name.includes("right back")) {
    return { x: 18, y: 85 };
  }
  if (abbr === "RWB" || (abbr === "RM" && name.includes("wing back"))) {
    return { x: 25, y: 85 };
  }

  // 3. Defensive / Central Midfielders
  if (abbr === "DM-L" || abbr === "LDM" || (abbr === "LM" && form === "4-2-3-1")) {
    return { x: 26, y: 38 };
  }
  if (abbr === "DM-R" || abbr === "RDM" || (abbr === "RM" && form === "4-2-3-1")) {
    return { x: 26, y: 62 };
  }
  if (abbr === "DM" || abbr === "CDM") {
    return { x: 25, y: 50 };
  }
  if (abbr === "CM-L" || abbr === "LCM") {
    return { x: 27, y: 34 };
  }
  if (abbr === "CM" || abbr === "MC") {
    return { x: 26, y: 50 };
  }
  if (abbr === "CM-R" || abbr === "RCM") {
    return { x: 27, y: 66 };
  }
  if (abbr === "LM" || abbr === "ML") {
    return { x: 29, y: 18 };
  }
  if (abbr === "RM" || abbr === "MR") {
    return { x: 29, y: 82 };
  }

  // 4. Attacking Midfielders / Wingers
  if (abbr === "AM-L" || abbr === "LAM" || abbr === "LW" || name.includes("attacking midfielder left") || name.includes("left wing")) {
    return { x: 36, y: 22 };
  }
  if (abbr === "AM-R" || abbr === "RAM" || abbr === "RW" || name.includes("attacking midfielder right") || name.includes("right wing")) {
    return { x: 36, y: 78 };
  }
  if (abbr === "AM" || abbr === "CAM" || name === "attacking midfielder" || (name.includes("attacking midfielder") && !name.includes("left") && !name.includes("right"))) {
    return { x: 34, y: 50 };
  }

  // 5. Forwards / Strikers
  if (abbr === "CF-L" || abbr === "LF" || abbr === "LS") {
    return { x: 43, y: 36 };
  }
  if (abbr === "CF-R" || abbr === "RF" || abbr === "RS") {
    return { x: 43, y: 64 };
  }
  if (abbr === "F" || abbr === "CF" || abbr === "ST" || abbr === "FW" || name.includes("forw") || name.includes("strik")) {
    return { x: 44, y: 50 };
  }

  // Default fallback based on index
  const defaultSlots: PitchCoordinate[] = [
    { x: 7, y: 50 },  // 0: GK
    { x: 18, y: 15 }, // 1: LB
    { x: 16, y: 38 }, // 2: LCB
    { x: 16, y: 62 }, // 3: RCB
    { x: 18, y: 85 }, // 4: RB
    { x: 26, y: 38 }, // 5: LDM
    { x: 26, y: 62 }, // 6: RDM
    { x: 36, y: 22 }, // 7: LW
    { x: 34, y: 50 }, // 8: CAM
    { x: 36, y: 78 }, // 9: RW
    { x: 44, y: 50 }, // 10: ST
  ];

  return defaultSlots[indexInLineup] || { x: 25, y: 50 };
}

export function calculateTacticalFormationPositions(
  starters: Array<{
    id: string;
    name: string;
    posAbbr?: string;
    posName?: string;
  }>,
  formation: string = "4-2-3-1",
  isHome: boolean
): Array<PitchCoordinate> {
  const results = starters.map((p, idx) => {
    const coord = getExactPositionCoordinates(p.posAbbr, p.posName, formation, idx);
    if (isHome) {
      return coord;
    } else {
      return {
        x: 100 - coord.x,
        y: coord.y,
      };
    }
  });

  return results;
}
