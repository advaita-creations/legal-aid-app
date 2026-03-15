import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  ShieldCheck,
  Database,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import type { Document, ConsolidatedJson } from '../types';

interface ProcessedResultsProps {
  doc: Document;
}

type TabKey = 'validated' | 'report' | 'structured';

const tabs: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: 'report', label: 'Validation Report', icon: ShieldCheck },
  { key: 'validated', label: 'Validated Document', icon: FileText },
  { key: 'structured', label: 'Structured Data', icon: Database },
];

export function ProcessedResults({ doc }: ProcessedResultsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('report');

  const hasResults =
    doc.processed_html_url || doc.processed_json_url || doc.processed_report_url;

  if (!hasResults) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => {
          const isDisabled =
            (tab.key === 'validated' && !doc.processed_html_url) ||
            (tab.key === 'report' && !doc.processed_report_url) ||
            (tab.key === 'structured' && !doc.processed_json_url);

          return (
            <button
              key={tab.key}
              onClick={() => !isDisabled && setActiveTab(tab.key)}
              disabled={isDisabled}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : isDisabled
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'validated' && doc.processed_html_url && (
          <ValidatedDocTab url={doc.processed_html_url} name={doc.name} />
        )}
        {activeTab === 'report' && doc.processed_report_url && (
          <ValidationReportTab url={doc.processed_report_url} name={doc.name} />
        )}
        {activeTab === 'structured' && doc.processed_json_url && (
          <StructuredDataTab url={doc.processed_json_url} name={doc.name} />
        )}
      </div>
    </div>
  );
}

/* ── Tab 1: Validated Document (HTML iframe) ─────────────── */

function ValidatedDocTab({ url, name }: { url: string; name: string }) {
  const { data: htmlContent, isLoading } = useQuery({
    queryKey: ['processed-html', url],
    queryFn: async () => {
      const resp = await fetch(url);
      const text = await resp.text();
      const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      return bodyMatch ? bodyMatch[1] : text;
    },
  });

  if (isLoading || !htmlContent) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm text-gray-500">Loading document...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-medium text-gray-600">
          Validated Document Preview
        </span>
        <a
          href={url}
          download={`${name}_validated.html`}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download HTML
        </a>
      </div>
      <div
        className="p-6 prose prose-sm max-w-none
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:border-b-2 [&_h1]:border-gray-800 [&_h1]:pb-2 [&_h1]:mb-4
          [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-700 [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-gray-200 [&_h2]:pb-1
          [&_p]:text-sm [&_p]:text-gray-700 [&_p]:leading-relaxed
          [&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:rounded
          [&_.illegible]:bg-red-100 [&_.illegible]:text-red-700 [&_.illegible]:font-bold [&_.illegible]:px-1 [&_.illegible]:rounded
          [&_.section]:my-4 [&_.section]:p-4 [&_.section]:bg-gray-50 [&_.section]:border-l-4 [&_.section]:border-gray-800 [&_.section]:rounded-r
          [&_.metadata]:bg-blue-50 [&_.metadata]:p-3 [&_.metadata]:rounded-lg [&_.metadata]:border [&_.metadata]:border-blue-100 [&_.metadata]:mb-4 [&_.metadata]:text-sm"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}

/* ── Tab 2: Validation Report ────────────────────────────── */

function parseReportMetrics(text: string) {
  const accuracy = text.match(/Final Consolidated Accuracy:\s*([\d.]+%)/)?.[1] ?? '—';
  const discrepancies = text.match(/Total Discrepancies:\s*(\d+)/)?.[1] ?? '0';
  const humanReview = text.match(/Human Review Items:\s*(\d+)/)?.[1] ?? '0';
  const illegible = text.match(/Illegible Items:\s*(\d+)/)?.[1] ?? '0';
  const ocrMisreads = text.match(/OCR Misreads:\s*(\d+)/)?.[1] ?? '0';
  const recommendations =
    text.match(/RECOMMENDATIONS:\n([\s\S]*?)(?:\n={3,}|\n*$)/)?.[1]?.trim() ?? '';

  const issueBlocks = text.split(/Issue #\d+:/g).slice(1);
  const issues = issueBlocks.map((block) => {
    const type = block.match(/Type:\s*(.+)/)?.[1]?.trim() ?? 'Unknown';
    const section = block.match(/Section:\s*(.+)/)?.[1]?.trim() ?? '';
    const reason = block.match(/Reason:\s*(.+)/)?.[1]?.trim() ?? '';
    const selected = block.match(/Selected:\s*(.+)/)?.[1]?.trim() ?? '';
    return { type, section, reason, selected };
  });

  return {
    accuracy,
    discrepancies: parseInt(discrepancies, 10),
    humanReview: parseInt(humanReview, 10),
    illegible: parseInt(illegible, 10),
    ocrMisreads: parseInt(ocrMisreads, 10),
    recommendations,
    issues,
  };
}

function ValidationReportTab({ url, name }: { url: string; name: string }) {
  const { data: reportText, isLoading } = useQuery({
    queryKey: ['processed-report', url],
    queryFn: async () => {
      const resp = await fetch(url);
      return resp.text();
    },
  });

  if (isLoading || !reportText) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm text-gray-500">Loading report...</span>
      </div>
    );
  }

  const metrics = parseReportMetrics(reportText);

  return (
    <div className="p-6 space-y-6">
      {/* Header with download */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Validation Report</h3>
        <a
          href={url}
          download={`${name}_report.txt`}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download Report
        </a>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Overall Accuracy"
          value={metrics.accuracy}
          variant="success"
        />
        <MetricCard
          label="Discrepancies"
          value={String(metrics.discrepancies)}
          variant={metrics.discrepancies > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          label="Human Review"
          value={String(metrics.humanReview)}
          variant={metrics.humanReview > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          label="OCR Misreads"
          value={String(metrics.ocrMisreads)}
          variant={metrics.ocrMisreads > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Issues list */}
      {metrics.issues.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Discrepancy Details
          </h4>
          <div className="space-y-3">
            {metrics.issues.map((issue, i) => (
              <IssueCard key={i} index={i + 1} {...issue} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {metrics.recommendations && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
            Recommendations
          </h4>
          <p className="text-sm text-blue-900 leading-relaxed">{metrics.recommendations}</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: 'success' | 'warning';
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 text-center',
        variant === 'success'
          ? 'bg-blue-50 border-blue-200'
          : 'bg-amber-50 border-amber-200',
      )}
    >
      <div
        className={cn(
          'text-2xl font-bold',
          variant === 'success' ? 'text-blue-700' : 'text-amber-700',
        )}
      >
        {value}
      </div>
      <div className="text-xs font-medium text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function IssueCard({
  index,
  type,
  section,
  reason,
  selected,
}: {
  index: number;
  type: string;
  section: string;
  reason: string;
  selected: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isOCR = type.toLowerCase().includes('ocr');

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
            isOCR ? 'bg-amber-100' : 'bg-orange-100',
          )}
        >
          <AlertTriangle className={cn('w-3.5 h-3.5', isOCR ? 'text-amber-600' : 'text-orange-600')} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900">Issue #{index}: {type}</span>
          <span className="text-xs text-gray-500 ml-2 truncate">{section}</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-3 pt-0 space-y-2 border-t border-gray-100">
          {selected && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-gray-700">
                <strong>Selected:</strong> {selected}
              </span>
            </div>
          )}
          {reason && (
            <p className="text-xs text-gray-600 leading-relaxed">{reason}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Tab 3: Structured Data (JSON accordion) ─────────────── */

function StructuredDataTab({ url, name }: { url: string; name: string }) {
  const { data: jsonData, isLoading } = useQuery<ConsolidatedJson>({
    queryKey: ['processed-json', url],
    queryFn: async () => {
      const resp = await fetch(url);
      return resp.json() as Promise<ConsolidatedJson>;
    },
  });

  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (isLoading || !jsonData) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm text-gray-500">Loading structured data...</span>
      </div>
    );
  }

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Structured Data</h3>
        <a
          href={url}
          download={`${name}_data.json`}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download JSON
        </a>
      </div>

      {/* Metadata badges */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {jsonData.document_title}
        </span>
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {jsonData.total_sections} section{jsonData.total_sections !== 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
          Source: {jsonData.document_metadata.source}
        </span>
        {jsonData.document_metadata.timestamp && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {new Date(jsonData.document_metadata.timestamp).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Sections accordion */}
      <div className="space-y-3">
        {jsonData.sections.map((section, idx) => (
          <SectionAccordion
            key={idx}
            index={idx}
            heading={section.section_heading}
            content={section.content}
            tables={section.tables}
            onCopy={(text) => handleCopy(text, idx)}
            copied={copiedIdx === idx}
          />
        ))}
      </div>
    </div>
  );
}

function SectionAccordion({
  index,
  heading,
  content,
  tables,
  onCopy,
  copied,
}: {
  index: number;
  heading: string;
  content: string;
  tables: string[];
  onCopy: (text: string) => void;
  copied: boolean;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-bold text-gray-400 w-6">§{index + 1}</span>
        <span className="text-sm font-medium text-gray-900 flex-1 truncate">{heading}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="flex justify-end mt-2 mb-2">
            <button
              onClick={() => onCopy(content)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-blue-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
          {tables.length > 0 && (
            <div className="mt-4 space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Tables</span>
              {tables.map((table, i) => (
                <div
                  key={i}
                  className="bg-white rounded border border-gray-200 p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto"
                >
                  {table}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
