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

export function ClientReportButton({ clientId }: { clientId: string }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  function handleGenerate(formData: FormData) {
    const monthValue = formData.get("month") as string; // YYYY-MM
    const month = `${monthValue}-01`;

    startTransition(async () => {
      try {
        const data = await getClientReportData(clientId, month);
        generateClientReportPDF({
          ...data,
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
          },
        });
        setOpen(false);
      } catch {
        toast.error("Failed to generate report");
      }
    });
  }

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
