import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// URL cờ quốc gia chất lượng cao định dạng ảnh PNG/SVG (hoạt động 100% trên Windows, Android, iOS, macOS)
export function getCountryFlagUrl(countryOrCode?: string | null): string {
  if (!countryOrCode) return "https://flagcdn.com/w40/eu.png";
  const key = countryOrCode.trim();
  const map: Record<string, string> = {
    England: "https://flagcdn.com/w40/gb-eng.png",
    PL: "https://flagcdn.com/w40/gb-eng.png",
    FAC: "https://flagcdn.com/w40/gb-eng.png",
    EFL: "https://flagcdn.com/w40/gb-eng.png",
    Spain: "https://flagcdn.com/w40/es.png",
    PD: "https://flagcdn.com/w40/es.png",
    LL: "https://flagcdn.com/w40/es.png",
    CDR: "https://flagcdn.com/w40/es.png",
    Italy: "https://flagcdn.com/w40/it.png",
    SA: "https://flagcdn.com/w40/it.png",
    CI: "https://flagcdn.com/w40/it.png",
    Germany: "https://flagcdn.com/w40/de.png",
    BL1: "https://flagcdn.com/w40/de.png",
    BL: "https://flagcdn.com/w40/de.png",
    DFB: "https://flagcdn.com/w40/de.png",
    France: "https://flagcdn.com/w40/fr.png",
    L1: "https://flagcdn.com/w40/fr.png",
    FL1: "https://flagcdn.com/w40/fr.png",
    CDF: "https://flagcdn.com/w40/fr.png",
    Europe: "https://flagcdn.com/w40/eu.png",
    CL: "https://flagcdn.com/w40/eu.png",
    UCL: "https://flagcdn.com/w40/eu.png",
    EL: "https://flagcdn.com/w40/eu.png",
    UEL: "https://flagcdn.com/w40/eu.png",
    ECL: "https://flagcdn.com/w40/eu.png",
    UECL: "https://flagcdn.com/w40/eu.png",
  };
  return map[key] || "https://flagcdn.com/w40/eu.png";
}

export function formatRound(round?: string | null): string {
  if (!round) return "Vòng đấu";
  const r = round.trim();

  // Kiểm tra nếu r là chuỗi ngày/giờ tiếng Anh ESPN (VD: 'Mon, August 31st at 1:30 PM EDT' hoặc 'FT', 'AET')
  const hasTimeOrDate =
    r.includes("EDT") ||
    r.includes("EST") ||
    r.includes("UTC") ||
    r.includes(" at ") ||
    r.includes("AM") ||
    r.includes("PM") ||
    r.toLowerCase() === "ft" ||
    r.toLowerCase() === "aet";

  if (hasTimeOrDate) {
    if (r.toLowerCase().includes("final") && !r.toLowerCase().includes("semi") && !r.toLowerCase().includes("quarter")) {
      return "Chung kết";
    }
    if (r.toLowerCase().includes("semi")) {
      return "Bán kết";
    }
    if (r.toLowerCase().includes("quarter")) {
      return "Tứ kết";
    }
    return "Vòng đấu";
  }

  return r;
}
