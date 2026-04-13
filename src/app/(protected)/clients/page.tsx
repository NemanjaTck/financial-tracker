import { getTranslations } from "next-intl/server";

export default async function ClientsPage() {
  const t = await getTranslations("clients");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
      <p className="text-muted-foreground">{t("noClients")}</p>
    </div>
  );
}
