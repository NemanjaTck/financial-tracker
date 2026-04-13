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
import { createEmployee, updateEmployee } from "./actions";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: boolean;
};

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}) {
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!employee;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isEditing) {
          formData.set("id", employee!.id);
          await updateEmployee(formData);
        } else {
          await createEmployee(formData);
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
            {isEditing ? t("editEmployee") : t("addEmployee")}
          </DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first_name">{t("firstName")}</Label>
            <Input
              id="first_name"
              name="first_name"
              defaultValue={employee?.first_name ?? ""}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last_name">{t("lastName")}</Label>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={employee?.last_name ?? ""}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">{tc("phone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={employee?.phone ?? ""}
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
