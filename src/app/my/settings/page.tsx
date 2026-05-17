"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/actions/settings";
import { getCategoriesWithCount, createCategory, deleteCategory } from "@/actions/categories";
import type { CategoryWithCount } from "@/actions/categories";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildTree } from "@/lib/tree";
import type { TreeNode } from "@/lib/tree";
import { uploadImage } from "@/lib/upload";

type CategoryTree = TreeNode<CategoryWithCount>;

function CategoryRow({
  cat,
  depth,
  onDelete,
  onAddChild,
}: {
  cat: CategoryTree;
  depth: number;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
}) {
  const totalPosts = cat.postCount + cat.children.reduce(function countAll(sum: number, c: CategoryTree): number {
    return sum + c.postCount + c.children.reduce(countAll, 0);
  }, 0);
  const canDelete = cat.postCount === 0 && cat.children.length === 0;

  return (
    <>
      <tr className="border-b border-border/20 last:border-b-0 hover:bg-bg-card/30 transition-colors">
        <td className="px-4 py-2.5 text-sm" style={{ paddingLeft: `${depth * 24 + 16}px` }}>
          {depth > 0 && <span className="text-text-tertiary mr-1.5">└</span>}
          <span className="font-medium">{cat.name}</span>
          <span className="text-text-tertiary text-xs ml-2">{cat.nameEn}</span>
        </td>
        <td className="px-4 py-2.5 text-center">
          <span className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated text-text-tertiary">{cat.postCount}</span>
        </td>
        <td className="px-4 py-2.5 text-right">
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => onAddChild(cat.id)} className="text-xs text-text-tertiary hover:text-accent transition-colors">
              + 하위
            </button>
            {canDelete ? (
              <button onClick={() => onDelete(cat.id)} className="text-xs text-red-400 hover:text-red-500">삭제</button>
            ) : (
              <span className="text-xs text-text-tertiary">&mdash;</span>
            )}
          </div>
        </td>
      </tr>
      {cat.children.map((child) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} onDelete={onDelete} onAddChild={onAddChild} />
      ))}
    </>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [allCategories, setAllCategories] = useState<CategoryWithCount[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [newCatParentId, setNewCatParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadAll = () => {
    getSettings().then(setSettings);
    getCategoriesWithCount().then(setAllCategories);
  };

  useEffect(() => { loadAll(); }, []);

  const tree = buildTree(allCategories, null);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddCategory = async () => {
    if (!newCatName || !newCatNameEn) return;
    const fd = new FormData();
    fd.set("name", newCatName);
    fd.set("nameEn", newCatNameEn);
    if (newCatParentId) fd.set("parentId", String(newCatParentId));
    await createCategory(fd);
    setNewCatName(""); setNewCatNameEn(""); setNewCatParentId(null);
    setAllCategories(await getCategoriesWithCount());
  };

  const handleDeleteCategory = async (id: number) => {
    const result = await deleteCategory(id);
    if (result?.error) { alert(result.error); return; }
    setAllCategories(await getCategoriesWithCount());
  };

  const handleAddChild = (parentId: number) => {
    setNewCatParentId(parentId);
    const parent = allCategories.find((c) => c.id === parentId);
    // Scroll to bottom of category section
    document.getElementById("cat-add-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const updateField = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const parentCat = newCatParentId ? allCategories.find((c) => c.id === newCatParentId) : null;

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            <div className="space-y-1.5">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">히어로 제목</label>
              <Input value={(settings.hero_title as string) || ""} onChange={(e) => updateField("hero_title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">Hero Title</label>
              <Input value={(settings.hero_title_en as string) || ""} onChange={(e) => updateField("hero_title_en", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">히어로 부제</label>
              <Input value={(settings.hero_subtitle as string) || ""} onChange={(e) => updateField("hero_subtitle", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">Hero Subtitle</label>
              <Input value={(settings.hero_subtitle_en as string) || ""} onChange={(e) => updateField("hero_subtitle_en", e.target.value)} />
            </div>
          </div>
          <div className="p-5">
            <label className="text-xs text-text-tertiary uppercase tracking-wider">히어로 이미지</label>
            <div className="mt-3">
              {(settings.hero_image as string) ? (
                <div className="relative group inline-block">
                  <img src={settings.hero_image as string} alt="" className="w-40 h-24 object-cover rounded-lg" />
                  <button onClick={() => updateField("hero_image", "")} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                </div>
              ) : (
                <label className="w-40 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-text-tertiary transition-colors text-text-tertiary inline-flex">
                  <div className="text-center"><span className="text-lg">+</span><p className="text-xs">업로드</p></div>
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const url = await uploadImage(file);
                    if (url) updateField("hero_image", url);
                    e.target.value = "";
                  }} />
                </label>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            <div className="space-y-1.5">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">썸네일 글자 수</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={(settings.thumbnail_text_length as number) || 8}
                onChange={(e) => updateField("thumbnail_text_length", Number(e.target.value))}
                placeholder="8"
              />
              <p className="text-[10px] text-text-tertiary">썸네일 이미지가 없을 때 제목에서 표시할 글자 수</p>
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

      {/* Categories */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold tracking-tight">카테고리</h2>
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 bg-bg-card">
                <th className="text-left text-xs text-text-tertiary font-medium px-4 py-2.5 uppercase tracking-wider">이름</th>
                <th className="text-center text-xs text-text-tertiary font-medium px-4 py-2.5 uppercase tracking-wider w-20">글</th>
                <th className="text-right text-xs text-text-tertiary font-medium px-4 py-2.5 uppercase tracking-wider w-28"></th>
              </tr>
            </thead>
            <tbody>
              {tree.map((cat) => (
                <CategoryRow key={cat.id} cat={cat} depth={0} onDelete={handleDeleteCategory} onAddChild={handleAddChild} />
              ))}
              {tree.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-text-tertiary">카테고리가 없습니다</td></tr>
              )}
            </tbody>
          </table>
          <div id="cat-add-form" className="p-4 bg-bg-card/50 border-t border-border/30">
            {parentCat && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-accent font-medium">{parentCat.name}</span>
                <span className="text-xs text-text-tertiary">의 하위 카테고리 추가</span>
                <button onClick={() => setNewCatParentId(null)} className="text-xs text-text-tertiary hover:text-text-primary">&times; 취소</button>
              </div>
            )}
            <div className="flex gap-2">
              <Input placeholder="카테고리명" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1" />
              <Input placeholder="English" value={newCatNameEn} onChange={(e) => setNewCatNameEn(e.target.value)} className="flex-1" />
              <Button onClick={handleAddCategory} variant="outlined">추가</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
