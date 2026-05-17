import { PostCard } from "./PostCard";

interface Post {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  createdAt: string;
  categoryName: string;
  categoryNameEn: string;
  tags?: { name: string; nameEn: string }[];
}

export function PostGrid({ posts, thumbnailTextLength }: { posts: Post[]; thumbnailTextLength?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} {...post} thumbnailTextLength={thumbnailTextLength} />
      ))}
    </div>
  );
}
