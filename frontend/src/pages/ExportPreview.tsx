import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { A4Preview } from '../components/preview/A4Preview';
import { ExportSettings } from '../components/preview/ExportSettings';
import { useExportPdf } from '../hooks/useExportPdf';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCheckStore } from '../stores/check';
import { useProfileStore } from '../stores/profile';
import { useResumeStore } from '../stores/resume';
import { computeCheckFingerprint, getCheckStatus } from '../utils/resume-check';

export function ExportPreview() {
  const { id } = useParams();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const resume = useResumeStore((state) => state.resumes.find((item) => item.id === id));
  const profile = useProfileStore((state) => state.profile);
  const checkReport = useCheckStore((state) => (id ? state.reports[id] : undefined));
  const [margin, setMargin] = useLocalStorage('smart-resume:export-margin', 14);
  const [fontSize, setFontSize] = useLocalStorage('smart-resume:export-font-size', 12);
  const { exportPdf, isExporting, error } = useExportPdf(previewRef);

  if (!resume) {
    return <EmptyState title="无法导出" description="没有找到这份简历，可能已被删除。" />;
  }

  const checkStatus = getCheckStatus(checkReport, computeCheckFingerprint(resume, profile));
  const checkWarning =
    checkStatus === 'failed'
      ? `自检未通过：还有 ${checkReport?.issues.length ?? 0} 个问题待处理，建议返回编辑器修复后再投递。`
      : checkStatus === 'stale'
        ? '自检报告已过期：检查后又修改过简历内容，建议回编辑器重新检查。'
        : null;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end">
        <div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]" to={`/resumes/${resume.id}/edit`}>
            <ArrowLeft size={15} aria-hidden /> 返回编辑
          </Link>
          <h1 className="mt-3 font-display text-4xl font-semibold">PDF 导出预览</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">按 A4 比例渲染，导出前可调整页边距和字号。</p>
        </div>
      </div>
      {checkWarning ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-[var(--gold)] bg-[var(--surface)] px-4 py-3 text-sm">
          <AlertTriangle className="shrink-0 text-[var(--gold)]" size={16} aria-hidden />
          <p className="min-w-0 flex-1">{checkWarning}</p>
          <Link className="font-semibold text-[var(--accent-strong)] underline" to={`/resumes/${resume.id}/edit`}>
            返回编辑器处理
          </Link>
        </div>
      ) : null}
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <ExportSettings
          fontSize={fontSize}
          isExporting={isExporting}
          margin={margin}
          onExport={() => exportPdf(`${resume.title || 'resume'}.pdf`, margin)}
          onFontSizeChange={setFontSize}
          onMarginChange={setMargin}
        />
        <div className="overflow-auto bg-[var(--surface-alt)] p-6">
          <A4Preview ref={previewRef} resume={resume} margin={margin} fontSize={fontSize} />
          {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

