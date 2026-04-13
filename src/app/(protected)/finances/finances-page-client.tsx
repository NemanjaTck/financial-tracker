"use client";

import { useRouter } from "next/navigation";
import { FinancesContent } from "./finances-content";
import type { MonthlyFinancials } from "./actions";

export function FinancesPage({
  data,
  initialMonth,
}: {
  data: MonthlyFinancials;
  initialMonth: string;
}) {
  const router = useRouter();

  function handleMonthChange(month: string) {
    router.push(`/finances?month=${month}`);
  }

  return (
    <FinancesContent
      data={data}
      month={initialMonth}
      onMonthChange={handleMonthChange}
    />
  );
}
