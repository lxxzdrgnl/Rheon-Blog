"use client";

import { useEffect, useState } from "react";

// Client-safe slug preview: lowercases and replaces spaces/special chars with hyphens.
// The server-side generateSlug (with transliteration) is used when saving via savePost.
function clientSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface SlugInputProps {
  title: string;
  value: string;
  onChange: (slug: string) => void;
}

export function SlugInput({ title, value, onChange }: SlugInputProps) {
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (!manual && title) {
      onChange(clientSlug(title));
    }
  }, [title, manual, onChange]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary whitespace-nowrap">/post/</span>
      <input
        type="text"
        value={value}
        onChange={(e) => { setManual(true); onChange(e.target.value); }}
        className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg-primary text-sm"
      />
      {manual && (
        <button
          onClick={() => { setManual(false); onChange(clientSlug(title)); }}
          className="text-xs text-accent hover:underline whitespace-nowrap"
        >
          자동 생성
        </button>
      )}
    </div>
  );
}
