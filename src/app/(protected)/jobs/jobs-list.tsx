"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  X,
  MapPin,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobFormDialog } from "./job-form-dialog";
import { AssignEmployeeDialog } from "./assign-employee-dialog";
import { deleteJob, toggleJobActive, removeAssignment } from "./actions";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
};

type JobAssignment = {
  id: string;
  employee_id: string;
  custom_rate: number | null;
  employees: Employee;
};

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
  is_active: boolean;
  clients: Client;
  job_assignments: JobAssignment[];
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_VALUES = [1, 2, 3, 4, 5, 6];

export function JobsList({
  jobs,
  clients,
  employees,
}: {
  jobs: Job[];
  clients: Client[];
  employees: Employee[];
}) {
  const t = useTranslations("jobs");
  const tc = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleEdit(job: Job) {
    setEditing(job);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteJob(id);
      } catch {
        toast.error("Failed to delete job");
      }
    });
  }

  function handleToggleActive(id: string, currentActive: boolean) {
    startTransition(async () => {
      try {
        await toggleJobActive(id, !currentActive);
      } catch {
        toast.error("Failed to update status");
      }
    });
  }

  function handleAssignEmployee(job: Job) {
    setAssigningJobId(job.id);
    setAssignedIds(job.job_assignments.map((a) => a.employee_id));
    setAssignDialogOpen(true);
  }

  function handleRemoveAssignment(assignmentId: string) {
    startTransition(async () => {
      try {
        await removeAssignment(assignmentId);
      } catch {
        toast.error("Failed to remove assignment");
      }
    });
  }

  function formatDays(workDays: number[]) {
    return workDays
      .map((d) => {
        const idx = DAY_VALUES.indexOf(d);
        return idx >= 0 ? t(`days.${DAY_KEYS[idx]}`) : "";
      })
      .filter(Boolean)
      .join(", ");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <Button onClick={handleAdd} size="sm">
          <Plus data-icon="inline-start" />
          {t("addJob")}
        </Button>
      </div>

      {jobs.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {t("noJobs")}
        </p>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <Card key={job.id} size="sm">
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="truncate">
                        {job.location_name}
                      </CardTitle>
                      <Badge
                        variant={job.is_active ? "secondary" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          handleToggleActive(job.id, job.is_active)
                        }
                      >
                        {job.is_active ? tc("active") : tc("inactive")}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {job.clients.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(job)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(job.id)}
                      disabled={isPending}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {job.employee_rate} / {job.client_rate} RSD/h
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {job.default_hours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDays(job.work_days)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("assignedEmployees")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleAssignEmployee(job)}
                    >
                      <UserPlus />
                    </Button>
                  </div>
                  {job.job_assignments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">—</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {job.job_assignments.map((a) => (
                        <Badge key={a.id} variant="outline" className="gap-1">
                          {a.employees.first_name} {a.employees.last_name}
                          {a.custom_rate != null && (
                            <span className="text-muted-foreground">
                              ({a.custom_rate})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignment(a.id)}
                            className="ml-0.5 hover:text-destructive"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <JobFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={editing}
        clients={clients}
      />

      {assigningJobId && (
        <AssignEmployeeDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          jobId={assigningJobId}
          employees={employees}
          alreadyAssignedIds={assignedIds}
        />
      )}
    </div>
  );
}
