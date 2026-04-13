import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["sr", "en"],
  defaultLocale: "sr",
  localePrefix: "never",
  localeCookie: {
    name: "NEXT_LOCALE",
  },
});
