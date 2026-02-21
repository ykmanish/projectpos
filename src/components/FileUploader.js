// components/FileUploader.js

"use client";

import { useState, useRef } from "react";
import {
  Upload,
  X,
  File,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { formatFileSize } from "@/utils/documentUtils";
import DocumentPreview from "./DocumentPreview";

export default function FileUploader({
  onUploadComplete,
  onCancel,
  maxSize = 50 * 1024 * 1024, // 50MB
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
    'image/*',
    'video/*',
    'audio/*'
  ],
  multiple = true,
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadResults, setUploadResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File exceeds maximum size of ${formatFileSize(maxSize)}`,
      };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes('*/*')) {
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return file.type.startsWith(category);
        }
        return type === file.type;
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: 'File type not allowed',
        };
      }
    }

    return { valid: true };
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    const newErrors = [];

    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        newErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (multiple) {
      setFiles(prev => [...prev, ...validFiles]);
    } else {
      setFiles(validFiles.slice(0, 1));
    }

    setErrors(newErrors);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              resolve({ success: true, url: xhr.responseText });
            }
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);

      const result = await uploadPromise;
      
      setUploadResults(prev => [...prev, {
        file: file.name,
        success: true,
        url: result.url || result,
        type: result.category || file.type,
      }]);

      return result;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResults(prev => [...prev, {
        file: file.name,
        success: false,
        error: error.message,
      }]);
      throw error;
    } finally {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors([]);
    setUploadResults([]);

    const uploadedFiles = [];

    for (const file of files) {
      try {
        const result = await uploadFile(file);
        uploadedFiles.push({
          file,
          result,
        });
      } catch (error) {
        // Error already handled in uploadFile
      }
    }

    setUploading(false);
    
    if (onUploadComplete) {
      onUploadComplete(uploadedFiles);
    }

    // Clear files after successful upload
    if (uploadedFiles.length === files.length) {
      setFiles([]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-green-500', 'bg-green-50', 'dark:bg-green-900/10');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-green-500', 'bg-green-50', 'dark:bg-green-900/10');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-green-500', 'bg-green-50', 'dark:bg-green-900/10');
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = [];
    const newErrors = [];

    droppedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        newErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (multiple) {
      setFiles(prev => [...prev, ...validFiles]);
    } else {
      setFiles(validFiles.slice(0, 1));
    }

    setErrors(newErrors);
  };

  return (
    <div className="file-uploader bg-white dark:bg-[#0c0c0c] rounded-3xl border border-zinc-200 dark:border-[#232529] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-[#232529]">
        <h3 className="text-lg font-semibold text-[#202124] dark:text-white">
          Upload Files
        </h3>
      </div>

      {/* Drop Zone */}
      <div
        className="m-4 p-8 border-2 border-dashed border-zinc-300 dark:border-[#333] rounded-2xl transition-colors cursor-pointer hover:border-green-500 dark:hover:border-green-500"
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
        
        <div className="text-center">
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
        <div className="mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
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
              const progress = uploadProgress[file.name];
              const result = uploadResults.find(r => r.file === file.name);

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#101010] rounded-xl group"
                >
                  <DocumentPreview.Compact
                    document={{
                      url: URL.createObjectURL(file),
                      name: file.name,
                      size: file.size,
                      type: file.type,
                    }}
                  />
                  
                  {progress !== undefined && (
                    <div className="w-16">
                      <div className="h-1 bg-gray-200 dark:bg-[#232529] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {result && result.success && (
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                  )}
                  
                  {result && !result.success && (
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                  )}
                  
                  {!uploading && !result && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-[#232529] rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={16} className="text-red-500" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div className="mx-4 mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
            Upload Complete
          </h4>
          <div className="space-y-1">
            {uploadResults.map((result, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {result.success ? (
                  <CheckCircle size={14} className="text-green-600" />
                ) : (
                  <AlertCircle size={14} className="text-red-600" />
                )}
                <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                  {result.file}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-zinc-200 dark:border-[#232529] flex justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[#5f6368] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-[#232529] disabled:text-gray-500 transition-colors flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload {files.length > 0 ? `(${files.length})` : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}