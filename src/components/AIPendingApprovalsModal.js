// components/AIPendingApprovalsModal.js
"use client";

import { X, Clock, AlertTriangle, Check, XCircle, User, Trash2, MicOff, Ban, UserMinus } from "lucide-react";

export default function AIPendingApprovalsModal({
  isOpen,
  onClose,
  pendingApprovals,
  onRespond,
  getMemberName,
}) {
  if (!isOpen) return null;

  const getActionIcon = (action) => {
    switch (action) {
      case 'warn':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'mute':
        return <MicOff size={16} className="text-orange-500" />;
      case 'kick':
        return <UserMinus size={16} className="text-red-500" />;
      case 'ban':
        return <Ban size={16} className="text-red-600" />;
      case 'delete':
        return <Trash2 size={16} className="text-purple-500" />;
      default:
        return <Clock size={16} className="text-blue-500" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'warn':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'mute':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'kick':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'ban':
        return 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300';
      case 'delete':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#f1f3f4] dark:border-[#232529] flex items-center justify-between sticky top-0 bg-white dark:bg-[#0c0c0c] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#202124] dark:text-white">
                Pending Approvals
              </h2>
              <p className="text-sm text-[#5f6368] dark:text-gray-400">
                {pendingApprovals.length} action{pendingApprovals.length !== 1 ? 's' : ''} waiting for your approval
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
        <div className="p-6">
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-[#202124] dark:text-white mb-2">
                No Pending Approvals
              </h3>
              <p className="text-sm text-[#5f6368] dark:text-gray-400">
                All AI actions have been processed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="p-4 border border-[#dadce0] dark:border-[#232529] rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(approval.action)}`}>
                        {getActionIcon(approval.action)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-[#202124] dark:text-white capitalize">
                          {approval.action} Request
                        </h4>
                        <p className="text-xs text-[#5f6368] dark:text-gray-400">
                          Requested {new Date(approval.requestedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  </div>

                  <div className="space-y-2">
                    {approval.action !== 'delete' && (
                      <div className="flex items-center gap-2 text-sm">
                        <User size={14} className="text-[#5f6368] dark:text-gray-400" />
                        <span className="text-[#202124] dark:text-white">
                          Target: {getMemberName(approval.target)}
                        </span>
                      </div>
                    )}
                    <div className="text-sm text-[#5f6368] dark:text-gray-400 bg-gray-50 dark:bg-[#101010] p-3 rounded-lg">
                      <p className="text-xs mb-1">Reason:</p>
                      <p className="text-[#202124] dark:text-white">{approval.reason}</p>
                    </div>
                    {approval.duration && (
                      <p className="text-xs text-[#5f6368] dark:text-gray-400">
                        Duration: {approval.duration / 60000} minutes
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onRespond(approval.id, true)}
                      className="flex-1 py-2 px-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => onRespond(approval.id, false)}
                      className="flex-1 py-2 px-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
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