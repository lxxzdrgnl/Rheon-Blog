import { ResumeLayout } from "@/components/blog/ResumeLayout";
import { getPosts, getAllPostTags } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getSettings, getSetting } from "@/actions/settings";
import { getPortfolios } from "@/actions/portfolios";
import { getExperiences, getEducation, getSkills, getSocialLinks, getActivities } from "@/actions/resume";
import type { Metadata } from "next";
import { alternates, socialMeta } from "@/lib/seo";

interface Props { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const isEn = loc === "en";
  const blogTitle = await getSetting(isEn ? "blog_title_en" : "blog_title");
  const blogTitleKo = await getSetting("blog_title");
  const title = blogTitle || blogTitleKo || "Rheon's Blog";
  const tagline = await getSetting(isEn ? "resume_tagline_en" : "resume_tagline");
  const description = tagline || (isEn ? "Personal blog and portfolio" : "개인 블로그와 포트폴리오");
  return {
    title,
    description,
    alternates: alternates("", loc),
    ...socialMeta({ title, description, path: "", locale: loc, type: "website" }),
  };
}

export default async function Home() {
  const [settings, allPosts, allCategories, allPortfolios, postTagsMap, experiences, educationList, skillsList, socialLinks, activitiesList] = await Promise.all([
    getSettings(),
    getPosts({ published: true, limit: 6 }),
    getCategories(),
    getPortfolios(),
    getAllPostTags(),
    getExperiences(),
    getEducation(),
    getSkills(),
    getSocialLinks(),
    getActivities(),
  ]);

  const posts = allPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
      tags: postTagsMap[post.id] || [],
    };
  });

  return (
    <ResumeLayout
      settings={settings}
      socialLinks={socialLinks}
      experiences={experiences}
      education={educationList}
      skills={skillsList}
      portfolios={allPortfolios}
      activities={activitiesList}
      posts={posts}
    />
  );
}
