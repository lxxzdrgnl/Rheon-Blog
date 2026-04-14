"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export function PostEditor({ value, onChange, onImageUpload }: PostEditorProps) {
  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) {
          const url = await onImageUpload(file);
          onChange(value + `\n![${file.name}](${url})\n`);
        }
      }
    },
    [value, onChange, onImageUpload]
  );

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const items = event.clipboardData.items;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const url = await onImageUpload(file);
            onChange(value + `\n![image](${url})\n`);
          }
        }
      }
    },
    [value, onChange, onImageUpload]
  );

  return (
    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onPaste={handlePaste}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={500}
        preview="live"
        data-color-mode="auto"
      />
    </div>
  );
}
