import { useMemo } from 'react';
import { AlertTriangle, ArrowRight, BadgeCheck, ScanSearch } from 'lucide-react';
import { useCheckStore } from '../../stores/check';
import { useProfileStore } from '../../stores/profile';
import { Resume } from '../../types/resume';
import { formatDateTime } from '../../utils/format';
import {
  CheckIssue,
  CheckModule,
  computeCheckFingerprint,
  getCheckStatus,
  runResumeCheck,
} from '../../utils/resume-check';
import { Button } from '../common/Button';

interface CheckPanelProps {
  resume: Resume;
  onJumpToIssue: (issue: CheckIssue) => void;
}

export function CheckPanel({ resume, onJumpToIssue }: CheckPanelProps) {
  const profile = useProfileStore((state) => state.profile);
  const report = useCheckStore((state) => state.reports[resume.id]);
  const saveReport = useCheckStore((state) => state.saveReport);
  const fingerprint = useMemo(() => computeCheckFingerprint(resume, profile), [resume, profile]);
  const status = getCheckStatus(report, fingerprint);

  const moduleLabels = useMemo(() => {
    const labels: Record<CheckModule, string> = {
      basic: '基本信息',
      summary: '职业摘要',
      work: '工作经历',
      education: '教育经历',
      skills: '技能矩阵',
      projects: '项目经历',
    };
    resume.sections.forEach((section) => {
      labels[section.id] = section.title;
    });
    return labels;
  }, [resume.sections]);

  const groupedIssues = useMemo(() => {
    if (!report) {
      return [];
    }
    const moduleOrder: CheckModule[] = ['basic', ...resume.sections.map((section) => section.id)];
    return moduleOrder
      .map((module) => ({ module, issues: report.issues.filter((issue) => issue.module === module) }))
      .filter((group) => group.issues.length > 0);
  }, [report, resume.sections]);

  const runCheck = () => {
    saveReport(resume.id, runResumeCheck(resume, profile));
  };

  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">本地自检</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">在浏览器本地检查投递前的常见硬伤，不会上传简历内容。</p>
        </div>
        <Button
          icon={<ScanSearch size={16} aria-hidden />}
          onClick={runCheck}
          variant={report ? 'secondary' : 'primary'}
        >
          {report ? '重新检查' : '开始检查'}
        </Button>
      </div>

      {status === 'unchecked' ? <p className="mt-4 text-sm text-[var(--muted)]">尚未生成检查报告。</p> : null}

      {report ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {status === 'passed' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-3 py-1 font-semibold text-[var(--accent-strong)]">
                <BadgeCheck size={14} aria-hidden /> 已通过
              </span>
            ) : null}
            {status === 'failed' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--danger)] px-3 py-1 font-semibold text-[var(--danger)]">
                <AlertTriangle size={14} aria-hidden /> 未通过 · {report.issues.length} 个问题
              </span>
            ) : null}
            {status === 'stale' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--gold)] px-3 py-1 font-semibold text-[var(--gold)]">
                <AlertTriangle size={14} aria-hidden /> 已过期
              </span>
            ) : null}
            <span className="text-xs text-[var(--muted)]">检查时间 {formatDateTime(report.ranAt)}</span>
          </div>

          {status === 'stale' ? (
            <p className="border border-[var(--gold)] bg-[var(--surface-alt)] px-3 py-2 text-sm">
              检查后又编辑过内容，以下结果可能已不准确，建议重新检查。
            </p>
          ) : null}

          {status === 'passed' ? (
            <p className="text-sm text-[var(--muted)]">未发现摘要、联系方式、日期和技能上的硬伤，可以放心导出。</p>
          ) : null}
          {status === 'stale' && report.issues.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">上次检查未发现问题。</p>
          ) : null}

          {groupedIssues.map((group) => (
            <div key={group.module}>
              <h3 className="text-sm font-semibold text-[var(--muted)]">{moduleLabels[group.module]}</h3>
              <ul className="mt-2 space-y-2">
                {group.issues.map((issue) => (
                  <li key={issue.id}>
                    <button
                      className="flex w-full items-center justify-between gap-3 border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left text-sm transition hover:border-[var(--accent)]"
                      type="button"
                      onClick={() => onJumpToIssue(issue)}
                    >
                      <span>{issue.message}</span>
                      <ArrowRight className="shrink-0 text-[var(--accent-strong)]" size={15} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
