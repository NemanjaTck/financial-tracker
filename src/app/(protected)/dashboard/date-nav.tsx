"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function DateNav({
  date,
  onDateChange,
  locale,
}: {
  date: string;
  onDateChange: (date: string) => void;
  locale: string;
}) {
  const t = useTranslations("home");

  function changeDay(offset: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + offset);
    onDateChange(d.toISOString().split("T")[0]);
  }

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => changeDay(-1)}
        aria-label={t("previousDay")}
      >
        <ChevronLeft />
      </Button>
      <div className="text-center">
        <span className="text-sm font-medium capitalize">
          {isToday(date) ? (
            <span className="text-primary">{t("today")}</span>
          ) : null}
          {isToday(date) ? " — " : ""}
          {formatDate(date, locale)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => changeDay(1)}
        disabled={isToday(date)}
        aria-label={t("nextDay")}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
