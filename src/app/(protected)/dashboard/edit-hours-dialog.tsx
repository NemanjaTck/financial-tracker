"use client";

import { useTranslations } from "next-intl";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateHours } from "./actions";
import type { ScheduleEntry } from "./actions";

export function EditHoursDialog({
  open,
  onOpenChange,
  entry,
  date,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: ScheduleEntry | null;
  date: string;
}) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [hours, setHours] = useState(String(entry?.hours ?? ""));

  // Reset hours when entry changes
  if (entry && String(entry.hours) !== hours && !open) {
    setHours(String(entry.hours));
  }

  function handleSave() {
    if (!entry) return;
    const h = parseFloat(hours);
    if (isNaN(h) || h < 0) return;

    startTransition(async () => {
      try {
        await updateHours(entry.job_id, entry.employee_id, date, h);
        onOpenChange(false);
      } catch {
        toast.error("Failed to update hours");
      }
    });
  }

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t("editHours")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {entry.employee_name} — {entry.job_location}
          </p>
          <div className="grid gap-2">
            <Label>{t("hoursWorked")}</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? tc("loading") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
