import { getMonthlyFinancials } from "./actions";
import { FinancesPage as FinancesPageClient } from "./finances-page-client";

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month =
    params.month ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const data = await getMonthlyFinancials(month);

  return <FinancesPageClient data={data} initialMonth={month} />;
}
