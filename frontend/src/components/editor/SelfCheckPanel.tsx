import { AlertTriangle, CheckCircle2, CircleAlert, Crosshair, ListChecks } from 'lucide-react';
import { SelfCheckIssue, SelfCheckModule, SelfCheckReport, selfCheckModuleLabels } from '../../types/self-check';
import { Button } from '../common/Button';

interface SelfCheckPanelProps {
  report: SelfCheckReport | null;
  stale: boolean;
  onJump: (issue: SelfCheckIssue) => void;
  onRun: () => void;
}

const moduleOrder: SelfCheckModule[] = ['basic', 'summary', 'work', 'projects', 'skills', 'education'];

export function SelfCheckPanel({ report, stale, onJump, onRun }: SelfCheckPanelProps) {
  const grouped = moduleOrder
    .map((module) => ({
      module,
      issues: report?.issues.filter((issue) => issue.module === module) ?? [],
    }))
    .filter((group) => group.issues.length > 0);

  return (
    <section className="border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">本地自检</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            检查摘要缺失、联系方式、日期倒置和重复技能，全部在本地完成。
          </p>
        </div>
        <Button icon={<ListChecks size={16} aria-hidden />} onClick={onRun} variant="primary">
          开始检查
        </Button>
      </div>

      {report ? (
        <div className="mt-4 space-y-3">
          {stale ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--gold)]">
              <AlertTriangle size={15} aria-hidden />
              报告已过期：检查后又编辑过简历，结果可能不准，请重新检查。
            </p>
          ) : report.issues.length === 0 ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]">
              <CheckCircle2 size={15} aria-hidden />
              自检通过，没有发现常见卡点。
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--danger)]">
              <CircleAlert size={15} aria-hidden />
              未通过：发现 {report.issues.length} 个问题，点击条目可跳到编辑位置。
            </p>
          )}

          {grouped.map((group) => (
            <div key={group.module}>
              <h3 className="text-sm font-semibold text-[var(--muted)]">{selfCheckModuleLabels[group.module]}</h3>
              <ul className="mt-1 space-y-1">
                {group.issues.map((issue) => (
                  <li key={issue.id}>
                    <button
                      className="flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left text-sm hover:border-[var(--accent)]"
                      type="button"
                      onClick={() => onJump(issue)}
                    >
                      <span className="flex-1">{issue.message}</span>
                      <Crosshair className="shrink-0 text-[var(--accent-strong)]" size={14} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">还没有检查过这份简历，点击「开始检查」生成报告。</p>
      )}
    </section>
  );
}
