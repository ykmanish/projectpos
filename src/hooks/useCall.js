'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Peer from 'simple-peer';
import { v4 as uuidv4 } from 'uuid';

export default function useCall({ socket, currentUserId, friend, onMessageUpdate }) {
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connecting, connected, ended, rejected, failed
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callType, setCallType] = useState('voice');

  const peerRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const pendingCallRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const isCallActiveRef = useRef(false);
  const localStreamRef = useRef(null);
  const cleanupInProgressRef = useRef(false);

  // Get user media (audio only for now)
  const getLocalStream = useCallback(async () => {
    try {
      console.log('🎤 Requesting microphone access...');
      
      // Stop any existing stream first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        localStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }, 
        video: false 
      });
      
      console.log('✅ Microphone access granted');
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Microphone permission denied. Please allow microphone access to make calls.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('No microphone found. Please connect a microphone to make calls.');
      } else {
        alert('Failed to access microphone. Please check your audio settings.');
      }
      setCallStatus('failed');
      return null;
    }
  }, []);

  // Clean up streams and peer connection
  const cleanupCall = useCallback(() => {
    // Prevent multiple cleanup calls
    if (cleanupInProgressRef.current) {
      console.log('🧹 Cleanup already in progress, skipping...');
      return;
    }

    cleanupInProgressRef.current = true;
    console.log('🧹 Cleaning up call resources');

    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.error('Error destroying peer:', e);
      }
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping remote track:', e);
        }
      });
      setRemoteStream(null);
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    callStartTimeRef.current = null;
    setCallDuration(0);
    setIsIncomingCall(false);
    isCallActiveRef.current = false;
    
    // Reset cleanup flag after a delay
    setTimeout(() => {
      cleanupInProgressRef.current = false;
    }, 1000);
  }, [remoteStream]);

  // End call
  const endCall = useCallback(() => {
    console.log('📞 Ending call');
    
    if (socket && currentUserId && friend?.userId && isCallActiveRef.current) {
      socket.emit('call-ended', {
        roomId: [currentUserId, friend.userId].sort().join('-'),
        callerId: currentUserId,
        receiverId: friend.userId,
        timestamp: new Date().toISOString()
      });
    }

    cleanupCall();
    setCallStatus('ended');
    isCallActiveRef.current = false;
  }, [socket, currentUserId, friend, cleanupCall]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!pendingCallRef.current) {
      console.error('No pending call to accept');
      return;
    }

    console.log('📞 Accepting incoming call from:', pendingCallRef.current.callerId);
    
    // Clean up any existing call first
    cleanupCall();
    
    // Small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stream = await getLocalStream();
    if (!stream) {
      rejectCall();
      return;
    }

    try {
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ]
        }
      });

      peerRef.current = peer;
      isCallActiveRef.current = true;

      peer.on('signal', (data) => {
        console.log('📡 Sending answer signal');
        if (socket && currentUserId && friend?.userId && isCallActiveRef.current) {
          socket.emit('call-answer', {
            roomId: [currentUserId, friend.userId].sort().join('-'),
            callId: pendingCallRef.current.callId,
            callerId: pendingCallRef.current.callerId,
            receiverId: currentUserId,
            signal: data,
            timestamp: new Date().toISOString()
          });
        }
      });

      peer.on('stream', (stream) => {
        console.log('✅ Remote stream received');
        setRemoteStream(stream);
        setCallStatus('connected');
        callStartTimeRef.current = Date.now();
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        
        durationIntervalRef.current = setInterval(() => {
          if (callStartTimeRef.current) {
            setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
          }
        }, 1000);

        // Clear call timeout
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
      });

      peer.on('error', (err) => {
        console.error('❌ Peer error:', err);
        if (isCallActiveRef.current) {
          setCallStatus('failed');
          cleanupCall();
          setTimeout(() => setCallStatus('idle'), 3000);
        }
      });

      peer.on('close', () => {
        console.log('📞 Peer connection closed');
        if (isCallActiveRef.current && callStatus === 'connected') {
          endCall();
        } else {
          cleanupCall();
        }
      });

      // Signal the initial offer
      if (pendingCallRef.current.signal) {
        console.log('📡 Signaling answer to offer');
        peer.signal(pendingCallRef.current.signal);
      }

      setIsIncomingCall(false);
      setCallStatus('connecting');
    } catch (error) {
      console.error('Error creating peer:', error);
      setCallStatus('failed');
      cleanupCall();
    }
  }, [socket, currentUserId, friend, getLocalStream, cleanupCall, endCall, callStatus]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    console.log('📞 Rejecting incoming call');
    if (socket && currentUserId && friend?.userId && pendingCallRef.current) {
      socket.emit('call-rejected', {
        roomId: [currentUserId, friend.userId].sort().join('-'),
        callId: pendingCallRef.current.callId,
        callerId: pendingCallRef.current.callerId,
        receiverId: currentUserId,
        timestamp: new Date().toISOString()
      });
    }

    setIsIncomingCall(false);
    pendingCallRef.current = null;
    setCallStatus('rejected');

    setTimeout(() => {
      setCallStatus('idle');
    }, 3000);
  }, [socket, currentUserId, friend]);

  // Start a call
  const startCall = useCallback(async (type = 'voice') => {
    console.log('📞 Starting call to:', friend?.userName);
    
    // Clean up any existing call first
    cleanupCall();
    
    // Small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCallType(type);
    setCallStatus('calling');

    const stream = await getLocalStream();
    if (!stream) {
      setCallStatus('failed');
      setTimeout(() => setCallStatus('idle'), 3000);
      return;
    }

    const callId = uuidv4();
    console.log('📞 Call ID:', callId);

    try {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ]
        }
      });

      peerRef.current = peer;
      isCallActiveRef.current = true;

      peer.on('signal', (data) => {
        console.log('📡 Sending offer signal');
        if (socket && currentUserId && friend?.userId && isCallActiveRef.current) {
          socket.emit('call-user', {
            roomId: [currentUserId, friend.userId].sort().join('-'),
            callerId: currentUserId,
            receiverId: friend.userId,
            signal: data,
            callId,
            callType: type,
            timestamp: new Date().toISOString()
          });
        }
      });

      peer.on('stream', (stream) => {
        console.log('✅ Remote stream received');
        setRemoteStream(stream);
        setCallStatus('connected');
        callStartTimeRef.current = Date.now();
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        
        durationIntervalRef.current = setInterval(() => {
          if (callStartTimeRef.current) {
            setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
          }
        }, 1000);

        // Clear call timeout
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
      });

      peer.on('error', (err) => {
        console.error('❌ Peer error:', err);
        if (isCallActiveRef.current) {
          setCallStatus('failed');
          cleanupCall();
          setTimeout(() => setCallStatus('idle'), 3000);
        }
      });

      peer.on('close', () => {
        console.log('📞 Peer connection closed');
        if (isCallActiveRef.current && callStatus === 'connected') {
          endCall();
        } else {
          cleanupCall();
          if (isCallActiveRef.current) {
            setCallStatus('failed');
            setTimeout(() => setCallStatus('idle'), 3000);
          }
        }
      });

      // Set timeout for no answer (30 seconds)
      callTimeoutRef.current = setTimeout(() => {
        if (isCallActiveRef.current && (callStatus === 'calling' || callStatus === 'ringing')) {
          console.log('⏰ Call timeout - no answer');
          endCall();
        }
      }, 30000);
    } catch (error) {
      console.error('Error creating peer:', error);
      setCallStatus('failed');
      cleanupCall();
    }
  }, [socket, currentUserId, friend, getLocalStream, cleanupCall, endCall, callStatus]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      console.log(`${!isMuted ? '🔇 Muted' : '🔊 Unmuted'}`);
    }
  }, [isMuted]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(!isSpeakerOn);
    console.log(`${!isSpeakerOn ? '🔊 Speaker on' : '🎧 Speaker off'}`);
  }, [isSpeakerOn]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !friend?.userId) return;

    const roomId = [currentUserId, friend.userId].sort().join('-');

    const handleIncomingCall = (data) => {
      if (data.receiverId === currentUserId && data.roomId === roomId) {
        console.log('📞 Incoming call from:', data.callerId);
        pendingCallRef.current = data;
        setIsIncomingCall(true);
        setCallStatus('ringing');
        setCallType(data.callType || 'voice');

        // Notify via onMessageUpdate if provided
        if (onMessageUpdate) {
          onMessageUpdate({
            type: 'incoming-call',
            callerId: data.callerId,
            friendId: friend.userId
          });
        }
      }
    };

    const handleCallAnswer = (data) => {
      if (data.receiverId === currentUserId && peerRef.current && isCallActiveRef.current) {
        console.log('📞 Call answered, signaling answer');
        try {
          peerRef.current.signal(data.signal);
          setCallStatus('connecting');
        } catch (error) {
          console.error('Error signaling answer:', error);
        }
      }
    };

    const handleCallRejected = (data) => {
      if ((data.receiverId === currentUserId || data.callerId === currentUserId) && isCallActiveRef.current) {
        console.log('📞 Call rejected');
        setCallStatus('rejected');
        cleanupCall();
        setTimeout(() => setCallStatus('idle'), 3000);
      }
    };

    const handleCallEnded = (data) => {
      if ((data.receiverId === currentUserId || data.callerId === currentUserId) && isCallActiveRef.current) {
        console.log('📞 Call ended by other party');
        setCallStatus('ended');
        cleanupCall();
        setTimeout(() => setCallStatus('idle'), 3000);
      }
    };

    const handleCallRinging = (data) => {
      if ((data.receiverId === currentUserId || data.callerId === currentUserId) && isCallActiveRef.current) {
        console.log('📞 Call ringing');
        setCallStatus('ringing');
      }
    };

    const handleCallFailed = (data) => {
      if ((data.receiverId === currentUserId || data.callerId === currentUserId) && isCallActiveRef.current) {
        console.log('❌ Call failed:', data.reason);
        setCallStatus('failed');
        cleanupCall();
        setTimeout(() => setCallStatus('idle'), 3000);
        
        // Show appropriate message based on reason
        if (data.reason === 'offline') {
          alert(`${friend.userName} is offline. They'll receive a missed call notification.`);
        } else if (data.reason === 'busy') {
          alert(`${friend.userName} is currently on another call.`);
        } else if (data.reason === 'no-answer') {
          alert(`${friend.userName} didn't answer.`);
        }
      }
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-answered', handleCallAnswer);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-ringing', handleCallRinging);
    socket.on('call-failed', handleCallFailed);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-answered', handleCallAnswer);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-ringing', handleCallRinging);
      socket.off('call-failed', handleCallFailed);
      
      // Don't cleanup on unmount if call is active - let the component handle it
      if (!isCallActiveRef.current) {
        cleanupCall();
      }
    };
  }, [socket, currentUserId, friend, cleanupCall, onMessageUpdate]);

  return {
    callStatus,
    isIncomingCall,
    localStream,
    remoteStream,
    isMuted,
    isSpeakerOn,
    callDuration,
    callType,
    startCall,
    endCall,
    acceptCall,
    rejectCall,
    toggleMute,
    toggleSpeaker
  };
}