"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/actions/settings";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">설정</h1>
          <p className="text-xs text-text-tertiary mt-1">블로그 전반 설정을 관리합니다</p>
        </div>
        <form action={logout}>
          <Button variant="ghost" type="submit" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">로그아웃</Button>
        </form>
      </div>

      {/* Blog Info */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight">블로그 정보</h2>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-emerald-500 animate-fade-in">저장됨</span>}
            <Button onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 divide-y divide-border/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            <div className="space-y-1.5">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">블로그 제목</label>
              <Input value={(settings.blog_title as string) || ""} onChange={(e) => updateField("blog_title", e.target.value)} placeholder="한국어" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">Blog Title</label>
              <Input value={(settings.blog_title_en as string) || ""} onChange={(e) => updateField("blog_title_en", e.target.value)} placeholder="English" />
            </div>
          </div>
          <div className="p-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-9 h-5 rounded-full transition-colors relative ${settings.show_view_count ? "bg-accent" : "bg-bg-elevated"}`}
                onClick={() => updateField("show_view_count", !settings.show_view_count)}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.show_view_count ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm">조회수 표시</span>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
