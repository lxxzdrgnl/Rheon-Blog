"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  // mermaid.render needs a unique DOM id; keep it stable per component instance.
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "dark" ? "dark" : "default",
          securityLevel: "strict",
          suppressErrorRendering: true,
          flowchart: { curve: "basis" },
        });
        const { svg } = await mermaid.render(idRef.current, chart);
        if (!cancelled) {
          setSvg(svg);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme, mounted]);

  if (!mounted || (!svg && !error)) {
    return (
      <div className="my-5 rounded-lg border border-border bg-bg-elevated p-4 text-xs text-text-tertiary font-mono">
        다이어그램 렌더링 중…
      </div>
    );
  }

  if (error) {
    // Fall back to the raw source so a syntax error never blanks the post.
    return (
      <pre className="my-5 rounded-lg border border-border bg-bg-elevated p-4 overflow-x-auto text-xs">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      className="my-5 flex justify-center overflow-x-auto [&>svg]:max-w-full [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg! }}
    />
  );
}
