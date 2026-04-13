import { getTranslations } from "next-intl/server";

export default async function EmployeesPage() {
  const t = await getTranslations("employees");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
      <p className="text-muted-foreground">{t("noEmployees")}</p>
    </div>
  );
}
