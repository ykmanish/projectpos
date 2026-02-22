// app/ventout/page.js

'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import {
  CircleEllipsis,
  Send,
  Heart,
  MessageCircle,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Flag,
  Plus,
  CheckCircle,
  AlertCircle,
  Users,
  ChevronLeft,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Type
} from 'lucide-react';
import { BeanHead } from 'beanheads';

// ─── Card Color Palette (matches reference design) ─────────────────
const CARD_PALETTES = [
  { bg: '#F3F3F3', track: '#c96b58', bar: '#1a0a08', text: '#1a0a08', sub: '#7a3028' },
  { bg: '#ffffff', track: '#d98898', bar: '#1a0810', text: '#1a0810', sub: '#7a3050' },
  { bg: '#7DCFCC', track: '#4eaaa7', bar: '#082020', text: '#082020', sub: '#1a5a58' },
  { bg: '#F5E09A', track: '#c8b860', bar: '#1a1408', text: '#1a1408', sub: '#6a5020' },
  { bg: '#A8D8FF', track: '#70b0e0', bar: '#081220', text: '#081220', sub: '#204870' },
  { bg: '#B8E8B0', track: '#80c078', bar: '#081408', text: '#081408', sub: '#205820' },
  { bg: '#E0C8F8', track: '#b090d0', bar: '#120820', text: '#120820', sub: '#503878' },
  { bg: '#FFD4A0', track: '#d8a060', bar: '#1a0e04', text: '#1a0e04', sub: '#7a4818' },

];

// Highlight colors for text
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FFE68F', textColor: '#000000' },
  { name: 'Green', value: '#CCE7C5', textColor: '#000000' },
  { name: 'Blue', value: '#B8DAFF', textColor: '#000000' },
  { name: 'Pink', value: '#FFD1DC', textColor: '#000000' },
  { name: 'Purple', value: '#E0C8F8', textColor: '#000000' },
  { name: 'Orange', value: '#FFD4A0', textColor: '#000000' },
  { name: 'Red', value: '#FFB6B6', textColor: '#000000' },
  { name: 'Gray', value: '#E0E0E0', textColor: '#000000' },
    { name: 'Light Green', value: '#7BF1A8', textColor: '#000000' },


];

const getCardPalette = (title = '') => {
  const idx = (title.charCodeAt(0) || 0) % CARD_PALETTES.length;
  return CARD_PALETTES[idx];
};

// Helper function to parse avatar (BeanHead config)
const parseAvatar = (avatarData) => {
  if (!avatarData) return null;
  
  try {
    if (typeof avatarData === 'object') return avatarData;
    const parsed = JSON.parse(avatarData);
    return parsed;
  } catch (e) {
    console.error('Failed to parse avatar:', e);
    return null;
  }
};

const getBeanConfig = (avatar) => {
  const parsed = parseAvatar(avatar);
  if (!parsed) return null;
  if (typeof parsed === 'object' && parsed.beanConfig) {
    return parsed.beanConfig;
  }
  if (typeof parsed === 'object' && (parsed.mask || parsed.eyes || parsed.mouth)) {
    return parsed;
  }
  return null;
};

// ─── Progress Bar (dark style on colored card) ─────────────────────
const ProgressBar = ({ percentage = 0, trackColor, barColor }) => {
  const pct = Math.min(Math.max(percentage, 0), 100);
  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className="flex-1 h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: trackColor || '#00000025' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor || '#000000' }}
        />
      </div>
      <span className="text-sm font-extrabold min-w-[42px] text-right" style={{ color: barColor || '#000' }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
};

// ─── Stacked Circular Avatars ───────────────────────────────────────
const StackedAvatars = ({ users = [], members = [], max = 4 }) => {
  const visible = users.slice(0, max);
  const extra = users.length - max;
  
  return (
    <div className="flex items-center">
      {visible.map((user, index) => {
        const member = members.find(m => m.userId === user.userId);
        const beanConfig = getBeanConfig(member?.avatar);
        
        return (
          <div
            key={user.userId}
            className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 overflow-hidden bg-gray-300 flex-shrink-0"
            style={{ zIndex: index }}
          >
            {beanConfig ? (
              <div className="w-full h-full bg-[#e8f0fe]">
                <BeanHead {...beanConfig} />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-700 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{user.userName?.charAt(0)}</span>
              </div>
            )}
          </div>
        );
      })}
      {extra > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-white -ml-2 bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700">
          +{extra}
        </div>
      )}
    </div>
  );
};

// ─── Anonymous Avatar Component ─────────────────────────────────────
function AnonymousAvatar({ size = "w-10 h-10" }) {
  return (
    <div className={`${size} rounded-full bg-zinc-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0`}>
      <Shield className="w-5 h-5 text-zinc-50 dark:text-gray-400" />
    </div>
  );
}

// ─── Vent Card Dropdown Menu Component ─────────────────────────────
const VentCardDropdown = ({ vent, currentUserId, onDelete, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isCreator = vent.userId === currentUserId;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isCreator) return null;

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    onDelete(vent);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2 hover:bg-black/10 transition-colors"
        style={{ backgroundColor: `${vent.palette?.text}18` }}
      >
        <MoreHorizontal size={16} style={{ color: vent.palette?.text }} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-1 w-40 bg-red-50 rounded-2xl  z-50 overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-red-50 transition-colors text-sm font-medium text-red-600"
          >
            <Flag size={14} className="text-red-500" />
            Delete Vent
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Rich Text Editor Component ────────────────────────────────────
const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    onChange(editorRef.current.innerHTML);
  };

  const handleHighlight = (color) => {
    setSelectedColor(color);
    document.execCommand('hiliteColor', false, color.value);
    editorRef.current.focus();
    onChange(editorRef.current.innerHTML);
    setShowHighlightPicker(false);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleInput = () => {
    onChange(editorRef.current.innerHTML);
  };

  const clearFormatting = () => {
    document.execCommand('removeFormat', false, null);
    editorRef.current.focus();
    onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="space-y-3">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-white border border-gray-200 rounded-2xl">
        <button
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          title="Bold"
          type="button"
        >
          <Bold size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          title="Italic"
          type="button"
        >
          <Italic size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          title="Underline"
          type="button"
        >
          <Underline size={18} className="text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        
        {/* Highlight Color Picker */}
        <div className="relative">
          <button
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1"
            title="Highlight color"
            type="button"
            style={{ backgroundColor: showHighlightPicker ? '#f3f4f6' : 'transparent' }}
          >
            <Highlighter size={18} className="text-gray-700" />
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedColor.value }}
            />
          </button>
          
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-2xl -lg border border-gray-200 z-50 w-48">
              <div className="grid grid-cols-4 gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleHighlight(color)}
                    className="w-8 h-8 rounded-lg hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    type="button"
                  />
                ))}
              </div>
              <button
                onClick={() => handleHighlight({ value: 'transparent', textColor: '#000000' })}
                className="w-full mt-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                type="button"
              >
                <X size={12} />
                Remove Highlight
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />
        
        <button
          onClick={clearFormatting}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-xs text-gray-500"
          title="Clear formatting"
          type="button"
        >
          <Type size={18} className="text-gray-700" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="w-full min-h-[250px] p-4 bg-zinc-50 rounded-3xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 overflow-y-auto"
        style={{ 
          fontFamily: 'inherit',
          fontSize: '1rem',
          lineHeight: '1.6'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      
      {/* Placeholder handling */}
      <style jsx>{`
        div[contenteditable=true]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          cursor: text;
        }
      `}</style>
    </div>
  );
};

// ─── VentOut Modal Component with Rich Text ────────────────────────
function VentOutModal({ isOpen, onClose, onSubmit }) {
  const [ventText, setVentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Get plain text for validation (strip HTML tags)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = ventText;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    if (!plainText.trim() || submitting) return;
    
    setSubmitting(true);
    setError('');
    const success = await onSubmit(ventText, isAnonymous);
    if (success) {
      setVentText('');
      setIsAnonymous(false);
      onClose();
    } else {
      setError('Failed to post vent. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden -2xl" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
            <h2 className="text-lg font-bold text-black flex items-center gap-2">
              Add your thoughts
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
            >
              <X size={16} className="text-gray-700" />
            </button>
          </div>

          {/* Error Toast */}
          {error && (
            <div className="px-5 mb-2">
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2">
                <AlertCircle size={15} strokeWidth={2.5} />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Content with Rich Text Editor */}
          <div className="flex-1 overflow-y-auto px-5 pb-2">
            <RichTextEditor
              value={ventText}
              onChange={setVentText}
              placeholder="What's on your mind? Use the toolbar to format your text..."
            />

            {/* Anonymous Option */}
            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-2xl">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 text-[#FF6B6B] rounded border-gray-300 focus:ring-[#FF6B6B]"
                />
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <Shield size={16} />
                  Post anonymously
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="px-5 pb-7 pt-4 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!ventText.replace(/<[^>]*>/g, '').trim() || submitting}
              className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={18} strokeWidth={2.5} />
                  Post Vent
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Delete Confirmation Modal ──────────────────────────────────────
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, ventTitle, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Flag size={28} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
          Delete Vent?
        </h3>
        <p className="text-center text-gray-500 text-sm mb-6">
          Are you sure you want to delete this vent? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-semibold text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Vent Comments Modal (Split View) ──────────────────────────────
function VentCommentsModal({ isOpen, onClose, vent, currentUserId, currentUserName, currentUserAvatar, onAddComment, onLikeComment }) {
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !vent) return null;

  const triggerSuccess = (msg = 'Done!') => {
    setSuccessMsg(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'recently';
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    const success = await onAddComment(vent._id, commentText);
    if (success) {
      setCommentText('');
      triggerSuccess('Comment added!');
    } else {
      setError('Failed to add comment');
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async (commentIndex) => {
    if (!replyText.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    const success = await onAddComment(vent._id, replyText, commentIndex, replyingTo.userName);
    if (success) {
      setReplyText('');
      setReplyingTo(null);
      setShowReplies(prev => ({ ...prev, [commentIndex]: true }));
      triggerSuccess('Reply added!');
    } else {
      setError('Failed to add reply');
    }
    setSubmitting(false);
  };

  const renderAvatar = (comment) => {
    if (comment.isAnonymous) {
      return <AnonymousAvatar size="w-8 h-8" />;
    }
    if (comment.userAvatar) {
      try {
        const beanConfig = getBeanConfig(comment.userAvatar);
        if (beanConfig) {
          return (
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e8f0fe] dark:bg-[#232529] flex-shrink-0">
              <BeanHead {...beanConfig} />
            </div>
          );
        }
      } catch (e) {
        console.error('Failed to parse avatar:', e);
      }
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
        {comment.userName?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    );
  };

  const renderFormattedText = (htmlContent) => {
    if (!htmlContent) return null;
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  const palette = getCardPalette(vent.text || 'Vent');

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] max-w-6xl w-full h-[85vh] overflow-hidden flex flex-col -2xl" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#FF6B6B]" />
              Comments ({vent.commentCount || 0})
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
            >
              <X size={16} className="text-gray-700" />
            </button>
          </div>

          {/* Split View Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Side - Vent Content */}
            <div className="w-2/5 border-gray-100 overflow-y-auto p-6">
              <div className="sticky top-0">
                <div className="rounded-3xl p-6 bg-zinc-50">
                  <div className="flex items-start gap-3 mb-4">
                    {vent.isAnonymous ? (
                      <AnonymousAvatar size="w-12 h-12" />
                    ) : (
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#e8f0fe] flex-shrink-0">
                        {getBeanConfig(vent.userAvatar) ? (
                          <BeanHead {...getBeanConfig(vent.userAvatar)} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#FF6B6B] to-[#ff5252] flex items-center justify-center text-white font-semibold">
                            {vent.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-base" style={{ color: palette.text }}>
                          {vent.userName}
                        </p>
                        {vent.isAnonymous && (
                          <span className="px-2 py-1 bg-black/20 rounded-full text-xs" style={{ color: palette.text }}>
                            Anonymous
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium mt-1" style={{ color: palette.sub }}>
                        {formatTimeAgo(vent.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Formatted vent text */}
                  <div 
                    className="text-base font-medium leading-relaxed prose prose-sm max-w-none"
                    style={{ color: palette.text }}
                    dangerouslySetInnerHTML={{ __html: vent.text }}
                  />
                  
                  {/* Engagement Stats on Vent */}
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-black/10">
                    <div className="flex items-center gap-2" style={{ color: palette.sub }}>
                      <Heart size={18} />
                      <span className="text-sm font-medium">{vent.likeCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: palette.sub }}>
                      <MessageCircle size={18} />
                      <span className="text-sm font-medium">{vent.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Comments Section */}
            <div className="w-3/5 flex flex-col overflow-hidden bg-gray-50">
              {/* Comments List - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {vent.comments && vent.comments.length > 0 ? (
                  <div className="space-y-6">
                    {vent.comments.map((comment, index) => (
                      <div key={index} className="space-y-3">
                        {/* Main Comment */}
                        <div className="flex gap-3">
                          {renderAvatar(comment)}
                          
                          <div className="flex-1 bg-white rounded-2xl p-4 -sm">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-sm text-gray-900">
                                {comment.isAnonymous ? 'Anonymous' : comment.userName}
                              </span>
                              {comment.isAnonymous && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                                  Anonymous
                                </span>
                              )}
                              <span className="text-xs text-gray-400 ml-auto">
                                {formatTimeAgo(comment.timestamp)}
                              </span>
                            </div>
                            
                            <div 
                              className="text-sm text-gray-700 mb-3 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: comment.text }}
                            />

                            {/* Comment Actions */}
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => onLikeComment(vent._id, index)}
                                className={`flex items-center gap-1 text-sm transition-all ${
                                  comment.likes?.includes(currentUserId)
                                    ? 'text-red-500'
                                    : 'text-gray-400 hover:text-red-500'
                                }`}
                              >
                                <Heart size={14} fill={comment.likes?.includes(currentUserId) ? 'currentColor' : 'none'} />
                                <span>{comment.likeCount || 0}</span>
                              </button>

                              <button
                                onClick={() => setReplyingTo({ commentIndex: index, userName: comment.isAnonymous ? 'Anonymous' : comment.userName })}
                                className="text-sm text-gray-400 hover:text-[#FF6B6B] transition-all"
                              >
                                Reply
                              </button>

                              {comment.replies && comment.replies.length > 0 && (
                                <button
                                  onClick={() => setShowReplies(prev => ({ ...prev, [index]: !prev[index] }))}
                                  className="flex items-center gap-1 text-sm text-[#FF6B6B] hover:text-[#ff5252] transition-all ml-auto"
                                >
                                  {showReplies[index] ? (
                                    <>
                                      <ChevronUp size={14} />
                                      Hide Replies
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown size={14} />
                                      View {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Reply Input */}
                            {replyingTo?.commentIndex === index && (
                              <div className="mt-4 flex items-start gap-2">
                                {currentUserAvatar ? (
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#e8f0fe] flex-shrink-0">
                                    <BeanHead {...(getBeanConfig(currentUserAvatar) || {})} />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                    {currentUserName?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                )}
                                <div className="flex-1 relative">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitReply(index);
                                      }
                                    }}
                                    placeholder={`Reply to ${replyingTo.userName}...`}
                                    className="w-full px-4 py-2 pr-10 border border-gray-200 bg-white rounded-full focus:ring-1 focus:ring-[#FF6B6B] focus:border-[#FF6B6B] focus:outline-none text-sm"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSubmitReply(index)}
                                    disabled={!replyText.trim() || submitting}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#FF6B6B] hover:text-[#ff5252] disabled:text-gray-300 disabled:cursor-not-allowed transition-all"
                                  >
                                    <Send size={16} />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Replies */}
                            {showReplies[index] && comment.replies && comment.replies.length > 0 && (
                              <div className="mt-4 ml-6 space-y-4">
                                {comment.replies.map((reply, replyIndex) => (
                                  <div key={replyIndex} className="flex gap-2">
                                    {reply.isAnonymous ? (
                                      <AnonymousAvatar size="w-6 h-6" />
                                    ) : reply.userAvatar ? (
                                      <div className="w-6 h-6 rounded-full overflow-hidden bg-[#e8f0fe] flex-shrink-0">
                                        <BeanHead {...(getBeanConfig(reply.userAvatar) || {})} />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                        {reply.userName?.charAt(0)?.toUpperCase() || 'U'}
                                      </div>
                                    )}
                                    
                                    <div className="flex-1 bg-white rounded-2xl p-3 -sm">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-xs text-gray-900">
                                          {reply.isAnonymous ? 'Anonymous' : reply.userName}
                                        </span>
                                        {reply.isAnonymous && (
                                          <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                                            Anonymous
                                          </span>
                                        )}
                                        <span className="text-[10px] text-gray-400 ml-auto">
                                          {formatTimeAgo(reply.timestamp)}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-700 mb-2">
                                        {reply.replyToUserName && (
                                          <span className="text-[#FF6B6B] font-medium">@{reply.replyToUserName} </span>
                                        )}
                                        <span dangerouslySetInnerHTML={{ __html: reply.text }} />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => onLikeComment(vent._id, index, replyIndex)}
                                          className={`flex items-center gap-1 text-xs transition-all ${
                                            reply.likes?.includes(currentUserId)
                                              ? 'text-red-500'
                                              : 'text-gray-400 hover:text-red-500'
                                          }`}
                                        >
                                          <Heart size={12} fill={reply.likes?.includes(currentUserId) ? 'currentColor' : 'none'} />
                                          <span>{reply.likeCount || 0}</span>
                                        </button>
                                        <button
                                          onClick={() => setReplyingTo({ commentIndex: index, userName: reply.isAnonymous ? 'Anonymous' : reply.userName })}
                                          className="text-xs text-gray-400 hover:text-[#FF6B6B] transition-all"
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full py-16">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center mx-auto mb-3 -sm">
                        <MessageCircle className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500">
                        No comments yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Be the first to share your thoughts
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Comment Input - Fixed at bottom */}
              <div className="px-6 pb-6 pt-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3">
                  {currentUserAvatar ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#e8f0fe] flex-shrink-0">
                      <BeanHead {...(getBeanConfig(currentUserAvatar) || {})} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {currentUserName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                      }}
                      placeholder="Write a comment..."
                      className="w-full px-4 py-3 pr-12 border border-gray-200 bg-gray-50 rounded-full focus:ring-2 focus:ring-[#FF6B6B] focus:border-[#FF6B6B] focus:outline-none text-sm"
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || submitting}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#FF6B6B] hover:text-[#ff5252] disabled:text-gray-300 disabled:cursor-not-allowed transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VentOutPage() {
  const { userId, userName, avatar } = useUser();
  const [vents, setVents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVentModal, setShowVentModal] = useState(false);
  const [selectedVent, setSelectedVent] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirmVent, setDeleteConfirmVent] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchVents();
  }, []);

  const triggerSuccess = (msg = 'Done!') => {
    setSuccessMsg(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const fetchVents = async () => {
    try {
      const response = await fetch('/api/ventout');
      const data = await response.json();
      if (data.success) {
        setVents(data.vents);
      }
    } catch (error) {
      console.error('Error fetching vents:', error);
      setError('Failed to load vents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVent = async (text, isAnonymous) => {
    try {
      const response = await fetch('/api/ventout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName: isAnonymous ? 'Anonymous' : userName,
          text, // This now contains HTML
          isAnonymous,
          avatar: isAnonymous ? null : avatar
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setVents(prev => [data.vent, ...prev]);
        triggerSuccess('Vent posted!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error posting vent:', error);
      return false;
    }
  };

  const handleDeleteVent = (vent) => {
    setDeleteConfirmVent(vent);
  };

  const confirmDeleteVent = async () => {
    if (!deleteConfirmVent) return;

    setDeleteLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/ventout?id=${deleteConfirmVent._id}&userId=${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setVents(prev => prev.filter(v => v._id !== deleteConfirmVent._id));
        triggerSuccess('Vent deleted');
        setDeleteConfirmVent(null);
      } else {
        setError(data.error || 'Failed to delete vent');
      }
    } catch (e) {
      console.error('Error deleting vent:', e);
      setError('Failed to delete vent');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmVent(null);
  };

  const handleLikeVent = async (ventId) => {
    try {
      const response = await fetch('/api/ventout/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventId, userId })
      });

      const data = await response.json();
      
      if (data.success) {
        setVents(prev => prev.map(vent => 
          vent._id === ventId 
            ? { 
                ...vent, 
                likes: data.liked 
                  ? [...(vent.likes || []), userId]
                  : (vent.likes || []).filter(id => id !== userId),
                likeCount: data.liked ? (vent.likeCount || 0) + 1 : Math.max((vent.likeCount || 0) - 1, 0)
              }
            : vent
        ));
      }
    } catch (error) {
      console.error('Error liking vent:', error);
    }
  };

  const handleAddComment = async (ventId, comment, commentIndex = null, replyToUserName = null) => {
    try {
      const response = await fetch('/api/ventout/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventId,
          userId,
          userName,
          avatar,
          comment,
          commentIndex,
          replyToUserName
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setVents(prev => prev.map(vent => {
          if (vent._id === ventId) {
            const updatedVent = { ...vent };
            
            if (commentIndex !== null) {
              const comments = [...(vent.comments || [])];
              const comment = { ...comments[commentIndex] };
              comment.replies = [...(comment.replies || []), data.comment];
              comments[commentIndex] = comment;
              updatedVent.comments = comments;
            } else {
              updatedVent.comments = [...(vent.comments || []), data.comment];
            }
            
            updatedVent.commentCount = (vent.commentCount || 0) + 1;
            return updatedVent;
          }
          return vent;
        }));

        if (selectedVent?._id === ventId) {
          setSelectedVent(prev => {
            const updated = { ...prev };
            if (commentIndex !== null) {
              const comments = [...(prev.comments || [])];
              const comment = { ...comments[commentIndex] };
              comment.replies = [...(comment.replies || []), data.comment];
              comments[commentIndex] = comment;
              updated.comments = comments;
            } else {
              updated.comments = [...(prev.comments || []), data.comment];
            }
            updated.commentCount = (prev.commentCount || 0) + 1;
            return updated;
          });
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  };

  const handleLikeComment = async (ventId, commentIndex, replyIndex = null) => {
    try {
      const response = await fetch('/api/ventout/comment/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventId, commentIndex, replyIndex, userId })
      });

      const data = await response.json();
      
      if (data.success) {
        setVents(prev => prev.map(vent => {
          if (vent._id === ventId) {
            const updatedVent = { ...vent };
            const comments = [...(vent.comments || [])];
            
            if (replyIndex !== null) {
              const comment = { ...comments[commentIndex] };
              const replies = [...(comment.replies || [])];
              const reply = { ...replies[replyIndex] };
              
              if (data.liked) {
                reply.likes = [...(reply.likes || []), userId];
                reply.likeCount = (reply.likeCount || 0) + 1;
              } else {
                reply.likes = (reply.likes || []).filter(id => id !== userId);
                reply.likeCount = Math.max((reply.likeCount || 0) - 1, 0);
              }
              
              replies[replyIndex] = reply;
              comment.replies = replies;
              comments[commentIndex] = comment;
            } else {
              const comment = { ...comments[commentIndex] };
              
              if (data.liked) {
                comment.likes = [...(comment.likes || []), userId];
                comment.likeCount = (comment.likeCount || 0) + 1;
              } else {
                comment.likes = (comment.likes || []).filter(id => id !== userId);
                comment.likeCount = Math.max((comment.likeCount || 0) - 1, 0);
              }
              
              comments[commentIndex] = comment;
            }
            
            updatedVent.comments = comments;
            return updatedVent;
          }
          return vent;
        }));

        if (selectedVent?._id === ventId) {
          setSelectedVent(prev => {
            const updated = { ...prev };
            const comments = [...(prev.comments || [])];
            
            if (replyIndex !== null) {
              const comment = { ...comments[commentIndex] };
              const replies = [...(comment.replies || [])];
              const reply = { ...replies[replyIndex] };
              
              if (data.liked) {
                reply.likes = [...(reply.likes || []), userId];
                reply.likeCount = (reply.likeCount || 0) + 1;
              } else {
                reply.likes = (reply.likes || []).filter(id => id !== userId);
                reply.likeCount = Math.max((reply.likeCount || 0) - 1, 0);
              }
              
              replies[replyIndex] = reply;
              comment.replies = replies;
              comments[commentIndex] = comment;
            } else {
              const comment = { ...comments[commentIndex] };
              
              if (data.liked) {
                comment.likes = [...(comment.likes || []), userId];
                comment.likeCount = (comment.likeCount || 0) + 1;
              } else {
                comment.likes = (comment.likes || []).filter(id => id !== userId);
                comment.likeCount = Math.max((comment.likeCount || 0) - 1, 0);
              }
              
              comments[commentIndex] = comment;
            }
            
            updated.comments = comments;
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const openComments = (vent) => {
    setSelectedVent(vent);
    setShowComments(true);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'recently';
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderVentAvatar = (vent) => {
    if (vent.isAnonymous) {
      return <AnonymousAvatar size="w-12 h-12" />;
    }
    
    if (vent.userAvatar) {
      try {
        const beanConfig = getBeanConfig(vent.userAvatar);
        if (beanConfig) {
          return (
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#e8f0fe] dark:bg-[#232529] flex-shrink-0">
              <BeanHead {...beanConfig} />
            </div>
          );
        }
      } catch (e) {
        console.error('Failed to parse avatar:', e);
      }
    }
    
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#ff5252] flex items-center justify-center text-white font-semibold flex-shrink-0">
        {vent.userName?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    );
  };

  return (
    <main className="flex-1 h-screen bg-[#EEF1F0] dark:bg-[#0a0a0a] overflow-hidden relative">
      {/* Floating Vent Out Button */}
      <button
        onClick={() => setShowVentModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-black rounded-full -lg hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center text-white z-40"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Scrollable Feed Container */}
      <div className="h-full overflow-y-auto">
        <div className="p-8">
          <div className="max-w-3xl ">
            {/* Header */}
            <div className="mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl text-[#000000] dark:text-white">
                  Vent <span className="font-semibold text-[#000000]">Out</span>
                </h1>
                <p className="text-base text-[#5f6368] dark:text-gray-400">
                  A safe space to express yourself
                </p>
              </div>
            </div>

            {/* Toasts */}
            {showSuccess && (
              <div className="mb-4">
                <div className="px-4 py-3 bg-black rounded-2xl text-white text-sm flex items-center gap-2 animate-fade-in">
                  <CheckCircle size={15} strokeWidth={2.5} />
                  <span className="font-semibold">{successMsg}</span>
                </div>
              </div>
            )}
            {error && (
              <div className="mb-4">
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle size={15} strokeWidth={2.5} />
                  <span className="font-semibold">{error}</span>
                </div>
              </div>
            )}

            {/* Vents Feed */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-3xl p-6 animate-pulse  border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : vents.length === 0 ? (
              <div className="bg-white rounded-[30px] p-12 text-center ">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CircleEllipsis className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl text-black font-semibold mb-2">
                  No vents yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Click the + button to share what's on your mind
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-8">
                {vents.map((vent) => {
                  const palette = getCardPalette(vent.text);
                  // Add palette to vent for dropdown
                  vent.palette = palette;
                  
                  return (
                    <article
                      key={vent._id}
                      className="bg-white rounded-[30px] overflow-hidden border border-gray-100 transition-all hover:-lg"
                    >
                      {/* Vent Header */}
                      <div className="p-6 pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {renderVentAvatar(vent)}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  {vent.userName}
                                </h3>
                                {vent.isAnonymous && (
                                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 flex items-center gap-1">
                                    <Shield size={10} />
                                    Anonymous
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <Clock size={12} />
                                {formatTimeAgo(vent.timestamp)}
                              </p>
                            </div>
                          </div>
                          <VentCardDropdown
                            vent={vent}
                            currentUserId={userId}
                            onDelete={handleDeleteVent}
                          />
                        </div>
                      </div>

                      {/* Vent Content - Colored Card */}
                      <div className="px-6 pb-4">
                        <div className="rounded-[30px] p-5 bg-zinc-50">
                          <div 
                            className="font-medium text-sm leading-relaxed prose prose-sm max-w-none"
                            style={{ color: palette.text }}
                            dangerouslySetInnerHTML={{ __html: vent.text }}
                          />
                        </div>
                      </div>

                      {/* Engagement Stats */}
                      <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-6">
                        <button
                          onClick={() => handleLikeVent(vent._id)}
                          className={`flex items-center gap-2 transition-all ${
                            vent.likes?.includes(userId)
                              ? 'text-red-500'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <Heart size={20} fill={vent.likes?.includes(userId) ? 'currentColor' : 'none'} />
                          <span className="text-sm font-medium">{vent.likeCount || 0}</span>
                        </button>

                        <button
                          onClick={() => openComments(vent)}
                          className="flex items-center gap-2 text-gray-400 hover:text-[#FF6B6B] transition-all"
                        >
                          <MessageCircle size={20} />
                          <span className="text-sm font-medium">{vent.commentCount || 0}</span>
                        </button>

                        <button className="flex items-center gap-2 text-gray-400 hover:text-[#FF6B6B] transition-all ml-auto">
                          <Flag size={18} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <VentOutModal
        isOpen={showVentModal}
        onClose={() => setShowVentModal(false)}
        onSubmit={handleSubmitVent}
      />

      <VentCommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        vent={selectedVent}
        currentUserId={userId}
        currentUserName={userName}
        currentUserAvatar={avatar}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteConfirmVent}
        onClose={cancelDelete}
        onConfirm={confirmDeleteVent}
        ventTitle={deleteConfirmVent?.text}
        loading={deleteLoading}
      />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        
        /* Rich text editor styles */
        div[contenteditable=true] {
          outline: none;
        }
        div[contenteditable=true] strong {
          font-weight: 600;
        }
        div[contenteditable=true] em {
          font-style: italic;
        }
        div[contenteditable=true] u {
          text-decoration: underline;
        }
        div[contenteditable=true] mark {
          padding: 0 2px;
          border-radius: 2px;
        }
        
        /* Prose styles for rendered content */
        .prose {
          word-break: break-word;
        }
        .prose strong {
          font-weight: 600;
        }
        .prose em {
          font-style: italic;
        }
        .prose u {
          text-decoration: underline;
        }
        .prose mark {
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
    </main>
  );
}