"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateAccountantReportPDF,
  type AccountantReportInput,
} from "@/lib/pdf";
import {
  getAccountantReportData,
  type MonthlyFinancials,
} from "./actions";

export function AccountantReportButton({
  data,
  month,
}: {
  data: MonthlyFinancials;
  month: string;
}) {
  const t = useTranslations("reports");
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      try {
        const clientData = await getAccountantReportData(month);

        const input: AccountantReportInput = {
          month,
          revenue: clientData.map((c) => ({
            name: c.name,
            pib: c.pib,
            hours: c.hours,
            amount: c.amount,
            dailyRate: c.dailyRate,
            days: c.days,
            locations: c.locations,
          })),
          totals: data.totals,
          labels: {
            accountantReport: t("accountantReport"),
            period: t("period"),
            revenue: t("revenue"),
            netProfit: t("netProfit"),
            name: t("name"),
            amount: t("amount"),
            total: t("total"),
            pib: "PIB",
            hours: t("hours"),
            price: t("hourlyRate"),
            days: t("daysShort"),
            dailyRate: t("dailyRate"),
          },
        };
        generateAccountantReportPDF(input);
      } catch {
        toast.error("Failed to generate report");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={isPending}
    >
      <FileText data-icon="inline-start" />
      {isPending ? "..." : t("generatePdf")}
    </Button>
  );
}
