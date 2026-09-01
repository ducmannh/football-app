import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Football Hub | Lịch thi đấu, Tỉ số trực tiếp 8 Giải Châu Âu",
  description:
    "Hệ thống cập nhật lịch thi đấu, kết quả và tỉ số trực tiếp 5 giải VĐQG hàng đầu và 3 Cúp Châu Âu (Champions League, Europa League, Conference League).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={cn("h-full font-sans antialiased", inter.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
