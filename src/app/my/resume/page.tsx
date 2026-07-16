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
  deleteResumePdf,
} from "@/actions/resume";
import { uploadImage, uploadResumePdfFile } from "@/lib/upload";
import { SOCIAL_ICONS, SOCIAL_PRESETS } from "@/lib/socialIcons";

type Experience = { id: number; company: string; companyEn: string | null; role: string; roleEn: string | null; description: string | null; descriptionEn: string | null; startDate: string; endDate: string | null; sortOrder: number };
type Education = { id: number; school: string; schoolEn: string | null; degree: string | null; degreeEn: string | null; field: string | null; fieldEn: string | null; description: string | null; descriptionEn: string | null; startDate: string; endDate: string | null; sortOrder: number };
type Activity = { id: number; title: string; titleEn: string | null; organization: string; organizationEn: string | null; date: string; description: string | null; descriptionEn: string | null; link: string | null; sortOrder: number };
type Skill = { id: number; name: string; category: string; categoryEn: string | null; sortOrder: number };
type SocialLink = { id: number; platform: string; url: string; sortOrder: number };

export default function ResumePage() {
  const [tab, setTab] = useState<"intro" | "experience" | "activities" | "education" | "skills" | "links">("intro");

  // 저장/삭제 완료 토스트
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  };

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [tagline, setTagline] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [pdfKo, setPdfKo] = useState("");
  const [pdfEn, setPdfEn] = useState("");
  const [pdfBusy, setPdfBusy] = useState<"ko" | "en" | null>(null);
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
  const [skillCatForm, setSkillCatForm] = useState(false);
  const [newSkillCat, setNewSkillCat] = useState({ name: "", nameEn: "" });
  const [customCategories, setCustomCategories] = useState<{ name: string; nameEn: string }[]>([]);

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
      setPdfKo((s.resume_pdf_ko as string) || "");
      setPdfEn((s.resume_pdf_en as string) || "");
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
    showToast("저장되었습니다");
  };

  const handleUploadPdf = async (locale: "ko" | "en", file: File) => {
    setPdfBusy(locale);
    try {
      const url = await uploadResumePdfFile(file, locale);
      if (!url) return;
      (locale === "ko" ? setPdfKo : setPdfEn)(url);
      showToast("이력서가 업로드되었습니다");
    } catch {
      alert("이력서 업로드에 실패했습니다.");
    } finally {
      setPdfBusy(null);
    }
  };

  const handleDeletePdf = async (locale: "ko" | "en") => {
    if (!confirm("이력서 PDF를 삭제하시겠습니까?")) return;
    setPdfBusy(locale);
    try {
      await deleteResumePdf(locale);
      (locale === "ko" ? setPdfKo : setPdfEn)("");
      showToast("삭제되었습니다");
    } catch {
      alert("이력서 삭제에 실패했습니다.");
    } finally {
      setPdfBusy(null);
    }
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
    showToast("저장되었습니다");
  };

  const handleDeleteExperience = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteExperience(id);
    setExperiences(await getExperiences());
    showToast("삭제되었습니다");
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
    showToast("저장되었습니다");
  };

  const handleDeleteActivity = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteActivity(id);
    setActivitiesList(await getActivities());
    showToast("삭제되었습니다");
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
    showToast("저장되었습니다");
  };

  const handleDeleteEducation = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteEducation(id);
    setEducationList(await getEducation());
    showToast("삭제되었습니다");
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
    showToast("저장되었습니다");
  };

  const handleDeleteSkill = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteSkill(id);
    setSkills(await getSkills());
    showToast("삭제되었습니다");
  };

  const handleAddSkillCategory = () => {
    const name = newSkillCat.name.trim();
    if (!name) return;
    setCustomCategories((prev) => (prev.some((c) => c.name === name) ? prev : [...prev, { name, nameEn: newSkillCat.nameEn.trim() }]));
    setNewSkillCat({ name: "", nameEn: "" });
    setSkillCatForm(false);
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
    showToast("저장되었습니다");
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteSocialLink(id);
    setLinks(await getSocialLinks());
    showToast("삭제되었습니다");
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

  // 편집 폼 — 신규는 목록 상단, 수정은 해당 항목 자리에 인라인으로 렌더(같은 엘리먼트 재사용).
  const experienceForm = editingExp ? (
    <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
      <div className="flex justify-end">
        <TranslateButton section="experience" onClick={() => handleTranslateSection("experience",
          { company: editingExp.company || "", role: editingExp.role || "", description: editingExp.description || "" },
          { company: (v) => setEditingExp((p) => ({ ...p, companyEn: v })), role: (v) => setEditingExp((p) => ({ ...p, roleEn: v })), description: (v) => setEditingExp((p) => ({ ...p, descriptionEn: v })) },
        )} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={labelClass}>회사</label><input className={inputClass} value={editingExp.company || ""} onChange={(e) => setEditingExp({ ...editingExp, company: e.target.value })} /></div>
        <div><label className={labelClass}>Company (EN)</label><input className={inputClass} value={editingExp.companyEn || ""} onChange={(e) => setEditingExp({ ...editingExp, companyEn: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={labelClass}>직책</label><input className={inputClass} value={editingExp.role || ""} onChange={(e) => setEditingExp({ ...editingExp, role: e.target.value })} /></div>
        <div><label className={labelClass}>Role (EN)</label><input className={inputClass} value={editingExp.roleEn || ""} onChange={(e) => setEditingExp({ ...editingExp, roleEn: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  ) : null;

  const activityForm = editingAct ? (
    <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
      <div className="flex justify-end">
        <TranslateButton section="activity" onClick={() => handleTranslateSection("activity",
          { title: editingAct.title || "", organization: editingAct.organization || "", description: editingAct.description || "" },
          { title: (v) => setEditingAct((p) => ({ ...p, titleEn: v })), organization: (v) => setEditingAct((p) => ({ ...p, organizationEn: v })), description: (v) => setEditingAct((p) => ({ ...p, descriptionEn: v })) },
        )} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={labelClass}>제목</label><input className={inputClass} value={editingAct.title || ""} onChange={(e) => setEditingAct({ ...editingAct, title: e.target.value })} placeholder="LG Aimers 6기 수료" /></div>
        <div><label className={labelClass}>Title (EN)</label><input className={inputClass} value={editingAct.titleEn || ""} onChange={(e) => setEditingAct({ ...editingAct, titleEn: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={labelClass}>기관/주최</label><input className={inputClass} value={editingAct.organization || ""} onChange={(e) => setEditingAct({ ...editingAct, organization: e.target.value })} placeholder="LG AI연구원" /></div>
        <div><label className={labelClass}>Organization (EN)</label><input className={inputClass} value={editingAct.organizationEn || ""} onChange={(e) => setEditingAct({ ...editingAct, organizationEn: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  ) : null;

  const educationForm = editingEdu ? (
    <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
      <div className="flex justify-end">
        <TranslateButton section="education" onClick={() => handleTranslateSection("education",
          { school: editingEdu.school || "", degree: editingEdu.degree || "", field: editingEdu.field || "", description: editingEdu.description || "" },
          { school: (v) => setEditingEdu((p) => ({ ...p, schoolEn: v })), degree: (v) => setEditingEdu((p) => ({ ...p, degreeEn: v })), field: (v) => setEditingEdu((p) => ({ ...p, fieldEn: v })), description: (v) => setEditingEdu((p) => ({ ...p, descriptionEn: v })) },
        )} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={labelClass}>학교</label><input className={inputClass} value={editingEdu.school || ""} onChange={(e) => setEditingEdu({ ...editingEdu, school: e.target.value })} /></div>
        <div><label className={labelClass}>School (EN)</label><input className={inputClass} value={editingEdu.schoolEn || ""} onChange={(e) => setEditingEdu({ ...editingEdu, schoolEn: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={labelClass}>학위</label><input className={inputClass} value={editingEdu.degree || ""} onChange={(e) => setEditingEdu({ ...editingEdu, degree: e.target.value })} placeholder="학사, 석사..." /></div>
        <div><label className={labelClass}>Degree (EN)</label><input className={inputClass} value={editingEdu.degreeEn || ""} onChange={(e) => setEditingEdu({ ...editingEdu, degreeEn: e.target.value })} placeholder="Bachelor, Master..." /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={labelClass}>전공</label><input className={inputClass} value={editingEdu.field || ""} onChange={(e) => setEditingEdu({ ...editingEdu, field: e.target.value })} placeholder="컴퓨터공학" /></div>
        <div><label className={labelClass}>Field (EN)</label><input className={inputClass} value={editingEdu.fieldEn || ""} onChange={(e) => setEditingEdu({ ...editingEdu, fieldEn: e.target.value })} placeholder="Computer Science" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  ) : null;

  const linkForm = editingLink ? (
    <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
      <div>
        <label className={labelClass}>플랫폼</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {SOCIAL_PRESETS.map((p) => {
            const active = (editingLink.platform || "").toLowerCase() === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setEditingLink({ ...editingLink, platform: p.label })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${active ? "border-accent text-accent bg-accent/5" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d={SOCIAL_ICONS[p.key]} /></svg>
                {p.label}
              </button>
            );
          })}
        </div>
        <input className={inputClass} value={editingLink.platform || ""} onChange={(e) => setEditingLink({ ...editingLink, platform: e.target.value })} placeholder="직접 입력 (예: Velog, Notion)" />
      </div>
      <div>
        <label className={labelClass}>URL</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </span>
          <input
            className={inputClass + " pl-9"}
            value={editingLink.url || ""}
            onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
            placeholder={SOCIAL_PRESETS.find((p) => p.key === (editingLink.platform || "").toLowerCase())?.placeholder || "https://..."}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSaveLink} className={btnPrimary}>저장</button>
        <button onClick={() => setEditingLink(null)} className={btnSecondary}>취소</button>
      </div>
    </div>
  ) : null;

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>이름</label><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className={labelClass}>Name (EN)</label><input className={inputClass} value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>직함</label><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><label className={labelClass}>Title (EN)</label><input className={inputClass} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div>
            <label className={labelClass}>이력서 PDF <span className="text-xs text-text-tertiary font-normal">— 업로드·삭제는 즉시 반영됩니다 (아래 저장 버튼과 무관)</span></label>
            <div className="space-y-2">
              {([["ko", "한국어", pdfKo], ["en", "English", pdfEn]] as const).map(([loc, label, url]) => (
                <div key={loc} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-text-secondary">{label}</span>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline truncate max-w-[16rem]">
                      현재 파일 열기
                    </a>
                  ) : (
                    <span className="text-xs text-text-tertiary">없음</span>
                  )}
                  <label className={btnSecondary + " cursor-pointer"}>
                    {pdfBusy === loc ? "처리 중..." : url ? "교체" : "업로드"}
                    <input type="file" accept="application/pdf" className="hidden" disabled={pdfBusy != null} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) await handleUploadPdf(loc, file);
                    }} />
                  </label>
                  {url && (
                    <button onClick={() => handleDeletePdf(loc)} disabled={pdfBusy != null} className="text-xs text-red-500">삭제</button>
                  )}
                </div>
              ))}
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
          {editingExp && editingExp.id == null && experienceForm}
          <div className="space-y-2">
            {experiences.map((exp, idx) =>
              editingExp?.id === exp.id ? <div key={exp.id}>{experienceForm}</div> : (
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
          {editingAct && editingAct.id == null && activityForm}
          <div className="space-y-2">
            {activitiesList.map((act, idx) =>
              editingAct?.id === act.id ? <div key={act.id}>{activityForm}</div> : (
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
          {editingEdu && editingEdu.id == null && educationForm}
          <div className="space-y-2">
            {educationList.map((edu, idx) =>
              editingEdu?.id === edu.id ? <div key={edu.id}>{educationForm}</div> : (
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
        <div className="space-y-5">
          {/* 카테고리 추가 */}
          {skillCatForm ? (
            <div className="flex flex-wrap items-end gap-2 p-3 border border-accent/30 rounded-xl bg-bg-elevated/50">
              <div className="flex-1 min-w-[140px]"><label className={labelClass}>카테고리</label><input className={inputClass} value={newSkillCat.name} autoFocus onChange={(e) => setNewSkillCat({ ...newSkillCat, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleAddSkillCategory(); }} placeholder="프론트엔드" /></div>
              <div className="flex-1 min-w-[140px]"><label className={labelClass}>Category (EN)</label><input className={inputClass} value={newSkillCat.nameEn} onChange={(e) => setNewSkillCat({ ...newSkillCat, nameEn: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleAddSkillCategory(); }} placeholder="Frontend" /></div>
              <div className="flex gap-2">
                <button onClick={handleAddSkillCategory} className={btnPrimary}>추가</button>
                <button onClick={() => { setSkillCatForm(false); setNewSkillCat({ name: "", nameEn: "" }); }} className={btnSecondary}>취소</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setSkillCatForm(true)} className={btnPrimary}>+ 카테고리 추가</button>
          )}

          {/* 카테고리별 기술 */}
          {(() => {
            const grouped: Record<string, { items: Skill[]; categoryEn: string | null }> = {};
            for (const s of skills) {
              if (!grouped[s.category]) grouped[s.category] = { items: [], categoryEn: s.categoryEn };
              grouped[s.category].items.push(s);
            }
            for (const c of customCategories) {
              if (!grouped[c.name]) grouped[c.name] = { items: [], categoryEn: c.nameEn || null };
            }
            const cats = Object.keys(grouped);
            if (cats.length === 0) return <p className="text-sm text-text-tertiary">카테고리를 추가해 기술을 등록하세요.</p>;
            const smallSave = "px-3 py-1.5 bg-accent text-bg-primary text-sm font-medium rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0";
            const smallCancel = btnSecondary + " whitespace-nowrap shrink-0";
            return (
              <div className="space-y-5">
                {cats.map((cat) => {
                  const { items, categoryEn } = grouped[cat];
                  const adding = editingSkill != null && editingSkill.id == null && editingSkill.category === cat;
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-medium text-text-secondary">{cat}</h3>
                        <button onClick={() => setEditingSkill({ category: cat, categoryEn })} className="text-xs text-text-tertiary hover:text-accent transition-colors">+ 기술</button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {items.map((s) =>
                          editingSkill?.id === s.id ? (
                            <div key={s.id} className="inline-flex items-center gap-2">
                              <input className={inputClass + " w-40 shrink-0"} value={editingSkill.name || ""} autoFocus onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleSaveSkill(); }} />
                              <button onClick={handleSaveSkill} className={smallSave}>저장</button>
                              <button onClick={() => setEditingSkill(null)} className={smallCancel}>취소</button>
                            </div>
                          ) : (
                            <span key={s.id} className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-bg-elevated border border-border rounded-lg">
                              {s.name}
                              <button onClick={() => setEditingSkill(s)} className="text-text-tertiary hover:text-accent text-xs opacity-0 group-hover:opacity-100 transition-opacity">✎</button>
                              <button onClick={() => handleDeleteSkill(s.id)} className="text-text-tertiary hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                            </span>
                          ),
                        )}
                        {adding && (
                          <div className="inline-flex items-center gap-2">
                            <input className={inputClass + " w-40 shrink-0"} value={editingSkill?.name || ""} autoFocus placeholder="React" onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") handleSaveSkill(); }} />
                            <button onClick={handleSaveSkill} className={smallSave}>추가</button>
                            <button onClick={() => setEditingSkill(null)} className={smallCancel}>취소</button>
                          </div>
                        )}
                        {items.length === 0 && !adding && <span className="text-xs text-text-tertiary">+ 기술을 눌러 추가하세요</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {tab === "links" && (
        <div className="space-y-4">
          <button onClick={() => setEditingLink({})} className={btnPrimary}>+ 링크 추가</button>
          {editingLink && editingLink.id == null && linkForm}
          <div className="space-y-2">
            {links.map((link, idx) =>
              editingLink?.id === link.id ? <div key={link.id}>{linkForm}</div> : (
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

      {/* 저장/삭제 토스트 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-text-primary text-bg-primary text-sm font-medium shadow-lg animate-fade-in">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
