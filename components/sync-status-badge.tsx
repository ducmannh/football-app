"use client";

import React, { useState, useEffect } from "react";
import {
  triggerSync,
  triggerCleanDatabase,
  getDatabaseSummary,
  DatabaseSummary,
} from "@/lib/actions/sync";
import { SyncResult } from "@/lib/services/football-sync";
import {
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  Globe,
  Activity,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusBadgeProps {
  onSyncComplete?: () => void;
}

export function SyncStatusBadge({ onSyncComplete }: SyncStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncType, setSyncType] = useState<"quick" | "full" | "clean" | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbSummary, setDbSummary] = useState<DatabaseSummary | null>(null);

  // Load database summary when modal opens
  useEffect(() => {
    if (isOpen) {
      getDatabaseSummary().then(setDbSummary);
    }
  }, [isOpen]);

  const handleQuickSync = async () => {
    setLoading(true);
    setSyncType("quick");
    setError(null);
    setResult(null);

    try {
      const res = await triggerSync({ clean: false, seasons: ["2026/2027"] });
      if (res.success) {
        setResult(res);
        getDatabaseSummary().then(setDbSummary);
        onSyncComplete?.();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setSyncType(null);
    }
  };

  const handleFullSync = async () => {
    setLoading(true);
    setSyncType("full");
    setError(null);
    setResult(null);

    try {
      const res = await triggerSync({
        clean: false,
        seasons: ["2026/2027", "2025/2026", "2024/2025", "2023/2024"],
      });
      if (res.success) {
        setResult(res);
        getDatabaseSummary().then(setDbSummary);
        onSyncComplete?.();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setSyncType(null);
    }
  };

  const handleCleanAndRebuild = async () => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn XÓA TOÀN BỘ dữ liệu cũ và cào nạp lại mới 100% từ internet không?"
      )
    ) {
      return;
    }

    setLoading(true);
    setSyncType("clean");
    setError(null);
    setResult(null);

    try {
      const res = await triggerSync({
        clean: true,
        seasons: ["2026/2027", "2025/2026", "2024/2025", "2023/2024"],
      });
      if (res.success) {
        setResult(res);
        getDatabaseSummary().then(setDbSummary);
        onSyncComplete?.();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setSyncType(null);
    }
  };

  const handleCleanOnly = async () => {
    if (!confirm("CẢNH BÁO: Thao tác này sẽ xóa sạch toàn bộ dữ liệu trong Database. Bạn có tiếp tục không?")) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await triggerCleanDatabase();
      if (res.success) {
        setResult({
          success: true,
          message: res.message,
          cleaned: true,
          seasonsCount: 0,
          leaguesCount: 0,
          teamsCount: 0,
          playersCount: 0,
          matchesCount: 0,
          standingsCount: 0,
          statsCount: 0,
          timestamp: new Date().toISOString(),
        });
        getDatabaseSummary().then(setDbSummary);
        onSyncComplete?.();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mini Trigger Button in Header / Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card hover:bg-secondary/90 text-foreground border border-border/80 shadow-xs font-bold text-xs transition-all cursor-pointer select-none active:scale-95 hover:border-emerald-500/40"
        title="Trung Tâm Đồng Bộ Dữ Liệu Quốc Tế"
      >
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <RefreshCw
          className={cn(
            "w-3.5 h-3.5 text-emerald-500 transition-transform duration-500 group-hover:rotate-180",
            loading && "animate-spin"
          )}
        />
        <span className="hidden sm:inline font-extrabold tracking-tight">Đồng bộ</span>
      </button>

      {/* Control Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in text-foreground">
          <div className="relative w-full max-w-xl rounded-3xl border border-border/90 bg-card/98 backdrop-blur-3xl shadow-2xl p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* 1. Header Section */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/25 flex-shrink-0">
                  <Database className="w-5 h-5" />
                  <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-card" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                      Trung Tâm Đồng Bộ Dữ Liệu
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <Globe className="w-2.5 h-2.5" />
                      <span>ESPN Live</span>
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                    Nguồn cấp dữ liệu trực tiếp 8 giải đấu hàng đầu Châu Âu
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/60 shadow-xs hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Database Health & Current Overview Grid */}
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Trạng thái Database (PostgreSQL)</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>Đang kết nối</span>
                </span>
              </div>

              {dbSummary ? (
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-card border border-border/80 shadow-2xs">
                    <span className="block text-[10px] text-muted-foreground font-semibold">CLB</span>
                    <span className="font-black text-sm text-foreground">{dbSummary.teamsCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-card border border-border/80 shadow-2xs">
                    <span className="block text-[10px] text-muted-foreground font-semibold">Trận đấu</span>
                    <span className="font-black text-sm text-foreground">{dbSummary.matchesCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-card border border-border/80 shadow-2xs">
                    <span className="block text-[10px] text-muted-foreground font-semibold">Cầu thủ</span>
                    <span className="font-black text-sm text-foreground">{dbSummary.playersCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-card border border-border/80 shadow-2xs">
                    <span className="block text-[10px] text-muted-foreground font-semibold">Hàng BXH</span>
                    <span className="font-black text-sm text-emerald-500">{dbSummary.standingsCount}</span>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-muted-foreground">
                  Đang tải thông tin database...
                </div>
              )}
            </div>

            {/* 3. Result / Error Banner */}
            {result && (
              <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{result.message}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-foreground font-bold">
                  <span className="p-1.5 rounded-xl bg-card border border-border/80 text-center">
                    {result.teamsCount} CLB thật
                  </span>
                  <span className="p-1.5 rounded-xl bg-card border border-border/80 text-center">
                    {result.standingsCount} Hàng BXH
                  </span>
                  <span className="p-1.5 rounded-xl bg-card border border-border/80 text-center">
                    {result.playersCount} Cầu thủ
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 4. Action Cards */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground px-0.5">
                Tùy Chọn Đồng Bộ Dữ Liệu
              </p>

              {/* Option 1: Quick Live Sync */}
              <button
                type="button"
                disabled={loading}
                onClick={handleQuickSync}
                className={cn(
                  "w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left active:scale-[0.99] disabled:opacity-50",
                  "bg-gradient-to-r from-emerald-600/10 via-card to-card hover:border-emerald-500/50 border-emerald-500/20 shadow-xs"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                      <span>Đồng Bộ Nhanh Mùa Hiện Tại (2026/2027)</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Cập nhật tỉ số LIVE, kết quả mới nhất và BXH đang diễn ra
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-black text-emerald-500 pl-2">
                  <RefreshCw className={cn("w-4 h-4", syncType === "quick" && "animate-spin")} />
                  <span className="hidden sm:inline">{syncType === "quick" ? "Đang chạy..." : "Cập nhật"}</span>
                </div>
              </button>

              {/* Option 2: Full Multi-Season Sync */}
              <button
                type="button"
                disabled={loading}
                onClick={handleFullSync}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card hover:bg-secondary/70 border border-border/80 hover:border-border transition-all cursor-pointer text-left active:scale-[0.99] disabled:opacity-50 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-foreground">
                      Đồng Bộ Toàn Diện 4 Mùa Giải
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Cào và làm mới cả 4 mùa: 2026/2027, 2025/2026, 2024/2025, 2023/2024
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-black text-blue-500 pl-2">
                  <RefreshCw className={cn("w-4 h-4", syncType === "full" && "animate-spin")} />
                  <span className="hidden sm:inline">{syncType === "full" ? "Đang chạy..." : "Đồng bộ"}</span>
                </div>
              </button>

              {/* Option 3: Clean & Rebuild */}
              <button
                type="button"
                disabled={loading}
                onClick={handleCleanAndRebuild}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card hover:bg-amber-500/5 border border-border/80 hover:border-amber-500/40 transition-all cursor-pointer text-left active:scale-[0.99] disabled:opacity-50 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-foreground">
                      Dọn Dẹp & Tái Cấu Trúc Database 100%
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Xóa toàn bộ bản ghi cũ và nạp lại chuẩn từ đầu
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-black text-amber-500 pl-2">
                  <RefreshCw className={cn("w-4 h-4", syncType === "clean" && "animate-spin")} />
                  <span className="hidden sm:inline">{syncType === "clean" ? "Đang nạp..." : "Làm sạch"}</span>
                </div>
              </button>
            </div>

            {/* 5. Footer / Emergency Action */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span className="text-[11px]">Next.js Cache Revalidation Enabled</span>
              <button
                type="button"
                disabled={loading}
                onClick={handleCleanOnly}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                <span>Chỉ xóa database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
