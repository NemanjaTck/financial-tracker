"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Plus,
  CheckCheck,
  AlertTriangle,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DateNav } from "./date-nav";
import { ScheduleEntryCard } from "./schedule-entry-card";
import { EditHoursDialog } from "./edit-hours-dialog";
import { SwapEmployeeDialog } from "./swap-employee-dialog";
import { AddExtraDialog } from "./add-extra-dialog";
import {
  getDailySchedule,
  confirmAll,
  type ScheduleEntry,
  type DashboardAlerts,
} from "./actions";

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

function groupByClient(entries: ScheduleEntry[]) {
  const groups = new Map<string, ScheduleEntry[]>();
  for (const entry of entries) {
    const key = entry.client_name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return groups;
}

function formatRSD(amount: number): string {
  return new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function DailyOverview({
  initialEntries,
  initialDate,
  employees,
  jobs,
  uncheckedDays,
  alerts,
  locale,
}: {
  initialEntries: ScheduleEntry[];
  initialDate: string;
  employees: Employee[];
  jobs: Job[];
  uncheckedDays: number;
  alerts: DashboardAlerts;
  locale: string;
}) {
  const t = useTranslations("home");
  const [date, setDate] = useState(initialDate);
  const [entries, setEntries] = useState(initialEntries);
  const [isLoading, startTransition] = useTransition();

  // Edit hours dialog
  const [editEntry, setEditEntry] = useState<ScheduleEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Swap dialog
  const [swapEntry, setSwapEntry] = useState<ScheduleEntry | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);

  // Add extra dialog
  const [extraOpen, setExtraOpen] = useState(false);

  // Show toast notification if there are unchecked days
  useEffect(() => {
    if (uncheckedDays > 0) {
      toast.warning(t("daysBehind", { count: uncheckedDays }), {
        id: "unchecked-reminder",
        duration: 6000,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSchedule = useCallback(
    (newDate: string) => {
      setDate(newDate);
      startTransition(async () => {
        try {
          const data = await getDailySchedule(newDate);
          setEntries(data);
        } catch {
          toast.error("Failed to load schedule");
        }
      });
    },
    [startTransition]
  );

  // Refresh entries when dialogs close (actions call revalidatePath)
  useEffect(() => {
    if (!editOpen && !swapOpen && !extraOpen) {
      startTransition(async () => {
        try {
          const data = await getDailySchedule(date);
          setEntries(data);
        } catch {
          // silent refresh failure
        }
      });
    }
  }, [editOpen, swapOpen, extraOpen, date, startTransition]);

  const grouped = groupByClient(entries);
  const uncheckedCount = entries.filter(
    (e) => !e.checked
  ).length;
  const hasUnchecked = uncheckedCount > 0;

  function handleConfirmAll() {
    startTransition(async () => {
      try {
        await confirmAll(date);
        const data = await getDailySchedule(date);
        setEntries(data);
      } catch {
        toast.error("Failed to confirm all");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        {uncheckedDays > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="size-3" />
            {t("daysBehind", { count: uncheckedDays })}
          </Badge>
        )}
      </div>

      {/* Notification banner for unchecked days */}
      {uncheckedDays > 3 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t("uncheckedWarning", { count: uncheckedDays })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick insight cards */}
      {(alerts.topClient || alerts.overworkedEmployees.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {alerts.topClient && (
            <Card size="sm">
              <CardContent className="flex items-center gap-2 py-2.5">
                <Trophy className="size-4 text-yellow-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {t("topClientThisMonth")}
                  </div>
                  <div className="text-sm font-semibold truncate">
                    {alerts.topClient.name}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({formatRSD(alerts.topClient.revenue)} RSD)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {alerts.overworkedEmployees.map((emp) => (
            <Card
              key={emp.name}
              size="sm"
              className="border-red-200 dark:border-red-800"
            >
              <CardContent className="flex items-center gap-2 py-2.5">
                <AlertCircle className="size-4 text-red-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {t("overworkedAlert")}
                  </div>
                  <div className="text-sm font-semibold truncate">
                    {emp.name}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({emp.daysWorked} {t("daysWorkedCount")})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Date navigation */}
      <DateNav date={date} onDateChange={loadSchedule} locale={locale} />

      {/* Action bar */}
      <div className="flex items-center gap-2">
        {hasUnchecked && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConfirmAll}
            disabled={isLoading}
          >
            <CheckCheck data-icon="inline-start" />
            {t("confirmAll")} ({uncheckedCount})
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExtraOpen(true)}
        >
          <Plus data-icon="inline-start" />
          {t("addExtra")}
        </Button>
      </div>

      {/* Schedule entries grouped by client */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {t("noJobsToday")}
        </p>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([clientName, clientEntries]) => (
            <div key={clientName} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {clientName}
              </h3>
              <div className="grid gap-2">
                {clientEntries.map((entry) => (
                  <ScheduleEntryCard
                    key={`${entry.job_id}_${entry.employee_id}`}
                    entry={entry}
                    date={date}
                    onEditHours={(e) => {
                      setEditEntry(e);
                      setEditOpen(true);
                    }}
                    onSwapEmployee={(e) => {
                      setSwapEntry(e);
                      setSwapOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <EditHoursDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        entry={editEntry}
        date={date}
      />

      <SwapEmployeeDialog
        open={swapOpen}
        onOpenChange={setSwapOpen}
        entry={swapEntry}
        date={date}
        employees={employees}
      />

      <AddExtraDialog
        open={extraOpen}
        onOpenChange={setExtraOpen}
        date={date}
        employees={employees}
        jobs={jobs}
      />
    </div>
  );
}
