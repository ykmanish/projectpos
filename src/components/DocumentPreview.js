// components/DocumentPreview.js

"use client";

import { useState } from "react";
import {
  FileText,
  File,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileType,
  Download,
  ExternalLink,
  Eye,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getDocumentType,
  formatFileSize,
  getDocumentColor,
  getDocumentBgClass,
  getDocumentTextClass,
  getDocumentTypeName,
} from "@/utils/documentUtils";

export default function DocumentPreview({
  document,
  onClose,
  onDownload,
  onOpenExternal,
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  if (!document) return null;

  const {
    url,
    name,
    size,
    type: mimeType,
    docType: explicitDocType,
  } = document;

  const docType = explicitDocType || getDocumentType(name, mimeType);
  const fileSize = size ? formatFileSize(size) : null;
  const bgClass = getDocumentBgClass(docType);
  const textClass = getDocumentTextClass(docType);
  const docTypeName = getDocumentTypeName(docType);

  // Determine if we can preview the document
  const canPreview = () => {
    const previewableTypes = ['image', 'video', 'audio', 'pdf', 'text'];
    if (previewableTypes.includes(docType)) return true;
    
    // Check by extension for PDFs
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return true;
    if (ext === 'txt' || ext === 'md') return true;
    
    return false;
  };

  const handlePreview = () => {
    if (canPreview()) {
      setIsPreviewOpen(true);
    } else {
      // For non-previewable documents, offer download
      if (onDownload) {
        onDownload(document);
      } else {
        window.open(url, '_blank');
      }
    }
  };

  // Get appropriate icon based on document type
  const getDocumentIcon = (size = 24) => {
    const iconProps = {
      size,
      className: textClass
    };

    switch (docType) {
      case 'pdf':
        return <FileText {...iconProps} />;
      case 'word':
        return <FileText {...iconProps} />;
      case 'excel':
        return <FileSpreadsheet {...iconProps} />;
      case 'powerpoint':
        return <FileType {...iconProps} />;
      case 'archive':
        return <FileArchive {...iconProps} />;
      case 'code':
        return <FileCode {...iconProps} />;
      case 'image':
        return <FileImage {...iconProps} />;
      case 'video':
        return <FileVideo {...iconProps} />;
      case 'audio':
        return <FileAudio {...iconProps} />;
      default:
        return <File {...iconProps} />;
    }
  };

  // Render preview modal
  const renderPreviewModal = () => {
    if (!isPreviewOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
        <div className="relative max-w-6xl max-h-[90vh] w-full bg-white dark:bg-[#0c0c0c] rounded-3xl overflow-hidden">
          {/* Preview Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-[#232529] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center`}>
                {getDocumentIcon(20)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#202124] dark:text-white">
                  {name}
                </h3>
                {fileSize && (
                  <p className="text-xs text-[#5f6368] dark:text-gray-400">
                    {fileSize} • {docTypeName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(url, '_blank')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={18} className="text-[#5f6368] dark:text-gray-400" />
              </button>
              <button
                onClick={() => {
                  if (onDownload) onDownload(document);
                  else window.open(url, '_blank');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
                title="Download"
              >
                <Download size={18} className="text-[#5f6368] dark:text-gray-400" />
              </button>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
              >
                <X size={18} className="text-[#5f6368] dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            {previewError ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">Failed to load preview</p>
                <button
                  onClick={() => window.open(url, '_blank')}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                >
                  Open in new tab
                </button>
              </div>
            ) : (
              <>
                {docType === 'image' && (
                  <img
                    src={url}
                    alt={name}
                    className="max-w-full max-h-[70vh] mx-auto object-contain"
                    onError={() => setPreviewError(true)}
                  />
                )}
                
                {docType === 'video' && (
                  <video
                    src={url}
                    controls
                    className="max-w-full max-h-[70vh] mx-auto"
                    onError={() => setPreviewError(true)}
                  />
                )}
                
                {docType === 'audio' && (
                  <audio
                    src={url}
                    controls
                    className="w-full"
                    onError={() => setPreviewError(true)}
                  />
                )}
                
                {docType === 'pdf' && (
                  <iframe
                    src={`${url}#view=FitH`}
                    className="w-full h-[70vh] rounded-xl"
                    title={name}
                    onError={() => setPreviewError(true)}
                  />
                )}
                
                {docType === 'text' && (
                  <iframe
                    src={url}
                    className="w-full h-[70vh] rounded-xl bg-white"
                    title={name}
                    onError={() => setPreviewError(true)}
                  />
                )}
                
                {!canPreview() && (
                  <div className="text-center py-12">
                    <div className={`w-24 h-24 rounded-3xl ${bgClass} flex items-center justify-center mx-auto mb-4`}>
                      {getDocumentIcon(48)}
                    </div>
                    <p className="text-[#202124] dark:text-white font-medium mb-2">
                      Preview not available
                    </p>
                    <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-4">
                      This file type cannot be previewed directly
                    </p>
                    <button
                      onClick={() => window.open(url, '_blank')}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 inline-flex items-center gap-2"
                    >
                      <Download size={18} />
                      Download to view
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Compact view (for messages)
  const renderCompact = () => {
    return (
      <div className="document-preview-compact">
        <div
          className={`p-3 rounded-xl ${bgClass} bg-opacity-20 dark:bg-opacity-20 hover:bg-opacity-30 transition-all cursor-pointer group`}
          onClick={handlePreview}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bgClass} flex items-center justify-center flex-shrink-0`}>
              {getDocumentIcon(20)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#202124] dark:text-white truncate">
                {name}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-gray-400">
                <span>{docTypeName}</span>
                {fileSize && (
                  <>
                    <span>•</span>
                    <span>{fileSize}</span>
                  </>
                )}
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDownload) onDownload(document);
                else window.open(url, '_blank');
              }}
              className="p-2 hover:bg-white dark:hover:bg-[#232529] rounded-full opacity-0 group-hover:opacity-100 transition-all"
              title="Download"
            >
              <Download size={16} className={textClass} />
            </button>
          </div>
        </div>
        
        {renderPreviewModal()}
      </div>
    );
  };

  // Detailed view (for file browser)
  const renderDetailed = () => {
    return (
      <div className="document-preview-detailed">
        <div
          className={`p-4 rounded-2xl border border-zinc-200 dark:border-[#232529] hover:bg-gray-50 dark:hover:bg-[#101010] transition-colors cursor-pointer group`}
          onClick={handlePreview}
        >
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl ${bgClass} flex items-center justify-center flex-shrink-0`}>
              {getDocumentIcon(32)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-[#202124] dark:text-white mb-1 truncate">
                {name}
              </h4>
              <div className="flex items-center gap-3 text-sm text-[#5f6368] dark:text-gray-400">
                <span>{docTypeName}</span>
                {fileSize && (
                  <>
                    <span>•</span>
                    <span>{fileSize}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDownload) onDownload(document);
                  else window.open(url, '_blank');
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-[#232529] rounded-full transition-colors"
                title="Download"
              >
                <Download size={18} className="text-[#5f6368] dark:text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(url, '_blank');
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-[#232529] rounded-full transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={18} className="text-[#5f6368] dark:text-gray-400" />
              </button>
              {canPreview() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPreviewOpen(true);
                  }}
                  className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                  title="Preview"
                >
                  <Eye size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {renderPreviewModal()}
      </div>
    );
  };

  // Export both views
  return {
    Compact: renderCompact,
    Detailed: renderDetailed,
    PreviewModal: renderPreviewModal,
  };
}

// Default export for the component (Compact view as default)
export function DocumentPreviewCompact(props) {
  const { Compact } = DocumentPreview(props);
  return Compact();
}

export function DocumentPreviewDetailed(props) {
  const { Detailed } = DocumentPreview(props);
  return Detailed();
}