import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, Image, File, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';

import { documentsApi } from '../api/documentsApi';
import type { DocumentStatus } from '../types';

const statusColors: Record<DocumentStatus, string> = {
  uploaded: 'bg-gray-100 text-gray-700',
  ready_to_process: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  processed: 'bg-green-100 text-green-700',
};

const statusLabels: Record<DocumentStatus, string> = {
  uploaded: 'Uploaded',
  ready_to_process: 'Ready',
  in_progress: 'In Progress',
  processed: 'Processed',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading documents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">Failed to load documents. Please try again.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage your uploaded documents
          </p>
        </div>
        <Link
          to="/documents/new"
          className="flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d3db4] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </Link>
      </div>

      {!isLoading && documents && documents.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
          >
            <option value="all">All Status</option>
            <option value="uploaded">Uploaded</option>
            <option value="ready_to_process">Ready</option>
            <option value="in_progress">In Progress</option>
            <option value="processed">Processed</option>
          </select>
        </div>
      )}

      {documents && documents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-4">Upload your first document to get started.</p>
          <Link
            to="/documents/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d3db4] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents?.filter((d) => {
                const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.case_title.toLowerCase().includes(search.toLowerCase());
                const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
                return matchesSearch && matchesStatus;
              }).map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {doc.file_type === 'image' ? (
                        <Image className="w-4 h-4 text-blue-500" />
                      ) : (
                        <File className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.case_title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.client_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium uppercase text-gray-500">{doc.file_type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(doc.file_size_bytes)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusColors[doc.status],
                      )}
                    >
                      {statusLabels[doc.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
