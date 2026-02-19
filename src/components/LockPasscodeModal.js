// components/LockPasscodeModal.js

'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Lock, Clock, Eye, EyeOff } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export default function LockPasscodeModal({ 
  isOpen, 
  onClose, 
  onSetPasscode,
  mode = 'set' // 'set' or 'unlock'
}) {
  const [passcode, setPasscode] = useState(['', '', '', '', '', '']);
  const [confirmPasscode, setConfirmPasscode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [timeout, setTimeout] = useState('5');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  
  const inputRefs = useRef([]);

  // Timeout options for the dropdown
  const timeoutOptions = [
    { value: '1', label: '1 minute', description: 'Lock after 1 minute of inactivity' },
    { value: '5', label: '5 minutes', description: 'Lock after 5 minutes of inactivity' },
    { value: '10', label: '10 minutes', description: 'Lock after 10 minutes of inactivity' },
    { value: '15', label: '15 minutes', description: 'Lock after 15 minutes of inactivity' },
    { value: '30', label: '30 minutes', description: 'Lock after 30 minutes of inactivity' },
    { value: '60', label: '1 hour', description: 'Lock after 1 hour of inactivity' },
    { value: '120', label: '2 hours', description: 'Lock after 2 hours of inactivity' },
    { value: '240', label: '4 hours', description: 'Lock after 4 hours of inactivity' },
    { value: '480', label: '8 hours', description: 'Lock after 8 hours of inactivity' },
  ];

  useEffect(() => {
    if (isOpen) {
      setPasscode(['', '', '', '', '', '']);
      setConfirmPasscode(['', '', '', '', '', '']);
      setStep(1);
      setError('');
      setTimeout('5');
      
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handlePasscodeChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    
    if (mode === 'set' && step === 1) {
      const newPasscode = [...passcode];
      newPasscode[index] = value.slice(-1);
      setPasscode(newPasscode);
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
      
      const isComplete = newPasscode.every(d => d !== '');
      if (isComplete) {
        setStep(2);
        setTimeout(() => {
          inputRefs.current[6]?.focus();
        }, 100);
      }
    } 
    else if (mode === 'set' && step === 2) {
      const newConfirmPasscode = [...confirmPasscode];
      newConfirmPasscode[index - 6] = value.slice(-1);
      setConfirmPasscode(newConfirmPasscode);
      
      if (value && index - 6 < 5) {
        inputRefs.current[index + 1]?.focus();
      }
      
      const isComplete = newConfirmPasscode.every(d => d !== '');
      if (isComplete) {
        const code1 = passcode.join('');
        const code2 = newConfirmPasscode.join('');
        
        if (code1 === code2) {
          onSetPasscode(code1, parseInt(timeout));
        } else {
          setError('Passcodes do not match');
          setPasscode(['', '', '', '', '', '']);
          setConfirmPasscode(['', '', '', '', '', '']);
          setStep(1);
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
        }
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const renderTimeoutOption = (option) => (
    <div className="flex items-center gap-2">
      <Clock size={16} className="text-zinc-500" />
      <div>
        <div className="font-medium">{option.label}</div>
        <div className="text-xs text-zinc-500">{option.description}</div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl max-w-md w-full p-6  border-zinc-200 dark:border-[#232529] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-black dark:text-white">
              {mode === 'set' ? 'Set Chat Lock' : 'Enter Passcode'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-[#101010] rounded-full transition-colors"
          >
            <X size={20} className="text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {mode === 'set' && step === 1 && (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6">
              Enter a 6-digit passcode to lock your chats
            </p>
            
            <div className="flex justify-center gap-3 mb-8">
              {passcode.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => inputRefs.current[idx] = el}
                  type={showPasscode ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePasscodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-12 text-center text-xl font-semibold border-2 border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-[#101010] text-black dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                />
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-sm font-medium text-black dark:text-white">
                Auto-lock after inactivity
              </label>
              <CustomDropdown
                options={timeoutOptions}
                value={timeout}
                onChange={(value) => setTimeout(value)}
                placeholder="Select timeout..."
                icon={Clock}
                renderOption={renderTimeoutOption}
                searchable={false}
              />
            </div>

            <button
              onClick={() => setShowPasscode(!showPasscode)}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mx-auto hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPasscode ? 'Hide' : 'Show'} passcode
            </button>
          </>
        )}

        {mode === 'set' && step === 2 && (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6">
              Confirm your 6-digit passcode
            </p>
            
            <div className="flex justify-center gap-3 mb-8">
              {confirmPasscode.map((digit, idx) => (
                <input
                  key={idx + 6}
                  ref={el => inputRefs.current[idx + 6] = el}
                  type={showPasscode ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePasscodeChange(idx + 6, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx + 6, e)}
                  className="w-12 h-12 text-center text-xl font-semibold border-2 border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-[#101010] text-black dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                />
              ))}
            </div>

            <button
              onClick={() => setShowPasscode(!showPasscode)}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mx-auto hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPasscode ? 'Hide' : 'Show'} passcode
            </button>
          </>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}