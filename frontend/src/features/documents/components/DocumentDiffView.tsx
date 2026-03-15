import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Columns2, ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Document } from '../types';

interface DocumentDiffViewProps {
  doc: Document;
}

export function DocumentDiffView({ doc }: DocumentDiffViewProps) {
  const [zoom, setZoom] = useState(100);
  const [expanded, setExpanded] = useState(false);

  const fileUrl = doc.file_url ?? null;
  const htmlUrl = doc.processed_html_url ?? null;

  const { data: htmlContent, isLoading: htmlLoading } = useQuery({
    queryKey: ['diff-html', htmlUrl],
    queryFn: async () => {
      const resp = await fetch(htmlUrl!);
      const text = await resp.text();
      const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      return bodyMatch ? bodyMatch[1] : text;
    },
    enabled: !!htmlUrl,
  });

  if (!fileUrl || !htmlUrl) return null;

  const maxH = expanded ? 'max-h-[80vh]' : 'max-h-[500px]';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Columns2 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">
            Compare: Original vs AI-Processed V1
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 25))}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <span className="text-[10px] text-gray-500 min-w-[2.5rem] text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 25))}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <Minimize2 className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Side-by-side panels */}
      <div className="grid grid-cols-2 divide-x divide-gray-200">
        {/* Left: Original Document */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 bg-red-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-red-700">Original Document</span>
            <a
              href={fileUrl}
              download={doc.name}
              className="p-1 rounded hover:bg-red-100 transition-colors"
              title="Download original"
            >
              <Download className="w-3.5 h-3.5 text-red-500" />
            </a>
          </div>
          <div className={cn('overflow-auto bg-gray-100', maxH)}>
            {doc.file_type === 'image' ? (
              <div className="flex items-start justify-center p-4">
                <img
                  src={fileUrl}
                  alt={doc.name}
                  style={{ width: `${zoom}%`, maxWidth: 'none' }}
                  className="rounded shadow-sm"
                />
              </div>
            ) : (
              <iframe
                src={fileUrl}
                title={`Original: ${doc.name}`}
                className="w-full border-0"
                style={{ height: expanded ? '80vh' : '500px' }}
              />
            )}
          </div>
        </div>

        {/* Right: Processed HTML V1 */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-blue-700">AI-Processed V1</span>
            <a
              href={htmlUrl}
              download={`${doc.name}_v1.html`}
              className="p-1 rounded hover:bg-blue-100 transition-colors"
              title="Download processed HTML"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
            </a>
          </div>
          <div className={cn('overflow-auto bg-white', maxH)}>
            {htmlLoading || !htmlContent ? (
              <div className="flex items-center justify-center h-64">
                <span className="text-sm text-gray-400">Loading processed document...</span>
              </div>
            ) : (
              <div
                className="p-6 prose prose-sm max-w-none
                  [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:border-b-2 [&_h1]:border-gray-800 [&_h1]:pb-2 [&_h1]:mb-4
                  [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-700 [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-gray-200 [&_h2]:pb-1
                  [&_p]:text-sm [&_p]:text-gray-700 [&_p]:leading-relaxed
                  [&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:rounded
                  [&_.illegible]:bg-red-100 [&_.illegible]:text-red-700 [&_.illegible]:font-bold [&_.illegible]:px-1 [&_.illegible]:rounded
                  [&_.section]:my-4 [&_.section]:p-4 [&_.section]:bg-gray-50 [&_.section]:border-l-4 [&_.section]:border-gray-800 [&_.section]:rounded-r
                  [&_.metadata]:bg-blue-50 [&_.metadata]:p-3 [&_.metadata]:rounded-lg [&_.metadata]:border [&_.metadata]:border-blue-100 [&_.metadata]:mb-4 [&_.metadata]:text-sm"
                style={{ fontSize: `${zoom}%` }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
