"use client";

import { useState } from "react";
import { createCategory, getCategories } from "@/actions/categories";
import { buildTree, getAncestorPath } from "@/lib/tree";
import type { TreeNode } from "@/lib/tree";

interface Category {
  id: number;
  parentId?: number | null;
  name: string;
  nameEn: string;
  slug: string;
}

interface CategorySelectProps {
  categories: Category[];
  value: number | null;
  onChange: (id: number) => void;
  onCategoriesChange?: (categories: Category[]) => void;
}

function TreeItem({
  node,
  depth,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  onAddChild,
}: {
  node: TreeNode<Category>;
  depth: number;
  selectedId: number | null;
  expandedIds: Set<number>;
  onSelect: (id: number) => void;
  onToggleExpand: (id: number) => void;
  onAddChild: (parentId: number) => void;
}) {
  const isSelected = selectedId === node.id;
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center group rounded-lg transition-colors ${
          isSelected ? "bg-accent/10" : "hover:bg-bg-elevated"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={() => hasChildren && onToggleExpand(node.id)}
          className={`w-5 h-5 flex items-center justify-center shrink-0 ${hasChildren ? "text-text-tertiary hover:text-text-primary" : ""}`}
        >
          {hasChildren && (
            <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* Name - click to select */}
        <button
          onClick={() => onSelect(node.id)}
          className={`flex-1 text-left py-2 px-1.5 text-sm truncate ${
            isSelected ? "text-accent font-medium" : "text-text-primary"
          }`}
        >
          {node.name}
          <span className="text-text-tertiary text-xs ml-1.5">{node.nameEn}</span>
        </button>

        {/* Check */}
        {isSelected && (
          <svg className="w-3.5 h-3.5 text-accent shrink-0 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}

        {/* Add child button */}
        <button
          onClick={() => onAddChild(node.id)}
          className="w-6 h-6 flex items-center justify-center text-text-tertiary hover:text-accent opacity-0 group-hover:opacity-100 transition-all shrink-0 mr-1"
          title={`${node.name}에 하위 추가`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategorySelect({ categories, value, onChange, onCategoriesChange }: CategorySelectProps) {
  const [showModal, setShowModal] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [addingParentId, setAddingParentId] = useState<number | null | "root">(null);
  const [newName, setNewName] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = categories.find((c) => c.id === value);
  const tree = buildTree(categories);

  const handleSelect = (id: number) => {
    onChange(id);
    setShowModal(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startAddChild = (parentId: number) => {
    setAddingParentId(parentId);
    setNewName(""); setNewNameEn("");
    // Expand parent so child will be visible
    setExpandedIds((prev) => new Set(prev).add(parentId));
  };

  const startAddRoot = () => {
    setAddingParentId("root");
    setNewName(""); setNewNameEn("");
  };

  const cancelAdd = () => {
    setAddingParentId(null);
    setNewName(""); setNewNameEn("");
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newNameEn.trim()) return;
    setSaving(true);
    const fd = new FormData();
    fd.set("name", newName.trim());
    fd.set("nameEn", newNameEn.trim());
    if (addingParentId !== "root" && addingParentId !== null) {
      fd.set("parentId", String(addingParentId));
    }
    await createCategory(fd);
    setNewName(""); setNewNameEn("");
    setAddingParentId(null);
    setSaving(false);
    if (onCategoriesChange) {
      onCategoriesChange(await getCategories());
    }
  };

  const addTargetName = addingParentId === "root"
    ? null
    : addingParentId
      ? categories.find((c) => c.id === addingParentId)?.name
      : null;

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary whitespace-nowrap">카테고리</span>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm text-text-primary hover:bg-bg-elevated transition-colors"
        >
          {selected ? getAncestorPath(categories, selected.id).join(" > ") : "선택"}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setShowModal(false); cancelAdd(); }}>
          <div className="bg-bg-primary rounded-xl border border-border shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/50">
              <h3 className="font-bold text-sm">카테고리</h3>
            </div>

            {/* Tree */}
            <div className="py-1 px-1 max-h-72 overflow-y-auto">
              {tree.length > 0 ? (
                tree.map((node) => (
                  <TreeItem
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedId={value}
                    expandedIds={expandedIds}
                    onSelect={handleSelect}
                    onToggleExpand={toggleExpand}
                    onAddChild={startAddChild}
                  />
                ))
              ) : (
                <p className="px-3 py-6 text-sm text-text-tertiary text-center">카테고리가 없습니다</p>
              )}

              {/* ... (root add) */}
              <button
                onClick={startAddRoot}
                className="w-full text-left px-3 py-2 text-sm text-text-tertiary hover:text-accent hover:bg-bg-elevated rounded-lg transition-colors mt-1"
              >
                ···
              </button>
            </div>

            {/* Inline add form */}
            {addingParentId !== null && (
              <div className="px-4 py-3 border-t border-border/50 bg-bg-card/50 space-y-2.5">
                <p className="text-xs text-text-secondary">
                  {addTargetName ? (
                    <><span className="font-medium">{addTargetName}</span> 하위에 추가</>
                  ) : (
                    "최상위 카테고리 추가"
                  )}
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="카테고리명 (한국어)"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && document.getElementById("cat-en-input")?.focus()}
                    className="w-full px-2.5 py-2 text-sm border border-border rounded-md bg-bg-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <input
                    id="cat-en-input"
                    type="text"
                    value={newNameEn}
                    onChange={(e) => setNewNameEn(e.target.value)}
                    placeholder="Category Name (English)"
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    className="w-full px-2.5 py-2 text-sm border border-border rounded-md bg-bg-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={cancelAdd} className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-elevated transition-colors">
                      취소
                    </button>
                    <button
                      onClick={handleAdd}
                      disabled={saving || !newName.trim() || !newNameEn.trim()}
                      className="px-4 py-1.5 text-xs bg-accent text-bg-primary rounded-md hover:opacity-90 font-medium disabled:opacity-30"
                    >
                      {saving ? "..." : "추가"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
