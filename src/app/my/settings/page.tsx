"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/actions/settings";
import { getCategories, createCategory, deleteCategory } from "@/actions/categories";
import { getTags, deleteTag } from "@/actions/tags";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [categories, setCategories] = useState<{ id: number; name: string; nameEn: string; slug: string }[]>([]);
  const [allTags, setAllTags] = useState<{ id: number; name: string; nameEn: string }[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
    getCategories().then(setCategories);
    getTags().then(setAllTags);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(settings);
    setSaving(false);
  };

  const handleAddCategory = async () => {
    if (!newCatName || !newCatNameEn) return;
    const fd = new FormData();
    fd.set("name", newCatName);
    fd.set("nameEn", newCatNameEn);
    await createCategory(fd);
    setNewCatName("");
    setNewCatNameEn("");
    setCategories(await getCategories());
  };

  const updateField = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-content mx-auto px-6 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">설정</h1>
        <form action={logout}>
          <Button variant="outlined" type="submit">로그아웃</Button>
        </form>
      </div>

      <Card variant="filled" className="p-6 space-y-4">
        <h2 className="text-lg font-bold">블로그 설정</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-secondary">블로그 제목 (한국어)</label>
            <Input value={(settings.blog_title as string) || ""} onChange={(e) => updateField("blog_title", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">블로그 제목 (영문)</label>
            <Input value={(settings.blog_title_en as string) || ""} onChange={(e) => updateField("blog_title_en", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">히어로 제목 (한국어)</label>
            <Input value={(settings.hero_title as string) || ""} onChange={(e) => updateField("hero_title", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">히어로 제목 (영문)</label>
            <Input value={(settings.hero_title_en as string) || ""} onChange={(e) => updateField("hero_title_en", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">히어로 부제 (한국어)</label>
            <Input value={(settings.hero_subtitle as string) || ""} onChange={(e) => updateField("hero_subtitle", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">히어로 부제 (영문)</label>
            <Input value={(settings.hero_subtitle_en as string) || ""} onChange={(e) => updateField("hero_subtitle_en", e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!settings.show_view_count} onChange={(e) => updateField("show_view_count", e.target.checked)} />
          조회수 표시
        </label>
        <Button onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "설정 저장"}</Button>
      </Card>

      <Card variant="filled" className="p-6 space-y-4">
        <h2 className="text-lg font-bold">카테고리 관리</h2>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm">{cat.name} ({cat.nameEn})</span>
              <button
                onClick={() => deleteCategory(cat.id).then(() => getCategories().then(setCategories))}
                className="text-xs text-red-500 hover:underline"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="카테고리 (한국어)" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
          <Input placeholder="Category (English)" value={newCatNameEn} onChange={(e) => setNewCatNameEn(e.target.value)} />
          <Button onClick={handleAddCategory}>추가</Button>
        </div>
      </Card>

      <Card variant="filled" className="p-6 space-y-4">
        <h2 className="text-lg font-bold">태그 관리</h2>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <span key={tag.id} className="inline-flex items-center gap-1 px-3 py-1 bg-bg-primary rounded-full text-sm border border-border">
              {tag.name} ({tag.nameEn})
              <button
                onClick={() => deleteTag(tag.id).then(() => getTags().then(setAllTags))}
                className="text-text-secondary hover:text-red-500"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
