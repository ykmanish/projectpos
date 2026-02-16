'use client';

import { useState, useRef } from 'react';
import { Image, Video, Link2, X, Loader2 } from 'lucide-react';
import LinkPreview from './LinkPreview';

export default function AttachmentUploader({ userId, onAttachmentsChange }) {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [processingLink, setProcessingLink] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        const newAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: data.category,
          url: data.url,
          name: data.name,
          mimeType: data.type,
          uploadedAt: new Date().toISOString(),
        };

        const updatedAttachments = [...attachments, newAttachment];
        setAttachments(updatedAttachments);
        onAttachmentsChange(updatedAttachments);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleLinkSubmit = async () => {
    if (!linkUrl.trim()) return;

    // Basic URL validation
    try {
      new URL(linkUrl);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    setProcessingLink(true);
    try {
      const res = await fetch('/api/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl }),
      });

      const data = await res.json();

      const newAttachment = {
        id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'link',
        url: linkUrl,
        preview: data.success ? data : {
          title: linkUrl,
          url: linkUrl,
          siteName: new URL(linkUrl).hostname
        },
        uploadedAt: new Date().toISOString(),
      };

      const updatedAttachments = [...attachments, newAttachment];
      setAttachments(updatedAttachments);
      onAttachmentsChange(updatedAttachments);
      
      setShowLinkInput(false);
      setLinkUrl('');
    } catch (error) {
      console.error('Link preview error:', error);
      // Still add the link even if preview fails
      try {
        const newAttachment = {
          id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'link',
          url: linkUrl,
          preview: {
            title: linkUrl,
            url: linkUrl,
            siteName: new URL(linkUrl).hostname
          },
          uploadedAt: new Date().toISOString(),
        };
        const updatedAttachments = [...attachments, newAttachment];
        setAttachments(updatedAttachments);
        onAttachmentsChange(updatedAttachments);
        setShowLinkInput(false);
        setLinkUrl('');
      } catch (e) {
        alert('Invalid URL format');
      }
    } finally {
      setProcessingLink(false);
    }
  };

  const removeAttachment = (id) => {
    const updatedAttachments = attachments.filter(a => a.id !== id);
    setAttachments(updatedAttachments);
    onAttachmentsChange(updatedAttachments);
  };

  return (
    <div className="space-y-4">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="grid  mb-4">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="relative group">
              {attachment.type === 'image' && (
                <div className="relative  w-full rounded-3xl overflow-hidden border border-[#dadce0]">
                  <img
                    src={attachment.url}
                    alt={attachment.name || 'Attachment'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150?text=Error';
                    }}
                  />
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {attachment.type === 'video' && (
                <div className="relative aspect-square rounded-lg overflow-hidden border border-[#dadce0] bg-black/5">
                  <video
                    src={attachment.url}
                    className="w-full h-full object-cover"
                    controls={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Video className="w-5 h-5 text-[#34A853]" />
                    </div>
                  </div>
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {attachment.type === 'link' && (
                <div className="relative">
                  <LinkPreview preview={attachment.preview} url={attachment.url} />
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white  hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload buttons */}
      <div className="flex flex-wrap gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0], 'image');
            }
          }}
          className="hidden"
        />
        <input
          type="file"
          ref={videoInputRef}
          accept="video/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0], 'video');
            }
          }}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-[#F8F9FA] hover:bg-[#f1f3f4] rounded-full text-sm font-medium text-[#5f6368] transition-colors disabled:opacity-50"
        >
          <Image className="w-4 h-4" />
          Photo
        </button>

        <button
          onClick={() => videoInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-[#F8F9FA] hover:bg-[#f1f3f4] rounded-full text-sm font-medium text-[#5f6368] transition-colors disabled:opacity-50"
        >
          <Video className="w-4 h-4" />
          Video
        </button>

        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-[#F8F9FA] hover:bg-[#f1f3f4] rounded-full text-sm font-medium text-[#5f6368] transition-colors disabled:opacity-50"
        >
          <Link2 className="w-4 h-4" />
          Link
        </button>

        {uploading && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F8F9FA] rounded-full">
            <Loader2 className="w-4 h-4 animate-spin text-[#34A853]" />
            <span className="text-sm text-[#5f6368]">Uploading...</span>
          </div>
        )}
      </div>

      {/* Link input field */}
      {showLinkInput && (
        <div className="flex gap-2 mt-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste your link here..."
            className="flex-1 px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none text-sm"
            disabled={processingLink}
            onKeyPress={(e) => e.key === 'Enter' && handleLinkSubmit()}
          />
          <button
            onClick={handleLinkSubmit}
            disabled={!linkUrl.trim() || processingLink}
            className="px-6 py-2 bg-[#34A853] hover:bg-[#2D9249] disabled:bg-[#E8F5E9] disabled:text-[#1E8E3E] text-white rounded-full text-sm font-medium transition-colors flex items-center gap-2"
          >
            {processingLink ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              'Add Link'
            )}
          </button>
        </div>
      )}
    </div>
  );
}