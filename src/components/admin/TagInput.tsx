"use client";

import { useState } from "react";
import { searchTags, createTag } from "@/actions/tags";

interface Tag {
  id: number;
  name: string;
  nameEn: string;
}

interface TagInputProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
}

export function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [query, setQuery] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length > 0) {
      const results = await searchTags(value);
      setSuggestions(results.filter((t) => !selectedTags.some((s) => s.id === t.id)));
    } else {
      setSuggestions([]);
    }
  };

  const addTag = (tag: Tag) => {
    onChange([...selectedTags, tag]);
    setQuery("");
    setSuggestions([]);
  };

  const removeTag = (id: number) => {
    onChange(selectedTags.filter((t) => t.id !== id));
  };

  const handleCreate = async () => {
    if (!query.trim() || !nameEn.trim()) return;
    const tag = await createTag(query.trim(), nameEn.trim());
    addTag(tag);
    setNameEn("");
    setShowNewForm(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span key={tag.id} className="inline-flex items-center gap-1 px-3 py-1 bg-bg-card rounded-full text-sm">
            {tag.name}
            <button onClick={() => removeTag(tag.id)} className="text-text-secondary hover:text-text-primary">&times;</button>
          </span>
        ))}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="태그 검색 또는 추가"
        className="w-full px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm"
      />

      {suggestions.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          {suggestions.map((tag) => (
            <button key={tag.id} onClick={() => addTag(tag)} className="w-full px-4 py-2 text-left text-sm hover:bg-bg-card">
              {tag.name} ({tag.nameEn})
            </button>
          ))}
        </div>
      )}

      {query.trim() && suggestions.length === 0 && !showNewForm && (
        <button onClick={() => setShowNewForm(true)} className="text-sm text-accent hover:underline">
          &quot;{query}&quot; 새 태그 만들기
        </button>
      )}

      {showNewForm && (
        <div className="flex gap-2">
          <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="영문 태그명" className="flex-1 px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm" />
          <button onClick={handleCreate} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">추가</button>
        </div>
      )}
    </div>
  );
}
