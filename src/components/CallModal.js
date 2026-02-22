'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';

export default function CallModal({
  isOpen,
  onClose,
  callType,
  callStatus,
  remoteUser,
  localStream,
  remoteStream,
  onMuteToggle,
  onSpeakerToggle,
  onEndCall,
  isMuted,
  isSpeakerOn,
  callDuration,
  isIncomingCall,
  onAcceptCall,
  onRejectCall
}) {
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (callStatus === 'connected') {
      const resetTimer = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      };

      resetTimer();

      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }
  }, [callStatus]);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  if (!isOpen) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'calling': return 'Calling...';
      case 'ringing': return 'Ringing...';
      case 'connecting': return 'Connecting...';
      case 'connected': return formatDuration(callDuration);
      case 'ended': return 'Call Ended';
      case 'rejected': return 'Call Rejected';
      case 'failed': return 'Call Failed';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Remote Video (main) */}
        <div className="relative aspect-video bg-black">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#34A853] to-[#1a73e8] flex items-center justify-center text-4xl font-bold mb-4">
                {remoteUser?.userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <h2 className="text-2xl font-semibold mb-2">{remoteUser?.userName}</h2>
              <p className="text-gray-300">{getStatusText()}</p>
            </div>
          )}

          {/* Local Video (picture-in-picture) */}
          {localStream && (
            <div className="absolute bottom-4 right-4 w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call Controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => callStatus === 'connected' && setShowControls(false)}
          >
            <div className="flex items-center justify-center gap-4">
              {/* Mute Button */}
              <button
                onClick={onMuteToggle}
                className={`p-4 rounded-full transition-all ${
                  isMuted
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                }`}
              >
                {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
              </button>

              {/* Speaker Button */}
              <button
                onClick={onSpeakerToggle}
                className={`p-4 rounded-full transition-all ${
                  !isSpeakerOn
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                }`}
              >
                {isSpeakerOn ? <Volume2 size={24} className="text-white" /> : <VolumeX size={24} className="text-white" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={onEndCall}
                className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-all transform hover:scale-110"
              >
                <PhoneOff size={24} className="text-white" />
              </button>
            </div>
          </div>

          {/* Incoming Call UI */}
          {isIncomingCall && callStatus === 'ringing' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#34A853] to-[#1a73e8] flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 animate-pulse">
                  {remoteUser?.userName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">{remoteUser?.userName}</h3>
                <p className="text-gray-300 mb-6">Incoming {callType} call...</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={onAcceptCall}
                    className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
                  >
                    <Phone size={20} />
                    Accept
                  </button>
                  <button
                    onClick={onRejectCall}
                    className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
                  >
                    <PhoneOff size={20} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Close Button (for ended calls) */}
          {(callStatus === 'ended' || callStatus === 'rejected' || callStatus === 'failed') && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all"
            >
              <X size={20} className="text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}