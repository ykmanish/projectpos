// components/LockPasscodeModal.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Lock, Clock, Eye, EyeOff, ChevronLeft, Shield, Key } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

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

// ─── Passcode Input Component ─────────────────────────────────────
const PasscodeInput = ({ value, onChange, onKeyDown, index, showPasscode, inputRef }) => {
  return (
    <input
      ref={inputRef}
      type={showPasscode ? 'text' : 'password'}
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(index, e.target.value)}
      onKeyDown={(e) => onKeyDown(index, e)}
      className="w-14 h-14 text-center text-2xl font-extrabold border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
    />
  );
};

// ─── Step Indicator Component ─────────────────────────────────────
const StepIndicator = ({ currentStep, totalSteps = 2 }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i + 1 === currentStep
              ? 'w-8 bg-black'
              : i + 1 < currentStep
              ? 'w-4 bg-black/30'
              : 'w-4 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
};

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
      const prevIndex = index - 1;
      inputRefs.current[prevIndex]?.focus();
      
      // Clear the previous digit
      if (mode === 'set' && step === 1) {
        const newPasscode = [...passcode];
        newPasscode[prevIndex] = '';
        setPasscode(newPasscode);
      } else if (mode === 'set' && step === 2) {
        const newConfirmPasscode = [...confirmPasscode];
        newConfirmPasscode[prevIndex - 6] = '';
        setConfirmPasscode(newConfirmPasscode);
      }
    }
  };

  const renderTimeoutOption = (option) => (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
        <Clock size={16} className="text-gray-600" />
      </div>
      <div>
        <div className="font-medium text-sm text-gray-900">{option.label}</div>
        <div className="text-xs text-gray-400">{option.description}</div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  const palette = getCardPalette('Lock');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
          
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'set' ? 'Chat Lock' : 'Enter Passcode'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6">
          {/* Info Card */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                <Shield size={24} style={{ color: palette.text }} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: palette.text }}>
                  {mode === 'set' ? 'Secure Your Chats' : 'Unlock Your Chats'}
                </h3>
                <p className="text-sm mt-1" style={{ color: palette.sub }}>
                  {mode === 'set' 
                    ? 'Set a 6-digit passcode to lock your private conversations'
                    : 'Enter your 6-digit passcode to access locked chats'}
                </p>
              </div>
            </div>
          </div>

          {/* Step Indicator (only for set mode) */}
          {mode === 'set' && <StepIndicator currentStep={step} />}

          {/* Passcode Input Area */}
          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {mode === 'set' && step === 1 && (
                <>
                  {passcode.map((digit, idx) => (
                    <PasscodeInput
                      key={`pass-${idx}`}
                      index={idx}
                      value={digit}
                      onChange={handlePasscodeChange}
                      onKeyDown={handleKeyDown}
                      showPasscode={showPasscode}
                      inputRef={(el) => (inputRefs.current[idx] = el)}
                    />
                  ))}
                </>
              )}

              {mode === 'set' && step === 2 && (
                <>
                  {confirmPasscode.map((digit, idx) => (
                    <PasscodeInput
                      key={`confirm-${idx}`}
                      index={idx + 6}
                      value={digit}
                      onChange={handlePasscodeChange}
                      onKeyDown={handleKeyDown}
                      showPasscode={showPasscode}
                      inputRef={(el) => (inputRefs.current[idx + 6] = el)}
                    />
                  ))}
                </>
              )}

              {mode === 'unlock' && (
                <>
                  {passcode.map((digit, idx) => (
                    <PasscodeInput
                      key={`unlock-${idx}`}
                      index={idx}
                      value={digit}
                      onChange={handlePasscodeChange}
                      onKeyDown={handleKeyDown}
                      showPasscode={showPasscode}
                      inputRef={(el) => (inputRefs.current[idx] = el)}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 rounded-2xl">
                <p className="text-sm text-red-600 text-center font-medium">{error}</p>
              </div>
            )}

            {/* Show/Hide Toggle */}
            <button
              onClick={() => setShowPasscode(!showPasscode)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mx-auto"
            >
              {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPasscode ? 'Hide' : 'Show'} passcode
            </button>
          </div>

          {/* Timeout Selection (only for set mode, step 1) */}
          {mode === 'set' && step === 1 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 px-1">
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
              <p className="text-xs text-gray-400 px-1">
                Chat will automatically lock after this period of inactivity
              </p>
            </div>
          )}

          {/* Instruction Text */}
          <div className="p-4 bg-gray-50 rounded-2xl">
            <p className="text-xs text-gray-400 text-center">
              {mode === 'set' && step === 1 && 'Enter a 6-digit passcode to secure your chats'}
              {mode === 'set' && step === 2 && 'Re-enter your passcode to confirm'}
              {mode === 'unlock' && 'Enter your 6-digit passcode to continue'}
            </p>
          </div>
        </div>
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