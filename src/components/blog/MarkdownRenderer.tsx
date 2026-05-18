"use client";

import ReactMarkdown, { Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

export const markdownPlugins = {
  remarkPlugins: [remarkGfm] as const,
  rehypePlugins: [rehypeRaw] as const,
};

function isBadgeImg(src?: string) {
  if (!src) return false;
  return src.includes("img.shields.io") || src.includes("badge");
}

export const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");
    const isBlock = codeString.includes("\n");

    if (match || isBlock) {
      return <CodeBlock language={match?.[1]}>{codeString}</CodeBlock>;
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  img({ src, alt, ...props }) {
    if (isBadgeImg(src as string | undefined)) {
      return <img src={src} alt={alt || ""} className="inline-block !my-0 h-6" {...props} />;
    }
    return <img src={src} alt={alt || ""} {...props} />;
  },
  table({ children, ...props }) {
    return (
      <div className="table-wrapper">
        <table {...props}>{children}</table>
      </div>
    );
  },
  p({ children, ...props }) {
    const childArray = Array.isArray(children) ? children : [children];
    const hasBadge = childArray.some(
      (child) => typeof child === "object" && child !== null && "props" in child && isBadgeImg(child.props?.src)
    );
    if (hasBadge) {
      return <p className="flex flex-wrap items-center gap-1.5 !leading-none" {...props}>{children}</p>;
    }
    return <p {...props}>{children}</p>;
  },
};

interface MarkdownRendererProps {
  content: string;
  components?: Components;
}

export function MarkdownRenderer({ content, components }: MarkdownRendererProps) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{ ...markdownComponents, ...components }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
