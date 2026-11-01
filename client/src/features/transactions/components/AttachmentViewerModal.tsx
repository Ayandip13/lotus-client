import React from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { TransactionAttachment } from '../types/transaction.types';
import { Button } from '../../../components/ui/Button';

interface AttachmentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: TransactionAttachment | null;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  isOpen,
  onClose,
  attachment,
}) => {
  if (!isOpen || !attachment) return null;

  // Resolve URL: if relative local URL like /uploads/..., resolve against backend API URL if needed
  const getFullUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    const serverRoot = apiBase.replace(/\/api\/?$/, '');
    return `${serverRoot}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const resolvedUrl = getFullUrl(attachment.url);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 truncate max-w-sm">
                {attachment.originalName || 'Bill / Receipt Attachment'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Size</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              aria-label="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4 min-h-[300px]">
          <img
            src={resolvedUrl}
            alt={attachment.originalName || 'Bill receipt image'}
            className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://placehold.co/600x400?text=Receipt+Image+Unavailable';
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>Uploaded: {new Date(attachment.uploadedAt).toLocaleDateString('en-IN')}</span>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
