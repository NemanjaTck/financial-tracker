import { getLocale } from "next-intl/server";
import {
  getDailySchedule,
  getAllEmployees,
  getAllJobs,
  getUncheckedDaysCount,
} from "./actions";
import { DailyOverview } from "./daily-overview";

export default async function DashboardPage() {
  const today = new Date().toISOString().split("T")[0];
  const locale = await getLocale();

  const [entries, employees, jobs, uncheckedDays] = await Promise.all([
    getDailySchedule(today),
    getAllEmployees(),
    getAllJobs(),
    getUncheckedDaysCount(),
  ]);

  return (
    <DailyOverview
      initialEntries={entries}
      initialDate={today}
      employees={employees}
      jobs={jobs}
      uncheckedDays={uncheckedDays}
      locale={locale}
    />
  );
}
