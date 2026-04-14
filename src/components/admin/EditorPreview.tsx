"use client";

import { useCallback, useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";

interface EditorPreviewProps {
  content: string;
  onContentChange: (content: string) => void;
}

function ResizableImage({
  src,
  alt,
  initialWidth,
  onResize,
}: {
  src: string;
  alt: string;
  initialWidth?: number;
  onResize: (src: string, width: number) => void;
}) {
  const imgRef = useRef<HTMLSpanElement>(null);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      startX.current = e.clientX;
      startWidth.current = imgRef.current?.offsetWidth || 300;

      const handleMouseMove = (ev: MouseEvent) => {
        const diff = ev.clientX - startX.current;
        const newWidth = Math.max(100, startWidth.current + diff);
        if (imgRef.current) {
          imgRef.current.style.width = `${newWidth}px`;
        }
      };

      const handleMouseUp = (ev: MouseEvent) => {
        setDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        const diff = ev.clientX - startX.current;
        const newWidth = Math.max(100, startWidth.current + diff);
        onResize(src, newWidth);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [src, onResize]
  );

  return (
    <span ref={imgRef} className="relative inline-block group my-4" style={{ maxWidth: "100%", display: "block", width: initialWidth ? `${initialWidth}px` : undefined }}>
      <img src={src} alt={alt || ""} className="w-full h-auto rounded-lg block" draggable={false} style={{ width: "100%", height: "auto" }} />
      {/* Resize handle */}
      <span
        onMouseDown={handleMouseDown}
        className={`absolute bottom-1 right-1 w-5 h-5 cursor-se-resize rounded-bl-lg bg-accent/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${dragging ? "opacity-100" : ""}`}
      >
        <svg className="w-3 h-3 text-white" viewBox="0 0 10 10" fill="currentColor">
          <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </span>
    </span>
  );
}

export function EditorPreview({ content, onContentChange }: EditorPreviewProps) {
  const handleImageResize = useCallback(
    (src: string, width: number) => {
      // Replace ![alt](src) with <img src="..." alt="..." width="..." />
      const imgRegex = new RegExp(
        `!\\[([^\\]]*)\\]\\(${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
        "g"
      );
      // Also match existing <img> tags with this src
      const imgTagRegex = new RegExp(
        `<img[^>]*src="${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*\\/?>`,
        "g"
      );

      let newContent = content;

      if (imgTagRegex.test(newContent)) {
        // Update existing <img> tag width
        newContent = newContent.replace(imgTagRegex, (match) => {
          if (match.includes("width=")) {
            return match.replace(/width="[^"]*"/, `width="${width}"`);
          }
          return match.replace("/>", `width="${width}" />`).replace(">", ` width="${width}">`);
        });
      } else if (imgRegex.test(newContent)) {
        // Replace markdown image with <img> tag
        newContent = newContent.replace(imgRegex, (_, alt) => {
          return `<img src="${src}" alt="${alt}" width="${width}" />`;
        });
      }

      onContentChange(newContent);
    },
    [content, onContentChange]
  );

  return (
    <MarkdownRenderer
      content={content}
      components={{
        img: ({ src, alt, width }) => {
          if (!src || typeof src !== "string") return null;
          return (
            <ResizableImage
              src={src}
              alt={alt || ""}
              initialWidth={width ? Number(width) : undefined}
              onResize={handleImageResize}
            />
          );
        },
      }}
    />
  );
}
