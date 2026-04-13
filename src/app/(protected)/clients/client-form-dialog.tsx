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
import { createClientRecord, updateClientRecord } from "./actions";

type Client = {
  id: string;
  name: string;
  pib: string | null;
  type: string;
  is_active: boolean;
};

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!client;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isEditing) {
          formData.set("id", client!.id);
          await updateClientRecord(formData);
        } else {
          await createClientRecord(formData);
        }
        onOpenChange(false);
        formRef.current?.reset();
      } catch {
        toast.error(isEditing ? "Failed to update" : "Failed to create");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editClient") : t("addClient")}
          </DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("clientName")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={client?.name ?? ""}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pib">{t("pib")}</Label>
            <Input
              id="pib"
              name="pib"
              defaultValue={client?.pib ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">{t("type")}</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="regular"
                  defaultChecked={!client || client.type === "regular"}
                  className="accent-primary"
                />
                {t("regular")}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="one_time"
                  defaultChecked={client?.type === "one_time"}
                  className="accent-primary"
                />
                {t("oneTime")}
              </label>
            </div>
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
