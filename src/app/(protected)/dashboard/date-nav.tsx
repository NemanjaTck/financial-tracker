"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDate(dateStr: string, locale: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(locale === "sr" ? "sr-Latn-RS" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isToday(dateStr: string) {
  const today = new Date();
  return dateStr === today.toISOString().split("T")[0];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 7 : day; // 1=Mon ... 7=Sun
}

const SHORT_DAYS = {
  sr: ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const MONTH_NAMES = {
  sr: [
    "Januar", "Februar", "Mart", "April", "Maj", "Jun",
    "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};

export function DateNav({
  date,
  onDateChange,
  locale,
  uncheckedDates = [],
}: {
  date: string;
  onDateChange: (date: string) => void;
  locale: string;
  uncheckedDates?: string[];
}) {
  const t = useTranslations("home");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const currentDate = new Date(date + "T00:00:00");
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());

  const uncheckedSet = new Set(uncheckedDates);
  const lang = locale === "sr" ? "sr" : "en";

  function changeDay(offset: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + offset);
    onDateChange(d.toISOString().split("T")[0]);
  }

  function openCalendar() {
    const d = new Date(date + "T00:00:00");
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setCalendarOpen(true);
  }

  function selectDate(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onDateChange(dateStr);
    setCalendarOpen(false);
  }

  function navigateMonth(delta: number) {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      <div className="flex items-center justify-center">
        <button
          onClick={openCalendar}
          className="text-center flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">
            {isToday(date) ? (
              <span className="text-primary">{t("today")}</span>
            ) : null}
            {isToday(date) ? " — " : ""}
            {formatDate(date, locale)}
          </span>
        </button>
      </div>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">{t("selectDate")}</DialogTitle>
          </DialogHeader>
          {/* Calendar month nav */}
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon-sm" onClick={() => navigateMonth(-1)}>
              <ChevronLeft />
            </Button>
            <span className="font-semibold text-sm">
              {MONTH_NAMES[lang][viewMonth]} {viewYear}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => navigateMonth(1)}>
              <ChevronRight />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {SHORT_DAYS[lang].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells for days before first day of month */}
            {Array.from({ length: firstDay - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = dateStr === date;
              const isTodayDate = dateStr === todayStr;
              const isUnchecked = uncheckedSet.has(dateStr);

              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  className={`h-9 w-full rounded-md text-sm font-medium transition-colors relative ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isTodayDate
                        ? "bg-accent font-bold"
                        : "hover:bg-muted"
                  }`}
                >
                  {day}
                  {isUnchecked && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
