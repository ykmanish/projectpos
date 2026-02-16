"use client";

import { X, Check, Clock, UserPlus } from "lucide-react";
import { BeanHead } from "beanheads";

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
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
            onClick={() => onAcceptRequest(user.userId)}
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
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
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

          {getActionButton()}
        </div>
      </div>
    </>
  );
}