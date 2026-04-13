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

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
};

type Job = {
  id: string;
  location_name: string;
  default_hours: number;
  clients: { id: string; name: string };
};

export function AddExtraDialog({
  open,
  onOpenChange,
  date,
  employees,
  jobs,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  employees: Employee[];
  jobs: Job[];
}) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [employeeId, setEmployeeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  const selectedJob = jobs.find((j) => j.id === jobId);

  function handleSubmit() {
    if (!employeeId || !jobId || !hours) return;

    startTransition(async () => {
      try {
        await addExtraWork(
          jobId,
          employeeId,
          date,
          parseFloat(hours),
          notes || undefined
        );
        onOpenChange(false);
        setEmployeeId("");
        setJobId("");
        setHours("");
        setNotes("");
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
            <Label>{t("selectJob")}</Label>
            <select
              value={jobId}
              onChange={(e) => {
                setJobId(e.target.value);
                const job = jobs.find((j) => j.id === e.target.value);
                if (job && !hours) setHours(String(job.default_hours));
              }}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                --
              </option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.clients.name} — {j.location_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>{t("selectEmployee")}</Label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                --
              </option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>{t("hoursWorked")}</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder={selectedJob ? String(selectedJob.default_hours) : ""}
            />
          </div>

          <div className="grid gap-2">
            <Label>{tc("name")}</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="..."
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
          <Button
            onClick={handleSubmit}
            disabled={isPending || !employeeId || !jobId || !hours}
          >
            {isPending ? tc("loading") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
