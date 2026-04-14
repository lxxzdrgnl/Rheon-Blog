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
  const style = isDark ? oneDark : ghcolors;

  return (
    <div className="relative group my-5 rounded-lg overflow-hidden border border-border/60">
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
          background: isDark ? "#101414" : "#fafaf9",
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
