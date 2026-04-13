"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClientReportData } from "./report-actions";
import { generateClientReportPDF } from "@/lib/pdf";

export type ReportDisplayMode = "default" | "by-location" | "anonymous";

export function ClientReportButton({ clientId }: { clientId: string }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [displayMode, setDisplayMode] = useState<ReportDisplayMode>("default");

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  function handleGenerate(formData: FormData) {
    const monthValue = formData.get("month") as string;
    const month = `${monthValue}-01`;

    startTransition(async () => {
      try {
        const data = await getClientReportData(clientId, month);
        generateClientReportPDF({
          ...data,
          displayMode,
          labels: {
            clientReport: t("clientReport"),
            period: t("period"),
            date: t("date"),
            employee: t("employee"),
            hours: t("hours"),
            hourlyRate: t("hourlyRate"),
            total: t("total"),
            totalHours: t("totalHours"),
            totalCost: t("totalCost"),
            visits: t("visits"),
            location: t("location"),
          },
        });
        setOpen(false);
      } catch {
        toast.error("Failed to generate report");
      }
    });
  }

  const modeOptions: { value: ReportDisplayMode; label: string }[] = [
    { value: "default", label: t("byEmployee") },
    { value: "by-location", label: t("byLocation") },
    { value: "anonymous", label: t("anonymousWorkers") },
  ];

  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)}>
        <FileText />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("clientReport")}</DialogTitle>
          </DialogHeader>
          <form action={handleGenerate} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="month">{t("period")}</Label>
              <Input
                id="month"
                name="month"
                type="month"
                defaultValue={defaultMonth}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("displayMode")}</Label>
              <div className="flex flex-col gap-1.5">
                {modeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDisplayMode(opt.value)}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                      displayMode === opt.value
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-input hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? tc("loading") : t("generatePdf")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
