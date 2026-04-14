"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { TagInput } from "@/components/admin/TagInput";
import { SlugInput } from "@/components/admin/SlugInput";
import { ImageSelector } from "@/components/admin/ImageSelector";
import { TranslationEditor } from "@/components/admin/TranslationEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getCategories } from "@/actions/categories";
import { getPostById, getPostTags, savePost } from "@/actions/posts";
import { extractImageUrls } from "@/lib/markdown";

interface Tag {
  id: number;
  name: string;
  nameEn: string;
}

export default function WritePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; nameEn: string; slug: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [postTitleEn, setPostTitleEn] = useState<string | null>(null);
  const [postContentEn, setPostContentEn] = useState<string | null>(null);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (editId) {
      getPostById(editId).then((post) => {
        if (post) {
          setTitle(post.title);
          setContent(post.content);
          setSlug(post.slug);
          setCategoryId(post.categoryId);
          setThumbnail(post.thumbnail);
          setPostTitleEn(post.titleEn);
          setPostContentEn(post.contentEn);
        }
      });
      getPostTags(editId).then(setSelectedTags);
    }
  }, [editId]);

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url;
  };

  const handleSave = async (publish: boolean) => {
    if (!title || !content || !categoryId) return;
    setSaving(true);

    const fd = new FormData();
    if (editId) fd.set("id", String(editId));
    fd.set("title", title);
    fd.set("content", content);
    fd.set("slug", slug);
    fd.set("categoryId", String(categoryId));
    fd.set("thumbnail", thumbnail || "");
    fd.set("tagIds", JSON.stringify(selectedTags.map((t) => t.id)));
    fd.set("publish", String(publish));

    const result = await savePost(fd);
    setSaving(false);
    router.push(`/my/write?id=${result.postId}`);
  };

  const images = extractImageUrls(content);

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{editId ? "글 수정" : "새 글 작성"}</h1>
        <div className="flex gap-2">
          <Button variant="outlined" onClick={() => handleSave(false)} disabled={saving}>
            임시저장
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? "저장 중..." : "발행"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="text-2xl font-bold border-0 border-b rounded-none px-0 focus:border-accent"
        />
        <SlugInput title={title} value={slug} onChange={setSlug} />
        <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
        <TagInput selectedTags={selectedTags} onChange={setSelectedTags} />
        <PostEditor value={content} onChange={setContent} onImageUpload={handleImageUpload} />
        <ImageSelector images={images} thumbnail={thumbnail} onSelect={setThumbnail} />
        {editId && postTitleEn && (
          <TranslationEditor postId={editId} titleEn={postTitleEn} contentEn={postContentEn} />
        )}
      </div>
    </div>
  );
}
