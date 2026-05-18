"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/actions/settings";
import {
  getExperiences, createExperience, updateExperience, deleteExperience, reorderExperiences,
  getActivities, createActivity, updateActivity, deleteActivity, reorderActivities,
  getEducation, createEducation, updateEducation, deleteEducation, reorderEducation,
  getSkills, createSkill, updateSkill, deleteSkill,
  getSocialLinks, createSocialLink, updateSocialLink, deleteSocialLink, reorderSocialLinks,
  translateResumeFields,
} from "@/actions/resume";
import { uploadImage } from "@/lib/upload";

type Experience = { id: number; company: string; companyEn: string | null; role: string; roleEn: string | null; description: string | null; descriptionEn: string | null; startDate: string; endDate: string | null; sortOrder: number };
type Education = { id: number; school: string; schoolEn: string | null; degree: string | null; degreeEn: string | null; field: string | null; fieldEn: string | null; description: string | null; descriptionEn: string | null; startDate: string; endDate: string | null; sortOrder: number };
type Activity = { id: number; title: string; titleEn: string | null; organization: string; organizationEn: string | null; date: string; description: string | null; descriptionEn: string | null; link: string | null; sortOrder: number };
type Skill = { id: number; name: string; category: string; categoryEn: string | null; sortOrder: number };
type SocialLink = { id: number; platform: string; url: string; sortOrder: number };

export default function ResumePage() {
  const [tab, setTab] = useState<"intro" | "experience" | "activities" | "education" | "skills" | "links">("intro");

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [tagline, setTagline] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [about, setAbout] = useState("");
  const [aboutEn, setAboutEn] = useState("");
  const [savingIntro, setSavingIntro] = useState(false);

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingExp, setEditingExp] = useState<Partial<Experience> | null>(null);

  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [editingAct, setEditingAct] = useState<Partial<Activity> | null>(null);

  const [educationList, setEducationList] = useState<Education[]>([]);
  const [editingEdu, setEditingEdu] = useState<Partial<Education> | null>(null);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);

  const [links, setLinks] = useState<SocialLink[]>([]);
  const [editingLink, setEditingLink] = useState<Partial<SocialLink> | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setName((s.resume_name as string) || "");
      setNameEn((s.resume_name_en as string) || "");
      setTitle((s.resume_title as string) || "");
      setTitleEn((s.resume_title_en as string) || "");
      setTagline((s.resume_tagline as string) || "");
      setTaglineEn((s.resume_tagline_en as string) || "");
      setProfileImage((s.resume_profile_image as string) || "");
      setAbout((s.resume_about as string) || "");
      setAboutEn((s.resume_about_en as string) || "");
    });
    getExperiences().then(setExperiences);
    getActivities().then(setActivitiesList);
    getEducation().then(setEducationList);
    getSkills().then(setSkills);
    getSocialLinks().then(setLinks);
  }, []);

  const handleSaveIntro = async () => {
    setSavingIntro(true);
    await updateSettings({
      resume_name: name, resume_name_en: nameEn,
      resume_title: title, resume_title_en: titleEn,
      resume_tagline: tagline, resume_tagline_en: taglineEn,
      resume_profile_image: profileImage,
      resume_about: about, resume_about_en: aboutEn,
    });
    setSavingIntro(false);
  };

  const handleSaveExperience = async () => {
    if (!editingExp?.company || !editingExp?.role || !editingExp?.startDate) return;
    if (editingExp.id) {
      await updateExperience(editingExp.id, {
        company: editingExp.company, companyEn: editingExp.companyEn || undefined,
        role: editingExp.role, roleEn: editingExp.roleEn || undefined,
        description: editingExp.description || undefined, descriptionEn: editingExp.descriptionEn || undefined,
        startDate: editingExp.startDate, endDate: editingExp.endDate || undefined,
      });
    } else {
      await createExperience({
        company: editingExp.company, companyEn: editingExp.companyEn || undefined,
        role: editingExp.role, roleEn: editingExp.roleEn || undefined,
        description: editingExp.description || undefined, descriptionEn: editingExp.descriptionEn || undefined,
        startDate: editingExp.startDate, endDate: editingExp.endDate || undefined,
      });
    }
    setEditingExp(null);
    setExperiences(await getExperiences());
  };

  const handleDeleteExperience = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteExperience(id);
    setExperiences(await getExperiences());
  };

  const handleMoveExperience = async (idx: number, dir: -1 | 1) => {
    const ids = experiences.map((e) => e.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    await reorderExperiences(ids);
    setExperiences(await getExperiences());
  };

  const handleSaveActivity = async () => {
    if (!editingAct?.title || !editingAct?.organization || !editingAct?.date) return;
    if (editingAct.id) {
      await updateActivity(editingAct.id, {
        title: editingAct.title, titleEn: editingAct.titleEn || undefined,
        organization: editingAct.organization, organizationEn: editingAct.organizationEn || undefined,
        date: editingAct.date, description: editingAct.description || undefined, descriptionEn: editingAct.descriptionEn || undefined, link: editingAct.link || undefined,
      });
    } else {
      await createActivity({
        title: editingAct.title, titleEn: editingAct.titleEn || undefined,
        organization: editingAct.organization, organizationEn: editingAct.organizationEn || undefined,
        date: editingAct.date, description: editingAct.description || undefined, descriptionEn: editingAct.descriptionEn || undefined, link: editingAct.link || undefined,
      });
    }
    setEditingAct(null);
    setActivitiesList(await getActivities());
  };

  const handleDeleteActivity = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteActivity(id);
    setActivitiesList(await getActivities());
  };

  const handleMoveActivity = async (idx: number, dir: -1 | 1) => {
    const ids = activitiesList.map((a) => a.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    await reorderActivities(ids);
    setActivitiesList(await getActivities());
  };

  const handleSaveEducation = async () => {
    if (!editingEdu?.school || !editingEdu?.startDate) return;
    if (editingEdu.id) {
      await updateEducation(editingEdu.id, {
        school: editingEdu.school, schoolEn: editingEdu.schoolEn || undefined,
        degree: editingEdu.degree || undefined, degreeEn: editingEdu.degreeEn || undefined,
        field: editingEdu.field || undefined, fieldEn: editingEdu.fieldEn || undefined,
        description: editingEdu.description || undefined, descriptionEn: editingEdu.descriptionEn || undefined,
        startDate: editingEdu.startDate, endDate: editingEdu.endDate || undefined,
      });
    } else {
      await createEducation({
        school: editingEdu.school, schoolEn: editingEdu.schoolEn || undefined,
        degree: editingEdu.degree || undefined, degreeEn: editingEdu.degreeEn || undefined,
        field: editingEdu.field || undefined, fieldEn: editingEdu.fieldEn || undefined,
        description: editingEdu.description || undefined, descriptionEn: editingEdu.descriptionEn || undefined,
        startDate: editingEdu.startDate, endDate: editingEdu.endDate || undefined,
      });
    }
    setEditingEdu(null);
    setEducationList(await getEducation());
  };

  const handleDeleteEducation = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteEducation(id);
    setEducationList(await getEducation());
  };

  const handleMoveEducation = async (idx: number, dir: -1 | 1) => {
    const ids = educationList.map((e) => e.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    await reorderEducation(ids);
    setEducationList(await getEducation());
  };

  const handleSaveSkill = async () => {
    if (!editingSkill?.name || !editingSkill?.category) return;
    if (editingSkill.id) {
      await updateSkill(editingSkill.id, { name: editingSkill.name, category: editingSkill.category, categoryEn: editingSkill.categoryEn || undefined });
    } else {
      await createSkill({ name: editingSkill.name, category: editingSkill.category, categoryEn: editingSkill.categoryEn || undefined });
    }
    setEditingSkill(null);
    setSkills(await getSkills());
  };

  const handleDeleteSkill = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteSkill(id);
    setSkills(await getSkills());
  };

  const handleSaveLink = async () => {
    if (!editingLink?.platform || !editingLink?.url) return;
    if (editingLink.id) {
      await updateSocialLink(editingLink.id, { platform: editingLink.platform, url: editingLink.url });
    } else {
      await createSocialLink({ platform: editingLink.platform, url: editingLink.url });
    }
    setEditingLink(null);
    setLinks(await getSocialLinks());
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteSocialLink(id);
    setLinks(await getSocialLinks());
  };

  const handleMoveLink = async (idx: number, dir: -1 | 1) => {
    const ids = links.map((l) => l.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    await reorderSocialLinks(ids);
    setLinks(await getSocialLinks());
  };

  const TABS = [
    { key: "intro" as const, label: "소개" },
    { key: "experience" as const, label: "경력" },
    { key: "activities" as const, label: "경험" },
    { key: "education" as const, label: "학력" },
    { key: "skills" as const, label: "기술 스택" },
    { key: "links" as const, label: "소셜 링크" },
  ];

  const [translatingSection, setTranslatingSection] = useState<string | null>(null);

  const handleTranslateSection = async (
    section: string,
    fields: Record<string, string>,
    setters: Record<string, (v: string) => void>,
  ) => {
    const nonEmpty = Object.fromEntries(Object.entries(fields).filter(([, v]) => v.trim()));
    if (Object.keys(nonEmpty).length === 0) return;
    setTranslatingSection(section);
    try {
      const result = await translateResumeFields(nonEmpty);
      for (const [key, value] of Object.entries(result)) {
        if (value && setters[key]) setters[key](value);
      }
    } catch { alert("\ubc88\uc5ed\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4."); }
    setTranslatingSection(null);
  };

  const inputClass = "w-full px-3 py-2 text-sm bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary";
  const labelClass = "block text-xs text-text-tertiary uppercase tracking-wider font-medium mb-1.5";
  const btnPrimary = "px-4 py-2 bg-accent text-bg-primary text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50";
  const btnSecondary = "px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-elevated transition-colors";

  const TranslateButton = ({ section, onClick }: { section: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={translatingSection !== null}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-bg-elevated transition-colors text-text-secondary disabled:opacity-50"
    >
      {translatingSection === section ? (
        <>
          <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          번역 중...
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
          </svg>
          AI 번역
        </>
      )}
    </button>
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">이력서 관리</h1>

      <div className="flex gap-1 mb-8 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? "border-accent text-text-primary" : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "intro" && (
        <div className="space-y-6 max-w-2xl">
          <div className="flex justify-end">
            <TranslateButton section="intro" onClick={() => handleTranslateSection("intro",
              { name, title, tagline, about },
              { name: setNameEn, title: setTitleEn, tagline: setTaglineEn, about: setAboutEn },
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>이름</label><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className={labelClass}>Name (EN)</label><input className={inputClass} value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>직함</label><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><label className={labelClass}>Title (EN)</label><input className={inputClass} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>한 줄 소개</label><input className={inputClass} value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
            <div><label className={labelClass}>Tagline (EN)</label><input className={inputClass} value={taglineEn} onChange={(e) => setTaglineEn(e.target.value)} /></div>
          </div>
          <div>
            <label className={labelClass}>프로필 이미지</label>
            <div className="flex items-center gap-4">
              {profileImage && <img src={profileImage} alt="" className="w-16 h-16 rounded-full object-cover" />}
              <label className={btnSecondary + " cursor-pointer"}>
                업로드
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImage(file);
                  if (url) setProfileImage(url);
                }} />
              </label>
              {profileImage && <button onClick={() => setProfileImage("")} className="text-xs text-red-500">제거</button>}
            </div>
          </div>
          <div><label className={labelClass}>자기소개 (마크다운)</label><textarea className={inputClass + " h-40"} value={about} onChange={(e) => setAbout(e.target.value)} /></div>
          <div><label className={labelClass}>About (EN, Markdown)</label><textarea className={inputClass + " h-40"} value={aboutEn} onChange={(e) => setAboutEn(e.target.value)} /></div>
          <button onClick={handleSaveIntro} disabled={savingIntro} className={btnPrimary}>{savingIntro ? "저장 중..." : "저장"}</button>
        </div>
      )}

      {tab === "experience" && (
        <div className="space-y-4">
          <button onClick={() => setEditingExp({})} className={btnPrimary}>+ 경력 추가</button>
          {editingExp && (
            <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
              <div className="flex justify-end">
                <TranslateButton section="experience" onClick={() => handleTranslateSection("experience",
                  { company: editingExp.company || "", role: editingExp.role || "", description: editingExp.description || "" },
                  { company: (v) => setEditingExp((p) => ({ ...p, companyEn: v })), role: (v) => setEditingExp((p) => ({ ...p, roleEn: v })), description: (v) => setEditingExp((p) => ({ ...p, descriptionEn: v })) },
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>회사</label><input className={inputClass} value={editingExp.company || ""} onChange={(e) => setEditingExp({ ...editingExp, company: e.target.value })} /></div>
                <div><label className={labelClass}>Company (EN)</label><input className={inputClass} value={editingExp.companyEn || ""} onChange={(e) => setEditingExp({ ...editingExp, companyEn: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>직책</label><input className={inputClass} value={editingExp.role || ""} onChange={(e) => setEditingExp({ ...editingExp, role: e.target.value })} /></div>
                <div><label className={labelClass}>Role (EN)</label><input className={inputClass} value={editingExp.roleEn || ""} onChange={(e) => setEditingExp({ ...editingExp, roleEn: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>시작일 (YYYY-MM)</label><input className={inputClass} value={editingExp.startDate || ""} onChange={(e) => setEditingExp({ ...editingExp, startDate: e.target.value })} placeholder="2024-01" /></div>
                <div><label className={labelClass}>종료일 (비우면 현재)</label><input className={inputClass} value={editingExp.endDate || ""} onChange={(e) => setEditingExp({ ...editingExp, endDate: e.target.value })} placeholder="2025-03" /></div>
              </div>
              <div><label className={labelClass}>설명</label><textarea className={inputClass + " h-20"} value={editingExp.description || ""} onChange={(e) => setEditingExp({ ...editingExp, description: e.target.value })} /></div>
              <div><label className={labelClass}>Description (EN)</label><textarea className={inputClass + " h-20"} value={editingExp.descriptionEn || ""} onChange={(e) => setEditingExp({ ...editingExp, descriptionEn: e.target.value })} /></div>
              <div className="flex gap-2">
                <button onClick={handleSaveExperience} className={btnPrimary}>저장</button>
                <button onClick={() => setEditingExp(null)} className={btnSecondary}>취소</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {experiences.map((exp, idx) => (
              <div key={exp.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMoveExperience(idx, -1)} disabled={idx === 0} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▲</button>
                  <button onClick={() => handleMoveExperience(idx, 1)} disabled={idx === experiences.length - 1} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{exp.role} @ {exp.company}</p>
                  <p className="text-xs text-text-tertiary">{exp.startDate} — {exp.endDate || "현재"}</p>
                </div>
                <button onClick={() => setEditingExp(exp)} className={btnSecondary}>수정</button>
                <button onClick={() => handleDeleteExperience(exp.id)} className="text-xs text-red-500 hover:text-red-400">삭제</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "activities" && (
        <div className="space-y-4">
          <button onClick={() => setEditingAct({})} className={btnPrimary}>+ 경험 추가</button>
          {editingAct && (
            <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
              <div className="flex justify-end">
                <TranslateButton section="activity" onClick={() => handleTranslateSection("activity",
                  { title: editingAct.title || "", organization: editingAct.organization || "", description: editingAct.description || "" },
                  { title: (v) => setEditingAct((p) => ({ ...p, titleEn: v })), organization: (v) => setEditingAct((p) => ({ ...p, organizationEn: v })), description: (v) => setEditingAct((p) => ({ ...p, descriptionEn: v })) },
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>제목</label><input className={inputClass} value={editingAct.title || ""} onChange={(e) => setEditingAct({ ...editingAct, title: e.target.value })} placeholder="LG Aimers 6기 수료" /></div>
                <div><label className={labelClass}>Title (EN)</label><input className={inputClass} value={editingAct.titleEn || ""} onChange={(e) => setEditingAct({ ...editingAct, titleEn: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>기관/주최</label><input className={inputClass} value={editingAct.organization || ""} onChange={(e) => setEditingAct({ ...editingAct, organization: e.target.value })} placeholder="LG AI연구원" /></div>
                <div><label className={labelClass}>Organization (EN)</label><input className={inputClass} value={editingAct.organizationEn || ""} onChange={(e) => setEditingAct({ ...editingAct, organizationEn: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>날짜</label><input className={inputClass} value={editingAct.date || ""} onChange={(e) => setEditingAct({ ...editingAct, date: e.target.value })} placeholder="2025.01 — 2025.02" /></div>
                <div><label className={labelClass}>관련 링크</label><input className={inputClass} value={editingAct.link || ""} onChange={(e) => setEditingAct({ ...editingAct, link: e.target.value })} placeholder="https://..." /></div>
              </div>
              <div><label className={labelClass}>설명</label><textarea className={inputClass + " h-20"} value={editingAct.description || ""} onChange={(e) => setEditingAct({ ...editingAct, description: e.target.value })} /></div>
              <div><label className={labelClass}>Description (EN)</label><textarea className={inputClass + " h-20"} value={editingAct.descriptionEn || ""} onChange={(e) => setEditingAct({ ...editingAct, descriptionEn: e.target.value })} /></div>
              <div className="flex gap-2">
                <button onClick={handleSaveActivity} className={btnPrimary}>저장</button>
                <button onClick={() => setEditingAct(null)} className={btnSecondary}>취소</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {activitiesList.map((act, idx) => (
              <div key={act.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMoveActivity(idx, -1)} disabled={idx === 0} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▲</button>
                  <button onClick={() => handleMoveActivity(idx, 1)} disabled={idx === activitiesList.length - 1} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{act.title}</p>
                  <p className="text-xs text-text-tertiary">{act.organization} · {act.date}</p>
                </div>
                <button onClick={() => setEditingAct(act)} className={btnSecondary}>수정</button>
                <button onClick={() => handleDeleteActivity(act.id)} className="text-xs text-red-500 hover:text-red-400">삭제</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "education" && (
        <div className="space-y-4">
          <button onClick={() => setEditingEdu({})} className={btnPrimary}>+ 학력 추가</button>
          {editingEdu && (
            <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
              <div className="flex justify-end">
                <TranslateButton section="education" onClick={() => handleTranslateSection("education",
                  { school: editingEdu.school || "", degree: editingEdu.degree || "", field: editingEdu.field || "", description: editingEdu.description || "" },
                  { school: (v) => setEditingEdu((p) => ({ ...p, schoolEn: v })), degree: (v) => setEditingEdu((p) => ({ ...p, degreeEn: v })), field: (v) => setEditingEdu((p) => ({ ...p, fieldEn: v })), description: (v) => setEditingEdu((p) => ({ ...p, descriptionEn: v })) },
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>학교</label><input className={inputClass} value={editingEdu.school || ""} onChange={(e) => setEditingEdu({ ...editingEdu, school: e.target.value })} /></div>
                <div><label className={labelClass}>School (EN)</label><input className={inputClass} value={editingEdu.schoolEn || ""} onChange={(e) => setEditingEdu({ ...editingEdu, schoolEn: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>학위</label><input className={inputClass} value={editingEdu.degree || ""} onChange={(e) => setEditingEdu({ ...editingEdu, degree: e.target.value })} placeholder="학사, 석사..." /></div>
                <div><label className={labelClass}>Degree (EN)</label><input className={inputClass} value={editingEdu.degreeEn || ""} onChange={(e) => setEditingEdu({ ...editingEdu, degreeEn: e.target.value })} placeholder="Bachelor, Master..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>전공</label><input className={inputClass} value={editingEdu.field || ""} onChange={(e) => setEditingEdu({ ...editingEdu, field: e.target.value })} placeholder="컴퓨터공학" /></div>
                <div><label className={labelClass}>Field (EN)</label><input className={inputClass} value={editingEdu.fieldEn || ""} onChange={(e) => setEditingEdu({ ...editingEdu, fieldEn: e.target.value })} placeholder="Computer Science" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>시작일 (YYYY)</label><input className={inputClass} value={editingEdu.startDate || ""} onChange={(e) => setEditingEdu({ ...editingEdu, startDate: e.target.value })} placeholder="2021" /></div>
                <div><label className={labelClass}>종료일 (비우면 현재)</label><input className={inputClass} value={editingEdu.endDate || ""} onChange={(e) => setEditingEdu({ ...editingEdu, endDate: e.target.value })} placeholder="2025" /></div>
              </div>
              <div><label className={labelClass}>설명</label><textarea className={inputClass + " h-20"} value={editingEdu.description || ""} onChange={(e) => setEditingEdu({ ...editingEdu, description: e.target.value })} /></div>
              <div><label className={labelClass}>Description (EN)</label><textarea className={inputClass + " h-20"} value={editingEdu.descriptionEn || ""} onChange={(e) => setEditingEdu({ ...editingEdu, descriptionEn: e.target.value })} /></div>
              <div className="flex gap-2">
                <button onClick={handleSaveEducation} className={btnPrimary}>저장</button>
                <button onClick={() => setEditingEdu(null)} className={btnSecondary}>취소</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {educationList.map((edu, idx) => (
              <div key={edu.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMoveEducation(idx, -1)} disabled={idx === 0} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▲</button>
                  <button onClick={() => handleMoveEducation(idx, 1)} disabled={idx === educationList.length - 1} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{edu.school}</p>
                  <p className="text-xs text-text-tertiary">{[edu.degree, edu.field].filter(Boolean).join(" · ")} · {edu.startDate} — {edu.endDate || "현재"}</p>
                </div>
                <button onClick={() => setEditingEdu(edu)} className={btnSecondary}>수정</button>
                <button onClick={() => handleDeleteEducation(edu.id)} className="text-xs text-red-500 hover:text-red-400">삭제</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "skills" && (
        <div className="space-y-4">
          <button onClick={() => setEditingSkill({})} className={btnPrimary}>+ 기술 추가</button>
          {editingSkill && (
            <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
              <div className="flex justify-end">
                <TranslateButton section="skill" onClick={() => handleTranslateSection("skill",
                  { category: editingSkill.category || "" },
                  { category: (v) => setEditingSkill((p) => ({ ...p, categoryEn: v })) },
                )} />
              </div>
              <div><label className={labelClass}>기술명</label><input className={inputClass} value={editingSkill.name || ""} onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })} placeholder="React" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>카테고리</label><input className={inputClass} value={editingSkill.category || ""} onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value })} placeholder="프론트엔드" /></div>
                <div><label className={labelClass}>Category (EN)</label><input className={inputClass} value={editingSkill.categoryEn || ""} onChange={(e) => setEditingSkill({ ...editingSkill, categoryEn: e.target.value })} placeholder="Frontend" /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveSkill} className={btnPrimary}>저장</button>
                <button onClick={() => setEditingSkill(null)} className={btnSecondary}>취소</button>
              </div>
            </div>
          )}
          {(() => {
            const grouped: Record<string, Skill[]> = {};
            for (const s of skills) {
              if (!grouped[s.category]) grouped[s.category] = [];
              grouped[s.category].push(s);
            }
            return Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="text-sm font-medium text-text-secondary mb-2">{cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((s) => (
                    <span key={s.id} className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-bg-elevated border border-border rounded-lg">
                      {s.name}
                      <button onClick={() => setEditingSkill(s)} className="text-text-tertiary hover:text-accent text-xs opacity-0 group-hover:opacity-100 transition-opacity">✎</button>
                      <button onClick={() => handleDeleteSkill(s.id)} className="text-text-tertiary hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </span>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {tab === "links" && (
        <div className="space-y-4">
          <button onClick={() => setEditingLink({})} className={btnPrimary}>+ 링크 추가</button>
          {editingLink && (
            <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
              <div><label className={labelClass}>플랫폼</label><input className={inputClass} value={editingLink.platform || ""} onChange={(e) => setEditingLink({ ...editingLink, platform: e.target.value })} placeholder="GitHub, LinkedIn, Email..." /></div>
              <div><label className={labelClass}>URL</label><input className={inputClass} value={editingLink.url || ""} onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })} placeholder="https://github.com/..." /></div>
              <div className="flex gap-2">
                <button onClick={handleSaveLink} className={btnPrimary}>저장</button>
                <button onClick={() => setEditingLink(null)} className={btnSecondary}>취소</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {links.map((link, idx) => (
              <div key={link.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMoveLink(idx, -1)} disabled={idx === 0} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▲</button>
                  <button onClick={() => handleMoveLink(idx, 1)} disabled={idx === links.length - 1} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{link.platform}</p>
                  <p className="text-xs text-text-tertiary truncate">{link.url}</p>
                </div>
                <button onClick={() => setEditingLink(link)} className={btnSecondary}>수정</button>
                <button onClick={() => handleDeleteLink(link.id)} className="text-xs text-red-500 hover:text-red-400">삭제</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
