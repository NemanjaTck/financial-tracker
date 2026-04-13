"use client";

import { useTranslations } from "next-intl";
import { signout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function TopBar() {
  const t = useTranslations("common");

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <h1 className="text-lg font-semibold md:hidden">Financial Tracker</h1>
      <div className="hidden md:block" />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="md:hidden">
          <LocaleSwitcher />
        </div>
        <form action={signout}>
          <Button variant="ghost" size="sm" className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t("signOut")}</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
