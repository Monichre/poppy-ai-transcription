"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FileText, Languages, Loader2, Mic, Search, SendIcon, StopCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcriptionService } from "@/services/assemblyai/transcription";

const QuickActions = [
    {
        action: "Search the web",
        icon: Search,
        gradient: "from-zinc-900/50 to-black/50",
        hoverGradient: "hover:from-zinc-800/50 hover:to-zinc-900/50",
    },
    {
        action: "Summarize this article",
        icon: FileText,
        gradient: "from-zinc-900/50 to-black/50",
        hoverGradient: "hover:from-zinc-800/50 hover:to-zinc-900/50",
    },
    {
        action: "Translate this text",
        icon: Languages,
        gradient: "from-zinc-900/50 to-black/50",
        hoverGradient: "hover:from-zinc-800/50 hover:to-zinc-900/50",
    },
];

export function MultimodalInput() {
    const [input, setInput] = useState("");
    const [isTranscribing, setIsTranscribing] = useState(false);
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
    
    // Update input when there's a recording error
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
    
    // Handle recording toggle
    const handleToggleRecording = useCallback(async () => {
        setError(null);
        
        if (isRecording) {
            // Stop recording
            stopRecording();
            setIsTranscribing(false);
            
            // Disconnect from transcription service
            if (isConnectedRef.current) {
                await transcriptionService.disconnect();
                isConnectedRef.current = false;
            }
        } else {
            // Clear input field when starting new recording
            setInput("");
            
            // Start the connection process
            setIsConnecting(true);
            setIsTranscribing(true);
            
            try {
                // Connect to transcription service
                const connected = await transcriptionService.connect({
                    onPartialTranscript: (text) => {
                        setInput(text);
                    },
                    onFinalTranscript: (text) => {
                        setInput(text);
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
                    setIsTranscribing(false);
                }
            } catch (err) {
                setError('Error initializing: ' + (err instanceof Error ? err.message : String(err)));
                setIsTranscribing(false);
            } finally {
                setIsConnecting(false);
            }
        }
    }, [isRecording, startRecording, stopRecording]);

    function handleSubmit() {
        if (input.length > 0) {
            console.log("Sending message:", input);
        }
        setInput("");
    }

    return (
        <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto">
            <div className="relative bg-zinc-900 rounded-xl border border-zinc-800">
                <Textarea
                    placeholder={isTranscribing ? "Listening..." : "What would you like to do?"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    className={cn(
                        "w-full px-4 py-3",
                        "resize-none",
                        "bg-transparent",
                        "border-none",
                        "text-zinc-100 text-base",
                        "focus:outline-none",
                        "focus-visible:ring-0 focus-visible:ring-offset-0",
                        "placeholder:text-zinc-500 placeholder:text-base",
                        "min-h-[60px]",
                        isTranscribing && "cursor-not-allowed opacity-80"
                    )}
                    disabled={isTranscribing}
                />
                <div className="flex items-center justify-end gap-2 p-3">
                    {/* Voice Recording Button */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleRecording}
                        disabled={isConnecting}
                        className={cn(
                            "rounded-full w-8 h-8",
                            isRecording && "bg-red-500/10 text-red-500",
                            isConnecting && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isRecording ? (
                            <StopCircle className="w-4 h-4" />
                        ) : (
                            <Mic className="w-4 h-4" />
                        )}
                    </Button>
                    
                    {/* Send Button */}
                    <Button
                        className={cn(
                            "px-1.5 py-1.5 h-6 rounded-lg text-sm transition-colors hover:bg-zinc-800 flex items-center justify-between gap-1",
                            "text-zinc-800",
                            "disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                        )}
                        disabled={input.length === 0 || isTranscribing}
                        onClick={handleSubmit}
                    >
                        <SendIcon className="w-4 h-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-500 text-xs">{error}</p>
                </div>
            )}

            <div className="grid sm:grid-cols-3 gap-2 w-full">
                {QuickActions.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{
                                delay: 0.1 * index,
                                duration: 0.4,
                                ease: "easeOut",
                            }}
                            key={index}
                            className={`${
                                index > 1 ? "hidden sm:block" : "block"
                            } h-full`}
                        >
                            <button
                                type="button"
                                className="group w-full h-full text-left rounded-lg p-2.5
                                    bg-zinc-900 hover:bg-zinc-800
                                    border border-zinc-800 hover:border-zinc-700
                                    transition-colors duration-300
                                    flex flex-col justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-zinc-800 border border-zinc-700">
                                        <Icon
                                            size={14}
                                            className="text-zinc-100"
                                        />
                                    </div>
                                    <div className="text-xs text-zinc-100 font-medium">
                                        {item.action}
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
