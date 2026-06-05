"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface MermaidProps {
  chart: string;
}

// stepAfter 곡선이 만드는 직각 폴리라인의 각 꺾임점을 반지름 r 곡선으로 라운딩한다.
const CORNER_RADIUS = 3;

function roundPathCorners(d: string, r: number): string {
  const tokens = d.match(/[MLCQZ][^MLCQZ]*/gi);
  if (!tokens) return d;
  const pts: { x: number; y: number }[] = [];
  for (const t of tokens) {
    const cmd = t[0].toUpperCase();
    if (cmd === "Z") continue;
    if (cmd !== "M" && cmd !== "L") return d; // 이미 곡선(C/Q)이면 손대지 않는다.
    const nums = t.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
  }
  if (pts.length < 3) return d;
  let out = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
    const v1x = p1.x - p0.x, v1y = p1.y - p0.y;
    const v2x = p2.x - p1.x, v2y = p2.y - p1.y;
    const l1 = Math.hypot(v1x, v1y), l2 = Math.hypot(v2x, v2y);
    if (l1 < 0.001 || l2 < 0.001) { out += ` L${p1.x},${p1.y}`; continue; }
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const ax = p1.x - (v1x / l1) * rr, ay = p1.y - (v1y / l1) * rr;
    const bx = p1.x + (v2x / l2) * rr, by = p1.y + (v2y / l2) * rr;
    out += ` L${ax.toFixed(2)},${ay.toFixed(2)} Q${p1.x},${p1.y} ${bx.toFixed(2)},${by.toFixed(2)}`;
  }
  const last = pts[pts.length - 1];
  out += ` L${last.x},${last.y}`;
  return out;
}

function softenEdges(svg: string, r: number): string {
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const paths = doc.querySelectorAll<SVGPathElement>("path.flowchart-link, .edgePaths path");
    if (paths.length === 0) return svg;
    paths.forEach((p) => {
      const d = p.getAttribute("d");
      if (d) p.setAttribute("d", roundPathCorners(d, r));
    });
    return new XMLSerializer().serializeToString(doc.documentElement);
  } catch {
    return svg; // 파싱 실패 시 원본 그대로 사용
  }
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
          flowchart: { curve: "stepAfter" },
        });
        const { svg } = await mermaid.render(idRef.current, chart);
        if (!cancelled) {
          setSvg(softenEdges(svg, CORNER_RADIUS));
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
