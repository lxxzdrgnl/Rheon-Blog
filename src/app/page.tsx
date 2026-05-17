import { ResumeHeroSection } from "@/components/blog/ResumeHeroSection";
import { AboutSection } from "@/components/blog/AboutSection";
import { ExperienceSection } from "@/components/blog/ExperienceSection";
import { EducationSection } from "@/components/blog/EducationSection";
import { SkillsSection } from "@/components/blog/SkillsSection";
import { PortfolioSection } from "@/components/blog/PortfolioSection";
import { RecentPostsSection } from "@/components/blog/RecentPostsSection";
import { ContactSection } from "@/components/blog/ContactSection";
import { getPosts, getAllPostTags } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getSettings } from "@/actions/settings";
import { getPortfolios } from "@/actions/portfolios";
import { getExperiences, getEducation, getSkills, getSocialLinks } from "@/actions/resume";

export default async function Home() {
  const [settings, allPosts, allCategories, allPortfolios, postTagsMap, experiences, educationList, skillsList, socialLinks] = await Promise.all([
    getSettings(),
    getPosts({ published: true, limit: 6 }),
    getCategories(),
    getPortfolios(),
    getAllPostTags(),
    getExperiences(),
    getEducation(),
    getSkills(),
    getSocialLinks(),
  ]);

  const postsWithCategory = allPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
      tags: postTagsMap[post.id] || [],
    };
  });

  return (
    <div>
      <ResumeHeroSection
        name={(settings.resume_name as string) || ""}
        nameEn={(settings.resume_name_en as string) || ""}
        title={(settings.resume_title as string) || ""}
        titleEn={(settings.resume_title_en as string) || ""}
        tagline={(settings.resume_tagline as string) || ""}
        taglineEn={(settings.resume_tagline_en as string) || ""}
        profileImage={(settings.resume_profile_image as string) || null}
        links={socialLinks}
      />
      <AboutSection
        content={(settings.resume_about as string) || ""}
        contentEn={(settings.resume_about_en as string) || ""}
      />
      <PortfolioSection portfolios={allPortfolios} />
      <ExperienceSection experiences={experiences} />
      <EducationSection education={educationList} />
      <SkillsSection skills={skillsList} />
      <RecentPostsSection posts={postsWithCategory} />
    </div>
  );
}
