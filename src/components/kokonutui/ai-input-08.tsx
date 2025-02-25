"use client";

import { Loader2, Mic, StopCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIInputProps {
    isRecording?: boolean;
    isConnecting?: boolean;
    onToggleRecording?: () => void;
}

export default function AIInput_08({ 
    isRecording = false, 
    isConnecting = false,
    onToggleRecording 
}: AIInputProps) {
    const [time, setTime] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [isDemo, setIsDemo] = useState(!onToggleRecording); // Only use demo mode if no toggle handler

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Timer functionality
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isRecording) {
            intervalId = setInterval(() => {
                setTime((t) => t + 1);
            }, 1000);
        } else {
            setTime(0);
        }

        return () => clearInterval(intervalId);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    /**
     * Demo animation - only used when no real functionality is provided
     */
    useEffect(() => {
        if (!isDemo) return;

        let timeoutId: NodeJS.Timeout;
        const runAnimation = () => {
            setIsDemo(true); // Keep demo mode active
            setTime(0); // Reset timer for demo
            
            // Fake recording for 3 seconds
            let demoRecording = true;
            setTime(0);
            
            // Start recording animation
            const recordingInterval = setInterval(() => {
                setTime(t => t + 1);
            }, 1000);
            
            // Stop after 3 seconds
            timeoutId = setTimeout(() => {
                clearInterval(recordingInterval);
                demoRecording = false;
                setTime(0);
                
                // Restart demo after a pause
                timeoutId = setTimeout(runAnimation, 2000);
            }, 3000);
        };

        const initialTimeout = setTimeout(runAnimation, 1000);
        return () => {
            clearTimeout(timeoutId);
            clearTimeout(initialTimeout);
        };
    }, [isDemo]);

    const handleClick = () => {
        if (isDemo) {
            // If in demo mode, just disable demo mode
            setIsDemo(false);
        } else if (onToggleRecording) {
            // If real functionality is provided, use it
            onToggleRecording();
        }
    };

    // Determine if we're in a recording or connecting state
    const showRecording = isDemo || isRecording;
    const isDisabled = isConnecting;

    return (
        <div className="w-full py-4">
            <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
                <button
                    className={cn(
                        "group w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
                        showRecording
                            ? "bg-red-500/10"
                            : "bg-none hover:bg-black/10 dark:hover:bg-white/10",
                        isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    type="button"
                    onClick={handleClick}
                    disabled={isDisabled}
                >
                    {isConnecting ? (
                        <Loader2 className="w-6 h-6 text-black/70 dark:text-white/70 animate-spin" />
                    ) : showRecording ? (
                        <StopCircle className="w-6 h-6 text-red-500" />
                    ) : (
                        <Mic className="w-6 h-6 text-black/70 dark:text-white/70" />
                    )}
                </button>

                <span
                    className={cn(
                        "font-mono text-sm transition-opacity duration-300",
                        showRecording
                            ? "text-black/70 dark:text-white/70"
                            : "text-black/30 dark:text-white/30"
                    )}
                >
                    {formatTime(time)}
                </span>

                <div className="h-4 w-64 flex items-center justify-center gap-0.5">
                    {[...Array(48)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-0.5 rounded-full transition-all duration-300",
                                showRecording
                                    ? "bg-black/50 dark:bg-white/50 animate-pulse"
                                    : "bg-black/10 dark:bg-white/10 h-1"
                            )}
                            style={
                                showRecording && isClient
                                    ? {
                                          height: `${20 + Math.random() * 80}%`,
                                          animationDelay: `${i * 0.05}s`,
                                      }
                                    : undefined
                            }
                        />
                    ))}
                </div>

                <p className="h-4 text-xs text-black/70 dark:text-white/70">
                    {isConnecting ? "Connecting..." : 
                     showRecording ? "Listening..." : 
                     "Click to speak"}
                </p>
            </div>
        </div>
    );
}
