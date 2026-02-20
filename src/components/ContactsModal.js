// components/ContactsModal.js
"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, MessageCircle, ChevronLeft, Users, UserPlus } from "lucide-react";
import { BeanHead } from "beanheads";

// ─── Card Color Palette (matches reference design) ─────────────────
const CARD_PALETTES = [
  { bg: '#FF8C78', track: '#c96b58', bar: '#1a0a08', text: '#1a0a08', sub: '#7a3028' },
  { bg: '#FFB8C6', track: '#d98898', bar: '#1a0810', text: '#1a0810', sub: '#7a3050' },
  { bg: '#7DCFCC', track: '#4eaaa7', bar: '#082020', text: '#082020', sub: '#1a5a58' },
  { bg: '#F5E09A', track: '#c8b860', bar: '#1a1408', text: '#1a1408', sub: '#6a5020' },
  { bg: '#A8D8FF', track: '#70b0e0', bar: '#081220', text: '#081220', sub: '#204870' },
  { bg: '#B8E8B0', track: '#80c078', bar: '#081408', text: '#081408', sub: '#205820' },
  { bg: '#E0C8F8', track: '#b090d0', bar: '#120820', text: '#120820', sub: '#503878' },
  { bg: '#FFD4A0', track: '#d8a060', bar: '#1a0e04', text: '#1a0e04', sub: '#7a4818' },
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

// Helper function to get beanConfig from avatar
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

// ─── Contact Avatar Component ─────────────────────────────────────
const ContactAvatar = ({ contact, size = 12 }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = (contact?.userName?.charCodeAt(0) || 0) % GRADIENTS.length;
  const beanConfig = getBeanConfig(contact?.avatar);
  
  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 bg-[#e8f0fe]`}>
      {beanConfig ? (
        <BeanHead {...beanConfig} />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center`}>
          <span className="text-white font-bold text-lg">{contact?.userName?.charAt(0)}</span>
        </div>
      )}
    </div>
  );
};

export default function ContactsModal({ isOpen, onClose, onSelectContact, userId }) {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);
  
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      // Focus search input after modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
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

  const palette = getCardPalette('New Chat');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
          
          <h2 className="text-lg font-bold text-gray-900">New Chat</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Info Card */}
        <div className="px-5 mb-4">
          <div className="rounded-3xl p-4" style={{ backgroundColor: palette.bg }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                <Users size={24} style={{ color: palette.text }} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: palette.text }}>
                  {contacts.length} Contacts
                </h3>
                <p className="text-sm mt-1" style={{ color: palette.sub }}>
                  Select a contact to start chatting
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pb-4">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-4 pl-12 bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm"
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredContacts.length > 0 ? (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.userId}
                  onClick={() => handleSelectContact(contact)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-all group border border-transparent hover:border-gray-200"
                >
                  <ContactAvatar contact={contact} size={12} />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 text-sm">
                      {contact.userName}
                    </p>
                    {contact.username && (
                      <p className="text-xs text-gray-400">
                        @{contact.username}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all">
                    <MessageCircle size={18} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                <Users size={36} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 font-medium">
                  {searchQuery ? "No contacts found" : "No contacts available"}
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  {searchQuery ? "Try a different search term" : "Add friends to start chatting!"}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={onClose}
                  className="mt-2 px-6 py-3 bg-black text-white rounded-2xl font-medium text-sm hover:bg-gray-900 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer for empty state with search */}
        {searchQuery && filteredContacts.length === 0 && !loading && (
          <div className="px-5 pb-7 pt-2 flex-shrink-0">
            <button
              onClick={() => setSearchQuery('')}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 rounded-2xl font-bold text-[15px] transition-all"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}