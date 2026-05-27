import { I18nProvider } from "@/i18n/provider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AdminChrome } from "./AdminChrome";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="ko">
      <SiteHeader />
      <AdminChrome>{children}</AdminChrome>
    </I18nProvider>
  );
}
