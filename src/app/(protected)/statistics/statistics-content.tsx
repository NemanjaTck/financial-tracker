"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  Building2,
  AlertTriangle,
  Trophy,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatisticsData } from "./actions";

type Tab = "general" | "clients" | "employees";

function formatRSD(amount: number): string {
  return new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function StatisticsContent({ data }: { data: StatisticsData }) {
  const t = useTranslations("statistics");
  const [activeTab, setActiveTab] = useState<Tab>("general");

  const hasData = data.monthlyTrends.some(
    (m) => m.revenue > 0 || m.salaries > 0
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "general",
      label: t("general"),
      icon: <TrendingUp className="size-4" />,
    },
    {
      key: "clients",
      label: t("byClient"),
      icon: <Building2 className="size-4" />,
    },
    {
      key: "employees",
      label: t("byEmployee"),
      icon: <Users className="size-4" />,
    },
  ];

  if (!hasData) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground py-8 text-center">{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>

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

      {activeTab === "general" && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            {data.topClient && (
              <Card size="sm">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="size-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">
                      {t("topClient")}
                    </span>
                  </div>
                  <div className="font-semibold truncate">
                    {data.topClient.name}
                  </div>
                </CardContent>
              </Card>
            )}
            {data.topEmployee && (
              <Card size="sm">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="size-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">
                      {t("overworkedEmployee")}
                    </span>
                  </div>
                  <div className="font-semibold truncate">
                    {data.topEmployee.name}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {data.uncheckedDays > 0 && (
            <Card size="sm" className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="py-3 flex items-center gap-2">
                <AlertTriangle className="size-4 text-yellow-600" />
                <span className="text-sm">
                  <strong>{data.uncheckedDays}</strong> {t("daysUnchecked")}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Profit trend chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("profitTrend")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    formatter={(value) => formatRSD(Number(value))}
                    labelFormatter={(label) => label}
                  />
                  <Bar
                    dataKey="profit"
                    name={t("profit")}
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue vs Costs chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("revenueVsCosts")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    formatter={(value) => formatRSD(Number(value))}
                    labelFormatter={(label) => label}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    name={t("revenue")}
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="salaries"
                    name={t("costs")}
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "clients" && (
        <div className="space-y-4">
          {/* Revenue by client chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("revenueOverTime")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data.monthlyTrends}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    formatter={(value) => formatRSD(Number(value))}
                    labelFormatter={(label) => label}
                  />
                  <Bar
                    dataKey="revenue"
                    name={t("revenue")}
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Client list with totals */}
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {t("byClient")} — {t("last6Months")}
          </h3>
          <div className="grid gap-2">
            {data.clientTrends.map((client, i) => (
              <Card key={client.client_id} size="sm">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {i === 0 && (
                        <Trophy className="size-4 text-yellow-500" />
                      )}
                      <span className="font-medium">{client.client_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("totalRevenue")}: {formatRSD(client.total)} {t("rsd")}
                    </div>
                  </div>
                  <div className="text-right">
                    {/* Mini sparkline: show last 3 months */}
                    <div className="flex gap-1 items-end h-6">
                      {client.months.slice(-3).map((m) => {
                        const maxRev = Math.max(
                          ...client.months.map((mm) => mm.revenue),
                          1
                        );
                        const height = Math.max(
                          (m.revenue / maxRev) * 24,
                          2
                        );
                        return (
                          <div
                            key={m.month}
                            className="w-2 bg-blue-400 rounded-t"
                            style={{ height: `${height}px` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "employees" && (
        <div className="space-y-4">
          {/* Employee hours chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("hoursWorked")} — {t("last6Months")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.employeeStats.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={data.monthlyTrends.map((mt) => {
                      const row: Record<string, string | number> = { label: mt.label };
                      for (const emp of data.employeeStats.slice(0, 5)) {
                        const m = emp.months.find((m) => m.month === mt.month);
                        row[emp.employee_name] = m?.hours ?? 0;
                      }
                      return row;
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    {data.employeeStats.slice(0, 5).map((emp, i) => {
                      const colors = [
                        "#3b82f6",
                        "#22c55e",
                        "#f59e0b",
                        "#ef4444",
                        "#8b5cf6",
                      ];
                      return (
                        <Bar
                          key={emp.employee_id}
                          dataKey={emp.employee_name}
                          fill={colors[i % colors.length]}
                          radius={[2, 2, 0, 0]}
                        />
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Employee list */}
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {t("byEmployee")} — {t("last6Months")}
          </h3>
          <div className="grid gap-2">
            {data.employeeStats.map((emp) => (
              <Card key={emp.employee_id} size="sm">
                <CardContent>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{emp.employee_name}</span>
                    <span className="text-sm font-semibold">
                      {formatRSD(emp.totalEarnings)} {t("rsd")}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      {t("totalHours")}: {Math.round(emp.totalHours)}h
                    </span>
                    <span>
                      {t("workDays")}: {emp.workDays}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
