"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import AIInput_08 from './kokonutui/ai-input-08';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { transcriptionService } from '@/services/assemblyai/transcription';
import { Loader2 } from 'lucide-react';

export function VoiceRecorder() {
  // State for transcription
  const [partialTranscript, setPartialTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get audio recording functionality
  const { 
    isRecording, 
    audioChunks,
    error: recordingError, 
    startRecording, 
    stopRecording 
  } = useAudioRecorder();

  // Track if transcription service is connected
  const isConnectedRef = useRef(false);
  
  // Update recording errors
  useEffect(() => {
    if (recordingError) {
      setError(recordingError);
    }
  }, [recordingError]);

  // Process audio chunks as they come in during recording
  useEffect(() => {
    const processAudioChunk = async (chunk: Blob) => {
      if (isConnectedRef.current) {
        await transcriptionService.sendAudio(chunk);
      }
    };

    // Process the last chunk that was added
    if (isRecording && audioChunks.length > 0 && isConnectedRef.current) {
      const lastChunk = audioChunks[audioChunks.length - 1];
      processAudioChunk(lastChunk);
    }
  }, [audioChunks, isRecording]);
  
  // Handle recording state changes
  const handleToggleRecording = useCallback(async () => {
    setError(null);
    
    if (isRecording) {
      // Stop recording
      stopRecording();
      
      // Disconnect from transcription service
      if (isConnectedRef.current) {
        await transcriptionService.disconnect();
        isConnectedRef.current = false;
      }
    } else {
      // Start the connection process
      setIsConnecting(true);
      
      try {
        // Connect to transcription service
        const connected = await transcriptionService.connect({
          onPartialTranscript: (text) => {
            setPartialTranscript(text);
          },
          onFinalTranscript: (text) => {
            setFinalTranscript(prev => prev ? `${prev}\n${text}` : text);
            setPartialTranscript('');
          },
          onError: (error) => {
            setError(error);
          }
        });
        
        if (connected) {
          isConnectedRef.current = true;
          // Start recording audio
          await startRecording();
        } else {
          setError('Failed to connect to transcription service');
        }
      } catch (err) {
        setError('Error initializing: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsConnecting(false);
      }
    }
  }, [isRecording, startRecording, stopRecording]);

  // Reset everything
  const handleReset = useCallback(() => {
    setPartialTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
      {/* Recording Interface */}
      <div className="w-full">
        <AIInput_08 
          isRecording={isRecording} 
          onToggleRecording={handleToggleRecording}
          isConnecting={isConnecting}
        />
      </div>
      
      {/* Connecting Status */}
      {isConnecting && (
        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Connecting to transcription service...</span>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl w-full">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
      
      {/* Current Transcription */}
      {(partialTranscript || finalTranscript) && (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl w-full">
          {finalTranscript && (
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Transcription</h3>
              <p className="text-zinc-100 whitespace-pre-line">{finalTranscript}</p>
            </div>
          )}
          
          {partialTranscript && (
            <div className="mt-2">
              <p className="text-zinc-400 italic">{partialTranscript}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}