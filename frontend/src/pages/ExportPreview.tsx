import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CircleAlert } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { A4Preview } from '../components/preview/A4Preview';
import { ExportSettings } from '../components/preview/ExportSettings';
import { useExportPdf } from '../hooks/useExportPdf';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useResumeStore } from '../stores/resume';
import { useSelfCheckStore } from '../stores/selfCheck';
import { isSelfCheckStale } from '../utils/selfCheck';

export function ExportPreview() {
  const { id } = useParams();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const resume = useResumeStore((state) => state.resumes.find((item) => item.id === id));
  const selfCheckReport = useSelfCheckStore((state) => (id ? state.reports[id] ?? null : null));
  const [margin, setMargin] = useLocalStorage('smart-resume:export-margin', 14);
  const [fontSize, setFontSize] = useLocalStorage('smart-resume:export-font-size', 12);
  const { exportPdf, isExporting, error } = useExportPdf(previewRef);

  if (!resume) {
    return <EmptyState title="无法导出" description="没有找到这份简历，可能已被删除。" />;
  }

  const selfCheckStale = selfCheckReport ? isSelfCheckStale(selfCheckReport, resume) : false;

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
      {selfCheckReport && !selfCheckStale && selfCheckReport.issues.length > 0 ? (
        <div className="mt-4 flex items-start gap-3 border border-[var(--danger)] bg-[var(--surface)] p-4" role="alert">
          <CircleAlert className="mt-0.5 shrink-0 text-[var(--danger)]" size={18} aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-[var(--danger)]">
              本地自检未通过：还有 {selfCheckReport.issues.length} 个问题
            </p>
            <p className="mt-1 text-[var(--muted)]">
              例如「{selfCheckReport.issues[0].message}」。导出不会被拦截，建议先
              <Link className="font-semibold text-[var(--accent-strong)]" to={`/resumes/${resume.id}/edit`}>
                返回编辑器
              </Link>
              处理。
            </p>
          </div>
        </div>
      ) : null}
      {selfCheckReport && selfCheckStale ? (
        <div className="mt-4 flex items-start gap-3 border border-[var(--gold)] bg-[var(--surface)] p-4" role="alert">
          <AlertTriangle className="mt-0.5 shrink-0 text-[var(--gold)]" size={18} aria-hidden />
          <div className="text-sm">
            <p className="font-semibold">自检报告已过期</p>
            <p className="mt-1 text-[var(--muted)]">
              检查之后简历又有修改，导出不会被拦截，建议
              <Link className="font-semibold text-[var(--accent-strong)]" to={`/resumes/${resume.id}/edit`}>
                回到编辑器
              </Link>
              重新检查。
            </p>
          </div>
        </div>
      ) : null}
      {!selfCheckReport ? (
        <p className="mt-4 text-sm text-[var(--muted)]">尚未运行本地自检，可在编辑器中点击「开始检查」。</p>
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

