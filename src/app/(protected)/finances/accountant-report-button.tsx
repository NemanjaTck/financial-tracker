"use client";

import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateAccountantReportPDF,
  type AccountantReportInput,
} from "@/lib/pdf";
import type { MonthlyFinancials } from "./actions";

export function AccountantReportButton({
  data,
  month,
}: {
  data: MonthlyFinancials;
  month: string;
}) {
  const t = useTranslations("reports");

  function handleGenerate() {
    const input: AccountantReportInput = {
      month,
      revenue: data.revenue.map((r) => ({
        name: r.client_name,
        amount: r.total_revenue,
      })),
      salaries: data.salaries.map((s) => ({
        name: s.employee_name,
        amount: s.net_salary,
      })),
      fixedCosts: data.monthlyCostEntries
        .filter((e) => !e.is_disabled)
        .map((e) => ({
          name: e.name,
          amount: Number(e.amount),
        })),
      variableCosts: data.variableCosts.map((vc) => ({
        name: vc.name,
        amount: Number(vc.amount),
        date: vc.date,
      })),
      totals: data.totals,
      labels: {
        accountantReport: t("accountantReport"),
        period: t("period"),
        revenue: t("revenue"),
        salaries: t("salaries"),
        fixedCosts: t("fixedCosts"),
        variableCosts: t("variableCosts"),
        netProfit: t("netProfit"),
        name: t("name"),
        amount: t("amount"),
        total: t("total"),
        date: t("date"),
      },
    };
    generateAccountantReportPDF(input);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleGenerate}>
      <FileText data-icon="inline-start" />
      {t("generatePdf")}
    </Button>
  );
}
