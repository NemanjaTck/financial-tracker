import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const t = await getTranslations("home");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{t("today")}</CardTitle>
          <CardDescription>{t("noJobsToday")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("schedule")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
