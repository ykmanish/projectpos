// components/AIPermissionModal.js
"use client";

import { useState } from "react";
import {
  X,
  Shield,
  AlertTriangle,
  UserMinus,
  MicOff,
  Ban,
  Trash2,
  Info,
  Clock,
  Check,
  Sparkles,
  Gavel,
  ShieldAlert,
} from "lucide-react";

export default function AIPermissionModal({
  isOpen,
  onClose,
  onGrant,
  currentPermissions,
  groupId,
  currentUserId,
}) {
  const [permissions, setPermissions] = useState({
    canModerate: currentPermissions?.canModerate || false,
    canManageUsers: currentPermissions?.canManageUsers || false,
    canCreateContent: currentPermissions?.canCreateContent || false,
    canAccessInfo: currentPermissions?.canAccessInfo || true,
    canWarn: currentPermissions?.canWarn || false,
    canMute: currentPermissions?.canMute || false,
    canKick: currentPermissions?.canKick || false,
    canBan: currentPermissions?.canBan || false,
    canDeleteMessages: currentPermissions?.canDeleteMessages || false,
  });

  const [duration, setDuration] = useState("");
  const [durationType, setDurationType] = useState("minutes");
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleGrantAll = () => {
    setPermissions({
      canModerate: true,
      canManageUsers: true,
      canCreateContent: true,
      canAccessInfo: true,
      canWarn: true,
      canMute: true,
      canKick: true,
      canBan: true,
      canDeleteMessages: true,
    });
  };

  const handleRevokeAll = () => {
    setPermissions({
      canModerate: false,
      canManageUsers: false,
      canCreateContent: false,
      canAccessInfo: true, // Keep info access by default
      canWarn: false,
      canMute: false,
      canKick: false,
      canBan: false,
      canDeleteMessages: false,
    });
  };

  const handleSubmit = () => {
    let durationMs = null;
    if (duration && !isNaN(parseInt(duration))) {
      const value = parseInt(duration);
      switch (durationType) {
        case "minutes":
          durationMs = value * 60 * 1000;
          break;
        case "hours":
          durationMs = value * 60 * 60 * 1000;
          break;
        case "days":
          durationMs = value * 24 * 60 * 60 * 1000;
          break;
      }
    }

    onGrant(permissions, durationMs);
    onClose();
  };

  const permissionGroups = [
    {
      title: "Moderation Actions",
      icon: Gavel,
      permissions: [
        { key: "canWarn", label: "Warn Users", icon: AlertTriangle },
        { key: "canMute", label: "Mute Users", icon: MicOff },
        { key: "canKick", label: "Kick Users", icon: UserMinus },
        { key: "canBan", label: "Ban Users", icon: Ban },
        { key: "canDeleteMessages", label: "Delete Messages", icon: Trash2 },
      ],
    },
    {
      title: "General Permissions",
      icon: Shield,
      permissions: [
        { key: "canModerate", label: "Full Moderation", icon: ShieldAlert },
        { key: "canManageUsers", label: "Manage Users", icon: UserMinus },
        { key: "canCreateContent", label: "Create Content", icon: Sparkles },
        { key: "canAccessInfo", label: "Access Group Info", icon: Info },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#f1f3f4] dark:border-[#232529] flex items-center justify-between sticky top-0 bg-white dark:bg-[#0c0c0c] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#202124] dark:text-white">
                AI Assistant Permissions
              </h2>
              <p className="text-sm text-[#5f6368] dark:text-gray-400">
                Grant permissions to Krixa AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
          >
            <X size={20} className="text-[#5f6368] dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleGrantAll}
              className="flex-1 py-2 px-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium"
            >
              Grant All
            </button>
            <button
              onClick={handleRevokeAll}
              className="flex-1 py-2 px-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
            >
              Revoke All
            </button>
          </div>

          {/* Permission Groups */}
          {permissionGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <div className="flex items-center gap-2">
                <group.icon size={18} className="text-[#5f6368] dark:text-gray-400" />
                <h3 className="text-sm font-medium text-[#202124] dark:text-white">
                  {group.title}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.permissions.map((perm) => (
                  <button
                    key={perm.key}
                    onClick={() => handleToggle(perm.key)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      permissions[perm.key]
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-[#dadce0] dark:border-[#232529] hover:bg-gray-50 dark:hover:bg-[#101010]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        permissions[perm.key]
                          ? "bg-purple-100 dark:bg-purple-900/30"
                          : "bg-gray-100 dark:bg-[#101010]"
                      }`}>
                        <perm.icon size={16} className={
                          permissions[perm.key]
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-[#5f6368] dark:text-gray-400"
                        } />
                      </div>
                      <span className={`text-sm ${
                        permissions[perm.key]
                          ? "text-purple-700 dark:text-purple-300 font-medium"
                          : "text-[#202124] dark:text-white"
                      }`}>
                        {perm.label}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      permissions[perm.key]
                        ? "border-purple-500 bg-purple-500"
                        : "border-[#dadce0] dark:border-[#232529]"
                    }`}>
                      {permissions[perm.key] && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Duration Picker */}
          <div className="space-y-3">
            <button
              onClick={() => setShowDurationPicker(!showDurationPicker)}
              className="flex items-center gap-2 text-sm text-[#5f6368] dark:text-gray-400 hover:text-[#202124] dark:hover:text-white transition-colors"
            >
              <Clock size={16} />
              <span>Temporary Permissions</span>
            </button>

            {showDurationPicker && (
              <div className="p-4 bg-gray-50 dark:bg-[#101010] rounded-xl space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Duration"
                    min="1"
                    className="flex-1 px-3 py-2 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#0c0c0c] rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                  />
                  <select
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    className="px-3 py-2 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#0c0c0c] rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
                <p className="text-xs text-[#5f6368] dark:text-gray-400">
                  Permissions will automatically expire after this time
                </p>
              </div>
            )}
          </div>

          {/* Warning for sensitive permissions */}
          {(permissions.canBan || permissions.canKick || permissions.canDeleteMessages) && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Sensitive Permissions Granted
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  These permissions allow Krixa AI to perform actions that cannot be undone. 
                  Consider setting a temporary duration for these permissions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#f1f3f4] dark:border-[#232529] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#dadce0] dark:border-[#232529] rounded-xl text-[#202124] dark:text-white hover:bg-gray-100 dark:hover:bg-[#101010] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Grant Permissions
          </button>
        </div>
      </div>
    </div>
  );
}