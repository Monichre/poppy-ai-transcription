import { useState, useEffect, useCallback, useRef } from 'react';

interface AudioRecorderReturn {
  isRecording: boolean;
  audioData: Blob | null;
  audioChunks: Blob[];
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export function useAudioRecorder(): AudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to maintain instance across renders
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Cleanup function for when component unmounts or recording stops
  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);
  
  // Clean up when component unmounts
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  // Setup and start recording
  const startRecording = useCallback(async () => {
    try {
      if (isRecording) return;
      
      // Reset any previous recordings
      setAudioChunks([]);
      setAudioData(null);
      setError(null);
      
      // Get microphone access with settings optimized for speech recognition
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Match AssemblyAI's expected sample rate
          channelCount: 1    // Mono audio is better for speech recognition
        } 
      });
      
      streamRef.current = stream;
      
      // Create and setup MediaRecorder with correct audio format
      let options;
      try {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
          console.log("Using opus codec");
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
          console.log("Using webm audio format");
        } else {
          console.log("Falling back to default audio format");
          options = {};
        }
      } catch (e) {
        console.log("Error checking codec support, using default", e);
        options = {};
      }
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      
      // Handle data when available
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks(chunks => [...chunks, e.data]);
        }
      };
      
      // Handle recording stop
      recorder.onstop = () => {
        setIsRecording(false);
        
        // Create final audio blob when recording stops
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioData(audioBlob);
      };
      
      // Handle errors
      recorder.onerror = (event) => {
        setError('Recording error: ' + event.error);
        console.error('Recorder error:', event);
      };
      
      // Start recording, collect chunks frequently for real-time transcription
      recorder.start(250); // 250ms chunks for better handling
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Microphone access denied');
      cleanup();
    }
  }, [isRecording, audioChunks, cleanup]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    cleanup();
  }, [isRecording, cleanup]);
  
  // Reset recording state
  const resetRecording = useCallback(() => {
    setAudioChunks([]);
    setAudioData(null);
    setError(null);
  }, []);
  
  return {
    isRecording,
    audioData,
    audioChunks,
    error,
    startRecording,
    stopRecording,
    resetRecording
  };
}