"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
  // Optimistic state for instant visual feedback
  const [optimisticChecked, setOptimisticChecked] = useState<boolean | null>(null);

  const checked = optimisticChecked ?? entry.checked;
  const isSkipped = checked && entry.hours === 0 && entry.notes === "skipped";

  function handleCheckIn() {
    setOptimisticChecked(true);
    startTransition(async () => {
      try {
        await checkIn(entry.job_id, entry.employee_id, date, entry.hours);
      } catch {
        setOptimisticChecked(null);
        toast.error("Failed to check in");
      }
    });
  }

  function handleUncheck() {
    if (!entry.work_log_id) return;
    setOptimisticChecked(false);
    startTransition(async () => {
      try {
        await uncheckEntry(entry.work_log_id!);
      } catch {
        setOptimisticChecked(null);
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

  const isCheckedAndNotSkipped = checked && !isSkipped;

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        backgroundColor: isCheckedAndNotSkipped
          ? "var(--color-primary-foreground)"
          : "transparent",
      }}
      transition={{ duration: 0.2 }}
    >
      <Card
        size="sm"
        className={`transition-colors duration-200 ${
          isCheckedAndNotSkipped
            ? "border-primary/30 bg-primary/5"
            : isSkipped
              ? "opacity-50"
              : ""
        }`}
      >
        <CardContent className="flex items-center gap-3">
          {/* Check/uncheck button with animation */}
          <motion.div
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Button
              variant={isCheckedAndNotSkipped ? "default" : "outline"}
              size="icon-sm"
              onClick={isCheckedAndNotSkipped ? handleUncheck : handleCheckIn}
              disabled={isPending}
              className={`shrink-0 transition-all duration-200 ${
                isCheckedAndNotSkipped ? "shadow-sm" : ""
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isCheckedAndNotSkipped ? "checked" : "unchecked"}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check className={isCheckedAndNotSkipped ? "size-4" : "size-4"} />
                </motion.div>
              </AnimatePresence>
            </Button>
          </motion.div>

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
    </motion.div>
  );
}
