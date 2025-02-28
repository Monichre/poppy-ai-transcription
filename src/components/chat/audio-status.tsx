"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIInputProps {
	isRecording?: boolean;
	isConnecting?: boolean;
	onToggleRecording?: () => void;
}

export function AudioStatus({
	isRecording = false,
	isConnecting = false,
	onToggleRecording,
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

	// Determine if we're in a recording or connecting state
	const showRecording = isRecording;

	return (
		<div className="w-full py-4">
			<div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
				<span
					className={cn(
						"font-mono text-sm transition-opacity duration-300",
						showRecording
							? "text-black/70 dark:text-white"
							: "text-black/30 dark:text-white"
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
									? "bg-black/50 dark:bg-white/90 animate-pulse"
									: "bg-black/10 dark:bg-white/60 h-1"
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
					{isConnecting ? "Connecting..." : isRecording ? "Listening..." : null}
				</p>
			</div>
		</div>
	);
}
