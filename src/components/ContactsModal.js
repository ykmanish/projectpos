// components/ContactsModal.js
"use client";

import { useState, useEffect } from "react";
import { X, Search, MessageCircle } from "lucide-react";
import Avatar from "./Avatar";

export default function ContactsModal({ isOpen, onClose, onSelectContact, userId }) {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = contacts.filter(contact => 
        contact.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/contacts?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
        setFilteredContacts(data.contacts);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contact) => {
    onSelectContact(contact);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#0c0c0c] rounded-3xl shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#f1f3f4] dark:border-[#181A1E] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#202124] dark:text-white">
            New Chat
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
          >
            <X size={20} className="text-[#5f6368] dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#f1f3f4] dark:border-[#181A1E]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl focus:ring focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none text-sm"
              autoFocus
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-gray-400"
              size={18}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="max-h-[400px] overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#34A853] mx-auto"></div>
            </div>
          ) : filteredContacts.length > 0 ? (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.userId}
                  onClick={() => handleSelectContact(contact)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#101010] rounded-xl transition-all group"
                >
                  <Avatar userAvatar={contact.avatar} name={contact.userName} size="w-12 h-12" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-[#202124] dark:text-white text-sm">
                      {contact.userName}
                    </p>
                    <p className="text-xs text-[#5f6368] dark:text-gray-400">
                      @{contact.username || 'username'}
                    </p>
                  </div>
                  <MessageCircle 
                    size={20} 
                    className="text-[#34A853] opacity-0 group-hover:opacity-100 transition-opacity" 
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#5f6368] dark:text-gray-400 text-sm">
                {searchQuery ? "No contacts found" : "No contacts available"}
              </p>
              <p className="text-xs text-[#5f6368] dark:text-gray-500 mt-2">
                Add friends to start chatting!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}