import { ingestAllSeasons } from "../lib/services/football-sync";
import "dotenv/config";

async function main() {
  console.log("🌱 Khởi tạo dữ liệu thực tế từ ESPN (Seeding Real ESPN Football Data)...");
  
  const result = await ingestAllSeasons({
    clean: true,
    seasons: ["2026/2027", "2025/2026"],
  });

  console.log("✅ Hoàn tất:", result.message);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi Seeding:", e);
    process.exit(1);
  });
