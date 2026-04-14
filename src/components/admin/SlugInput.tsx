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
  locked?: boolean;
}

export function SlugInput({ title, value, onChange, locked }: SlugInputProps) {
  const [manual, setManual] = useState(!!locked);

  useEffect(() => {
    if (!manual && !locked && title) {
      const slug = clientSlug(title);
      onChange(slug.slice(0, 20).replace(/-$/, ""));
    }
  }, [title, manual, locked, onChange]);

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
