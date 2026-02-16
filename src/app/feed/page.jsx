"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import {
  Calendar,
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  MoreHorizontal,
  Users,
  Bell,
  X,
  Check,
  Clock,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  Link2,
  ExternalLink,
  Play,
  FileText,
} from "lucide-react";
import { BeanHead } from "beanheads";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Attachment Gallery Component
function AttachmentGallery({ attachments }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState({});

  if (!attachments || attachments.length === 0) return null;

  const handleImageLoad = (index) => {
    setLoading(prev => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index) => {
    setLoading(prev => ({ ...prev, [index]: false }));
  };

  const openLightbox = (index) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev + 1) % attachments.length);
  };

  const goToPrev = () => {
    setSelectedIndex((prev) => (prev - 1 + attachments.length) % attachments.length);
  };

  // Group attachments by type
  const images = attachments.filter(a => a.type === 'image');
  const videos = attachments.filter(a => a.type === 'video');
  const links = attachments.filter(a => a.type === 'link');

  return (
    <>
      <div className="space-y-3 mb-4">
        {/* Image Grid */}
        {images.length > 0 && (
          <div className={`grid gap-2 ${
            images.length === 1 ? 'grid-cols-1' :
            images.length === 2 ? 'grid-cols-2' :
            'grid-cols-3'
          }`}>
            {images.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={() => openLightbox(idx)}
                className="relative aspect-square rounded-xl overflow-hidden bg-[#f1f3f4] group hover:opacity-95 transition-opacity"
              >
                {loading[idx] !== false && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#f1f3f4]">
                    <div className="w-6 h-6 border-2 border-[#34A853] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={img.url}
                  alt={img.name || 'Attachment'}
                  className="w-full h-full object-cover"
                  onLoad={() => handleImageLoad(idx)}
                  onError={() => handleImageError(idx)}
                />
                {images.length > 4 && idx === 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-lg">
                    +{images.length - 4}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div className=" gap-2">
            {videos.slice(0, 2).map((video, idx) => (
              <button
                key={idx}
                onClick={() => window.open(video.url, '_blank')}
                className="relative h-96 w-full aspect-square rounded-3xl  overflow-hidden  group"
              >
                <video
                  src={video.url}
                  className="w-full h-96 object-cover opacity-90"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                  <Play className="w-16 h-16 text-white fill-white" />
                </div>
                <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                  Video
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Links */}
        {links.length > 0 && (
          <div className="space-y-2">
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-[#F8F9FA] rounded-xl hover:bg-[#f1f3f4] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {link.preview?.image ? (
                    <div className="flex-shrink-0 w-12 h-12 bg-[#e8f0fe] rounded-lg overflow-hidden">
                      <img
                        src={link.preview.image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-12 h-12 bg-[#e8f0fe] rounded-lg flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-[#1a73e8]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202124] truncate group-hover:text-[#1a73e8] transition-colors">
                      {link.preview?.title || link.url}
                    </p>
                    {link.preview?.description && (
                      <p className="text-xs text-[#5f6368] line-clamp-1 mt-0.5">
                        {link.preview.description}
                      </p>
                    )}
                    <p className="text-xs text-[#34A853] mt-1 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {link.preview?.siteName || new URL(link.url).hostname}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <ChevronDown className="w-6 h-6 -rotate-90" />
              </button>
            </>
          )}

          <div className="max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[selectedIndex]?.url}
              alt=""
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <p className="text-white text-center mt-4 text-sm opacity-70">
              {images[selectedIndex]?.name}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// User Profile Modal Component (keep existing code)
function UserProfileModal({
  isOpen,
  onClose,
  user,
  onSendRequest,
  onCancelRequest,
  friendshipStatus,
  currentUserId,
}) {
  if (!isOpen || !user) return null;

  const getActionButton = () => {
    if (user.userId === currentUserId) {
      return (
        <button className="w-full px-4 py-3 bg-gray-100 text-[#5f6368] rounded-xl font-medium cursor-default">
          This is you
        </button>
      );
    }

    switch (friendshipStatus) {
      case "friends":
        return (
          <button className="w-full px-4 py-3 bg-green-100 text-green-600 rounded-xl font-medium flex items-center justify-center gap-2 cursor-default">
            <Check size={18} />
            Friends
          </button>
        );
      case "pending_sent":
        return (
          <button
            onClick={() => onCancelRequest(user.userId)}
            className="w-full px-4 py-3 bg-yellow-100 text-yellow-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-yellow-200 transition-all"
          >
            <Clock size={18} />
            Cancel Request
          </button>
        );
      case "pending_received":
        return (
          <button
            onClick={() => onSendRequest(user.userId)}
            className="w-full px-4 py-3 bg-blue-100 text-blue-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-200 transition-all"
          >
            <Check size={18} />
            Accept Request
          </button>
        );
      default:
        return (
          <button
            onClick={() => onSendRequest(user.userId)}
            className="w-full px-4 py-3 bg-[#34A853] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#2D9249] transition-all"
          >
            <UserPlus size={18} />
            Add Friend
          </button>
        );
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="text-center mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-[#e8f0fe]">
              {user.avatar ? (
                <BeanHead
                  {...(typeof user.avatar === "string"
                    ? JSON.parse(user.avatar).beanConfig
                    : user.avatar.beanConfig)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white text-2xl font-semibold">
                  {user.userName?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            <h2 className="text-2xl font-semibold text-[#202124]">
              {user.userName}
            </h2>
            <p className="text-[#5f6368] mb-2">@{user.username}</p>

            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-xl font-semibold text-[#202124]">
                  {user.totalReflections || 0}
                </p>
                <p className="text-xs text-[#5f6368]">Reflections</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-[#202124]">
                  {user.daysOnPlatform || 0}
                </p>
                <p className="text-xs text-[#5f6368]">Days Active</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {getActionButton()}
        </div>
      </div>
    </>
  );
}

// Friend Requests Modal Component (keep existing code)
function FriendRequestsModal({
  isOpen,
  onClose,
  requests,
  onAccept,
  onReject,
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-[#f1f3f4]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#202124]">
                Friend Requests
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Requests List */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-[#5f6368]">No pending friend requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {request.avatar ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#e8f0fe]">
                          <BeanHead
                            {...(typeof request.avatar === "string"
                              ? JSON.parse(request.avatar).beanConfig
                              : request.avatar.beanConfig)}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white font-semibold">
                          {request.userName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#202124]">
                          {request.userName}
                        </p>
                        <p className="text-xs text-[#5f6368]">
                          @{request.username}
                        </p>
                        <p className="text-xs text-[#5f6368] mt-1">
                          <Clock size={12} className="inline mr-1" />
                          {new Date(request.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onAccept(request._id)}
                        className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-all"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => onReject(request._id)}
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Comments Modal Component (keep existing code but add attachment support)
function CommentsModal({
  isOpen,
  onClose,
  post: initialPost,
  currentUserAvatar,
  currentUserName,
  userId,
  onLike,
  commentText,
  setCommentText,
  submittingComment,
  formatTimeAgo,
  renderAvatar,
  onUserClick,
}) {
  const commentInputRef = useRef(null);
  const [post, setPost] = useState(initialPost);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState({});
  const [likingComment, setLikingComment] = useState(false);
  const [submittingCommentLocal, setSubmittingCommentLocal] = useState(false);

  // Update post state when prop changes
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  if (!isOpen || !post) return null;

  const handleCommentLike = async (commentIndex, replyIndex = null) => {
    if (likingComment) return;

    try {
      setLikingComment(true);
      const response = await fetch("/api/feed/comment/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          commentIndex,
          replyIndex,
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setPost((prevPost) => {
          const newPost = { ...prevPost };
          const comments = [...newPost.comments];

          if (replyIndex !== null) {
            // Update reply like
            const comment = { ...comments[commentIndex] };
            const replies = [...comment.replies];
            const reply = { ...replies[replyIndex] };

            if (data.liked) {
              reply.likes = [...(reply.likes || []), userId];
              reply.likeCount = (reply.likeCount || 0) + 1;
            } else {
              reply.likes = (reply.likes || []).filter((id) => id !== userId);
              reply.likeCount = Math.max((reply.likeCount || 0) - 1, 0);
            }

            replies[replyIndex] = reply;
            comment.replies = replies;
            comments[commentIndex] = comment;
          } else {
            // Update comment like
            const comment = { ...comments[commentIndex] };

            if (data.liked) {
              comment.likes = [...(comment.likes || []), userId];
              comment.likeCount = (comment.likeCount || 0) + 1;
            } else {
              comment.likes = (comment.likes || []).filter(
                (id) => id !== userId,
              );
              comment.likeCount = Math.max((comment.likeCount || 0) - 1, 0);
            }

            comments[commentIndex] = comment;
          }

          newPost.comments = comments;
          return newPost;
        });
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    } finally {
      setLikingComment(false);
    }
  };

  const handleReply = async (
    commentIndex,
    replyToReplyIndex = null,
    replyToUserName = null,
  ) => {
    if (!replyText.trim() || submittingReply) return;

    try {
      setSubmittingReply(true);
      const response = await fetch("/api/feed/comment/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          commentIndex,
          userId,
          userName: currentUserName,
          avatar: currentUserAvatar,
          reply: replyText,
          replyToUserName: replyToUserName,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setPost((prevPost) => {
          const newPost = { ...prevPost };
          const comments = [...newPost.comments];
          const comment = { ...comments[commentIndex] };

          comment.replies = [...(comment.replies || []), data.reply];
          comments[commentIndex] = comment;
          newPost.comments = comments;

          // Update comment count
          newPost.commentCount = (newPost.commentCount || 0) + 1;

          return newPost;
        });

        setReplyText("");
        setReplyingTo(null);

        // Auto-expand replies
        setShowReplies((prev) => ({
          ...prev,
          [commentIndex]: true,
        }));
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleMainComment = async () => {
    if (!commentText.trim() || submittingCommentLocal) return;

    try {
      setSubmittingCommentLocal(true);
      const response = await fetch("/api/feed/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          userId,
          userName: currentUserName,
          avatar: currentUserAvatar,
          comment: commentText,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setPost((prevPost) => {
          const newPost = { ...prevPost };
          newPost.comments = [...(newPost.comments || []), data.comment];
          newPost.commentCount = (newPost.commentCount || 0) + 1;
          return newPost;
        });

        setCommentText("");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmittingCommentLocal(false);
    }
  };

  const toggleReplies = (commentIndex) => {
    setShowReplies((prev) => ({
      ...prev,
      [commentIndex]: !prev[commentIndex],
    }));
  };

  const startReplyTo = (commentIndex, replyIndex = null, userName = null) => {
    setReplyingTo({ commentIndex, replyIndex, userName });
    setReplyText("");
  };

  // Calculate total comments including replies for display
  const getTotalCommentsCount = () => {
    if (!post.comments) return 0;
    
    let count = post.comments.length;
    post.comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        count += comment.replies.length;
      }
    });
    return count;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-[#EEF1F0] rounded-[40px] max-w-6xl w-full h-[85vh] overflow-hidden flex"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Section - Post Content */}
          <div className="w-1/2 border-r border-[#d7d7d7] overflow-y-auto">
            {/* Post Header */}
            <div className="p-6 pb-4 border-b border-[#f1f3f4]">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    onUserClick({
                      userId: post.userId,
                      userName: post.userName,
                      userUsername: post.userUsername,
                      userAvatar: post.userAvatar,
                      totalReflections: post.userTotalReflections || 0,
                      daysOnPlatform: post.userDaysOnPlatform || 1,
                    })
                  }
                  className="flex items-center gap-3 hover:opacity-80 transition-all text-left"
                >
                  {renderAvatar(post.userAvatar, post.userName)}
                  <div>
                    <h3 className="font-semibold text-[#202124]">
                      {post.userName}
                      {post.userUsername && (
                        <span className="text-sm text-[#5f6368] font-normal ml-2">
                          @{post.userUsername}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#5f6368]">
                      {formatTimeAgo(post.timestamp)}
                    </p>
                  </div>
                </button>
              </div>

              {/* Task Badge */}
              <span className="inline-flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                <Sparkles size={12} />
                Today's Challenge
              </span>
            </div>

            {/* Reflection Content */}
            <div className="p-6">
              <p className="text-[#202124] text-base leading-relaxed mb-4">
                {post.reflection}
              </p>

              {/* Attachments */}
              {post.attachments && post.attachments.length > 0 && (
                <AttachmentGallery attachments={post.attachments} />
              )}

              {/* Good Deed Quote */}
              <div className="p-4 bg-[#F8F9FA] rounded-2xl mt-4">
                <p className="text-sm text-[#5f6368]">"{post.goodDeed}"</p>
              </div>
            </div>

            {/* Like Button */}
            <div className="px-6 pb-6">
              <button
                onClick={() => onLike(post._id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  post.likes?.includes(userId)
                    ? "bg-red-50 text-red-500"
                    : "bg-gray-100 text-[#5f6368] hover:bg-red-50 hover:text-red-500"
                }`}
              >
                <Heart
                  size={20}
                  fill={post.likes?.includes(userId) ? "currentColor" : "none"}
                />
                <span className="text-sm font-medium">
                  {post.likeCount || 0}{" "}
                  {post.likeCount === 1 ? "like" : "likes"}
                </span>
              </button>
            </div>
          </div>

          {/* Right Section - Comments (keep existing comments code) */}
          <div className="w-1/2 flex flex-col h-full">
            {/* Comments Header */}
            <div className="p-6 border-b flex border-[#f1f3f4] justify-between items-center">
              <h3 className="text-xl font-semibold text-[#000000] flex items-center gap-2">
                Comments ({getTotalCommentsCount()})
              </h3>
              <button
                onClick={onClose}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Comments List - Scrollable (keep existing comments list code) */}
            <div className="flex-1 overflow-y-auto px-2">
              {post.comments && post.comments.length > 0 ? (
                <div className="space-y-1">
                  {post.comments.map((comment, index) => (
                    <div key={index} className="py-3">
                      {/* Main Comment */}
                      <div className="flex gap-3 px-3">
                        <button
                          onClick={() =>
                            onUserClick({
                              userId: comment.userId,
                              userName: comment.userName,
                              userUsername: comment.userUsername,
                              userAvatar: comment.userAvatar,
                            })
                          }
                          className="hover:opacity-80 transition-all flex-shrink-0 self-start"
                        >
                          {renderAvatar(
                            comment.userAvatar,
                            comment.userName,
                            "w-8 h-8",
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="mb-1">
                            <button
                              onClick={() =>
                                onUserClick({
                                  userId: comment.userId,
                                  userName: comment.userName,
                                  userUsername: comment.userUsername,
                                  userAvatar: comment.userAvatar,
                                })
                              }
                              className="font-semibold text-sm tracking-wide text-[#000000] hover:underline inline"
                            >
                              {comment.userName}
                            </button>
                            <span className="text-xs text-[#5f6368] ml-2 inline">
                              {formatTimeAgo(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-[#202124] mb-2 break-words">
                            {comment.text}
                          </p>

                          {/* Comment Actions */}
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleCommentLike(index)}
                              className={`flex items-center gap-1 text-xs transition-all ${
                                comment.likes?.includes(userId)
                                  ? "text-red-500 font-medium"
                                  : "text-[#5f6368] hover:text-red-500"
                              }`}
                              disabled={likingComment}
                            >
                              <Heart
                                size={14}
                                fill={
                                  comment.likes?.includes(userId)
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                              {comment.likeCount > 0 && (
                                <span>{comment.likeCount}</span>
                              )}
                            </button>

                            <button
                              onClick={() =>
                                startReplyTo(index, null, comment.userName)
                              }
                              className="text-xs text-[#5f6368] hover:text-[#1a73e8] font-medium transition-all"
                            >
                              Reply
                            </button>

                            {comment.replies && comment.replies.length > 0 && (
                              <button
                                onClick={() => toggleReplies(index)}
                                className="flex items-center gap-1 text-xs text-[#1a73e8] hover:text-[#0d47a1] font-medium transition-all"
                              >
                                {showReplies[index] ? (
                                  <>
                                    <ChevronUp size={14} />
                                    Hide replies
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown size={14} />
                                    View {comment.replies.length}{" "}
                                    {comment.replies.length === 1
                                      ? "reply"
                                      : "replies"}
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Reply Input for Main Comment */}
                          {replyingTo?.commentIndex === index &&
                            replyingTo?.replyIndex === null && (
                              <div className="mt-3 flex items-start gap-2">
                                {renderAvatar(
                                  currentUserAvatar,
                                  currentUserName,
                                  "w-6 h-6",
                                )}
                                <div className="flex-1">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={replyText}
                                      onChange={(e) =>
                                        setReplyText(e.target.value)
                                      }
                                      onKeyPress={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          handleReply(
                                            index,
                                            null,
                                            replyingTo.userName,
                                          );
                                        }
                                      }}
                                      placeholder={`Reply to ${replyingTo.userName}...`}
                                      className="w-full px-3 py-2 pr-10 border border-[#dadce0] rounded-full focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-xs"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() =>
                                        handleReply(
                                          index,
                                          null,
                                          replyingTo.userName,
                                        )
                                      }
                                      disabled={
                                        !replyText?.trim() || submittingReply
                                      }
                                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#1a73e8] hover:text-[#0d47a1] disabled:text-[#dadce0] disabled:cursor-not-allowed transition-all"
                                    >
                                      <Send size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                          {/* Replies Section */}
                          {showReplies[index] &&
                            comment.replies &&
                            comment.replies.length > 0 && (
                              <div className="mt-3 ml-6 space-y-3">
                                {comment.replies.map((reply, replyIndex) => (
                                  <div key={replyIndex}>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          onUserClick({
                                            userId: reply.userId,
                                            userName: reply.userName,
                                            userUsername: reply.userUsername,
                                            userAvatar: reply.userAvatar,
                                          })
                                        }
                                        className="hover:opacity-80 transition-all flex-shrink-0 self-start"
                                      >
                                        {renderAvatar(
                                          reply.userAvatar,
                                          reply.userName,
                                          "w-6 h-6",
                                        )}
                                      </button>

                                      <div className="flex-1 min-w-0">
                                        <div className="mb-1">
                                          <button
                                            onClick={() =>
                                              onUserClick({
                                                userId: reply.userId,
                                                userName: reply.userName,
                                                userUsername:
                                                  reply.userUsername,
                                                userAvatar: reply.userAvatar,
                                              })
                                            }
                                            className="font-semibold text-sm text-[#000000] hover:underline inline"
                                          >
                                            {reply.userName}
                                          </button>
                                          <span className="text-xs text-[#5f6368] ml-2 inline">
                                            {formatTimeAgo(reply.timestamp)}
                                          </span>
                                        </div>
                                        <p className="text-sm text-[#202124] mb-1 break-words">
                                          {reply.replyToUserName && (
                                            <span className="text-[#1a73e8] font-medium">
                                              @{reply.replyToUserName}{" "}
                                            </span>
                                          )}
                                          {reply.text}
                                        </p>

                                        {/* Reply Actions */}
                                        <div className="flex items-center gap-3 mt-1">
                                          <button
                                            onClick={() =>
                                              handleCommentLike(
                                                index,
                                                replyIndex,
                                              )
                                            }
                                            className={`flex items-center gap-1 text-xs transition-all ${
                                              reply.likes?.includes(userId)
                                                ? "text-red-500 font-medium"
                                                : "text-[#5f6368] hover:text-red-500"
                                            }`}
                                            disabled={likingComment}
                                          >
                                            <Heart
                                              size={12}
                                              fill={
                                                reply.likes?.includes(userId)
                                                  ? "currentColor"
                                                  : "none"
                                              }
                                            />
                                            {reply.likeCount > 0 && (
                                              <span>{reply.likeCount}</span>
                                            )}
                                          </button>

                                          <button
                                            onClick={() =>
                                              startReplyTo(
                                                index,
                                                replyIndex,
                                                reply.userName,
                                              )
                                            }
                                            className="text-xs text-[#5f6368] hover:text-[#1a73e8] font-medium transition-all"
                                          >
                                            Reply
                                          </button>
                                        </div>

                                        {/* Reply Input for Reply */}
                                        {replyingTo?.commentIndex === index &&
                                          replyingTo?.replyIndex ===
                                            replyIndex && (
                                            <div className="mt-2 flex items-start gap-2">
                                              {renderAvatar(
                                                currentUserAvatar,
                                                currentUserName,
                                                "w-5 h-5",
                                              )}
                                              <div className="flex-1">
                                                <div className="relative">
                                                  <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={(e) =>
                                                      setReplyText(
                                                        e.target.value,
                                                      )
                                                    }
                                                    onKeyPress={(e) => {
                                                      if (
                                                        e.key === "Enter" &&
                                                        !e.shiftKey
                                                      ) {
                                                        e.preventDefault();
                                                        handleReply(
                                                          index,
                                                          replyIndex,
                                                          replyingTo.userName,
                                                        );
                                                      }
                                                    }}
                                                    placeholder={`Reply to ${replyingTo.userName}...`}
                                                    className="w-full px-3 py-1.5 pr-10 border border-[#dadce0] rounded-full focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-xs"
                                                    autoFocus
                                                  />
                                                  <button
                                                    onClick={() =>
                                                      handleReply(
                                                        index,
                                                        replyIndex,
                                                        replyingTo.userName,
                                                      )
                                                    }
                                                    disabled={
                                                      !replyText?.trim() ||
                                                      submittingReply
                                                    }
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#1a73e8] hover:text-[#0d47a1] disabled:text-[#dadce0] disabled:cursor-not-allowed transition-all"
                                                  >
                                                    <Send size={12} />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          )}
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
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-8 h-8 text-[#5f6368]" />
                    </div>
                    <p className="text-sm text-[#5f6368]">
                      No comments yet. Be the first to comment!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Add Comment Input - Fixed at bottom */}
            <div className="p-6 border-t border-[#f1f3f4] flex-shrink-0">
              <div className="flex items-center gap-3">
                {renderAvatar(currentUserAvatar, currentUserName, "w-10 h-10")}

                <div className="flex-1 relative">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleMainComment();
                      }
                    }}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 pr-12 border border-[#dadce0] rounded-full focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-sm"
                  />
                  <button
                    onClick={handleMainComment}
                    disabled={!commentText?.trim() || submittingCommentLocal}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#1a73e8] hover:text-[#0d47a1] disabled:text-[#dadce0] disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const {
    userName,
    feedPosts,
    loadingFeed,
    likePost,
    addComment,
    fetchFeedPosts,
    avatar,
    userId,
  } = useUser();

  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [unreadRequests, setUnreadRequests] = useState(0);

  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    if (userId) {
      fetchFeedPosts();
      fetchFriendRequests();
    }
  }, [userId]);

  // Sync selected post with feed updates for real-time comments
  useEffect(() => {
    if (selectedPost && feedPosts.length > 0) {
      const updatedPost = feedPosts.find((p) => p._id === selectedPost._id);
      if (updatedPost) {
        // Only update if there are actual changes to avoid infinite loops
        if (JSON.stringify(updatedPost) !== JSON.stringify(selectedPost)) {
          setSelectedPost(updatedPost);
        }
      }
    }
  }, [feedPosts]);

  const fetchFriendRequests = async () => {
    try {
      const res = await fetch(`/api/friends/requests?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setFriendRequests(data.requests || []);
        setUnreadRequests(data.requests?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  const viewUserProfile = async (postUser) => {
    const username = postUser.userUsername || "username";

    const user = {
      userId: postUser.userId,
      userName: postUser.userName,
      username: username,
      avatar: postUser.userAvatar,
      totalReflections: postUser.totalReflections || 0,
      daysOnPlatform: postUser.daysOnPlatform || 1,
    };

    setSelectedUser(user);

    try {
      const res = await fetch(
        `/api/friends/status?userId=${userId}&targetUserId=${user.userId}`,
      );
      const data = await res.json();
      if (data.success) {
        setFriendshipStatus(data.status);
      }
    } catch (error) {
      console.error("Error checking friendship status:", error);
    }

    setShowUserModal(true);
  };

  const openCommentsModal = (post) => {
    setSelectedPost(post);
    setCommentText("");
    setShowCommentsModal(true);
  };

  const sendFriendRequest = async (targetUserId) => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendshipStatus("pending_sent");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const cancelFriendRequest = async (targetUserId) => {
    try {
      const res = await fetch("/api/friends/request/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendshipStatus(null);
      }
    } catch (error) {
      console.error("Error cancelling friend request:", error);
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const res = await fetch("/api/friends/request/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, requestId }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));
        setUnreadRequests((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      const res = await fetch("/api/friends/request/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, requestId }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));
        setUnreadRequests((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const handleLike = async (postId) => {
    await likePost(postId);
  };

  const handleComment = async () => {
    if (!commentText?.trim() || !selectedPost) return;

    setSubmittingComment(true);

    // Store the comment text before clearing
    const currentComment = commentText;

    // Clear input immediately for better UX
    setCommentText("");

    // Create the new comment object with current user data
    const newComment = {
      userId: userId,
      userName: userName,
      userAvatar: avatar,
      userUsername: "", // Add if available in your context
      text: currentComment,
      timestamp: new Date().toISOString(),
      likes: [],
      likeCount: 0,
      replies: []
    };

    // Optimistically update the UI
    const optimisticPost = {
      ...selectedPost,
      comments: [...(selectedPost.comments || []), newComment],
      commentCount: (selectedPost.commentCount || 0) + 1,
    };

    setSelectedPost(optimisticPost);

    // Make the API call
    const success = await addComment(selectedPost._id, currentComment);

    if (success) {
      // Refresh the feed data in background
      fetchFeedPosts();
    } else {
      // If failed, revert the optimistic update
      setSelectedPost(selectedPost);
      // Restore the comment text
      setCommentText(currentComment);
    }

    setSubmittingComment(false);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "recently";

    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return postDate.toLocaleDateString();
  };

  const renderAvatar = (userAvatar, name, size = "w-10 h-10") => {
    if (!userAvatar) {
      return (
        <div
          className={`${size} rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white font-semibold`}
        >
          {name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      );
    }

    try {
      const parsedAvatar =
        typeof userAvatar === "string" ? JSON.parse(userAvatar) : userAvatar;

      if (parsedAvatar && parsedAvatar.beanConfig) {
        return (
          <div
            className={`${size} rounded-full overflow-hidden bg-[#e8f0fe] flex items-center justify-center`}
          >
            <BeanHead {...parsedAvatar.beanConfig} />
          </div>
        );
      }
    } catch (e) {
      console.error("Failed to parse avatar:", e);
    }

    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white font-semibold`}
      >
        {name?.charAt(0)?.toUpperCase() || "U"}
      </div>
    );
  };

  // Calculate total comments including replies for each post
  const getTotalCommentsCount = (post) => {
    if (!post.comments) return post.commentCount || 0;
    
    let count = post.comments.length;
    post.comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        count += comment.replies.length;
      }
    });
    return count;
  };

  return (
    <main className="flex-1 p-8 bg-[#EEF1F0] overflow-y-auto">
      <div className="max-w-7xl">
        {/* Header with Friends and Requests Buttons */}
        <header className="space-y-3 lg:ml-4 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-sm font-medium text-[#5f6368]">
            <Calendar className="w-4 h-4 text-[#34A853]" />
            <span>{today}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl text-[#000000]">
                Community <span className="font-semibold">Feed</span>
              </h1>
              <p className="text-base text-[#5f6368] font-normal">
                See what others are sharing and spread kindness
              </p>
            </div>

            <div className="flex gap-3">
              {/* Friends Button - Navigates to Friends Page */}
              <button
                onClick={() => router.push("/friends")}
                className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border-[#dadce0] hover:bg-gray-50 transition-all flex-1 lg:flex-none justify-center"
              >
                <Users size={20} className="text-green-600" />
                <span className="font-medium text-[#202124]">Friends</span>
              </button>

              {/* Requests Button - Opens Modal */}
              <button
                onClick={() => setShowRequestsModal(true)}
                className="relative flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border-[#dadce0] hover:bg-gray-50 transition-all flex-1 lg:flex-none justify-center"
              >
                <Bell size={20} className="text-green-600" />
                <span className="font-medium text-[#202124]">Requests</span>
                {unreadRequests > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadRequests}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Feed Posts */}
        {loadingFeed ? (
          <div className="space-y-4 max-w-4xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="bg-white rounded-3xl max-w-4xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-[#202124] mb-2">
              No reflections yet
            </h3>
            <p className="text-[#5f6368] mb-6">
              Be the first to share your kindness journey!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#34A853] text-white rounded-full font-medium hover:bg-[#2D9249] transition-all"
            >
              Complete Today's Challenge
            </Link>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl">
            {feedPosts.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-3xl overflow-hidden border-[#dadce0] transition-all"
              >
                {/* Post Header - Make avatar and name clickable */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() =>
                        viewUserProfile({
                          userId: post.userId,
                          userName: post.userName,
                          userUsername: post.userUsername,
                          userAvatar: post.userAvatar,
                          totalReflections: post.userTotalReflections || 0,
                          daysOnPlatform: post.userDaysOnPlatform || 1,
                        })
                      }
                      className="flex items-center gap-3 hover:opacity-80 transition-all text-left"
                    >
                      {renderAvatar(post.userAvatar, post.userName)}
                      <div>
                        <h3 className="font-semibold text-[#202124]">
                          {post.userName}
                          {post.userUsername && (
                            <span className="text-sm text-[#5f6368] font-normal ml-2">
                              @{post.userUsername}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-[#5f6368]">
                          {formatTimeAgo(post.timestamp)}
                        </p>
                      </div>
                    </button>
                    <button className="text-[#5f6368] hover:text-[#202124] p-2">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>

                {/* Task Badge */}
                <div className="px-6 mb-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#e8f0fe] text-[#1a73e8] rounded-full text-xs font-medium">
                    <Sparkles size={12} />
                    Today's Challenge
                  </span>
                </div>

                {/* Reflection Content */}
                <div className="px-6 pb-4">
                  <p className="text-[#202124] text-base leading-relaxed">
                    {post.reflection}
                  </p>
                </div>

                {/* Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <div className="px-6 pb-4">
                    <AttachmentGallery attachments={post.attachments} />
                  </div>
                )}

                {/* Good Deed Quote */}
                <div className="mx-6 mb-4 p-4 bg-[#F8F9FA] rounded-2xl">
                  <p className="text-sm text-[#5f6368]">"{post.goodDeed}"</p>
                </div>

                {/* Engagement Stats */}
                <div className="px-6 py-3 border-t border-[#f1f3f4] flex items-center gap-6">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-2 transition-all ${
                      post.likes?.includes(userId)
                        ? "text-red-500"
                        : "text-[#5f6368] hover:text-red-500"
                    }`}
                  >
                    <Heart
                      size={20}
                      fill={
                        post.likes?.includes(userId) ? "currentColor" : "none"
                      }
                    />
                    <span className="text-sm font-medium">
                      {post.likeCount || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => openCommentsModal(post)}
                    className="flex items-center gap-2 text-[#5f6368] hover:text-[#1a73e8] transition-all"
                  >
                    <MessageCircle size={20} />
                    <span className="text-sm font-medium">
                      {getTotalCommentsCount(post)}
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Friend Requests Modal */}
      <FriendRequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        requests={friendRequests}
        onAccept={acceptFriendRequest}
        onReject={rejectFriendRequest}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={selectedUser}
        onSendRequest={sendFriendRequest}
        onCancelRequest={cancelFriendRequest}
        friendshipStatus={friendshipStatus}
        currentUserId={userId}
      />

      {/* Comments Modal */}
      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        post={selectedPost}
        currentUserAvatar={avatar}
        currentUserName={userName}
        userId={userId}
        onLike={handleLike}
        onComment={handleComment}
        commentText={commentText}
        setCommentText={setCommentText}
        submittingComment={submittingComment}
        formatTimeAgo={formatTimeAgo}
        renderAvatar={renderAvatar}
        onUserClick={viewUserProfile}
      />
    </main>
  );
}