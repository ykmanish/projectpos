"use client";

import { X, Check, Clock, Users } from "lucide-react";
import { BeanHead } from "beanheads";

export default function FriendRequestsModal({ isOpen, onClose, requests, onAccept, onReject }) {
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