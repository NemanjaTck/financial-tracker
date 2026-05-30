import { getLocale } from "next-intl/server";
import {
  getDailySchedule,
  getExtraWork,
  getAllEmployees,
  getUncheckedDaysCount,
  getUncheckedDates,
  getDashboardAlerts,
} from "./actions";
import { DailyOverview } from "./daily-overview";

export default async function DashboardPage() {
  const today = new Date().toISOString().split("T")[0];
  const locale = await getLocale();

  const [entries, extraWork, employees, uncheckedDays, uncheckedDates, alerts] =
    await Promise.all([
      getDailySchedule(today),
      getExtraWork(today),
      getAllEmployees(),
      getUncheckedDaysCount(),
      getUncheckedDates(),
      getDashboardAlerts(),
    ]);

  return (
    <DailyOverview
      initialEntries={entries}
      initialExtraWork={extraWork}
      initialDate={today}
      employees={employees}
      uncheckedDays={uncheckedDays}
      uncheckedDates={uncheckedDates}
      alerts={alerts}
      locale={locale}
    />
  );
}
