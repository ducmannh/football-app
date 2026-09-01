"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
  Sparkles,
  CalendarDays,
} from "lucide-react";

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  hasLiveToday: boolean;
}

export function DateSelector({
  selectedDate,
  onSelectDate,
  hasLiveToday,
}: DateSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarModalRef = useRef<HTMLDivElement>(null);

  // Helper format YYYY-MM-DD
  const formatDateStr = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = useMemo(() => formatDateStr(new Date()), []);

  // Hàm tính ngày Thứ 2 đầu tuần (Monday) của bất kỳ ngày nào
  const getMondayOfDate = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const day = date.getUTCDay(); // 0 = Chủ Nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    const diff = day === 0 ? -6 : 1 - day; // Nếu là CN lùi 6 ngày về Thứ 2, còn lại lùi về 1 - day
    date.setUTCDate(date.getUTCDate() + diff);
    return date;
  };

  // Tạo chính xác 7 ngày trong 1 tuần từ Thứ 2 đến Chủ Nhật
  const currentWeekDays = useMemo(() => {
    const monday = getMondayOfDate(selectedDate);
    const todayNoon = new Date(
      Date.UTC(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        12,
        0,
        0
      )
    );

    const days = [];
    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday);
      dt.setUTCDate(monday.getUTCDate() + i);

      const yyyy = dt.getUTCFullYear();
      const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(dt.getUTCDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const label = `${dd}/${mm}`;
      let subtitle = dayNames[i];

      if (dateStr === todayStr) {
        subtitle = "H.Nay";
      } else {
        const diffDays = Math.round(
          (dt.getTime() - todayNoon.getTime()) / 86400000
        );
        if (diffDays === -1) subtitle = "H.Qua";
        else if (diffDays === 1) subtitle = "N.Mai";
      }

      days.push({
        dateStr,
        label,
        subtitle,
        dayName: dayNames[i],
        dayNumber: dd,
        monthNumber: mm,
        yearNumber: yyyy,
        isToday: dateStr === todayStr,
        isWeekend: i === 5 || i === 6, // Thứ 7 & CN
      });
    }

    return days;
  }, [selectedDate, todayStr]);

  // Thông tin tiêu đề tuần (Ví dụ: Tuần 31/08 - 06/09/2026)
  const weekRangeLabel = useMemo(() => {
    if (currentWeekDays.length < 7) return "";
    const first = currentWeekDays[0];
    const last = currentWeekDays[6];
    return `Tuần ${first.dayNumber}/${first.monthNumber} - ${last.dayNumber}/${last.monthNumber}/${last.yearNumber}`;
  }, [currentWeekDays]);

  // Điều hướng Tuần Trước / Tuần Sau (Nhảy đúng 7 ngày)
  const handlePrevWeek = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d - 7, 12, 0, 0));
    onSelectDate(
      `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}-${String(prev.getUTCDate()).padStart(2, "0")}`
    );
  };

  const handleNextWeek = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 7, 12, 0, 0));
    onSelectDate(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}-${String(next.getUTCDate()).padStart(2, "0")}`
    );
  };

  const handleTodayClick = () => {
    onSelectDate(todayStr);
  };

  // State cho bộ lịch tùy chỉnh (Custom Calendar Dropdown)
  const [calYear, setCalYear] = useState(() =>
    parseInt(selectedDate.split("-")[0], 10)
  );
  const [calMonth, setCalMonth] = useState(
    () => parseInt(selectedDate.split("-")[1], 10) - 1
  );

  // Đóng dropdown khi bấm ra ngoài hoặc nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCalendarOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        calendarModalRef.current &&
        !calendarModalRef.current.contains(e.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Tạo ma trận các ngày trong tháng cho Calendar Dropdown
  const calendarMatrix = useMemo(() => {
    const firstDayOfMonth = new Date(Date.UTC(calYear, calMonth, 1, 12, 0, 0));
    const lastDayOfMonth = new Date(
      Date.UTC(calYear, calMonth + 1, 0, 12, 0, 0)
    );
    const daysInMonth = lastDayOfMonth.getUTCDate();

    // Thứ 2 = 0, ..., CN = 6
    let startingDayOfWeek = firstDayOfMonth.getUTCDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days = [];

    // Ngày của tháng trước để lấp đầy hàng đầu
    const prevMonthLastDay = new Date(
      Date.UTC(calYear, calMonth, 0, 12, 0, 0)
    ).getUTCDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = prevMonthLastDay - i;
      const prevM = calMonth === 0 ? 12 : calMonth;
      const prevY = calMonth === 0 ? calYear - 1 : calYear;
      days.push({
        dateStr: `${prevY}-${String(prevM).padStart(2, "0")}-${String(
          prevDate
        ).padStart(2, "0")}`,
        dayNumber: prevDate,
        isCurrentMonth: false,
      });
    }

    // Ngày của tháng hiện tại
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(
        2,
        "0"
      )}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    // Ngày của tháng tiếp theo để đủ 35 hoặc 42 ô
    const totalCells = days.length <= 35 ? 35 : 42;
    const remainingCells = totalCells - days.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextM = calMonth === 11 ? 1 : calMonth + 2;
      const nextY = calMonth === 11 ? calYear + 1 : calYear;
      days.push({
        dateStr: `${nextY}-${String(nextM).padStart(2, "0")}-${String(
          d
        ).padStart(2, "0")}`,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calYear, calMonth, selectedDate, todayStr]);

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const handlePrevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const isTodaySelected = selectedDate === todayStr;

  return (
    <div className="relative z-30 w-full bg-card/85 backdrop-blur-md border-b border-border/70 py-2 sm:py-2.5 transition-colors select-none">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 space-y-1.5 sm:space-y-2">
        {/* ======================================================== */}
        {/* HÀNG 1: ĐIỀU HƯỚNG TUẦN & CÁC NÚT TÁC VỤ (HÔM NAY, LỊCH)  */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between gap-2">
          {/* Cụm Điều Hướng Tuần: Nút Lùi - Nhãn Tuần - Nút Tiến */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-secondary/60 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-border/60 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevWeek}
              aria-label="Tuần trước"
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs active:scale-90 border border-border/70"
              title="Tuần trước"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <span className="text-[11px] sm:text-xs font-black tracking-tight text-foreground px-2 sm:px-2.5 whitespace-nowrap">
              {weekRangeLabel}
            </span>

            <button
              type="button"
              onClick={handleNextWeek}
              aria-label="Tuần tiếp theo"
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs active:scale-90 border border-border/70"
              title="Tuần tiếp theo"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Cụm Tác Vụ Phải (Có chứa Neo Định Vị Dropdown Lịch Ở Dưới) */}
          <div className="relative flex items-center gap-1.5 flex-shrink-0" ref={calendarModalRef}>
            {!isTodaySelected && (
              <button
                type="button"
                onClick={handleTodayClick}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                title="Quay lại hôm nay"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Hôm nay</span>
              </button>
            )}

            {/* Nút Mở Dropdown Lịch */}
            <button
              type="button"
              onClick={() => {
                if (!isCalendarOpen) {
                  const [y, m] = selectedDate.split("-").map(Number);
                  setCalYear(y);
                  setCalMonth(m - 1);
                }
                setIsCalendarOpen(!isCalendarOpen);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer text-xs font-bold shadow-2xs active:scale-95",
                isCalendarOpen
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/25"
                  : "bg-card hover:bg-secondary text-foreground border-border/80 hover:border-emerald-500/40"
              )}
              title="Mở bảng lịch chọn ngày bất kỳ"
            >
              <CalendarIcon
                className={cn(
                  "w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0",
                  isCalendarOpen ? "text-white" : "text-emerald-500"
                )}
              />
              <span className="font-extrabold">Lịch</span>
            </button>

            {/* ======================================================== */}
            {/* GIAO DIỆN DROPDOWN LỊCH THẢ NGAY DƯỚI NÚT LỊCH            */}
            {/* ======================================================== */}
            {isCalendarOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 p-3.5 sm:p-4 rounded-3xl border border-border/90 bg-card/98 backdrop-blur-3xl shadow-2xl space-y-3 text-foreground animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header Lịch: Chọn Tháng & Năm */}
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs sm:text-sm text-foreground">
                        {monthNames[calMonth]}, {calYear}
                      </h3>
                    </div>
                  </div>

                  {/* Nút Chuyển Tháng */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevCalMonth}
                      className="p-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/60"
                      title="Tháng trước"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextCalMonth}
                      className="p-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/60"
                      title="Tháng sau"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tên các thứ trong tuần (Thứ 2 -> Chủ Nhật) */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-muted-foreground uppercase">
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span className="text-amber-500 font-extrabold">T7</span>
                  <span className="text-rose-500 font-extrabold">CN</span>
                </div>

                {/* Ma Trận Ngày Trong Tháng */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarMatrix.map((cDay, idx) => {
                    const isSelected = selectedDate === cDay.dateStr;

                    return (
                      <button
                        key={`${cDay.dateStr}-${idx}`}
                        type="button"
                        onClick={() => {
                          onSelectDate(cDay.dateStr);
                          setIsCalendarOpen(false);
                        }}
                        className={cn(
                          "h-7 sm:h-8 rounded-xl flex items-center justify-center font-bold text-[11px] sm:text-xs font-mono transition-all cursor-pointer relative active:scale-95",
                          !cDay.isCurrentMonth &&
                            "text-muted-foreground/30 hover:text-muted-foreground",
                          cDay.isCurrentMonth &&
                            !isSelected &&
                            "hover:bg-secondary text-foreground",
                          isSelected
                            ? "bg-gradient-to-b from-emerald-500 to-teal-600 text-white font-black shadow-xs ring-1 ring-emerald-400"
                            : "",
                          cDay.isToday &&
                            !isSelected &&
                            "border border-emerald-500 text-emerald-500 font-black bg-emerald-500/5"
                        )}
                      >
                        <span>{cDay.dayNumber}</span>
                        {cDay.isToday && (
                          <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Phím Tắt Nhanh Dưới Cùng */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDate(todayStr);
                      setIsCalendarOpen(false);
                    }}
                    className="flex items-center gap-1 font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer p-0.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>
                      Về Hôm nay ({todayStr.slice(8, 10)}/{todayStr.slice(5, 7)})
                    </span>
                  </button>

                  <span className="text-muted-foreground text-[10px]">
                    T2 ➡️ CN
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* HÀNG 2: 7 NGÀY TRONG TUẦN (THỨ 2 -> CHỦ NHẬT) RỘNG RÃI   */}
        {/* ======================================================== */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {currentWeekDays.map((item) => {
            const isSelected = selectedDate === item.dateStr;

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => onSelectDate(item.dateStr)}
                className={cn(
                  "relative w-full flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 overflow-hidden",
                  isSelected
                    ? "bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-700 text-white border-emerald-400 shadow-md shadow-emerald-500/25 font-black ring-2 ring-emerald-500/30 scale-[1.02] z-10"
                    : "bg-secondary/40 border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:border-border"
                )}
              >
                {/* Thứ trong tuần */}
                <span
                  className={cn(
                    "text-[9px] sm:text-[11px] font-bold tracking-tight uppercase truncate max-w-full leading-none mb-1",
                    isSelected
                      ? "text-emerald-100 font-black"
                      : item.isWeekend
                      ? "text-amber-500 font-extrabold dark:text-amber-400"
                      : "text-muted-foreground"
                  )}
                >
                  {item.subtitle}
                </span>

                {/* Ngày / Tháng đầy đủ (Ví dụ: 31/08, 01/09) */}
                <span
                  className={cn(
                    "text-[11px] sm:text-sm md:text-base font-black font-mono tracking-tight leading-none",
                    isSelected ? "text-white" : "text-foreground"
                  )}
                >
                  {item.label}
                </span>

                {/* Đèn Live đỏ nhấp nháy cho ngày hôm nay */}
                {item.isToday && hasLiveToday && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-card" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
