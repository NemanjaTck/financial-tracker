import { getTranslations } from "next-intl/server";

export default async function FinancesPage() {
  const t = await getTranslations("finances");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
      <p className="text-muted-foreground">{t("noFixedCosts")}</p>
    </div>
  );
}
