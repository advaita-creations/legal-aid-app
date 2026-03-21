import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Columns2, Download, Maximize2, Minimize2,
  CheckCircle, Loader, Send, History, RotateCcw, FileOutput,
  FileText, BarChart3, ChevronDown,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { documentsApi } from '../api/documentsApi';
import { useToast } from '@/components/ui/toast';
import type { Document, DocumentVersion } from '../types';

interface DocumentDiffViewProps {
  doc: Document;
}

export function DocumentDiffView({ doc }: DocumentDiffViewProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const fileUrl = doc.file_url ?? null;
  const htmlUrl = doc.processed_html_url ?? null;

  const { data: fullHtmlContent } = useQuery({
    queryKey: ['full-html', htmlUrl],
    queryFn: async () => {
      const resp = await fetch(htmlUrl!);
      let html = await resp.text();
      
      // Inject script to intercept saveAndExport and send v2 files to parent
      const injectedScript = `
        <script>
        (function() {
          const originalSaveAndExport = window.saveAndExport;
          window.saveAndExport = function() {
            const exportedAt = new Date().toISOString();
            const docBodyEl = document.getElementById('document-body');
            const cloneBody = docBodyEl.cloneNode(true);
            
            cloneBody.querySelectorAll('.mismatch-block').forEach(el => el.remove());
            cloneBody.querySelectorAll('.editable-para').forEach(el => {
              el.removeAttribute('contenteditable');
              el.removeAttribute('title');
              el.removeAttribute('spellcheck');
              el.classList.remove('editable-para', 'edited');
              delete el.dataset.editId;
              delete el.dataset.originalText;
            });
            
            const cleanDocHTML = cloneBody.innerHTML;
            const PAGE_TITLE = document.title;
            const BASE_NAME = window.BASE_NAME || 'document';
            
            // Generate v2 HTML
            const htmlV2 = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>\${PAGE_TITLE} — Final</title>
  <style>
    body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.8; max-width: 820px; margin: 40px auto; padding: 60px; color: #000; }
    p  { margin: 0.6em 0; }
    h1 { font-size: 14pt; text-align: center; text-transform: uppercase; margin-bottom: 1.5em; }
    h2 { font-size: 13pt; margin-top: 1.5em; margin-bottom: 0.5em; }
    h3 { font-size: 12pt; margin-top: 1em; }
    ol, ul { margin: 0.8em 0 0.8em 1.5em; }
    li { margin: 0.4em 0; }
    table { width: 100%; border-collapse: collapse; margin: 1.2em 0; }
    td, th { border: 1px solid #666; padding: 6px 10px; }
    th { background: #f0f0f0; font-weight: bold; }
    .page-break { text-align: center; margin: 2em 0; padding: 4px 0; border-top: 1px dashed #bbb; border-bottom: 1px dashed #bbb; color: #888; font-size: 9pt; letter-spacing: 0.1em; }
  </style>
</head>
<body>
\${cleanDocHTML}
</body>
</html>\`;
            
            // Generate v2 TXT
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cleanDocHTML;
            tempDiv.querySelectorAll('.page-break').forEach(el => {
              el.replaceWith(document.createTextNode(\`\n\n--- \${el.textContent.trim()} ---\n\n\`));
            });
            tempDiv.querySelectorAll('tr').forEach(tr => {
              const cells = [...tr.querySelectorAll('td,th')].map(c => c.textContent.trim()).join(' | ');
              tr.replaceWith(document.createTextNode(cells + '\n'));
            });
            tempDiv.querySelectorAll('table').forEach(t => {
              t.replaceWith(document.createTextNode(t.textContent));
            });
            const txtV2 = tempDiv.textContent.replace(/\n{3,}/g, '\n\n').trim();
            
            // Generate corrections log
            const corrections = window.corrections || {};
            const editHistory = window.editHistory || {};
            const allActions = Object.values(corrections);
            const autoAccepted = allActions.filter(c => c.type === 'auto_accepted');
            const hitlConfirmed = allActions.filter(c => c.type === 'hitl_confirmed');
            const hitlDeleted = allActions.filter(c => c.type === 'hitl_deleted');
            const textEdits = Object.values(editHistory);
            
            let logLines = [];
            let counter = 1;
            logLines.push('==================================================');
            logLines.push('CORRECTIONS LOG');
            logLines.push('Document  : ' + BASE_NAME);
            logLines.push('Exported  : ' + exportedAt);
            logLines.push('==================================================');
            logLines.push('');
            
            autoAccepted.forEach(c => {
              logLines.push('[' + String(counter++).padStart(3,'0') + '] ' + c.marker_id + ' — AUTO-RESOLVED — ACCEPTED');
              logLines.push('      Page         : ' + (c.page || '?'));
              logLines.push('      AI Choice    : ' + (c.chosen_source || 'auto'));
              logLines.push('      Mistral Text : ' + (c.mistral_text || ''));
              logLines.push('      Vector Text  : ' + (c.vector_text  || ''));
              logLines.push('      Final Text   : ' + c.final_text);
              logLines.push('      Timestamp    : ' + c.ts);
              logLines.push('');
            });
            
            hitlConfirmed.forEach(c => {
              logLines.push('[' + String(counter++).padStart(3,'0') + '] ' + c.marker_id + ' — HITL — CONFIRMED');
              logLines.push('      Page         : ' + (c.page || '?'));
              logLines.push('      Started With : ' + c.started_with);
              logLines.push('      Mistral Text : ' + (c.mistral_text || ''));
              logLines.push('      Vector Text  : ' + (c.vector_text  || ''));
              logLines.push('      Final Text   : ' + c.final_text);
              logLines.push('      Modified     : ' + (c.modified ? 'YES — user changed the pre-filled text' : 'NO — used as-is'));
              logLines.push('      Timestamp    : ' + c.ts);
              logLines.push('');
            });
            
            hitlDeleted.forEach(c => {
              logLines.push('[' + String(counter++).padStart(3,'0') + '] ' + c.marker_id + ' — HITL — DELETED');
              logLines.push('      Page         : ' + (c.page || '?'));
              logLines.push('      Mistral Text : ' + (c.mistral_text || ''));
              logLines.push('      Vector Text  : ' + (c.vector_text  || ''));
              logLines.push('      Reason       : Marked as not significant by reviewer');
              logLines.push('      Timestamp    : ' + c.ts);
              logLines.push('');
            });
            
            textEdits.forEach(e => {
              logLines.push('[' + String(counter++).padStart(3,'0') + '] TEXT EDIT — ' + e.tag);
              logLines.push('      Edit ID      : ' + e.editId);
              logLines.push('      Before       : ' + e.before.replace(/<[^>]+>/g, '').trim());
              logLines.push('      After        : ' + e.after.replace(/<[^>]+>/g, '').trim());
              logLines.push('      Timestamp    : ' + e.ts);
              logLines.push('');
            });
            
            logLines.push('==================================================');
            logLines.push('SUMMARY');
            logLines.push('Auto-Resolved Accepted : ' + autoAccepted.length);
            logLines.push('HITL Confirmed         : ' + hitlConfirmed.length +
              (hitlConfirmed.length ? ' (' + hitlConfirmed.filter(c => c.modified).length + ' modified, ' + hitlConfirmed.filter(c => !c.modified).length + ' as-is)' : ''));
            logLines.push('HITL Deleted           : ' + hitlDeleted.length);
            logLines.push('Text Edits             : ' + textEdits.length);
            logLines.push('Total Actions          : ' + (autoAccepted.length + hitlConfirmed.length + hitlDeleted.length + textEdits.length));
            logLines.push('==================================================');
            const corrLogTxt = logLines.join('\n');
            
            // Send to parent window instead of downloading
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'v2_files_ready',
                data: {
                  htmlV2: htmlV2,
                  txtV2: txtV2,
                  corrLogTxt: corrLogTxt,
                  baseName: BASE_NAME
                }
              }, '*');
              alert('Files saved! The document has been updated.');
            } else {
              // Fallback to original download behavior
              originalSaveAndExport();
            }
          };
        })();
        </script>
      `;
      
      // Inject before closing body tag
      html = html.replace('</body>', injectedScript + '</body>');
      return html;
    },
    enabled: !!htmlUrl,
  });

  const { data: versions } = useQuery({
    queryKey: ['doc-versions', doc.id],
    queryFn: () => documentsApi.getVersions(doc.id),
  });

  const { data: reportText } = useQuery({
    queryKey: ['doc-report', doc.processed_report_url],
    queryFn: async () => {
      if (!doc.processed_report_url) return null;
      const resp = await fetch(doc.processed_report_url);
      return resp.text();
    },
    enabled: !!doc.processed_report_url,
  });

  const latestVersion = versions && versions.length > 0
    ? Math.max(...versions.map((v) => v.version_number))
    : 1;


  const finalizeMutation = useMutation({
    mutationFn: () => documentsApi.finalizeRag(doc.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['document', doc.id] });
      toast(`Finalized v${data.version} — ${data.rag_response}`);
    },
  });

  const generatePdfMutation = useMutation({
    mutationFn: () => documentsApi.generatePdf(doc.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', doc.id] });
      queryClient.invalidateQueries({ queryKey: ['document', doc.id] });
      queryClient.invalidateQueries({ queryKey: ['processing-logs', doc.id] });
      toast('PDF generated and document finalized!');
    },
  });

  const revertMutation = useMutation({
    mutationFn: (versionId: number) => documentsApi.revertVersion(doc.id, versionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doc-versions', doc.id] });
      queryClient.invalidateQueries({ queryKey: ['diff-html'] });
      queryClient.invalidateQueries({ queryKey: ['documents', doc.id] });
      queryClient.invalidateQueries({ queryKey: ['processing-logs', doc.id] });
      toast(`Reverted to v${data.reverted_to}`);
    },
  });


  const handleFinalize = useCallback(() => {
    finalizeMutation.mutate();
  }, [finalizeMutation]);

  const handleGeneratePdf = useCallback(() => {
    generatePdfMutation.mutate();
  }, [generatePdfMutation]);


  // Listen for v2 files from iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'v2_files_ready') {
        const { htmlV2, txtV2, corrLogTxt, baseName } = event.data.data;
        
        try {
          // Upload v2 files to backend
          const formData = new FormData();
          formData.append('html_v2', new Blob([htmlV2], { type: 'text/html' }), `${baseName}_v2.html`);
          formData.append('txt_v2', new Blob([txtV2], { type: 'text/plain' }), `${baseName}_v2.txt`);
          formData.append('corrections_log', new Blob([corrLogTxt], { type: 'text/plain' }), `${baseName}_corrections_log.txt`);
          
          await documentsApi.uploadV2Files(doc.id, formData);
          
          queryClient.invalidateQueries({ queryKey: ['documents', doc.id] });
          queryClient.invalidateQueries({ queryKey: ['document', doc.id] });
          queryClient.invalidateQueries({ queryKey: ['diff-html'] });
          queryClient.invalidateQueries({ queryKey: ['full-html'] });
          toast('Document finalized! V2 files saved successfully.');
          setShowPreview(false);
        } catch (error) {
          console.error('Failed to upload v2 files:', error);
          toast('Failed to save v2 files. Please try again.');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [doc.id, queryClient, toast]);

  if (!fileUrl || !htmlUrl) return null;

  const panelH = expanded ? 'h-[calc(100vh-120px)]' : 'h-[520px]';

  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm',
      expanded && 'fixed inset-4 z-50 rounded-xl shadow-2xl',
    )}>
      {expanded && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setExpanded(false)} />
      )}
      {/* Header toolbar */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white',
        expanded && 'relative z-50',
      )}>
        <div className="flex items-center gap-3">
          <Columns2 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">
            Document Review
          </span>
          <span className="text-[10px] rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 font-semibold">
            Interactive Editor
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Expand/collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5 text-gray-500" /> : <Maximize2 className="w-3.5 h-3.5 text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Side-by-side panels */}
      <div className={cn('grid grid-cols-2 divide-x divide-gray-200', expanded && 'relative z-[45] flex-1')}>
        {/* Left: Original Document */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 bg-red-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-red-700">Original Document</span>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-red-100 transition-colors"
              title="Download original"
            >
              <Download className="w-3.5 h-3.5 text-red-500" />
            </a>
          </div>
          <div className={cn('overflow-auto bg-gray-100', panelH)}>
            {doc.file_type === 'image' ? (
              <div className="flex items-start justify-center p-4">
                <img
                  src={fileUrl}
                  alt={doc.name}
                  className="rounded shadow-sm max-w-full"
                />
              </div>
            ) : (
              <iframe
                src={fileUrl}
                title={`Original: ${doc.name}`}
                className="w-full h-full border-0"
              />
            )}
          </div>
        </div>

        {/* Right: V1 HTML (fully interactive with toolbar and scripts) */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700">
                AI-Processed V1 (Interactive)
              </span>
              <span className="text-[9px] bg-blue-200/60 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                EDITABLE
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPreview(true)}
                className="p-1 rounded hover:bg-blue-100 transition-colors"
                title="Open in fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
              </button>
              <a
                href={htmlUrl}
                download
                className="p-1 rounded hover:bg-blue-100 transition-colors"
                title="Download HTML file"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
              </a>
            </div>
          </div>
          <div className={cn('overflow-hidden bg-white', panelH)}>
            {!fullHtmlContent ? (
              <div className="flex items-center justify-center h-64">
                <Loader className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            ) : (
              <iframe
                srcDoc={fullHtmlContent}
                title="V1 HTML Interactive Editor"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-downloads allow-modals allow-forms"
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer: version list with revert + FINALIZE */}
      <div className={cn('border-t border-gray-200 bg-gray-50', expanded && 'relative z-[45]')}>
        {/* Version list */}
        {versions && versions.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Versions ({versions.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...versions].sort((a, b) => b.version_number - a.version_number).map((v: DocumentVersion) => {
                const isCurrent = v.version_number === latestVersion;
                return (
                  <div
                    key={v.id}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] border transition-colors',
                      isCurrent
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                        : 'bg-white border-gray-200 text-gray-600',
                    )}
                  >
                    <span>v{v.version_number}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-400">{new Date(v.created_at).toLocaleString()}</span>
                    {v.notes && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500 truncate max-w-[120px]">{v.notes}</span>
                      </>
                    )}
                    {!isCurrent && (
                      <button
                        onClick={() => revertMutation.mutate(v.id)}
                        disabled={revertMutation.isPending}
                        className="ml-1 flex items-center gap-0.5 text-[10px] text-amber-600 hover:text-amber-800 font-medium transition-colors"
                        title={`Revert to v${v.version_number}`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Revert
                      </button>
                    )}
                    {isCurrent && (
                      <span className="text-[9px] bg-blue-200/60 text-blue-800 px-1 py-0.5 rounded font-medium ml-1">
                        CURRENT
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs text-gray-500">
            {versions && versions.length > 0
              ? `Viewing v${latestVersion}`
              : 'Version 1 (AI output)'}
          </span>

          <div className="flex items-center gap-2">
            {/* Save & Generate PDF — primary action */}
            <button
              onClick={handleGeneratePdf}
              disabled={generatePdfMutation.isPending}
              className={cn(
                'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold transition-all',
                generatePdfMutation.isSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              {generatePdfMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : generatePdfMutation.isSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  PDF Generated
                </>
              ) : (
                <>
                  <FileOutput className="w-4 h-4" />
                  Save &amp; Generate PDF
                </>
              )}
            </button>

            {/* Finalize & Push to RAG — secondary action */}
            <button
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                finalizeMutation.isSuccess
                  ? 'bg-blue-600 text-white'
                  : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              {finalizeMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Pushing...
                </>
              ) : finalizeMutation.isSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  RAG Done
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Push to RAG
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && htmlUrl && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Processed HTML Preview</h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {fullHtmlContent ? (
                <iframe
                  srcDoc={fullHtmlContent}
                  title="HTML Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-downloads"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accuracy Report Section */}
      {reportText && (
        <div className="border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowReport(!showReport)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">Accuracy Report</span>
              <span className="text-xs text-gray-500">(for reference)</span>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showReport && 'rotate-180')} />
          </button>
          {showReport && (
            <div className="px-4 pb-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{reportText}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
