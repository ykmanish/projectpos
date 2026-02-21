// components/DocumentPicker.js

"use client";

import { useState, useRef, useEffect } from "react";
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
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  Trash2,
  Download,
  ExternalLink,
  Eye,
} from "lucide-react";
import { getDocumentType, formatFileSize, getDocumentBgClass, getDocumentTextClass } from "@/utils/documentUtils";

export default function DocumentPicker({
  onSelect,
  onClose,
  multiple = false,
  maxSize = 50 * 1024 * 1024, // 50MB default max size
  allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/json',
    'text/javascript',
    'text/html',
    'text/css',
    'image/*', // Allow images too
    'video/*', // Allow videos too
    'audio/*'  // Allow audio too
  ],
}) {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndAddFiles(selectedFiles);
  };

  const validateAndAddFiles = (newFiles) => {
    const validFiles = [];
    const newErrors = [];

    for (const file of newFiles) {
      // Check file size
      if (file.size > maxSize) {
        newErrors.push(`${file.name} exceeds the maximum size of ${formatFileSize(maxSize)}`);
        continue;
      }

      // Check file type if allowedTypes is not empty and not '*'
      if (allowedTypes.length > 0 && !allowedTypes.includes('*/*')) {
        const isAllowed = allowedTypes.some(type => {
          if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(category);
          }
          return type === file.type;
        });

        if (!isAllowed) {
          newErrors.push(`${file.name} is not an allowed file type`);
          continue;
        }
      }

      validFiles.push(file);
    }

    if (multiple) {
      setFiles(prev => [...prev, ...validFiles]);
    } else {
      setFiles(validFiles.slice(0, 1));
    }

    setErrors(newErrors);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length > 0) {
      onSelect(files);
    }
  };

  // Get appropriate icon based on file type
  const getFileIcon = (file) => {
    const docType = getDocumentType(file.name, file.type);
    
    const iconProps = {
      size: 24,
      className: `${getDocumentTextClass(docType)}`
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

  return (
    <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl border border-zinc-200 dark:border-[#232529] shadow-xl w-[500px] max-w-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-[#232529] flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#202124] dark:text-white">
          Upload Documents
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
        >
          <X size={20} className="text-[#5f6368] dark:text-gray-400" />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        className={`m-4 p-8 border-2 border-dashed rounded-2xl transition-colors ${
          isDragging
            ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
            : 'border-zinc-300 dark:border-[#333] hover:border-green-500 dark:hover:border-green-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="text-center cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-[#5f6368] dark:text-gray-400 mb-4" />
          <p className="text-[#202124] dark:text-white font-medium mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-[#5f6368] dark:text-gray-400">
            Any file type up to {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mx-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-[#202124] dark:text-white">
              Selected Files ({files.length})
            </h4>
            {multiple && (
              <button
                onClick={() => setFiles([])}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => {
              const docType = getDocumentType(file.name, file.type);
              const bgClass = getDocumentBgClass(docType);
              
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#101010] rounded-xl group"
                >
                  <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center flex-shrink-0`}>
                    {getFileIcon(file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202124] dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-[#5f6368] dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-[#232529] rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-zinc-200 dark:border-[#232529] flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-[#5f6368] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={files.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-[#232529] disabled:text-gray-500 transition-colors flex items-center gap-2"
        >
          <Upload size={18} />
          Upload {files.length > 0 ? `(${files.length})` : ''}
        </button>
      </div>
    </div>
  );
}