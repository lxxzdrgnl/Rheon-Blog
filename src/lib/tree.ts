export type TreeNode<T extends { id: number; parentId?: number | null }> = T & {
  children: TreeNode<T>[];
};

export function buildTree<T extends { id: number; parentId?: number | null }>(
  items: T[],
  parentId: number | null = null,
): TreeNode<T>[] {
  return items
    .filter((item) => (item.parentId ?? null) === parentId)
    .map((item) => ({ ...item, children: buildTree(items, item.id) }));
}

export function getAncestorPath<T extends { id: number; parentId?: number | null; name: string }>(
  items: T[],
  id: number | null,
): string[] {
  if (!id) return [];
  const path: string[] = [];
  let current = items.find((c) => c.id === id);
  while (current) {
    path.unshift(current.name);
    current = current.parentId ? items.find((c) => c.id === current!.parentId) : undefined;
  }
  return path;
}
