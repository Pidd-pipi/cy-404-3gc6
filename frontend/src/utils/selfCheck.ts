import { Profile } from '../types/profile';
import { Resume } from '../types/resume';
import { SelfCheckIssue, SelfCheckModule, SelfCheckReport } from '../types/self-check';

function parseDateValue(value: string): number | null {
  const text = value.trim();
  if (!text) {
    return null;
  }
  if (/至今|今|现在|目前|present|current|now/i.test(text)) {
    return Date.now();
  }
  const match = text.match(/(\d{4})\s*(?:[.\-/年]\s*(\d{1,2}))?/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : 1;
  if (Number.isNaN(year) || month < 1 || month > 12) {
    return null;
  }
  return new Date(year, month - 1, 1).getTime();
}

function collectDateIssues(
  items: Array<{ id: string; label: string; startDate: string; endDate: string }>,
  module: SelfCheckModule,
): SelfCheckIssue[] {
  return items
    .filter((item) => {
      const start = parseDateValue(item.startDate);
      const end = parseDateValue(item.endDate);
      return start !== null && end !== null && start > end;
    })
    .map((item) => ({
      id: `date-${item.id}`,
      module,
      message: `「${item.label}」的开始时间晚于结束时间`,
    }));
}

export function runSelfCheck(resume: Resume, profile: Profile): SelfCheckReport {
  const issues: SelfCheckIssue[] = [];

  // 姓名和联系方式按预览实际渲染判断：简历字段为空时会回落到个人资料
  const previewInfo = {
    fullName: resume.basicInfo.fullName || profile.fullName,
    phone: resume.basicInfo.phone || profile.phone,
    email: resume.basicInfo.email || profile.email,
  };
  if (!previewInfo.fullName.trim()) {
    issues.push({ id: 'basic-fullName', module: 'basic', message: '姓名为空，预览和导出件都没有署名' });
  }
  if (!previewInfo.phone.trim()) {
    issues.push({ id: 'basic-phone', module: 'basic', message: '电话为空，投递后无法电话联系' });
  }
  if (!previewInfo.email.trim()) {
    issues.push({ id: 'basic-email', module: 'basic', message: '邮箱为空，投递后无法邮件联系' });
  }

  // 摘要只看简历自身的内容，不用个人资料兜底
  if (!resume.summary.trim()) {
    issues.push({ id: 'summary-missing', module: 'summary', message: '缺少一句话职业摘要' });
  }

  issues.push(
    ...collectDateIssues(
      resume.workExperiences.map((item) => ({
        id: item.id,
        label: item.companyName || item.position || '未命名经历',
        startDate: item.startDate,
        endDate: item.endDate,
      })),
      'work',
    ),
    ...collectDateIssues(
      resume.projects.map((item) => ({
        id: item.id,
        label: item.name || '未命名项目',
        startDate: item.startDate,
        endDate: item.endDate,
      })),
      'projects',
    ),
    ...collectDateIssues(
      resume.educations.map((item) => ({
        id: item.id,
        label: item.school || '未填写学校',
        startDate: item.startDate,
        endDate: item.endDate,
      })),
      'education',
    ),
  );

  const skillCounts = new Map<string, { name: string; count: number }>();
  for (const skill of resume.skills) {
    const key = skill.name.trim().toLowerCase();
    if (!key) {
      continue;
    }
    const entry = skillCounts.get(key);
    if (entry) {
      entry.count += 1;
    } else {
      skillCounts.set(key, { name: skill.name.trim(), count: 1 });
    }
  }
  skillCounts.forEach((entry, key) => {
    if (entry.count > 1) {
      issues.push({
        id: `skills-duplicate-${key}`,
        module: 'skills',
        message: `技能「${entry.name}」重复出现 ${entry.count} 次`,
      });
    }
  });

  return {
    resumeId: resume.id,
    checkedAt: new Date().toISOString(),
    issues,
  };
}

export function isSelfCheckStale(report: SelfCheckReport, resume: Resume): boolean {
  return new Date(resume.updatedAt).getTime() > new Date(report.checkedAt).getTime();
}
