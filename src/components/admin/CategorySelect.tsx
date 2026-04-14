"use client";

interface Category {
  id: number;
  name: string;
  nameEn: string;
  slug: string;
}

interface CategorySelectProps {
  categories: Category[];
  value: number | null;
  onChange: (id: number) => void;
}

export function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="px-4 py-2.5 rounded-lg border border-border bg-bg-primary text-text-primary text-sm"
    >
      <option value="" disabled>카테고리 선택</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  );
}
