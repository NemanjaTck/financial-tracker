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
import { Checkbox } from "@/components/ui/checkbox";
import { createFixedCost, updateFixedCost, type FixedCost } from "./actions";

export function FixedCostFormDialog({
  open,
  onOpenChange,
  fixedCost,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixedCost?: FixedCost | null;
}) {
  const t = useTranslations("finances");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!fixedCost;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isEditing) {
          formData.set("id", fixedCost!.id);
          await updateFixedCost(formData);
        } else {
          await createFixedCost(formData);
        }
        onOpenChange(false);
        formRef.current?.reset();
      } catch {
        toast.error("Failed to save fixed cost");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editFixedCost") : t("addFixedCost")}
          </DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("costName")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={fixedCost?.name ?? ""}
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
              defaultValue={fixedCost?.amount ?? ""}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="day_of_month">{t("dayOfMonth")}</Label>
            <Input
              id="day_of_month"
              name="day_of_month"
              type="number"
              min="1"
              max="31"
              defaultValue={fixedCost?.day_of_month ?? 1}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_recurring"
              name="is_recurring_checkbox"
              defaultChecked={fixedCost?.is_recurring ?? true}
              onCheckedChange={(checked) => {
                const hidden = document.getElementById(
                  "is_recurring_hidden"
                ) as HTMLInputElement;
                if (hidden) hidden.value = String(!!checked);
              }}
            />
            <input
              type="hidden"
              id="is_recurring_hidden"
              name="is_recurring"
              defaultValue={String(fixedCost?.is_recurring ?? true)}
            />
            <Label htmlFor="is_recurring" className="cursor-pointer">
              {t("recurring")}
            </Label>
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
