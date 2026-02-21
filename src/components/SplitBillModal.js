// components/SplitBillModal.js
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Check, CheckCircle, Clock, AlertCircle, Send,
  CreditCard, Globe, ChevronLeft, ReceiptText,
  Receipt, Users, History, MoreVertical, UserCircle, ChevronDown,
  Edit2, Trash2
} from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import { CURRENCIES, getCurrencySymbol } from '@/constants/currencies';
import encryptionService from '@/utils/encryptionService';
import { BeanHead } from 'beanheads';

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
    // If it's already an object, return it
    if (typeof avatarData === 'object') return avatarData;
    
    // Try to parse JSON string
    const parsed = JSON.parse(avatarData);
    return parsed;
  } catch (e) {
    // If parsing fails, return null
    console.error('Failed to parse avatar:', e);
    return null;
  }
};

// Helper function to get beanConfig from avatar
const getBeanConfig = (avatar) => {
  const parsed = parseAvatar(avatar);
  
  if (!parsed) return null;
  
  // If parsed is an object with beanConfig property
  if (typeof parsed === 'object' && parsed.beanConfig) {
    return parsed.beanConfig;
  }
  
  // If parsed is the beanConfig itself (has typical BeanHead properties)
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
const StackedAvatars = ({ splits = [], members = [], max = 4 }) => {
  const visible = splits.slice(0, max);
  const extra = splits.length - max;
  
  return (
    <div className="flex items-center">
      {visible.map((split, index) => {
        const member = members.find(m => m.userId === split.userId);
        const beanConfig = getBeanConfig(member?.avatar);
        
        return (
          <div
            key={split.userId}
            className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 overflow-hidden bg-gray-300 flex-shrink-0"
            style={{ zIndex: index }}
          >
            {beanConfig ? (
              <div className="w-full h-full bg-[#e8f0fe]">
                <BeanHead {...beanConfig} />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-700 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{split.userName?.charAt(0)}</span>
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

// ─── Rounded Square Avatar ─────────────────────────────────────────
const SquareAvatar = ({ member, size = 10, selected = true }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = (member?.userName?.charCodeAt(0) || 0) % GRADIENTS.length;
  const beanConfig = getBeanConfig(member?.avatar);
  
  return (
    <div className={`w-${size} h-${size} rounded-2xl overflow-hidden flex-shrink-0 transition-opacity ${!selected ? 'opacity-35' : ''}`}>
      {beanConfig ? (
        <div className="w-full h-full bg-[#e8f0fe]">
          <BeanHead {...beanConfig} />
        </div>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">{member?.userName?.charAt(0)}</span>
        </div>
      )}
    </div>
  );
};

// ─── Bill Card Dropdown Menu Component ─────────────────────────
const BillCardDropdown = ({ bill, currentUserId, onEdit, onDelete, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isCreator = bill.createdBy === currentUserId;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only show dropdown if user is creator
  if (!isCreator) return null;

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    onEdit(bill);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    onDelete(bill);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2 hover:bg-black/10 transition-colors"
        style={{ backgroundColor: `${bill.palette?.text}18` }}
      >
        <MoreVertical size={16} style={{ color: bill.palette?.text }} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-1 w-40 bg-white rounded-2xl -lg border border-gray-200 z-50 overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleEdit}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <Edit2 size={14} className="text-gray-500" />
            Edit Bill
          </button>
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-red-50 transition-colors text-sm font-medium text-red-600 border-t border-gray-100"
          >
            <Trash2 size={14} className="text-red-500" />
            Delete Bill
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Multi-Select User Dropdown Component ─────────────────────────
const MultiSelectUserDropdown = ({ members, selectedUsers, onToggleUser, currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedCount = () => {
    return selectedUsers.filter(u => u.selected).length;
  };

  const getSelectedNames = () => {
    const selected = selectedUsers.filter(u => u.selected);
    if (selected.length === 0) return 'Select members';
    if (selected.length === 1) return selected[0].userName;
    if (selected.length === 2) return `${selected[0].userName} and ${selected[1].userName}`;
    return `${selected[0].userName} and ${selected.length - 1} others`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 hover:bg-white transition-all"
      >
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {getSelectedNames()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-gray-200 px-2 py-1 rounded-full">
            {getSelectedCount()}
          </span>
          <ChevronDown size={16} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl -lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {members.map((member) => {
            const isSelected = selectedUsers.find(u => u.userId === member.userId)?.selected || false;
            const beanConfig = getBeanConfig(member.avatar);
            const isYou = member.userId === currentUserId;

            return (
              <div
                key={member.userId}
                onClick={() => {
                  onToggleUser(member.userId);
                  // Don't close dropdown
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all cursor-pointer ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#e8f0fe] flex-shrink-0">
                  {beanConfig ? (
                    <BeanHead {...beanConfig} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{member.userName?.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {member.userName}
                    {isYou && <span className="text-xs text-gray-400 ml-1">(You)</span>}
                  </p>
                </div>
                {isSelected ? (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────
export default function SplitBillModal({
  isOpen, onClose, group, currentUserId, onSave, socket, isConnected, roomId
}) {
  const [activeTab, setActiveTab]             = useState('history');
  const [historyFilter, setHistoryFilter]     = useState('recent');
  const [billTitle, setBillTitle]             = useState('');
  const [totalAmount, setTotalAmount]         = useState('');
  const [currency, setCurrency]               = useState('USD');
  const [paidBy, setPaidBy]                   = useState(currentUserId);
  const [splitType, setSplitType]             = useState('equal');
  const [participants, setParticipants]       = useState([]);
  const [customAmounts, setCustomAmounts]     = useState({});
  const [bills, setBills]                     = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [paymentLoading, setPaymentLoading]   = useState(null);
  const [showSuccess, setShowSuccess]         = useState(false);
  const [successMsg, setSuccessMsg]           = useState('');
  const [expandedBillId, setExpandedBillId]   = useState(null);
  const [editingBill, setEditingBill]         = useState(null);
  const [deleteConfirmBill, setDeleteConfirmBill] = useState(null);
  const [groupKey, setGroupKey]               = useState(null);
  const [encryptionReady, setEncryptionReady] = useState(false);

  // ── Effects ───────────────────────────────────────────────────────
  useEffect(() => {
    if (group?.groupId && currentUserId) initializeEncryption();
  }, [group?.groupId, currentUserId]);

  useEffect(() => {
    if (isOpen) fetchBills();
  }, [isOpen, group?.groupId]);

  useEffect(() => {
    if (group?.members) {
      setParticipants(
        group.members.map(m => ({ 
          userId: m.userId, 
          userName: m.userName, 
          selected: true, 
          amount: 0 
        }))
      );
    }
  }, [group?.members]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    const onBillUpdated = (data) => {
      if (data.bill && data.bill.groupId === group?.groupId) {
        setBills(prev => {
          const idx = prev.findIndex(b => b.id === data.bill.id);
          if (idx >= 0) { const n = [...prev]; n[idx] = data.bill; return n; }
          return [data.bill, ...prev];
        });
        triggerSuccess('Payment status updated!');
      }
    };
    socket.on('bill-updated', onBillUpdated);
    return () => socket.off('bill-updated', onBillUpdated);
  }, [socket, isConnected, group?.groupId]);

  // ── Helpers ────────────────────────────────────────────────────────
  const triggerSuccess = (msg = 'Done!') => {
    setSuccessMsg(msg); setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const diffDays = Math.floor((new Date() - d) / 86400000);
    if (diffDays === 0) return `Today, ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return `${diffDays} days ago`;
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
  };

  const getPaidPercentage = (bill) => {
    if (!bill.totalAmount) return 0;
    const paid = bill.splits.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0);
    return (paid / bill.totalAmount) * 100;
  };

  const getFilteredBills = () => {
    switch (historyFilter) {
      case 'unfinished': return bills.filter(b => b.splits.some(s => s.status !== 'paid'));
      case 'completed':  return bills.filter(b => b.splits.every(s => s.status === 'paid'));
      default:           return [...bills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  // ── Bill CRUD Operations ──────────────────────────────────────────
  const handleEditBill = (bill) => {
    setEditingBill(bill);
    setBillTitle(bill.title);
    setTotalAmount(bill.totalAmount.toString());
    setCurrency(bill.currency || 'USD');
    setPaidBy(bill.paidBy);
    
    // Set participants selection based on bill splits
    setParticipants(prev => 
      prev.map(p => ({
        ...p,
        selected: bill.splits.some(s => s.userId === p.userId)
      }))
    );

    // Set custom amounts if bill had custom split
    const hasCustomAmounts = bill.splits.some(s => {
      const equalAmount = bill.totalAmount / bill.splits.length;
      return Math.abs(s.amount - equalAmount) > 0.01;
    });

    if (hasCustomAmounts) {
      setSplitType('custom');
      const customAmts = {};
      bill.splits.forEach(s => {
        customAmts[s.userId] = s.amount;
      });
      setCustomAmounts(customAmts);
    } else {
      setSplitType('equal');
      setCustomAmounts({});
    }

    setActiveTab('new');
  };

  const handleDeleteBill = (bill) => {
    setDeleteConfirmBill(bill);
  };

  const confirmDeleteBill = async () => {
    if (!deleteConfirmBill) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/chat/split-bill?billId=${deleteConfirmBill.id}&userId=${currentUserId}&groupId=${group.groupId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        // Remove bill from local state
        setBills(prev => prev.filter(b => b.id !== deleteConfirmBill.id));
        
        // Emit socket event for bill deletion to update chat
        if (socket && isConnected) {
          socket.emit('bill-deleted', {
            billId: deleteConfirmBill.id,
            roomId: roomId || group.groupId,
            deletedBy: currentUserId,
            timestamp: new Date().toISOString()
          });

          // Also emit a bill-message-deleted event specifically for the chat interface
          socket.emit('bill-message-deleted', {
            billId: deleteConfirmBill.id,
            roomId: roomId || group.groupId,
            deletedBy: currentUserId,
            deletedByName: group.members?.find(m => m.userId === currentUserId)?.userName || 'Someone',
            timestamp: new Date().toISOString()
          });
        }

        triggerSuccess('Bill deleted successfully');
        setDeleteConfirmBill(null);
      } else {
        setError(data.error || 'Failed to delete bill');
      }
    } catch (e) {
      console.error('Error deleting bill:', e);
      setError('Failed to delete bill');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmBill(null);
  };

  // ── API Calls ──────────────────────────────────────────────────────
  const initializeEncryption = async () => {
    try {
      await encryptionService.initializeKeys(currentUserId);
      const key = await encryptionService.getGroupKey(currentUserId, group.groupId);
      setGroupKey(key); setEncryptionReady(true);
    } catch (e) { console.error('Encryption init error:', e); }
  };

  const fetchBills = async () => {
    try {
      const res  = await fetch(`/api/chat/split-bill?groupId=${group.groupId}`);
      const data = await res.json();
      if (data.success) setBills(data.bills);
    } catch (e) { console.error('Error fetching bills:', e); }
  };

  const toggleParticipant = (userId) => {
    setParticipants(prev => 
      prev.map(p => p.userId === userId ? { ...p, selected: !p.selected } : p)
    );
    // Clear custom amounts for deselected users
    const user = participants.find(p => p.userId === userId);
    if (user?.selected) {
      setCustomAmounts(prev => {
        const newAmounts = { ...prev };
        delete newAmounts[userId];
        return newAmounts;
      });
    }
  };

  const handleCustomAmountChange = (userId, amount) =>
    setCustomAmounts(prev => ({ ...prev, [userId]: parseFloat(amount) || 0 }));

  const calculateSplits = () => {
    const selected = participants.filter(p => p.selected);
    if (splitType === 'equal') {
      const perPerson = parseFloat(totalAmount) / selected.length;
      return selected.map(p => ({
        userId: p.userId, userName: p.userName, amount: perPerson, currency,
        status: p.userId === paidBy ? 'paid' : 'pending'
      }));
    }
    const customTotal = Object.values(customAmounts).reduce((s, a) => s + (a || 0), 0);
    if (Math.abs(customTotal - parseFloat(totalAmount)) > 0.01) {
      setError('Custom amounts must equal total amount'); return null;
    }
    return selected.map(p => ({
      userId: p.userId, userName: p.userName,
      amount: customAmounts[p.userId] || 0, currency,
      status: p.userId === paidBy ? 'paid' : 'pending'
    }));
  };

  // components/SplitBillModal.js (partial - only the handleSubmit function needs to be updated)

// components/SplitBillModal.js - Update the handleSubmit function

const handleSubmit = async () => {
  if (!billTitle.trim()) return setError('Please enter a bill title');
  if (!totalAmount || parseFloat(totalAmount) <= 0) return setError('Please enter a valid amount');
  const selected = participants.filter(p => p.selected);
  if (selected.length === 0) return setError('Please select at least one participant');
  const splits = calculateSplits();
  if (!splits) return;

  setLoading(true); setError('');
  
  try {
    let res;
    let data;

    if (editingBill) {
      // Update existing bill
      res = await fetch('/api/chat/split-bill', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: editingBill.id,
          groupId: group.groupId,
          billTitle,
          totalAmount: parseFloat(totalAmount),
          currency,
          paidBy,
          splits,
          updatedBy: currentUserId
        })
      });
      data = await res.json();
      
      if (data.success) {
        // Update bill in local state
        setBills(prev => prev.map(b => b.id === editingBill.id ? data.bill : b));
        
        // Emit socket event for bill update
        if (socket && isConnected) {
          socket.emit('bill-updated', {
            bill: data.bill,
            roomId: roomId || group.groupId,
            updatedBy: currentUserId,
            timestamp: new Date().toISOString()
          });
        }
        
        triggerSuccess('Bill updated successfully!');
      }
    } else {
      // Create new bill - the API will now handle creating the chat message
      res = await fetch('/api/chat/split-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.groupId,
          billTitle,
          totalAmount: parseFloat(totalAmount),
          currency,
          paidBy,
          splits,
          createdBy: currentUserId
        })
      });
      data = await res.json();
      
      if (data.success) {
        // Just pass the bill data to onSave for local state
        // The chat message will be created by the API, so we don't emit socket here
        await onSave(data.bill);
        
        // Don't emit bill-created socket event here - the API already created the message
        // and will handle any necessary socket emissions
        
        triggerSuccess('Bill created successfully!');
      }
    }

    if (data.success) {
      // Reset form
      setBillTitle('');
      setTotalAmount('');
      setCurrency('USD');
      setPaidBy(currentUserId);
      setCustomAmounts({});
      setEditingBill(null);
      setError('');
      await fetchBills();
      setActiveTab('history');
    } else {
      setError(data.error || (editingBill ? 'Failed to update bill' : 'Failed to create bill'));
    }
  } catch (e) {
    console.error(e);
    setError(editingBill ? 'Failed to update bill' : 'Failed to create bill');
  } finally {
    setLoading(false);
  }
};

  // Update split status function
  const updateSplitStatus = async (billId, splitUserId, status) => {
    setPaymentLoading(`${billId}-${splitUserId}`);
    try {
      const res = await fetch('/api/chat/split-bill', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          billId, 
          splitUserId, 
          status, 
          groupId: group.groupId 
        })
      });
      const data = await res.json();
      
      if (data.success && data.bill) { 
        console.log('✅ Payment updated successfully:', data.bill);
        
        // Update local bills state
        setBills(prev => {
          const index = prev.findIndex(b => b.id === billId);
          if (index >= 0) {
            const newBills = [...prev];
            newBills[index] = data.bill;
            return newBills;
          }
          return [data.bill, ...prev];
        });

        // Emit socket events for real-time updates
        if (socket && isConnected) {
          // Calculate updated stats
          const paidCount = data.bill.splits?.filter(s => s.status === 'paid').length || 0;
          const totalCount = data.bill.splits?.length || 0;
          const paidAmount = data.bill.splits
            ?.filter(s => s.status === 'paid')
            .reduce((sum, s) => sum + s.amount, 0) || 0;
          const paidPercentage = data.bill.totalAmount > 0 ? (paidAmount / data.bill.totalAmount) * 100 : 0;
          
          // Get payer name
          const paidByMember = data.bill.splits?.find(s => s.userId === data.bill.paidBy);
          const paidByName = paidByMember?.userName || 'Someone';

          // Emit bill updated event
          socket.emit('bill-updated', {
            bill: data.bill,
            roomId: roomId || group.groupId,
            updatedBy: currentUserId,
            timestamp: new Date().toISOString()
          });

          // Emit bill message updated event
          socket.emit('bill-message-updated', {
            billId: billId,
            roomId: roomId || group.groupId,
            billData: {
              id: data.bill.id,
              title: data.bill.title,
              totalAmount: data.bill.totalAmount,
              currency: data.bill.currency || 'USD',
              paidBy: data.bill.paidBy,
              paidByName: paidByName,
              splits: data.bill.splits || [],
              paidCount: paidCount,
              totalCount: totalCount,
              pendingCount: totalCount - paidCount,
              paidPercentage: paidPercentage
            },
            updatedBy: currentUserId,
            timestamp: new Date().toISOString()
          });

          // Emit a direct message update event
          socket.emit('bill-direct-update', {
            billId: billId,
            roomId: roomId || group.groupId,
            bill: data.bill,
            updatedBy: currentUserId,
            timestamp: new Date().toISOString()
          });
        }
        
        triggerSuccess('Payment updated!'); 
      }
    } catch (e) { 
      console.error('Error updating payment:', e); 
      setError('Failed to update payment status'); 
    } finally { 
      setPaymentLoading(null); 
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingBill(null);
    setBillTitle('');
    setTotalAmount('');
    setCurrency('USD');
    setPaidBy(currentUserId);
    setCustomAmounts({});
    setError('');
    setActiveTab('history');
  };

  if (!isOpen) return null;

  // ── Toast ──────────────────────────────────────────────────────────
  const Toast = () => (
    <div className="px-5 flex-shrink-0 space-y-2 mb-2">
      {showSuccess && (
        <div className="px-4 py-3 bg-black rounded-2xl text-white text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle size={15} strokeWidth={2.5} />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={15} strokeWidth={2.5} />
          <span className="font-semibold">{error}</span>
        </div>
      )}
    </div>
  );

  // ── Delete Confirmation Modal ──────────────────────────────────────
  const DeleteConfirmationModal = () => {
    if (!deleteConfirmBill) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={28} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
            Delete Bill?
          </h3>
          <p className="text-center text-gray-500 text-sm mb-6">
            Are you sure you want to delete "{deleteConfirmBill.title}"? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={cancelDelete}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteBill}
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

  // ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden -2xl">

          {/* ══════════════════ HISTORY TAB ══════════════════ */}
          {activeTab === 'history' && (
            <div className="flex flex-col h-full min-h-0">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('new')}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={17} className="text-gray-700" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">Your Bills</h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <X size={16} className="text-gray-700" />
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 px-5 pb-4 flex-shrink-0">
                {[
                  { key: 'recent',     label: 'Recent'  },
                  { key: 'unfinished', label: 'Pending' },
                  { key: 'completed',  label: 'Paid'    },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setHistoryFilter(t.key)}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                      historyFilter === t.key
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <Toast />

              {/* Bills List */}
              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3 min-h-0">
                {getFilteredBills().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                      <ReceiptText size={36} className="text-gray-300" />
                    </div>
                    <div className="text-center">
                      <p className=" text-gray-400">No bills found</p>
                      <p className="text-sm text-gray-300 mt-1">Create your first bill to get started</p>
                    </div>
                  </div>
                ) : (
                  getFilteredBills().map(bill => {
                    const pct        = getPaidPercentage(bill);
                    const sym        = getCurrencySymbol(bill.currency || 'USD');
                    const isExpanded = expandedBillId === bill.id;
                    const palette    = getCardPalette(bill.title);
                    const paidCount  = bill.splits.filter(s => s.status === 'paid').length;
                    const totalCount = bill.splits.length;
                    const remaining  = bill.totalAmount - bill.splits
                      .filter(s => s.status === 'paid')
                      .reduce((sum, s) => sum + s.amount, 0);

                    // Add palette to bill for dropdown
                    bill.palette = palette;

                    return (
                      <div key={bill.id}>
                        {/* ── Colored Bill Card ── */}
                        <button
                          onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                          className="w-full text-left active:scale-[0.98] transition-transform"
                        >
                          <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>

                            {/* Row 1: Title + Menu */}
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-extrabold leading-tight" style={{ color: palette.text }}>
                                  {bill.title}
                                </h3>
                                <p className="text-xs mt-0.5 font-medium" style={{ color: palette.sub }}>
                                  {formatDate(bill.createdAt)}
                                </p>
                              </div>
                              <BillCardDropdown
                                bill={bill}
                                currentUserId={currentUserId}
                                onEdit={handleEditBill}
                                onDelete={handleDeleteBill}
                              />
                            </div>

                            {/* Row 2: Total + Split to */}
                            <div className="flex items-end justify-between mb-5">
                              <div>
                                <p className="text-xs font-semibold mb-1" style={{ color: palette.sub }}>Total</p>
                                <p className="text-2xl font-extrabold tracking-tight" style={{ color: palette.text }}>
                                  {sym}{bill.totalAmount.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold mb-2" style={{ color: palette.sub }}>Split to</p>
                                <StackedAvatars splits={bill.splits} members={group?.members || []} max={4} />
                              </div>
                            </div>

                            {/* Row 3: Progress */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold" style={{ color: palette.sub }}>Paid</span>
                                <span className="text-xs font-semibold" style={{ color: palette.sub }}>
                                  {paidCount}/{totalCount} people
                                </span>
                              </div>
                              <ProgressBar
                                percentage={pct}
                                trackColor={`${palette.text}22`}
                                barColor={palette.text}
                              />
                            </div>
                          </div>
                        </button>

                        {/* ── Expanded Split Details ── */}
                        {isExpanded && (
                          <div className="mx-1 mt-1.5 p-4 bg-gray-50  border-gray-100 rounded-3xl animate-fade-in">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm text-gray-400">
                                Split Details
                              </p>
                              <span className="text-sm text-gray-400 font-medium">
                                {sym}{bill.totalAmount.toFixed(2)} total
                              </span>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {bill.splits.map(split => {
                                const isMe     = split.userId === currentUserId;
                                const isPaying = paymentLoading === `${bill.id}-${split.userId}`;
                                const splitSym = getCurrencySymbol(split.currency || bill.currency || 'USD');
                                const isPayer  = split.userId === bill.paidBy;
                                const member   = group?.members?.find(m => m.userId === split.userId);
                                const beanConfig = getBeanConfig(member?.avatar);

                                return (
                                  <div
                                    key={split.userId}
                                    className={`flex items-center justify-between p-3 rounded-2xl  ${
                                      isMe
                                        ? 'bg-blue-50 border-blue-100'
                                        : 'bg-white border-gray-100'
                                    }`}
                                  >
                                    {/* Left: avatar + name */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className="w-9 h-9 rounded-2xl overflow-hidden bg-gray-200 flex-shrink-0">
                                        {beanConfig ? (
                                          <div className="w-full h-full bg-[#e8f0fe]">
                                            <BeanHead {...beanConfig} />
                                          </div>
                                        ) : (
                                          <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">{split.userName?.charAt(0)}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className={`text-sm truncate ${isMe ? 'text-blue-600' : 'text-gray-800'}`}>
                                          {split.userName}
                                          {isMe && <span className="font-normal text-gray-400 text-xs ml-1">(You)</span>}
                                          {isPayer && !isMe && <span className="text-green-500 text-xs ml-2">· Payer</span>}
                                        </p>
                                        <p className={`text-xs font-medium ${
                                          split.status === 'paid'    ? 'text-green-600' :
                                          split.status === 'overdue' ? 'text-red-500'   : 'text-amber-500'
                                        }`}>
                                          {split.status === 'paid' ? 'Paid' : split.status}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Right: amount + button */}
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                      <span className="font-extrabold text-sm text-gray-900">
                                        {splitSym}{split.amount.toFixed(2)}
                                      </span>
                                      {split.status !== 'paid' ? (
                                        <button
                                          onClick={e => { e.stopPropagation(); updateSplitStatus(bill.id, split.userId, 'paid'); }}
                                          disabled={!!paymentLoading}
                                          className={`text-xs font-bold px-3 py-2 rounded-full transition-all disabled:opacity-50 flex items-center gap-1 ${
                                            isMe
                                              ? 'bg-black text-white'
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          }`}
                                        >
                                          {isPaying ? (
                                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <>
                                              <CreditCard size={11} />
                                              {isMe ? 'Pay' : 'Mark'}
                                            </>
                                          )}
                                        </button>
                                      ) : (
                                        <div className="w-16"></div> // Spacer to maintain layout
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Footer */}
                            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                              <span className="font-medium">{paidCount} of {totalCount} paid</span>
                              {pct < 100 ? (
                                <span className="font-bold text-gray-700">
                                  {sym}{remaining.toFixed(2)} pending
                                </span>
                              ) : (
                                <span className="text-green-600 flex items-center gap-1">
                                  Fully Paid
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Create New Bill FAB */}
              <div className="px-5 pb-7 pt-3 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingBill(null);
                    setBillTitle('');
                    setTotalAmount('');
                    setCurrency('USD');
                    setPaidBy(currentUserId);
                    setCustomAmounts({});
                    setError('');
                    setActiveTab('new');
                  }}
                  className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} strokeWidth={2.5} /> Create New Bill
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════ NEW BILL TAB (Create/Edit) ══════════════════ */}
          {activeTab === 'new' && (
            <div className="flex flex-col h-full min-h-0">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
                <button
                  onClick={cancelEditing}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={17} className="text-gray-700" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingBill ? 'Edit Bill' : 'Split New Bill'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <X size={16} className="text-gray-700" />
                </button>
              </div>

              <Toast />

              <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-2 min-h-0">

                {/* ── Yellow Summary Card ── */}
                <div className="rounded-3xl p-5" style={{ backgroundColor: '#F5E09A' }}>
                  {/* Bill title inside card */}
                  <input
                    type="text"
                    value={billTitle}
                    onChange={e => { setBillTitle(e.target.value); setError(''); }}
                    placeholder="Bill title…"
                    className="w-full bg-transparent text-xl font-extrabold text-gray-900 placeholder-gray-500/70 focus:outline-none mb-4 caret-gray-700"
                  />

                  {/* Amount */}
                  <p className="text-sm text-zinc-800 mb-1">Total amount</p>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {getCurrencySymbol(currency)}
                    </span>
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={e => { setTotalAmount(e.target.value); setError(''); }}
                      placeholder="0.00"
                      min="0" step="0.01"
                      className="flex-1 bg-transparent text-3xl font-extrabold text-gray-900 placeholder-gray-400 focus:outline-none caret-gray-700"
                    />
                  </div>

                  {/* Member Selection Dropdown */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-zinc-800 mb-2">
                      Select Members ({participants.filter(p => p.selected).length})
                    </p>
                    <MultiSelectUserDropdown
                      members={group?.members || []}
                      selectedUsers={participants}
                      onToggleUser={toggleParticipant}
                      currentUserId={currentUserId}
                    />
                  </div>

                  {/* Selected Member Avatars Preview */}
                  {participants.filter(p => p.selected).length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-zinc-800 mb-2">Selected Members:</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {participants.filter(p => p.selected).map(p => {
                          const member = group?.members?.find(m => m.userId === p.userId);
                          return (
                            <div key={p.userId} className="relative group">
                              <SquareAvatar member={member || { userName: p.userName }} size={10} selected={true} />
                              <button
                                onClick={() => toggleParticipant(p.userId)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={8} className="text-white" />
                              </button>
                              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-gray-700 whitespace-nowrap bg-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {p.userName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Currency ── */}
                <div>
                  <label className="block text-sm text-zinc-800 mb-1.5">Currency</label>
                  <CustomDropdown
                    options={CURRENCIES.map(c => ({
                      value: c.value,
                      label: `${c.flag} ${c.label}`,
                      shortLabel: `${c.flag} ${c.symbol}`,
                      currency: c
                    }))}
                    value={currency}
                    onChange={setCurrency}
                    placeholder="Currency"
                    icon={Globe}
                    searchable={true}
                    renderOption={(option) => (
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{option.currency.flag}</span>
                        <div>
                          <div className="font-semibold text-sm">{option.currency.label}</div>
                          <div className="text-xs text-gray-400">{option.currency.fullName}</div>
                        </div>
                      </div>
                    )}
                  />
                </div>

                {/* ── Paid By Dropdown ── */}
                <div>
                  <label className="block text-sm text-zinc-800 mb-1.5">Paid By</label>
                  <CustomDropdown
                    options={(group?.members || []).map(m => {
                      const beanConfig = getBeanConfig(m.avatar);
                      return {
                        value: m.userId,
                        label: m.userName,
                        description: m.userId === currentUserId ? 'You' : '',
                        avatar: m.avatar,
                        beanConfig: beanConfig
                      };
                    })}
                    value={paidBy}
                    onChange={setPaidBy}
                    placeholder="Who paid?"
                    icon={Users}
                    searchable={true}
                    renderOption={(option) => (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl overflow-hidden bg-[#e8f0fe] flex items-center justify-center text-white text-xs font-bold">
                          {option.beanConfig ? (
                            <BeanHead {...option.beanConfig} />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{option.label?.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{option.label}</div>
                          {option.description && <div className="text-xs text-gray-400">{option.description}</div>}
                        </div>
                      </div>
                    )}
                  />
                </div>

                {/* ── Split Type Toggle ── */}
                <div>
                  <label className="block text-sm text-zinc-800 mb-1.5">Split Type</label>
                  <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-2xl">
                    {['equal', 'custom'].map(type => (
                      <button
                        key={type}
                        onClick={() => setSplitType(type)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          splitType === type
                            ? 'bg-white text-gray-900 -sm'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {type === 'equal' ? 'Equal Split' : 'Custom Split'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Split Between Selected People ── */}
                <div>
                  <p className="text-sm text-zinc-800 mb-3">
                    Split between {participants.filter(p => p.selected).length} people
                  </p>
                  <div className="divide-y divide-gray-100">
                    {participants.filter(p => p.selected).map(p => {
                      const member   = group?.members?.find(m => m.userId === p.userId);
                      const selected = participants.filter(x => x.selected).length;
                      const equalAmt = totalAmount
                        ? (parseFloat(totalAmount) / Math.max(selected, 1)).toFixed(2)
                        : '—';
                      const beanConfig = getBeanConfig(member?.avatar);

                      return (
                        <div key={p.userId} className="flex items-center justify-between py-3">
                          {/* Left: avatar + name */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#e8f0fe] flex-shrink-0">
                              {beanConfig ? (
                                <BeanHead {...beanConfig} />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{p.userName?.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-zinc-800 text-sm">
                                {p.userName}
                                {p.userId === currentUserId && (
                                  <span className="font-normal text-gray-400 text-xs ml-1">(You)</span>
                                )}
                              </p>
                              {p.userId === paidBy && (
                                <p className="text-xs text-green-600 ">Payer</p>
                              )}
                            </div>
                          </div>

                          {/* Right: amount */}
                          {splitType === 'custom' ? (
                            <div className="relative w-28">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                                {getCurrencySymbol(currency)}
                              </span>
                              <input
                                type="number"
                                value={customAmounts[p.userId] || ''}
                                onChange={e => handleCustomAmountChange(p.userId, e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-7 pr-3 py-2.5 bg-gray-100 rounded-2xl text-sm font-bold text-gray-800 text-right focus:outline-none focus:ring-2 focus:ring-black/20"
                              />
                            </div>
                          ) : (
                            <span className="font-extrabold text-gray-900 text-sm">
                              {equalAmt !== '—' ? `${getCurrencySymbol(currency)}${equalAmt}` : '—'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="px-5 pb-7 pt-4 flex-shrink-0">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    editingBill ? 'Update Bill' : 'Split Bill'
                  )}
                </button>
              </div>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </>
  );
}