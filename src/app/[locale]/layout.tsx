import { notFound } from "next/navigation";
import { I18nProvider } from "@/i18n/provider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { locales, type Locale } from "@/i18n/config";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();

  return (
    <I18nProvider locale={locale as Locale}>
      <SiteHeader />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </I18nProvider>
  );
}
