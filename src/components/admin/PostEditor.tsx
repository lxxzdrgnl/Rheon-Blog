"use client";

import { useCallback, useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { EditorPreview } from "@/components/admin/EditorPreview";
import { EditorView, keymap, placeholder as cmPlaceholder, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}

const mdHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontSize: "1.75em", fontWeight: "bold" },
  { tag: tags.heading2, fontSize: "1.5em", fontWeight: "bold" },
  { tag: tags.heading3, fontSize: "1.25em", fontWeight: "bold" },
  { tag: tags.heading4, fontSize: "1.1em", fontWeight: "bold" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.link, color: "var(--accent)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--accent)" },
  { tag: tags.monospace, fontFamily: "monospace", backgroundColor: "var(--bg-card)", padding: "2px 4px", borderRadius: "3px" },
  { tag: tags.quote, color: "var(--text-secondary)", fontStyle: "italic" },
  { tag: tags.processingInstruction, color: "var(--text-secondary)" },
]);

const editorTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "15px", fontFamily: "'Pretendard Variable', Pretendard, sans-serif" },
  ".cm-content": { padding: "24px", caretColor: "var(--text-primary)", color: "var(--text-primary)", lineHeight: "1.8" },
  ".cm-scroller": { overflow: "auto" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "var(--text-primary)" },
  ".cm-activeLine": { backgroundColor: "transparent" },
  ".cm-gutters": { display: "none" },
  ".cm-placeholder": { color: "var(--text-secondary)", opacity: "0.5" },
});

// Toolbar button config
const TOOLBAR = [
  { icon: "H1", prefix: "# ", suffix: "", group: "heading" },
  { icon: "H2", prefix: "## ", suffix: "", group: "heading" },
  { icon: "H3", prefix: "### ", suffix: "", group: "heading" },
  { icon: "H4", prefix: "#### ", suffix: "", group: "heading" },
  { icon: "bold", prefix: "**", suffix: "**", group: "format" },
  { icon: "italic", prefix: "_", suffix: "_", group: "format" },
  { icon: "strikethrough", prefix: "~~", suffix: "~~", group: "format" },
  { icon: "quote", prefix: "> ", suffix: "", group: "block" },
  { icon: "link", prefix: "[", suffix: "](url)", group: "block" },
  { icon: "image", prefix: "", suffix: "", group: "block" },
  { icon: "code", prefix: "```\n", suffix: "\n```", group: "block" },
] as const;

function ToolbarIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "bold":
      return <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z" stroke="currentColor" strokeWidth="1" fill="none"/></svg>;
    case "italic":
      return <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>;
    case "strikethrough":
      return <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 7.5A4.5 4.5 0 0012 4H7v8h5a4.5 4.5 0 010 9H7"/></svg>;
    case "quote":
      return <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor"><path d="M4 5h16v2H4V5zm0 4h10v2H4V9zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" opacity="0.7"/><rect x="2" y="5" width="2" height="14" rx="1"/></svg>;
    case "link":
      return <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
    case "image":
      return <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>;
    case "code":
      return <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    default:
      return <span className="text-sm font-semibold leading-none">{icon}</span>;
  }
}

export interface PostEditorHandle {
  getSelection: () => { from: number; to: number; text: string } | null;
  replaceSelection: (text: string) => void;
}

export const PostEditor = forwardRef<PostEditorHandle, PostEditorProps>(function PostEditor({ value, onChange, onImageUpload }, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onImageUploadRef = useRef(onImageUpload);
  const onChangeRef = useRef(onChange);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  onImageUploadRef.current = onImageUpload;
  onChangeRef.current = onChange;

  useImperativeHandle(ref, () => ({
    getSelection() {
      const view = viewRef.current;
      if (!view) return null;
      const { from, to } = view.state.selection.main;
      if (from === to) return null;
      return { from, to, text: view.state.sliceDoc(from, to) };
    },
    replaceSelection(text: string) {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      if (from === to) return;
      view.dispatch({ changes: { from, to, insert: text } });
    },
  }));

  useEffect(() => {
    if (!editorRef.current) return;

    // Drag & drop + paste image handler as CM extension
    const imageHandler = EditorView.domEventHandlers({
      drop: (event, view) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        for (const file of Array.from(files)) {
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            onImageUploadRef.current(file).then((url) => {
              if (url) {
                const insert = `\n![${file.name}](${url})\n`;
                const pos = view.state.selection.main.head;
                view.dispatch({ changes: { from: pos, insert } });
              }
            });
            return true;
          }
        }
        return false;
      },
      paste: (event, view) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              onImageUploadRef.current(file).then((url) => {
                if (url) {
                  const insert = `\n![image](${url})\n`;
                  const pos = view.state.selection.main.head;
                  view.dispatch({ changes: { from: pos, insert } });
                }
              });
            }
            return true;
          }
        }
        return false;
      },
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(mdHighlight),
        editorTheme,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        cmPlaceholder("내용을 입력하세요..."),
        EditorView.lineWrapping,
        imageHandler,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;
    return () => view.destroy();
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({ changes: { from: 0, to: currentDoc.length, insert: value } });
    }
  }, [value]);

  const insertAtCursor = (prefix: string, suffix: string) => {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const insert = prefix + selected + suffix;
    view.dispatch({ changes: { from, to, insert } });
    view.focus();
  };

  const handleToolbar = (item: typeof TOOLBAR[number]) => {
    if (item.icon === "image") {
      fileInputRef.current?.click();
    } else {
      insertAtCursor(item.prefix, item.suffix);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = await onImageUpload(file);
      if (url) insertAtCursor(`![${file.name}](${url})`, "");
    }
    e.target.value = "";
  };

  let lastGroup = "";

  return (
    <>
      <div className="flex flex-col h-full rounded-lg border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-4 py-2 border-b border-border bg-bg-primary shrink-0">
          {TOOLBAR.map((item, i) => {
            const sep = lastGroup && lastGroup !== item.group;
            lastGroup = item.group;
            return (
              <div key={i} className="flex items-center">
                {sep && <div className="w-px h-5 bg-border mx-2" />}
                <button
                  type="button"
                  onClick={() => handleToolbar(item)}
                  className="p-1.5 rounded hover:bg-bg-elevated text-text-tertiary hover:text-text-primary transition-colors"
                  title={item.icon}
                >
                  <ToolbarIcon icon={item.icon} />
                </button>
              </div>
            );
          })}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
        </div>

        {/* Editor + Preview */}
        <div className="flex flex-1 min-h-0">
          {/* Editor */}
          <div className="w-full md:flex-1 md:border-r border-border overflow-hidden">
            <div ref={editorRef} className="h-full" />
          </div>

          {/* Desktop preview */}
          <div className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden p-6 min-w-0">
            <EditorPreview content={value} onContentChange={onChange} />
          </div>
        </div>
      </div>

      {/* Mobile preview button */}
      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className="md:hidden fixed bottom-20 right-6 z-40 w-12 h-12 rounded-full bg-accent text-bg-primary shadow-lg flex items-center justify-center"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Mobile preview modal */}
      {showPreview && (
        <div className="md:hidden fixed inset-0 z-50 bg-bg-primary overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b border-border bg-bg-primary/90 backdrop-blur-sm">
            <span className="text-sm font-medium">미리보기</span>
            <button onClick={() => setShowPreview(false)} className="text-sm text-text-secondary hover:text-text-primary">닫기</button>
          </div>
          <div className="p-6">
            <EditorPreview content={value} onContentChange={onChange} />
          </div>
        </div>
      )}
    </>
  );
});
