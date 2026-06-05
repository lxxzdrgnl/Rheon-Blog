"use client";

import { useState, useEffect } from "react";
import { getCategoriesWithCount, createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import type { CategoryWithCount } from "@/actions/categories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildTree } from "@/lib/tree";
import type { TreeNode } from "@/lib/tree";

type CategoryTree = TreeNode<CategoryWithCount>;

interface RowShared {
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
  onStartEdit: (cat: CategoryWithCount) => void;
  newCatParentId: number | null;
  newCatName: string;
  newCatNameEn: string;
  onNewCatName: (v: string) => void;
  onNewCatNameEn: (v: string) => void;
  onAddCategory: () => void;
  onCancelAdd: () => void;
  editingId: number | null;
  editName: string;
  editNameEn: string;
  onEditName: (v: string) => void;
  onEditNameEn: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

function CategoryRow({ cat, depth, s }: { cat: CategoryTree; depth: number; s: RowShared }) {
  const totalPosts = cat.postCount + cat.children.reduce(function countAll(sum: number, c: CategoryTree): number {
    return sum + c.postCount + c.children.reduce(countAll, 0);
  }, 0);
  const canDelete = cat.postCount === 0 && cat.children.length === 0;
  const pad = `${depth * 24 + 16}px`;

  return (
    <>
      <tr className="border-b border-border/20 last:border-b-0 hover:bg-bg-card/30 transition-colors">
        <td className="px-4 py-2.5 text-sm" style={{ paddingLeft: pad }}>
          {depth > 0 && <span className="text-text-tertiary mr-1.5">└</span>}
          <span className="font-medium">{cat.name}</span>
          <span className="text-text-tertiary text-xs ml-2">{cat.nameEn}</span>
        </td>
        <td className="px-4 py-2.5 text-center">
          <span className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated text-text-tertiary tabular-nums">{totalPosts}</span>
        </td>
        <td className="px-4 py-2.5 text-right">
          <div className="flex items-center justify-end gap-2.5">
            <button onClick={() => s.onStartEdit(cat)} className="text-xs text-text-tertiary hover:text-accent transition-colors">수정</button>
            <button onClick={() => s.onAddChild(cat.id)} className="text-xs text-text-tertiary hover:text-accent transition-colors">+ 하위</button>
            {canDelete ? (
              <button onClick={() => s.onDelete(cat.id)} className="text-xs text-text-tertiary hover:text-red-500 transition-colors">삭제</button>
            ) : (
              <span className="text-xs text-text-tertiary/40">&mdash;</span>
            )}
          </div>
        </td>
      </tr>

      {/* 인라인 수정 폼 — 해당 행 바로 아래 */}
      {s.editingId === cat.id && (
        <tr className="border-b border-border/20 bg-accent/[0.04]">
          <td colSpan={3} className="px-4 py-3" style={{ paddingLeft: pad }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-accent font-medium">카테고리 수정</span>
              <button onClick={s.onCancelEdit} className="text-xs text-text-tertiary hover:text-text-primary">&times; 취소</button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="카테고리명" value={s.editName} onChange={(e) => s.onEditName(e.target.value)} className="flex-1" />
              <Input placeholder="English" value={s.editNameEn} onChange={(e) => s.onEditNameEn(e.target.value)} className="flex-1" />
              <Button onClick={s.onSaveEdit} variant="outlined">저장</Button>
            </div>
          </td>
        </tr>
      )}

      {cat.children.map((child) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} s={s} />
      ))}

      {/* 인라인 하위 추가 폼 */}
      {s.newCatParentId === cat.id && (
        <tr className="border-b border-border/20 last:border-b-0 bg-bg-card/50">
          <td colSpan={3} className="px-4 py-3" style={{ paddingLeft: `${(depth + 1) * 24 + 16}px` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-accent font-medium">{cat.name}</span>
              <span className="text-xs text-text-tertiary">의 하위 카테고리 추가</span>
              <button onClick={s.onCancelAdd} className="text-xs text-text-tertiary hover:text-text-primary">&times; 취소</button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="카테고리명" value={s.newCatName} onChange={(e) => s.onNewCatName(e.target.value)} className="flex-1" />
              <Input placeholder="English" value={s.newCatNameEn} onChange={(e) => s.onNewCatNameEn(e.target.value)} className="flex-1" />
              <Button onClick={s.onAddCategory} variant="outlined">추가</Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function CategoryManager() {
  const [allCategories, setAllCategories] = useState<CategoryWithCount[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [newCatParentId, setNewCatParentId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameEn, setEditNameEn] = useState("");

  const refresh = async () => setAllCategories(await getCategoriesWithCount());
  useEffect(() => { refresh(); }, []);

  const tree = buildTree(allCategories, null);

  const handleAddCategory = async () => {
    if (!newCatName || !newCatNameEn) return;
    const fd = new FormData();
    fd.set("name", newCatName);
    fd.set("nameEn", newCatNameEn);
    if (newCatParentId) fd.set("parentId", String(newCatParentId));
    await createCategory(fd);
    setNewCatName(""); setNewCatNameEn(""); setNewCatParentId(null);
    await refresh();
  };

  const handleDeleteCategory = async (id: number) => {
    const result = await deleteCategory(id);
    if (result?.error) { alert(result.error); return; }
    await refresh();
  };

  const startEdit = (cat: CategoryWithCount) => {
    setNewCatParentId(null);
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditNameEn(cat.nameEn);
  };

  const handleSaveEdit = async () => {
    if (editingId == null || !editName.trim() || !editNameEn.trim()) return;
    await updateCategory(editingId, { name: editName.trim(), nameEn: editNameEn.trim() });
    setEditingId(null);
    await refresh();
  };

  const shared: RowShared = {
    onDelete: handleDeleteCategory,
    onAddChild: (parentId) => { setEditingId(null); setNewCatParentId(parentId); },
    onStartEdit: startEdit,
    newCatParentId, newCatName, newCatNameEn,
    onNewCatName: setNewCatName,
    onNewCatNameEn: setNewCatNameEn,
    onAddCategory: handleAddCategory,
    onCancelAdd: () => setNewCatParentId(null),
    editingId, editName, editNameEn,
    onEditName: setEditName,
    onEditNameEn: setEditNameEn,
    onSaveEdit: handleSaveEdit,
    onCancelEdit: () => setEditingId(null),
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30 bg-bg-card">
              <th className="text-left text-xs text-text-tertiary font-medium px-4 py-2.5 uppercase tracking-wider">이름</th>
              <th className="text-center text-xs text-text-tertiary font-medium px-4 py-2.5 uppercase tracking-wider w-16">글</th>
              <th className="text-right text-xs text-text-tertiary font-medium px-4 py-2.5 uppercase tracking-wider w-36"></th>
            </tr>
          </thead>
          <tbody>
            {tree.map((cat) => (
              <CategoryRow key={cat.id} cat={cat} depth={0} s={shared} />
            ))}
            {tree.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-text-tertiary">카테고리가 없습니다</td></tr>
            )}
          </tbody>
        </table>
        {newCatParentId === null && (
          <div className="p-4 bg-bg-card/50 border-t border-border/30 space-y-2">
            <span className="text-xs text-accent font-medium">최상위 카테고리 추가</span>
            <div className="flex gap-2">
              <Input placeholder="카테고리명" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1" />
              <Input placeholder="English" value={newCatNameEn} onChange={(e) => setNewCatNameEn(e.target.value)} className="flex-1" />
              <Button onClick={handleAddCategory} variant="outlined">추가</Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
