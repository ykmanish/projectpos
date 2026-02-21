// components/AIActionLogModal.js
"use client";

import { X, Clock, AlertTriangle, Check, XCircle, User, Trash2, MicOff, Ban, UserMinus, Shield, Sparkles } from "lucide-react";
import { useState } from "react";

export default function AIActionLogModal({
  isOpen,
  onClose,
  actionLog,
  getMemberName,
}) {
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

  const getActionIcon = (action) => {
    switch (action) {
      case 'warn':
        return <AlertTriangle size={14} className="text-amber-500" />;
      case 'mute':
        return <MicOff size={14} className="text-orange-500" />;
      case 'kick':
        return <UserMinus size={14} className="text-red-500" />;
      case 'ban':
        return <Ban size={14} className="text-red-600" />;
      case 'delete':
        return <Trash2 size={14} className="text-purple-500" />;
      case 'permissions_granted':
        return <Shield size={14} className="text-green-500" />;
      case 'command_processed':
        return <Sparkles size={14} className="text-blue-500" />;
      case 'action_approved':
        return <Check size={14} className="text-green-500" />;
      case 'action_rejected':
        return <XCircle size={14} className="text-red-500" />;
      default:
        return <Clock size={14} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'error':
        return 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  const filteredLogs = filter === 'all' 
    ? actionLog 
    : actionLog.filter(log => log.status === filter);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#f1f3f4] dark:border-[#232529] flex items-center justify-between sticky top-0 bg-white dark:bg-[#0c0c0c] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Shield size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#202124] dark:text-white">
                AI Action Logs
              </h2>
              <p className="text-sm text-[#5f6368] dark:text-gray-400">
                History of AI assistant actions
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

        {/* Filter */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filter === 'all'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'bg-gray-100 dark:bg-[#101010] text-[#5f6368] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a1a1a]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filter === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-[#101010] text-[#5f6368] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a1a1a]'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filter === 'failed'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-[#101010] text-[#5f6368] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a1a1a]'
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#101010] flex items-center justify-center mx-auto mb-4">
                <Clock size={24} className="text-[#5f6368] dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-[#202124] dark:text-white mb-2">
                No Logs Found
              </h3>
              <p className="text-sm text-[#5f6368] dark:text-gray-400">
                {filter === 'all' 
                  ? "No AI actions have been logged yet"
                  : `No ${filter} actions found`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border border-[#dadce0] dark:border-[#232529] rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#101010] flex items-center justify-center">
                        {getActionIcon(log.action)}
                      </div>
                      <span className="text-sm font-medium text-[#202124] dark:text-white capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>

                  <div className="ml-8 space-y-1">
                    {log.details && (
                      <div className="text-xs text-[#5f6368] dark:text-gray-400">
                        {Object.entries(log.details).map(([key, value]) => {
                          if (key === 'targetUserId' || key === 'targetUserName') {
                            return null;
                          }
                          return (
                            <div key={key} className="flex gap-1">
                              <span className="font-medium">{key}:</span>
                              <span className="text-[#202124] dark:text-white">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="text-xs text-[#5f6368] dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#f1f3f4] dark:border-[#232529] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#dadce0] dark:border-[#232529] rounded-xl text-[#202124] dark:text-white hover:bg-gray-100 dark:hover:bg-[#101010] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}