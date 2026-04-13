"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Check,
  X,
  Pencil,
  ArrowLeftRight,
  Ban,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { checkIn, uncheckEntry, skipEntry } from "./actions";
import type { ScheduleEntry } from "./actions";

export function ScheduleEntryCard({
  entry,
  date,
  onEditHours,
  onSwapEmployee,
}: {
  entry: ScheduleEntry;
  date: string;
  onEditHours: (entry: ScheduleEntry) => void;
  onSwapEmployee: (entry: ScheduleEntry) => void;
}) {
  const t = useTranslations("home");
  const [isPending, startTransition] = useTransition();

  const isSkipped = entry.checked && entry.hours === 0 && entry.notes === "skipped";

  function handleCheckIn() {
    startTransition(async () => {
      try {
        await checkIn(entry.job_id, entry.employee_id, date, entry.hours);
      } catch {
        toast.error("Failed to check in");
      }
    });
  }

  function handleUncheck() {
    if (!entry.work_log_id) return;
    startTransition(async () => {
      try {
        await uncheckEntry(entry.work_log_id!);
      } catch {
        toast.error("Failed to uncheck");
      }
    });
  }

  function handleSkip() {
    startTransition(async () => {
      try {
        await skipEntry(entry.job_id, entry.employee_id, date);
      } catch {
        toast.error("Failed to skip");
      }
    });
  }

  return (
    <Card
      size="sm"
      className={
        entry.checked && !isSkipped
          ? "border-primary/30 bg-primary/5"
          : isSkipped
            ? "opacity-50"
            : ""
      }
    >
      <CardContent className="flex items-center gap-3">
        {/* Check/uncheck button */}
        <Button
          variant={entry.checked && !isSkipped ? "default" : "outline"}
          size="icon-sm"
          onClick={entry.checked && !isSkipped ? handleUncheck : handleCheckIn}
          disabled={isPending}
          className="shrink-0"
        >
          {entry.checked && !isSkipped ? <Check /> : <Check />}
        </Button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {entry.employee_name}
            </span>
            {entry.is_extra && (
              <Badge variant="secondary" className="gap-1">
                <Star className="size-2.5" />
                {t("extraWork")}
              </Badge>
            )}
            {isSkipped && (
              <Badge variant="outline">{t("skipped")}</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {entry.client_name} — {entry.job_location}
          </div>
        </div>

        {/* Hours display */}
        <div className="text-sm font-medium tabular-nums shrink-0">
          {isSkipped ? "—" : `${entry.hours}h`}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onEditHours(entry)}
            disabled={isPending || isSkipped}
            title={t("editHours")}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onSwapEmployee(entry)}
            disabled={isPending || isSkipped}
            title={t("swapEmployee")}
          >
            <ArrowLeftRight />
          </Button>
          {!isSkipped ? (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleSkip}
              disabled={isPending}
              title={t("markNotWorking")}
            >
              <Ban />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCheckIn}
              disabled={isPending}
              title={t("checkIn")}
            >
              <X />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
