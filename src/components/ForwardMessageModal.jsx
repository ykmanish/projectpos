// components/ForwardMessageModal.js
'use client';

import { useState, useEffect } from "react";
import { X, Send, Search, Check, Users, User, MessageCircle } from "lucide-react";
import { BeanHead } from "beanheads";

export default function ForwardMessageModal({
  isOpen,
  onClose,
  messages,
  currentUserId,
  onForward,
  contacts,
  groups,
}) {
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts"); // "contacts" or "groups"
  const [forwarding, setForwarding] = useState(false);

  // Filter contacts based on search
  const filteredContacts = contacts?.filter(contact => 
    contact.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter groups based on search
  const filteredGroups = groups?.filter(group => 
    group.groupName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle contact selection
  const toggleContact = (contact) => {
    setSelectedContacts(prev => {
      const exists = prev.find(c => c.userId === contact.userId);
      if (exists) {
        return prev.filter(c => c.userId !== contact.userId);
      } else {
        return [...prev, contact];
      }
    });
  };

  // Handle group selection
  const toggleGroup = (group) => {
    setSelectedGroups(prev => {
      const exists = prev.find(g => g.groupId === group.groupId);
      if (exists) {
        return prev.filter(g => g.groupId !== group.groupId);
      } else {
        return [...prev, group];
      }
    });
  };

  // Handle forward action
  const handleForward = async () => {
    if (selectedContacts.length === 0 && selectedGroups.length === 0) return;
    
    setForwarding(true);
    try {
      await onForward({
        contacts: selectedContacts,
        groups: selectedGroups,
        messages
      });
      handleClose();
    } catch (error) {
      console.error("Error forwarding messages:", error);
    } finally {
      setForwarding(false);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedContacts([]);
    setSelectedGroups([]);
    setSearchQuery("");
    setActiveTab("contacts");
    onClose();
  };

  if (!isOpen) return null;

  const totalSelected = selectedContacts.length + selectedGroups.length;

  // Render avatar helper
  const renderAvatar = (item, type) => {
    if (type === 'contact') {
      if (!item.avatar) {
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white font-semibold">
            {item.userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
        );
      }

      try {
        const parsedAvatar = typeof item.avatar === "string" ? JSON.parse(item.avatar) : item.avatar;
        if (parsedAvatar?.beanConfig) {
          return (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#e8f0fe] dark:bg-[#232529]">
              <BeanHead {...parsedAvatar.beanConfig} />
            </div>
          );
        }
      } catch (e) {
        console.error("Failed to parse avatar:", e);
      }

      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white font-semibold">
          {item.userName?.charAt(0)?.toUpperCase() || "U"}
        </div>
      );
    } else {
      // Group avatar
      if (item.avatar?.beanConfig) {
        return (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#e8f0fe] dark:bg-[#232529]">
            <BeanHead {...item.avatar.beanConfig} />
          </div>
        );
      } else {
        const groupName = item.groupName || item.name || "Group";
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#34A853] to-[#2D9249] flex items-center justify-center text-white font-semibold">
            {groupName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>
        );
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl border border-[#dadce0] dark:border-[#232529] animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-[#f1f3f4] dark:border-[#232529] flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#202124] dark:text-white">
              Forward {messages.length} {messages.length === 1 ? 'Message' : 'Messages'}
            </h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
            >
              <X size={20} className="text-[#5f6368] dark:text-gray-400" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-[#f1f3f4] dark:border-[#232529]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5f6368] dark:text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts or groups..."
                className="w-full pl-10 pr-4 py-2 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl focus:ring-2 focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#f1f3f4] dark:border-[#232529]">
            <button
              onClick={() => setActiveTab("contacts")}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "contacts"
                  ? "text-[#34A853] dark:text-[#34A853]"
                  : "text-[#5f6368] dark:text-gray-400 hover:text-[#202124] dark:hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={16} />
                <span>Contacts</span>
              </div>
              {activeTab === "contacts" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34A853] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "groups"
                  ? "text-[#34A853] dark:text-[#34A853]"
                  : "text-[#5f6368] dark:text-gray-400 hover:text-[#202124] dark:hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users size={16} />
                <span>Groups</span>
              </div>
              {activeTab === "groups" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34A853] rounded-full" />
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === "contacts" ? (
              filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <User size={40} className="mx-auto text-[#dadce0] dark:text-[#232529] mb-2" />
                  <p className="text-[#5f6368] dark:text-gray-400">No contacts found</p>
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <button
                    key={contact.userId}
                    onClick={() => toggleContact(contact)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#101010] rounded-xl transition-colors"
                  >
                    <div className="relative">
                      {renderAvatar(contact, 'contact')}
                      {contact.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#0c0c0c] rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-[#202124] dark:text-white">
                        {contact.userName}
                      </p>
                      <p className="text-xs text-[#5f6368] dark:text-gray-400">
                        @{contact.username || contact.userName}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedContacts.some(c => c.userId === contact.userId)
                        ? 'bg-[#34A853] border-[#34A853]'
                        : 'border-[#dadce0] dark:border-[#232529]'
                    }`}>
                      {selectedContacts.some(c => c.userId === contact.userId) && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                  </button>
                ))
              )
            ) : (
              filteredGroups.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={40} className="mx-auto text-[#dadce0] dark:text-[#232529] mb-2" />
                  <p className="text-[#5f6368] dark:text-gray-400">No groups found</p>
                </div>
              ) : (
                filteredGroups.map(group => (
                  <button
                    key={group.groupId}
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#101010] rounded-xl transition-colors"
                  >
                    <div className="relative">
                      {renderAvatar(group, 'group')}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-[#202124] dark:text-white">
                        {group.groupName}
                      </p>
                      <p className="text-xs text-[#5f6368] dark:text-gray-400">
                        {group.members?.length || 0} members
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedGroups.some(g => g.groupId === group.groupId)
                        ? 'bg-[#34A853] border-[#34A853]'
                        : 'border-[#dadce0] dark:border-[#232529]'
                    }`}>
                      {selectedGroups.some(g => g.groupId === group.groupId) && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                  </button>
                ))
              )
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#f1f3f4] dark:border-[#232529]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#5f6368] dark:text-gray-400">
                {totalSelected} {totalSelected === 1 ? 'recipient' : 'recipients'} selected
              </span>
              <button
                onClick={() => {
                  setSelectedContacts([]);
                  setSelectedGroups([]);
                }}
                className="text-xs text-[#34A853] hover:text-[#2D9249] transition-colors"
              >
                Clear all
              </button>
            </div>
            <button
              onClick={handleForward}
              disabled={totalSelected === 0 || forwarding}
              className="w-full py-3 bg-[#34A853] text-white rounded-xl font-medium hover:bg-[#2D9249] disabled:bg-gray-200 dark:disabled:bg-[#232529] disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              {forwarding ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Forwarding...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Forward {messages.length} {messages.length === 1 ? 'Message' : 'Messages'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}