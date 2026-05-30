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
import { addExtraWork } from "./actions";

export function AddExtraDialog({
  open,
  onOpenChange,
  date,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
}) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  function handleSubmit() {
    if (!name.trim() || !amount) return;

    startTransition(async () => {
      try {
        await addExtraWork(name.trim(), parseFloat(amount), date);
        onOpenChange(false);
        setName("");
        setAmount("");
      } catch {
        toast.error("Failed to add extra work");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addExtra")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t("extraName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="..."
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("extraAmount")}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim() || !amount}
          >
            {isPending ? tc("loading") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
