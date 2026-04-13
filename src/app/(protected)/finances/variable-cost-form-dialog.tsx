"use client";

import { useTranslations } from "next-intl";
import { useTransition, useRef } from "react";
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
import {
  createVariableCost,
  updateVariableCost,
  type VariableCost,
} from "./actions";

export function VariableCostFormDialog({
  open,
  onOpenChange,
  variableCost,
  defaultMonth,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variableCost?: VariableCost | null;
  defaultMonth: string; // YYYY-MM-01
}) {
  const t = useTranslations("finances");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!variableCost;

  // Default date: first day of month or existing date
  const defaultDate = variableCost?.date ?? defaultMonth;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isEditing) {
          formData.set("id", variableCost!.id);
          await updateVariableCost(formData);
        } else {
          await createVariableCost(formData);
        }
        onOpenChange(false);
        formRef.current?.reset();
      } catch {
        toast.error("Failed to save variable cost");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editVariableCost") : t("addVariableCost")}
          </DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("costName")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={variableCost?.name ?? ""}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">{tc("amount")} (RSD)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={variableCost?.amount ?? ""}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">{tc("date")}</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={defaultDate}
              required
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
            <Button type="submit" disabled={isPending}>
              {isPending ? tc("loading") : tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
