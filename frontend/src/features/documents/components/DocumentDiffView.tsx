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

      // Replace the download() function body with postMessage logic.
      // Uses bracket counting to reliably find the function's closing brace,
      // handling nested {} like { type: mime } correctly.
      const sig = 'function download(content, filename, mime) {';
      const sigIdx = html.indexOf(sig);
      if (sigIdx >= 0) {
        const bodyStart = sigIdx + sig.length;
        let depth = 1;
        let i = bodyStart;
        while (i < html.length && depth > 0) {
          if (html[i] === '{') depth++;
          if (html[i] === '}') depth--;
          i++;
        }
        // i now points right after the closing }
        const replacement = [
          sig,
          '    if (window.parent !== window) {',
          '      if (!window._v2Files) window._v2Files = {};',
          '      window._v2Files[filename] = content;',
          '      var keys = Object.keys(window._v2Files);',
          '      if (keys.length >= 3) {',
          '        var h=null,t=null,l=null,bn="";',
          '        keys.forEach(function(k){',
          '          if(k.indexOf("v2.html")>=0) h=window._v2Files[k];',
          '          else if(k.indexOf("v2.txt")>=0) t=window._v2Files[k];',
          '          else if(k.indexOf("correction")>=0) l=window._v2Files[k];',
          '          var ci=k.indexOf("_consolidated");',
          '          if(ci>0&&!bn) bn=k.substring(0,ci);',
          '          ci=k.indexOf("_corrections");',
          '          if(ci>0&&!bn) bn=k.substring(0,ci);',
          '        });',
          '        if(h&&t&&l){',
          '          window.parent.postMessage({type:"v2_files_ready",',
          '            data:{htmlV2:h,txtV2:t,corrLogTxt:l,baseName:bn||"document"}',
          '          },"*");',
          '          alert("Files saved! The document has been updated in the system.");',
          '          window._v2Files={};',
          '        }',
          '      }',
          '    } else {',
          '      var blob=new Blob([content],{type:mime});',
          '      var a=document.createElement("a");',
          '      a.href=URL.createObjectURL(blob);',
          '      a.download=filename;',
          '      document.body.appendChild(a);',
          '      a.click();',
          '      document.body.removeChild(a);',
          '      setTimeout(function(){URL.revokeObjectURL(a.href)},1000);',
          '    }',
          '  }',
        ].join('\n');
        html = html.slice(0, sigIdx) + replacement + html.slice(i);
      }

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
                sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
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
                  sandbox="allow-scripts allow-same-origin"
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
