"use client";

import { useTranslations } from "next-intl";
import { useTransition, useRef, useState } from "react";
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
import { createJob, updateJob } from "./actions";

type Client = {
  id: string;
  name: string;
};

type Job = {
  id: string;
  client_id: string;
  location_name: string;
  employee_rate: number;
  client_rate: number;
  default_hours: number;
  work_days: number[];
  start_date: string | null;
  daily_rate: number | null;
  rate_type: string | null;
  is_active: boolean;
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 7];

export function JobFormDialog({
  open,
  onOpenChange,
  job,
  clients,
  preselectedClientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job | null;
  clients: Client[];
  preselectedClientId?: string;
}) {
  const t = useTranslations("jobs");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!job;

  const [selectedDays, setSelectedDays] = useState<number[]>(
    job?.work_days ?? [1, 2, 3, 4, 5]
  );

  const [rateType, setRateType] = useState<"hourly" | "daily">(
    (job?.rate_type as "hourly" | "daily") ?? "hourly"
  );

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function handleSubmit(formData: FormData) {
    formData.set("work_days", selectedDays.join(","));
    formData.set("rate_type", rateType);

    startTransition(async () => {
      try {
        if (isEditing) {
          formData.set("id", job!.id);
          await updateJob(formData);
        } else {
          await createJob(formData);
        }
        onOpenChange(false);
        formRef.current?.reset();
        setSelectedDays([1, 2, 3, 4, 5]);
        setRateType("hourly");
      } catch {
        toast.error(isEditing ? "Failed to update" : "Failed to create");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setSelectedDays(job?.work_days ?? [1, 2, 3, 4, 5]);
          setRateType((job?.rate_type as "hourly" | "daily") ?? "hourly");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("editJob") : t("addJob")}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="client_id">{tc("name")}</Label>
            <select
              id="client_id"
              name="client_id"
              defaultValue={job?.client_id ?? preselectedClientId ?? ""}
              required
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                --
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location_name">{t("locationName")}</Label>
            <Input
              id="location_name"
              name="location_name"
              defaultValue={job?.location_name ?? ""}
              required
              autoFocus
            />
          </div>

          {/* Rate type toggle */}
          <div className="grid gap-2">
            <Label>{t("rateType")}</Label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setRateType("hourly")}
                className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                  rateType === "hourly"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                {t("hourlyMode")}
              </button>
              <button
                type="button"
                onClick={() => setRateType("daily")}
                className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                  rateType === "daily"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                {t("dailyMode")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="employee_rate">
                {rateType === "hourly" ? t("employeeRate") : t("employeeDailyRate")}
              </Label>
              <Input
                id="employee_rate"
                name="employee_rate"
                type="number"
                step="any"
                min="0"
                defaultValue={job?.employee_rate ?? ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_rate">
                {rateType === "hourly" ? t("clientRate") : t("clientDailyRate")}
              </Label>
              <Input
                id="client_rate"
                name="client_rate"
                type="number"
                step="any"
                min="0"
                defaultValue={job?.client_rate ?? ""}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="default_hours">{t("defaultHours")}</Label>
              <Input
                id="default_hours"
                name="default_hours"
                type="number"
                step="0.5"
                min="0"
                defaultValue={job?.default_hours ?? ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start_date">{t("startDate")}</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={job?.start_date ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t("workDays")}</Label>
            <div className="flex gap-1.5">
              {DAY_KEYS.map((dayKey, i) => {
                const dayValue = DAY_VALUES[i];
                const isSelected = selectedDays.includes(dayValue);
                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => toggleDay(dayValue)}
                    className={`flex h-8 w-10 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t(`days.${dayKey}`)}
                  </button>
                );
              })}
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
