import { ResumeLayout } from "@/components/blog/ResumeLayout";
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
      posts={posts}
    />
  );
}
