import React, { useState, useRef, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { chatService } from '../../services/chat';

const VoiceRecorder = ({ onTranscription, disabled = false, autoSend = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const { addNotification } = useApp();

  // Start recording timer
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, []);

  // Stop recording timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  }, []);

  // Format recording time
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission with optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimized for speech recognition
          channelCount: 1,    // Mono audio for smaller file size
          sampleSize: 16      // 16-bit audio
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder with optimized settings
      let mimeType = 'audio/webm;codecs=opus';

      // Fallback to supported formats
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = ''; // Use default
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000 // Optimized bitrate for speech
      });
      
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording with optimized data collection
      mediaRecorder.start(250); // Collect data every 250ms for smoother processing
      setIsRecording(true);
      startTimer();
      
      addNotification({
        type: 'info',
        message: 'Recording started...',
        duration: 2000
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      
      let errorMessage = 'Failed to start recording';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.';
      }
      
      addNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000
      });
    }
  }, [addNotification, startTimer]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
      
      addNotification({
        type: 'info',
        message: 'Processing audio...',
        duration: 2000
      });
    }
  }, [isRecording, stopTimer, addNotification]);

  // Handle transcription
  const handleTranscription = useCallback(async (audioBlob) => {
    setIsProcessing(true);

    try {
      const data = await chatService.transcribeAudio(audioBlob);

      if (data.success) {
        onTranscription(data.transcription, data.language, autoSend);
        addNotification({
          type: 'success',
          message: `Transcription completed (${data.language})${autoSend ? ' - Sending...' : ''}`,
          duration: 3000
        });
      } else {
        throw new Error(data.message || 'Transcription failed');
      }

    } catch (error) {
      console.error('Transcription error:', error);

      // Handle specific error messages
      let errorMessage = 'Failed to transcribe audio';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      addNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onTranscription, addNotification]);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Check if MediaRecorder is supported
  const isSupported = typeof MediaRecorder !== 'undefined';

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <button
          onClick={toggleRecording}
          disabled={disabled || isProcessing}
          className={`
            relative p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105
            ${isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 shadow-lg'
              : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500 shadow-md'
            }
            ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed transform-none' : 'cursor-pointer'}
          `}
          title={isRecording ? 'Stop recording' : 'Start voice recording'}
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Mic className="w-5 h-5" />
          )}

          {/* Recording pulse animation */}
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
          )}
        </button>

        {/* Recording indicator dot */}
        {isRecording && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
        )}
      </div>

      {/* Recording time display */}
      {isRecording && (
        <div className="flex items-center space-x-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-red-600 dark:text-red-400 font-mono font-medium">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-md">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Processing...
          </span>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
