"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Ban,
  Check,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FixedCostFormDialog } from "./fixed-cost-form-dialog";
import { VariableCostFormDialog } from "./variable-cost-form-dialog";
import { AccountantReportButton } from "./accountant-report-button";
import {
  deleteFixedCost,
  deleteVariableCost,
  toggleMonthlyCostDisabled,
  updateMonthlyCostAmount,
  type MonthlyFinancials,
  type FixedCost,
  type VariableCost,
} from "./actions";

type Tab = "revenue" | "costs" | "profit";

function formatRSD(amount: number): string {
  return new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function formatMonth(month: string, locale: string): string {
  const date = new Date(month + "T00:00:00");
  return date.toLocaleDateString(locale === "sr" ? "sr-Latn-RS" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

export function FinancesContent({
  data,
  month,
  onMonthChange,
}: {
  data: MonthlyFinancials;
  month: string;
  onMonthChange: (month: string) => void;
}) {
  const t = useTranslations("finances");
  const tc = useTranslations("common");
  const [activeTab, setActiveTab] = useState<Tab>("profit");
  const [fixedCostDialogOpen, setFixedCostDialogOpen] = useState(false);
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(
    null
  );
  const [variableCostDialogOpen, setVariableCostDialogOpen] = useState(false);
  const [editingVariableCost, setEditingVariableCost] =
    useState<VariableCost | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingMonthlyEntry, setEditingMonthlyEntry] = useState<string | null>(
    null
  );
  const [editAmount, setEditAmount] = useState("");

  function navigateMonth(delta: number) {
    const date = new Date(month + "T00:00:00");
    date.setMonth(date.getMonth() + delta);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    onMonthChange(newMonth);
  }

  function handleDeleteFixedCost(id: string) {
    startTransition(async () => {
      try {
        await deleteFixedCost(id);
      } catch {
        toast.error("Failed to delete");
      }
    });
  }

  function handleDeleteVariableCost(id: string) {
    startTransition(async () => {
      try {
        await deleteVariableCost(id);
      } catch {
        toast.error("Failed to delete");
      }
    });
  }

  function handleToggleMonthlyDisabled(entryId: string, isDisabled: boolean) {
    startTransition(async () => {
      try {
        await toggleMonthlyCostDisabled(entryId, isDisabled);
      } catch {
        toast.error("Failed to update");
      }
    });
  }

  function handleSaveMonthlyAmount(entryId: string) {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) return;
    startTransition(async () => {
      try {
        await updateMonthlyCostAmount(entryId, amount);
        setEditingMonthlyEntry(null);
      } catch {
        toast.error("Failed to update");
      }
    });
  }

  const profitColor =
    data.totals.profit >= 0 ? "text-green-600" : "text-red-600";

  // Detect locale from month formatting
  const locale = t("title") === "Finansije" ? "sr" : "en";

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "revenue", label: t("revenue"), icon: <TrendingUp className="size-4" /> },
    { key: "costs", label: t("costs"), icon: <TrendingDown className="size-4" /> },
    { key: "profit", label: t("profit"), icon: <Wallet className="size-4" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <AccountantReportButton data={data} month={month} />
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigateMonth(-1)}
        >
          <ChevronLeft />
        </Button>
        <span className="text-lg font-semibold min-w-[180px] text-center capitalize">
          {formatMonth(month, locale)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigateMonth(1)}
        >
          <ChevronRight />
        </Button>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-background shadow-sm"
                : "hover:bg-background/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "revenue" && (
        <div className="space-y-3">
          {/* Summary card */}
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t("totalRevenue")}
                </span>
                <span className="text-xl font-bold text-green-600">
                  {formatRSD(data.totals.revenue)} {t("rsd")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by client */}
          {data.revenue.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              {t("noRevenue")}
            </p>
          ) : (
            <>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t("revenueByClient")}
              </h3>
              <div className="grid gap-2">
                {data.revenue.map((r) => (
                  <Card key={r.client_id} size="sm">
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{r.client_name}</span>
                        <div className="text-xs text-muted-foreground">
                          {r.total_hours}
                          {t("hoursShort")}
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatRSD(r.total_revenue)} {t("rsd")}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "costs" && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <Card size="sm">
              <CardContent className="text-center py-3">
                <div className="text-xs text-muted-foreground">
                  {t("salaries")}
                </div>
                <div className="font-bold text-sm">
                  {formatRSD(data.totals.salaries)}
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="text-center py-3">
                <div className="text-xs text-muted-foreground">
                  {t("fixedCosts")}
                </div>
                <div className="font-bold text-sm">
                  {formatRSD(data.totals.fixedCosts)}
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="text-center py-3">
                <div className="text-xs text-muted-foreground">
                  {t("variableCosts")}
                </div>
                <div className="font-bold text-sm">
                  {formatRSD(data.totals.variableCosts)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salaries section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t("salaries")}
            </h3>
            {data.salaries.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm py-2">
                {t("noSalaries")}
              </p>
            ) : (
              <div className="grid gap-2">
                {data.salaries.map((s) => (
                  <Card key={s.employee_id} size="sm">
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{s.employee_name}</span>
                        <div className="text-xs text-muted-foreground">
                          {s.total_hours}
                          {t("hoursShort")}
                          {s.bonuses > 0 && (
                            <span className="text-green-600">
                              {" "}
                              +{formatRSD(s.bonuses)}
                            </span>
                          )}
                          {s.penalties > 0 && (
                            <span className="text-red-600">
                              {" "}
                              -{formatRSD(s.penalties)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold">
                        {formatRSD(s.net_salary)} {t("rsd")}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Fixed costs section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t("fixedCosts")}
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingFixedCost(null);
                  setFixedCostDialogOpen(true);
                }}
              >
                <Plus data-icon="inline-start" />
                {tc("add")}
              </Button>
            </div>
            {data.monthlyCostEntries.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm py-2">
                {t("noFixedCosts")}
              </p>
            ) : (
              <div className="grid gap-2">
                {data.monthlyCostEntries.map((entry) => {
                  const template = data.fixedCosts.find(
                    (fc) => fc.id === entry.fixed_cost_id
                  );
                  return (
                    <Card
                      key={entry.id}
                      size="sm"
                      className={entry.is_disabled ? "opacity-50" : ""}
                    >
                      <CardContent className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="min-w-0">
                            <span className="font-medium truncate block">
                              {entry.name}
                            </span>
                            {entry.is_disabled && (
                              <Badge variant="outline" className="text-xs">
                                {t("disableThisMonth")}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {editingMonthlyEntry === entry.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-24 h-8"
                                min="0"
                                step="0.01"
                              />
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() =>
                                  handleSaveMonthlyAmount(entry.id)
                                }
                                disabled={isPending}
                              >
                                <Check />
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="font-semibold cursor-pointer"
                              onClick={() => {
                                setEditingMonthlyEntry(entry.id);
                                setEditAmount(String(entry.amount));
                              }}
                            >
                              {formatRSD(Number(entry.amount))} {t("rsd")}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              handleToggleMonthlyDisabled(
                                entry.id,
                                !entry.is_disabled
                              )
                            }
                            disabled={isPending}
                          >
                            {entry.is_disabled ? <Check /> : <Ban />}
                          </Button>
                          {template && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditingFixedCost(template);
                                setFixedCostDialogOpen(true);
                              }}
                            >
                              <Pencil />
                            </Button>
                          )}
                          {template && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteFixedCost(template.id)}
                              disabled={isPending}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Variable costs section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t("variableCosts")}
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingVariableCost(null);
                  setVariableCostDialogOpen(true);
                }}
              >
                <Plus data-icon="inline-start" />
                {tc("add")}
              </Button>
            </div>
            {data.variableCosts.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm py-2">
                {t("noVariableCosts")}
              </p>
            ) : (
              <div className="grid gap-2">
                {data.variableCosts.map((vc) => (
                  <Card key={vc.id} size="sm">
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{vc.name}</span>
                        <div className="text-xs text-muted-foreground">
                          {vc.date}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">
                          {formatRSD(Number(vc.amount))} {t("rsd")}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingVariableCost(vc);
                            setVariableCostDialogOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteVariableCost(vc.id)}
                          disabled={isPending}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "profit" && (
        <div className="space-y-3">
          {/* Profit summary */}
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("netProfit")}</span>
                <span className={`text-2xl font-bold ${profitColor}`}>
                  {formatRSD(data.totals.profit)} {t("rsd")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {t("breakdown")}
          </h3>
          <Card>
            <CardContent className="divide-y">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  {t("totalRevenue")}
                </span>
                <span className="font-medium text-green-600">
                  +{formatRSD(data.totals.revenue)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  {t("totalSalaries")}
                </span>
                <span className="font-medium text-red-600">
                  -{formatRSD(data.totals.salaries)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  {t("totalFixedCosts")}
                </span>
                <span className="font-medium text-red-600">
                  -{formatRSD(data.totals.fixedCosts)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  {t("totalVariableCosts")}
                </span>
                <span className="font-medium text-red-600">
                  -{formatRSD(data.totals.variableCosts)}
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold">
                <span>{t("netProfit")}</span>
                <span className={profitColor}>
                  {formatRSD(data.totals.profit)} {t("rsd")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Revenue details */}
          {data.revenue.length > 0 && (
            <>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t("revenueByClient")}
              </h3>
              <div className="grid gap-2">
                {data.revenue.map((r) => (
                  <Card key={r.client_id} size="sm">
                    <CardContent className="flex items-center justify-between">
                      <span className="text-sm">{r.client_name}</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatRSD(r.total_revenue)}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Salary details */}
          {data.salaries.length > 0 && (
            <>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t("salaryByEmployee")}
              </h3>
              <div className="grid gap-2">
                {data.salaries.map((s) => (
                  <Card key={s.employee_id} size="sm">
                    <CardContent className="flex items-center justify-between">
                      <span className="text-sm">{s.employee_name}</span>
                      <span className="text-sm font-medium">
                        {formatRSD(s.net_salary)}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Dialogs */}
      <FixedCostFormDialog
        open={fixedCostDialogOpen}
        onOpenChange={setFixedCostDialogOpen}
        fixedCost={editingFixedCost}
      />
      <VariableCostFormDialog
        open={variableCostDialogOpen}
        onOpenChange={setVariableCostDialogOpen}
        variableCost={editingVariableCost}
        defaultMonth={month}
      />
    </div>
  );
}
