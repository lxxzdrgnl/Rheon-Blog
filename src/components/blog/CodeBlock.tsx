"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ghcolors } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface CodeBlockProps {
  language?: string;
  children: string;
}

export function CodeBlock({ language, children }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const baseStyle = isDark ? oneDark : ghcolors;

  // Strip background colors from individual tokens to remove highlighter effect
  const style = Object.fromEntries(
    Object.entries(baseStyle).map(([key, value]) => {
      if (typeof value === "object" && value !== null && "background" in value) {
        const { background, ...rest } = value as Record<string, string>;
        return [key, rest];
      }
      return [key, value];
    })
  );

  return (
    <div className="relative group my-5 rounded-lg overflow-hidden border border-border max-w-full">
      {language && (
        <div className="flex items-center px-4 py-1.5 bg-bg-elevated text-xs text-text-tertiary border-b border-border/60 font-mono uppercase tracking-wider">
          {language}
        </div>
      )}
      <SyntaxHighlighter
        style={style}
        language={language || "text"}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.8125rem",
          lineHeight: "1.7",
          padding: "1rem 1.25rem",
          background: isDark ? "#1a1e1e" : "#f0f2f0",
          overflowX: "auto",
          wordBreak: "break-all" as const,
          whiteSpace: "pre-wrap",
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
