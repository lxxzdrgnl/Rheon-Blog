"use client";

import { useState, useEffect, useMemo } from "react";
import { getTags, createTag } from "@/actions/tags";

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
  const [input, setInput] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    getTags().then(setAllTags);
  }, []);

  const filtered = useMemo(() => {
    if (!input.trim()) return [];
    const q = input.toLowerCase();
    return allTags.filter(
      (t) =>
        !selectedTags.some((s) => s.id === t.id) &&
        (t.name.toLowerCase().includes(q) || t.nameEn.toLowerCase().includes(q))
    );
  }, [input, allTags, selectedTags]);

  const handleInputChange = (value: string) => {
    setInput(value);
    setShowDropdown(!!value.trim());
  };

  const addExistingTag = (tag: Tag) => {
    onChange([...selectedTags, tag]);
    setInput("");
    setShowDropdown(false);
  };

  const removeTag = (id: number) => {
    onChange(selectedTags.filter((t) => t.id !== id));
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const value = input.replace(",", "").trim();
      if (!value) return;

      // Check if tag already exists
      const existing = allTags.find(
        (t) => t.name === value || t.nameEn.toLowerCase() === value.toLowerCase()
      );

      if (existing) {
        if (!selectedTags.some((s) => s.id === existing.id)) {
          addExistingTag(existing);
        } else {
          setInput("");
          setShowDropdown(false);
        }
      } else {
        // Create new tag — use the input as both ko and en name
        const newTag = await createTag(value, value);
        onChange([...selectedTags, newTag]);
        setAllTags((prev) => [...prev, newTag]);
        setInput("");
        setShowDropdown(false);
      }
    } else if (e.key === "Backspace" && !input && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1].id);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-transparent min-h-[40px]">
        {selectedTags.map((tag) => (
          <span key={tag.id} className="inline-flex items-center gap-1 px-3 py-1 bg-bg-card rounded text-sm text-accent">
            {tag.name}
            <button onClick={() => removeTag(tag.id)} className="text-text-secondary hover:text-text-primary ml-0.5">&times;</button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input.trim() && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={selectedTags.length === 0 ? "태그를 입력하세요 (쉼표 또는 Enter로 구분)" : ""}
          className="flex-1 min-w-[150px] bg-transparent text-sm focus:outline-none text-text-primary placeholder:text-text-secondary/50"
        />
      </div>

      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 border border-border rounded-lg bg-bg-primary shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addExistingTag(tag)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-bg-card flex justify-between"
            >
              <span>{tag.name}</span>
              <span className="text-text-secondary text-xs">{tag.nameEn}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
