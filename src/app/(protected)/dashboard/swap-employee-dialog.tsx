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
import { Label } from "@/components/ui/label";
import { swapEmployee } from "./actions";
import type { ScheduleEntry } from "./actions";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
};

export function SwapEmployeeDialog({
  open,
  onOpenChange,
  entry,
  date,
  employees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: ScheduleEntry | null;
  date: string;
  employees: Employee[];
}) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState("");

  function handleSwap() {
    if (!entry || !selectedId) return;

    startTransition(async () => {
      try {
        await swapEmployee(
          entry.job_id,
          entry.employee_id,
          selectedId,
          date,
          entry.hours
        );
        onOpenChange(false);
        setSelectedId("");
      } catch {
        toast.error("Failed to swap employee");
      }
    });
  }

  if (!entry) return null;

  const availableEmployees = employees.filter(
    (e) => e.id !== entry.employee_id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t("swapEmployee")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {entry.employee_name} → ?
          </p>
          <div className="grid gap-2">
            <Label>{t("selectEmployee")}</Label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                --
              </option>
              {availableEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button onClick={handleSwap} disabled={isPending || !selectedId}>
            {isPending ? tc("loading") : tc("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
