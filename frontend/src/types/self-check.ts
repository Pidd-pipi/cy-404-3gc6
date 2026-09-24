import { ResumeSectionType } from './resume';

export type SelfCheckModule = 'basic' | ResumeSectionType;

export interface SelfCheckIssue {
  id: string;
  module: SelfCheckModule;
  message: string;
}

export interface SelfCheckReport {
  resumeId: string;
  checkedAt: string;
  issues: SelfCheckIssue[];
}

export const selfCheckModuleLabels: Record<SelfCheckModule, string> = {
  basic: '基本信息',
  summary: '职业摘要',
  work: '工作经历',
  projects: '项目经历',
  skills: '技能矩阵',
  education: '教育经历',
};
