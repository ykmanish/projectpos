// components/SplitBillModal.js (Enhanced Version)
'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  UserPlus,
  Check,
  DollarSign,
  Users,
  Receipt,
  History,
  ArrowLeft,
  Save,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Wallet,
  Bell
} from 'lucide-react';
import Avatar from './Avatar';

export default function SplitBillModal({
  isOpen,
  onClose,
  group,
  currentUserId,
  onSave
}) {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
  const [billTitle, setBillTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
  const [participants, setParticipants] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Fetch bills history
  useEffect(() => {
    if (isOpen) {
      fetchBills();
    }
  }, [isOpen, group?.groupId]);

  // Initialize participants when group changes
  useEffect(() => {
    if (group?.members) {
      const initialParticipants = group.members.map(m => ({
        userId: m.userId,
        userName: m.userName,
        selected: true,
        amount: 0
      }));
      setParticipants(initialParticipants);
    }
  }, [group?.members]);

  const fetchBills = async () => {
    try {
      const response = await fetch(`/api/chat/split-bill?groupId=${group.groupId}`);
      const data = await response.json();
      if (data.success) {
        setBills(data.bills);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const toggleParticipant = (userId) => {
    setParticipants(prev =>
      prev.map(p =>
        p.userId === userId ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const handleCustomAmountChange = (userId, amount) => {
    setCustomAmounts(prev => ({
      ...prev,
      [userId]: parseFloat(amount) || 0
    }));
  };

  const calculateSplits = () => {
    const selectedParticipants = participants.filter(p => p.selected);
    
    if (splitType === 'equal') {
      const amountPerPerson = parseFloat(totalAmount) / selectedParticipants.length;
      return selectedParticipants.map(p => ({
        userId: p.userId,
        userName: p.userName,
        amount: amountPerPerson,
        status: p.userId === paidBy ? 'paid' : 'pending'
      }));
    } else {
      // Custom split - validate total matches
      const customTotal = Object.values(customAmounts).reduce((sum, amt) => sum + (amt || 0), 0);
      if (Math.abs(customTotal - parseFloat(totalAmount)) > 0.01) {
        setError('Custom amounts must equal total amount');
        return null;
      }
      
      return selectedParticipants.map(p => ({
        userId: p.userId,
        userName: p.userName,
        amount: customAmounts[p.userId] || 0,
        status: p.userId === paidBy ? 'paid' : 'pending'
      }));
    }
  };

  const handleSubmit = async () => {
    if (!billTitle.trim()) {
      setError('Please enter a bill title');
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const selectedParticipants = participants.filter(p => p.selected);
    if (selectedParticipants.length === 0) {
      setError('Please select at least one participant');
      return;
    }

    const splits = calculateSplits();
    if (!splits) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chat/split-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.groupId,
          billTitle,
          totalAmount: parseFloat(totalAmount),
          paidBy,
          splits,
          createdBy: currentUserId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Create a chat message about the bill
        await createBillMessage(data.bill);
        
        // Reset form
        setBillTitle('');
        setTotalAmount('');
        setPaidBy(currentUserId);
        setCustomAmounts({});
        setError('');
        
        // Refresh bills
        await fetchBills();
        
        // Show success message
        setShowPaymentSuccess(true);
        setTimeout(() => setShowPaymentSuccess(false), 3000);
        
        // Switch to history tab
        setActiveTab('history');
        
        // Call onSave callback
        if (onSave) {
          onSave(data.bill);
        }
      } else {
        setError(data.error || 'Failed to create bill');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      setError('Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  const createBillMessage = async (bill) => {
    try {
      const payerName = group.members.find(m => m.userId === bill.paidBy)?.userName || 'Someone';
      const pendingCount = bill.splits.filter(s => s.status === 'pending').length;
      
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: group.groupId,
          senderId: currentUserId,
          senderName: group.members.find(m => m.userId === currentUserId)?.userName,
          receiverId: 'group',
          isGroupMessage: true,
          content: `💰 **New Split Bill: ${bill.title}**\nTotal: $${bill.totalAmount.toFixed(2)}\nPaid by: ${payerName}\nPending payments: ${pendingCount} people\n\nUse /split to view or pay bills`,
          attachments: [],
          timestamp: new Date().toISOString(),
          isEncrypted: false,
          billId: bill.id
        })
      });
    } catch (error) {
      console.error('Error creating bill message:', error);
    }
  };

  const updateSplitStatus = async (billId, splitUserId, status) => {
    setPaymentLoading(true);
    try {
      const response = await fetch('/api/chat/split-bill', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId,
          splitUserId,
          status,
          groupId: group.groupId
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchBills();
        
        // Show success message
        setShowPaymentSuccess(true);
        setTimeout(() => setShowPaymentSuccess(false), 3000);
        
        // Create a payment notification message
        if (splitUserId === currentUserId && status === 'paid') {
          const bill = bills.find(b => b.id === billId);
          const userName = group.members.find(m => m.userId === currentUserId)?.userName;
          
          await fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: group.groupId,
              senderId: currentUserId,
              senderName: userName,
              receiverId: 'group',
              isGroupMessage: true,
              content: `✅ **${userName}** has paid their share for "${bill?.title || 'a bill'}"`,
              attachments: [],
              timestamp: new Date().toISOString(),
              isEncrypted: false
            })
          });
        }
      }
    } catch (error) {
      console.error('Error updating bill status:', error);
      setError('Failed to update payment status');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'overdue':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'overdue': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const calculateTotalPaid = (bill) => {
    return bill.splits
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + s.amount, 0);
  };

  const calculateTotalPending = (bill) => {
    return bill.splits
      .filter(s => s.status === 'pending' || s.status === 'overdue')
      .reduce((sum, s) => sum + s.amount, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-zinc-200 dark:border-[#232529] shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-[#232529] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#202124] dark:text-white">Split Bill</h2>
              <p className="text-sm text-[#5f6368] dark:text-gray-400">Split expenses with group members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
          >
            <X size={20} className="text-[#5f6368] dark:text-gray-400" />
          </button>
        </div>

        {/* Success Message */}
        {showPaymentSuccess && (
          <div className="mx-6 mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 flex items-center gap-2 animate-fade-in">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">Payment status updated successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-[#232529] px-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'new'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-[#5f6368] dark:text-gray-400 hover:text-[#202124] dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Receipt size={16} />
              New Bill
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-[#5f6368] dark:text-gray-400 hover:text-[#202124] dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <History size={16} />
              History
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {activeTab === 'new' ? (
            <div className="space-y-6">
              {/* Bill Title */}
              <div>
                <label className="block text-sm font-medium text-[#202124] dark:text-white mb-2">
                  Bill Title
                </label>
                <input
                  type="text"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  placeholder="e.g., Dinner, Groceries, Movie Tickets"
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                />
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-sm font-medium text-[#202124] dark:text-white mb-2">
                  Total Amount ($)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                />
              </div>

              {/* Paid By */}
              <div>
                <label className="block text-sm font-medium text-[#202124] dark:text-white mb-2">
                  Paid By
                </label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none"
                >
                  {group?.members?.map(member => (
                    <option key={member.userId} value={member.userId}>
                      {member.userName} {member.userId === currentUserId ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Split Type */}
              <div>
                <label className="block text-sm font-medium text-[#202124] dark:text-white mb-2">
                  Split Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSplitType('equal')}
                    className={`flex-1 py-3 px-4 rounded-xl border transition-colors ${
                      splitType === 'equal'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'border-zinc-200 dark:border-[#232529] text-[#5f6368] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#101010]'
                    }`}
                  >
                    Equal Split
                  </button>
                  <button
                    onClick={() => setSplitType('custom')}
                    className={`flex-1 py-3 px-4 rounded-xl border transition-colors ${
                      splitType === 'custom'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'border-zinc-200 dark:border-[#232529] text-[#5f6368] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#101010]'
                    }`}
                  >
                    Custom Split
                  </button>
                </div>
              </div>

              {/* Participants */}
              <div>
                <label className="block text-sm font-medium text-[#202124] dark:text-white mb-2">
                  Participants
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-zinc-200 dark:border-[#232529] rounded-xl p-3">
                  {participants.map(participant => (
                    <div
                      key={participant.userId}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-[#101010] rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={participant.selected}
                        onChange={() => toggleParticipant(participant.userId)}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 flex items-center gap-2">
                        <Avatar
                          avatar={group.members.find(m => m.userId === participant.userId)?.avatar}
                          name={participant.userName}
                          size="w-6 h-6"
                        />
                        <span className="text-sm text-[#202124] dark:text-white">
                          {participant.userName}
                          {participant.userId === currentUserId && ' (You)'}
                          {participant.userId === paidBy && ' (Payer)'}
                        </span>
                      </div>
                      {splitType === 'custom' && participant.selected && (
                        <input
                          type="number"
                          value={customAmounts[participant.userId] || ''}
                          onChange={(e) => handleCustomAmountChange(participant.userId, e.target.value)}
                          placeholder="Amount"
                          className="w-24 px-2 py-1 border border-zinc-200 dark:border-[#232529] bg-white dark:bg-[#101010] text-sm rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Create Bill
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-zinc-200 dark:border-[#232529] hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // History Tab
            <div className="space-y-4">
              {bills.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#101010] flex items-center justify-center">
                    <Receipt size={24} className="text-[#5f6368] dark:text-gray-400" />
                  </div>
                  <h3 className="text-[#202124] dark:text-white font-medium mb-2">No bills yet</h3>
                  <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-4">
                    Create your first split bill using the New Bill tab
                  </p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                  >
                    <Plus size={16} />
                    Create Bill
                  </button>
                </div>
              ) : (
                bills.map(bill => {
                  const payerName = group.members.find(m => m.userId === bill.paidBy)?.userName || 'Unknown';
                  const userSplit = bill.splits.find(s => s.userId === currentUserId);
                  const totalPaid = calculateTotalPaid(bill);
                  const totalPending = calculateTotalPending(bill);
                  const isFullyPaid = totalPending === 0;
                  
                  return (
                    <div
                      key={bill.id}
                      className={`border rounded-xl p-4 hover:shadow-md transition-shadow ${
                        isFullyPaid 
                          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' 
                          : 'border-zinc-200 dark:border-[#232529]'
                      }`}
                    >
                      {/* Bill Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-[#202124] dark:text-white">{bill.title}</h4>
                          <p className="text-xs text-[#5f6368] dark:text-gray-400">
                            {new Date(bill.createdAt).toLocaleDateString()} • Paid by {payerName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            ${bill.totalAmount.toFixed(2)}
                          </span>
                          {isFullyPaid && (
                            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                              <CheckCircle size={12} />
                              Fully Paid
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {!isFullyPaid && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-[#5f6368] dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>${totalPaid.toFixed(2)} paid of ${bill.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-[#232529] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full transition-all duration-300"
                              style={{ width: `${(totalPaid / bill.totalAmount) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Splits */}
                      <div className="space-y-2 mb-3">
                        {bill.splits.map(split => {
                          const isCurrentUser = split.userId === currentUserId;
                          const isPayer = split.userId === bill.paidBy;
                          
                          return (
                            <div
                              key={split.userId}
                              className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                                isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <Avatar
                                  avatar={group.members.find(m => m.userId === split.userId)?.avatar}
                                  name={split.userName}
                                  size="w-6 h-6"
                                />
                                <div className="flex-1">
                                  <span className={`${isCurrentUser ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-[#202124] dark:text-white'}`}>
                                    {split.userName}
                                    {isPayer && ' (Payer)'}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(split.status)}`}>
                                      {getStatusIcon(split.status)}
                                      <span className="ml-1">{getStatusText(split.status)}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="font-medium">${split.amount.toFixed(2)}</span>
                                
                                {/* Payment Action Button */}
                                {split.userId === currentUserId && split.status !== 'paid' && (
                                  <button
                                    onClick={() => updateSplitStatus(bill.id, split.userId, 'paid')}
                                    disabled={paymentLoading}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-full transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {paymentLoading ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <CreditCard size={12} />
                                        Pay Now
                                      </>
                                    )}
                                  </button>
                                )}
                                
                                {/* For other users, show status with quick action for admins */}
                                {split.userId !== currentUserId && split.status !== 'paid' && (
                                  <button
                                    onClick={() => updateSplitStatus(bill.id, split.userId, 'paid')}
                                    className="p-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    title="Mark as paid (admin)"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary for current user */}
                      {userSplit && (
                        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-[#232529]">
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-[#101010] p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Wallet size={16} className="text-[#5f6368] dark:text-gray-400" />
                              <span className="text-sm font-medium text-[#202124] dark:text-white">Your balance</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-lg">${userSplit.amount.toFixed(2)}</span>
                              {userSplit.status === 'paid' ? (
                                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                                  <CheckCircle size={14} />
                                  Paid
                                </span>
                              ) : (
                                <button
                                  onClick={() => updateSplitStatus(bill.id, currentUserId, 'paid')}
                                  disabled={paymentLoading}
                                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                  {paymentLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    <>
                                      <CreditCard size={14} />
                                      Pay Now
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment Summary */}
                      <div className="mt-2 flex justify-between text-xs text-[#5f6368] dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle size={12} className="text-green-500" />
                          Paid: {bill.splits.filter(s => s.status === 'paid').length}/{bill.splits.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-yellow-500" />
                          Pending: ${totalPending.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}