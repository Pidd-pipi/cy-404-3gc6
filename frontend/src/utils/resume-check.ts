import { Profile } from '../types/profile';
import { Resume, ResumeSectionType } from '../types/resume';
import { Skill } from '../types/skill';
import { createId } from './format';

export type CheckModule = 'basic' | ResumeSectionType;

export interface CheckIssue {
  id: string;
  module: CheckModule;
  message: string;
  targetId: string;
}

export interface CheckReport {
  ranAt: string;
  fingerprint: string;
  issues: CheckIssue[];
}

export type CheckStatus = 'unchecked' | 'passed' | 'failed' | 'stale';

// 自检报告里每个问题对应的编辑位置锚点，编辑器组件用同一套 id 渲染
export const checkTargetIds = {
  basicField: (field: 'fullName' | 'phone' | 'email') => `check-basic-${field}`,
  summary: 'check-summary',
  work: (id: string) => `check-work-${id}`,
  education: (id: string) => `check-edu-${id}`,
  skill: (id: string) => `check-skill-${id}`,
  project: (id: string) => `check-project-${id}`,
} as const;

const ongoingPattern = /(至今|现在|目前|present|current|now)/i;

// 把「2021.06」「2021年6月」「2021-06-15」等写法规整成可比较的数字（yyyyMMdd），无法识别时返回 null
export function parseResumeDate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || ongoingPattern.test(trimmed)) {
    return null;
  }
  const yearMatch = trimmed.match(/\d{4}/);
  if (!yearMatch) {
    return null;
  }
  const rest = trimmed.slice((yearMatch.index ?? 0) + yearMatch[0].length);
  const parts = rest.match(/\d{1,2}/g) ?? [];
  const year = Number(yearMatch[0]);
  const month = parts.length > 0 ? Number(parts[0]) : 1;
  const day = parts.length > 1 ? Number(parts[1]) : 1;
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return year * 10000 + month * 100 + day;
}

function isDateRangeInverted(startDate: string, endDate: string): boolean {
  const start = parseResumeDate(startDate);
  const end = parseResumeDate(endDate);
  if (start === null || end === null) {
    return false;
  }
  return start > end;
}

// 指纹覆盖整份简历和预览兜底用到的个人资料字段：检查后编辑任何字段都会让报告过期
export function computeCheckFingerprint(resume: Resume, profile: Profile): string {
  const payload = JSON.stringify({
    resume,
    profileFallback: {
      fullName: profile.fullName,
      phone: profile.phone,
      email: profile.email,
    },
  });
  let hash = 5381;
  for (let index = 0; index < payload.length; index += 1) {
    hash = (hash * 33) ^ payload.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

export function getCheckStatus(report: CheckReport | undefined, fingerprint: string): CheckStatus {
  if (!report) {
    return 'unchecked';
  }
  if (report.fingerprint !== fingerprint) {
    return 'stale';
  }
  return report.issues.length > 0 ? 'failed' : 'passed';
}

export function runResumeCheck(resume: Resume, profile: Profile): CheckReport {
  const issues: CheckIssue[] = [];
  const enabledSections = new Set(
    resume.sections.filter((section) => section.enabled).map((section) => section.id),
  );

  // 姓名和联系方式按预览实际取值判断：简历优先，个人资料兜底
  const effectiveFields = [
    { field: 'fullName' as const, label: '姓名', value: resume.basicInfo.fullName || profile.fullName },
    { field: 'phone' as const, label: '电话', value: resume.basicInfo.phone || profile.phone },
    { field: 'email' as const, label: '邮箱', value: resume.basicInfo.email || profile.email },
  ];
  effectiveFields.forEach(({ field, label, value }) => {
    if (!value.trim()) {
      issues.push({
        id: createId('issue'),
        module: 'basic',
        message: `${label}未填写，预览中会显示为空白`,
        targetId: checkTargetIds.basicField(field),
      });
    }
  });

  // 摘要只看简历里填写的内容，不用个人资料兜底
  if (enabledSections.has('summary') && !resume.summary.trim()) {
    issues.push({
      id: createId('issue'),
      module: 'summary',
      message: '缺少一句话职业摘要',
      targetId: checkTargetIds.summary,
    });
  }

  if (enabledSections.has('work')) {
    resume.workExperiences.forEach((item) => {
      if (isDateRangeInverted(item.startDate, item.endDate)) {
        issues.push({
          id: createId('issue'),
          module: 'work',
          message: `「${item.companyName || '未填写公司'}」的开始时间（${item.startDate}）晚于结束时间（${item.endDate}）`,
          targetId: checkTargetIds.work(item.id),
        });
      }
    });
  }

  if (enabledSections.has('projects')) {
    resume.projects.forEach((item) => {
      if (isDateRangeInverted(item.startDate, item.endDate)) {
        issues.push({
          id: createId('issue'),
          module: 'projects',
          message: `项目「${item.name || '未填写名称'}」的开始时间（${item.startDate}）晚于结束时间（${item.endDate}）`,
          targetId: checkTargetIds.project(item.id),
        });
      }
    });
  }

  if (enabledSections.has('education')) {
    resume.educations.forEach((item) => {
      if (isDateRangeInverted(item.startDate, item.endDate)) {
        issues.push({
          id: createId('issue'),
          module: 'education',
          message: `「${item.school || '未填写学校'}」的开始时间（${item.startDate}）晚于结束时间（${item.endDate}）`,
          targetId: checkTargetIds.education(item.id),
        });
      }
    });
  }

  if (enabledSections.has('skills')) {
    const groups = new Map<string, Skill[]>();
    resume.skills.forEach((skill) => {
      const key = skill.name.trim().toLowerCase();
      if (!key) {
        return;
      }
      groups.set(key, [...(groups.get(key) ?? []), skill]);
    });
    groups.forEach((skills) => {
      if (skills.length > 1) {
        issues.push({
          id: createId('issue'),
          module: 'skills',
          message: `技能「${skills[0].name.trim()}」重复出现 ${skills.length} 次`,
          targetId: checkTargetIds.skill(skills[0].id),
        });
      }
    });
  }

  return {
    ranAt: new Date().toISOString(),
    fingerprint: computeCheckFingerprint(resume, profile),
    issues,
  };
}
