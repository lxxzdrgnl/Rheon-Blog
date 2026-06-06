import { ResumeLayout } from "@/components/blog/ResumeLayout";
import { getPosts, getAllPostTags } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getSettings, getSetting } from "@/actions/settings";
import { getPortfolios } from "@/actions/portfolios";
import { getExperiences, getEducation, getSkills, getSocialLinks, getActivities } from "@/actions/resume";
import type { Metadata } from "next";
import { pageMetadata, personJsonLd } from "@/lib/seo";
import { excerptFromMarkdown } from "@/lib/markdown";

interface Props { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const isEn = loc === "en";
  const s = await getSettings();
  const name = ((isEn ? s.resume_name_en : s.resume_name) as string) || (s.resume_name as string) || "";
  const role = ((isEn ? s.resume_title_en : s.resume_title) as string) || "";
  const blogTitle = ((isEn ? s.blog_title_en : s.blog_title) as string) || (s.blog_title as string) || "Rheon's Blog";
  // 이름 검색 대응: 제목에 이름(+직함)을 넣고, 설명엔 소개를 쓴다.
  const title = name ? (role ? `${name} — ${role}` : `${name} | ${blogTitle}`) : blogTitle;
  const about = (isEn ? s.resume_about_en : s.resume_about) as string;
  const tagline = (isEn ? s.resume_tagline_en : s.resume_tagline) as string;
  const description =
    (about && excerptFromMarkdown(about, 160)) || tagline || (isEn ? "Personal blog and portfolio" : "개인 블로그와 포트폴리오");
  return pageMetadata({ title, description, path: "", locale: loc, type: "website" });
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const isEn = locale === "en";
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

  const jsonLd = personJsonLd({
    locale: isEn ? "en" : "ko",
    name: ((isEn ? settings.resume_name_en : settings.resume_name) as string) || (settings.resume_name as string) || "",
    jobTitle: ((isEn ? settings.resume_title_en : settings.resume_title) as string) || "",
    description: excerptFromMarkdown(((isEn ? settings.resume_about_en : settings.resume_about) as string) || "", 300),
    image: (settings.resume_profile_image as string) || "",
    email: socialLinks.find((l) => l.platform.toLowerCase() === "email")?.url.replace(/^mailto:/, "") || "",
    sameAs: socialLinks.filter((l) => l.platform.toLowerCase() !== "email").map((l) => l.url),
    knowsAbout: skillsList.flatMap((s) => s.name.split(",").map((x) => x.trim())).filter(Boolean),
    alumniOf: educationList.map((e) => (isEn ? e.schoolEn || e.school : e.school)).filter(Boolean),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
    </>
  );
}
