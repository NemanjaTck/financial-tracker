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
import { assignEmployee } from "./actions";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
};

export function AssignEmployeeDialog({
  open,
  onOpenChange,
  jobId,
  employees,
  alreadyAssignedIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  employees: Employee[];
  alreadyAssignedIds: string[];
}) {
  const t = useTranslations("jobs");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [customRate, setCustomRate] = useState("");

  const availableEmployees = employees.filter(
    (e) => !alreadyAssignedIds.includes(e.id)
  );

  function handleSubmit() {
    if (!selectedEmployeeId) return;

    startTransition(async () => {
      try {
        await assignEmployee(
          jobId,
          selectedEmployeeId,
          customRate ? parseFloat(customRate) : null
        );
        onOpenChange(false);
        setSelectedEmployeeId("");
        setCustomRate("");
      } catch {
        toast.error("Failed to assign employee");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("assignEmployee")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{tc("name")}</Label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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

          <div className="grid gap-2">
            <Label>
              {t("employeeRate")}{" "}
              <span className="text-muted-foreground font-normal">
                (override)
              </span>
            </Label>
            <Input
              type="number"
              step="any"
              min="0"
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              placeholder="—"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !selectedEmployeeId}
            >
              {isPending ? tc("loading") : tc("save")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
