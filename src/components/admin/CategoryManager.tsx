"use client";

import { useState, useEffect } from "react";
import { getCategoriesWithCount, createCategory, deleteCategory } from "@/actions/categories";
import type { CategoryWithCount } from "@/actions/categories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildTree } from "@/lib/tree";
import type { TreeNode } from "@/lib/tree";


type CategoryTree = TreeNode<CategoryWithCount>;

function CategoryRow({
  cat,
  depth,
  onDelete,
  onAddChild,
  newCatParentId,
  newCatName,
  newCatNameEn,
  onNewCatName,
  onNewCatNameEn,
  onAddCategory,
  onCancelAdd,
}: {
  cat: CategoryTree;
  depth: number;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
  newCatParentId: number | null;
  newCatName: string;
  newCatNameEn: string;
  onNewCatName: (value: string) => void;
  onNewCatNameEn: (value: string) => void;
  onAddCategory: () => void;
  onCancelAdd: () => void;
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
          <span className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated text-text-tertiary">{totalPosts}</span>
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
        <CategoryRow
          key={child.id}
          cat={child}
          depth={depth + 1}
          onDelete={onDelete}
          onAddChild={onAddChild}
          newCatParentId={newCatParentId}
          newCatName={newCatName}
          newCatNameEn={newCatNameEn}
          onNewCatName={onNewCatName}
          onNewCatNameEn={onNewCatNameEn}
          onAddCategory={onAddCategory}
          onCancelAdd={onCancelAdd}
        />
      ))}
      {newCatParentId === cat.id && (
        <tr className="border-b border-border/20 last:border-b-0 bg-bg-card/50">
          <td colSpan={3} className="px-4 py-3" style={{ paddingLeft: `${(depth + 1) * 24 + 16}px` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-accent font-medium">{cat.name}</span>
              <span className="text-xs text-text-tertiary">의 하위 카테고리 추가</span>
              <button onClick={onCancelAdd} className="text-xs text-text-tertiary hover:text-text-primary">&times; 취소</button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="카테고리명" value={newCatName} onChange={(e) => onNewCatName(e.target.value)} className="flex-1" />
              <Input placeholder="English" value={newCatNameEn} onChange={(e) => onNewCatNameEn(e.target.value)} className="flex-1" />
              <Button onClick={onAddCategory} variant="outlined">추가</Button>
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

  useEffect(() => {
    getCategoriesWithCount().then(setAllCategories);
  }, []);

  const tree = buildTree(allCategories, null);

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
  };

  return (
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
              <CategoryRow
                key={cat.id}
                cat={cat}
                depth={0}
                onDelete={handleDeleteCategory}
                onAddChild={handleAddChild}
                newCatParentId={newCatParentId}
                newCatName={newCatName}
                newCatNameEn={newCatNameEn}
                onNewCatName={setNewCatName}
                onNewCatNameEn={setNewCatNameEn}
                onAddCategory={handleAddCategory}
                onCancelAdd={() => setNewCatParentId(null)}
              />
            ))}
            {tree.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-text-tertiary">카테고리가 없습니다</td></tr>
            )}
          </tbody>
        </table>
        {newCatParentId === null && (
          <div id="cat-add-form" className="p-4 bg-bg-card/50 border-t border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-accent font-medium">최상위 카테고리 추가</span>
            </div>
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
