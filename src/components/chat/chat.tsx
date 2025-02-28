"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

import { useEffect, useState, useRef, type DragEvent } from "react";

import { useChat } from "@ai-sdk/react";

import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
	StopCircle,
	Mic,
	SendIcon,
	AlertCircle,
	Paperclip,
	X,
} from "lucide-react";
import { AudioStatus } from "@/components/chat/audio-status";
import { toast } from "sonner";
import { Messages } from "@/components/chat/messages";

type ValidationError = {
	message: string;
	hasError: boolean;
};

// Check browser compatibility
const isBrowserCompatible = () => {
	return !!(
		typeof navigator !== "undefined" &&
		navigator?.mediaDevices &&
		typeof navigator.mediaDevices.getUserMedia === "function" &&
		typeof window !== "undefined" &&
		typeof window.AudioContext === "function"
	);
};

function TextFilePreview({ file }: { file: File }) {
	const [content, setContent] = useState<string>("");

	useEffect(() => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result;
			setContent(typeof text === "string" ? text.slice(0, 100) : "");
		};
		reader.readAsText(file);
	}, [file]);

	return (
		<div>
			{content}
			{content.length >= 100 && "..."}
		</div>
	);
}

// Removed unused getTextFromDataUrl function

export default function Chat() {
	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		addToolResult,
		setInput,
	} = useChat({
		maxSteps: 5,

		streamProtocol: "data",
		// run client-side tools that are automatically executed:
		async onToolCall({ toolCall }) {
			if (toolCall.toolName === "researchPoppyAI") {
				// Use a more specific type instead of any
				const typedToolCall = toolCall as {
					toolName: string;
					parameters?: { query?: string };
				};
				const query =
					typedToolCall.parameters?.query || "Tell me all about PoppyAI";

				// Return just the query parameter for researching Poppy AI
				return {
					query,
				};
			}

			if (toolCall.toolName === "askForConfirmation") {
				// Handle the askForConfirmation tool
				// Implementation depends on your UI requirements
				return undefined;
			}

			return undefined;
		},
	});
	const {
		isRecording,
		toggleRecording,
		transcribedText,
		isConnecting,
		recordingOff,
		notConnected,
	} = useAudioRecorder();

	const [validationError] = useState<ValidationError>({
		message: "",
		hasError: false,
	});
	const [files, setFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [micPermissionError, setMicPermissionError] = useState<string | null>(
		null,
	);
	const [apiConnectionError, setApiConnectionError] = useState<string | null>(
		null,
	);
	const [browserCompatError, setBrowserCompatError] = useState<string | null>(
		null,
	);

	const resetErrors = () => {
		setMicPermissionError(null);
		setApiConnectionError(null);
		setBrowserCompatError(null);
	};
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Check browser compatibility on mount
	useEffect(() => {
		if (!isBrowserCompatible()) {
			setBrowserCompatError(
				"Your browser doesn't support audio recording features. Please use a modern browser like Chrome, Firefox, or Edge.",
			);
			toast.error("Browser compatibility issue detected");
		}
	}, []);

	useEffect(() => {
		setInput(transcribedText);
	}, [transcribedText, setInput]);

	// File upload handling functions
	const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const droppedFiles = event.dataTransfer.files;
		const droppedFilesArray = Array.from(droppedFiles);

		if (droppedFilesArray.length > 0) {
			const validFiles = droppedFilesArray.filter(
				(file) =>
					file.type.startsWith("image/") || file.type.startsWith("text/"),
			);

			if (validFiles.length === droppedFilesArray.length) {
				setFiles(validFiles);
			} else {
				toast.error("Only image and text files are allowed!");
			}
		}
		setIsDragging(false);
	};

	// Function to handle file selection via the upload button
	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	// Function to handle files selected from the file dialog
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = event.target.files;
		if (selectedFiles) {
			const validFiles = Array.from(selectedFiles).filter(
				(file) =>
					file.type.startsWith("image/") ||
					file.type.startsWith("text/") ||
					file.type === "application/pdf",
			);

			if (validFiles.length === selectedFiles.length) {
				setFiles(validFiles);
			} else {
				toast.error("Only image, text and PDF files are allowed");
			}
		}
	};

	const removeSelectedFile = (file: File) => {
		setFiles(files.filter((f) => f !== file));
	};

	// Modified toggleRecording with error handling
	const handleToggleRecording = async () => {
		// Reset previous errors
		setMicPermissionError(null);
		setApiConnectionError(null);

		if (!isBrowserCompatible()) {
			setBrowserCompatError(
				"Your browser doesn't support audio recording features. Please use a modern browser.",
			);
			toast.error("Browser compatibility issue");
			return;
		}

		try {
			await toggleRecording();
		} catch (error) {
			console.error("Recording error:", error);
			if (error instanceof Error) {
				// Check if it's a permission error
				if (
					error.message.includes("Permission") ||
					error.name === "NotAllowedError"
				) {
					setMicPermissionError(
						"Microphone access denied. Please allow microphone access in your browser settings.",
					);
					toast.error("Microphone permission denied");
				}
				// Check if it's a connection error
				else if (
					error.message.includes("network") ||
					error.message.includes("connect")
				) {
					setApiConnectionError(
						"Unable to connect to the transcription service. Please check your internet connection.",
					);
					toast.error("Connection to transcription service failed");
				}
				// Generic error
				else {
					toast.error(`Error: ${error.message}`);
				}
			} else {
				toast.error("An unknown error occurred");
			}
		}
	};

	const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		recordingOff();
		notConnected();
		setInput("");

		// Convert File array to FileList compatible format using DataTransfer
		let attachments: FileList | undefined;
		if (files.length > 0) {
			const dataTransfer = new DataTransfer();
			for (const file of files) {
				dataTransfer.items.add(file);
			}
			attachments = dataTransfer.files;
		}

		handleSubmit(e, {
			experimental_attachments: attachments,
		});
	};

	return (
		<div
			className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black dark:from-black dark:via-zinc-800/40 dark:to-black px-4"
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{/* Error messages */}
			{(micPermissionError || apiConnectionError || browserCompatError) && (
				<div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/80 text-white px-4 py-2 rounded-md shadow-lg max-w-md text-center">
					{micPermissionError || apiConnectionError || browserCompatError}
					<Button
						onClick={resetErrors}
						variant="ghost"
						size="sm"
						className="ml-2 p-1 h-6 w-6 rounded-full"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			)}

			{/* Drop area overlay */}
			{isDragging && (
				<motion.div
					className="fixed pointer-events-none bg-zinc-900/90 h-screen w-screen z-10 flex flex-col justify-center items-center gap-1"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<div className="text-white">Drag and drop files here</div>
					<div className="text-sm text-zinc-400">{"(images and text)"}</div>
				</motion.div>
			)}

			<div className="w-full p-4 flex flex-col items-center justify-center h-screen mx-auto">
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.7 }}
					className={cn("text-center mb-10", "opacity-100 scale-100")}
				>
					<h1 className="text-5xl md:text-6xl font-medium mb-4 tracking-tighter bg-clip-text bg-gradient-to-b from-black to-black/70 text-white">
						Poppy Voice Chat
					</h1>
					<p className="text-xl text-zinc-400">
						Speak or type your message - I&apos;m listening
					</p>
				</motion.div>

				<AnimatePresence>
					{messages?.length ? (
						<Messages addToolResult={addToolResult} messages={messages} />
					) : null}
				</AnimatePresence>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.7 }}
					className="w-full max-w-4xl px-4 md:px-0 mt-6"
				>
					<div className="relative backdrop-blur-xl rounded-xl">
						<div className="flex flex-col gap-4 w-full max-w-6xl mx-auto">
							{/* File preview area */}
							{files.length > 0 && (
								<div className="flex flex-row gap-2 flex-wrap">
									{files.map((file, idx) =>
										file.type.startsWith("image") ? (
											<div key={`${file.name}-${idx}`}>
												<motion.img
													src={URL.createObjectURL(file)}
													alt={file.name}
													className="rounded-md w-16 h-16 object-cover"
													initial={{ scale: 0.8, opacity: 0 }}
													animate={{ scale: 1, opacity: 1 }}
												/>
											</div>
										) : file.type.startsWith("text") ? (
											<motion.div
												key={`${file.name}-${idx}`}
												className="text-[10px] leading-tight w-28 h-16 overflow-hidden text-zinc-400 border border-zinc-700 p-2 rounded-md bg-zinc-800 relative"
												initial={{ scale: 0.8, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
											>
												<X
													className="absolute top-0 right-0"
													onClick={() => removeSelectedFile(file)}
												/>
												<TextFilePreview file={file} />
											</motion.div>
										) : null,
									)}
								</div>
							)}

							<form
								onSubmit={handleChatSubmit}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleChatSubmit(e as React.FormEvent<HTMLFormElement>);
									}
								}}
								className="relative bg-zinc-900 rounded-xl border border-zinc-800"
							>
								<Textarea
									placeholder={"Ask away"}
									value={input}
									onChange={handleInputChange}
									className={cn(
										"w-full px-4 py-3",
										"resize-none",
										"bg-transparent",
										"border-none",
										"text-zinc-100 text-base",
										"focus:outline-none",
										"focus-visible:ring-0 focus-visible:ring-offset-0",
										"placeholder:text-white placeholder:text-base",
										"min-h-[100px]",

										validationError.hasError && "border-red-500 pr-10",
									)}
								/>
								{validationError.hasError && (
									<div className="absolute right-14 top-3 text-red-500">
										<AlertCircle className="h-5 w-5" />
										<span className="sr-only">{validationError.message}</span>
									</div>
								)}
								<div className="flex items-center justify-end gap-2 p-3 absolute bottom-0 right-0 w-auto">
									{/* File Upload Button */}
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={handleUploadClick}
										className={cn(
											"rounded-full w-8 h-8 bg-neutral-800 border border-indigo-400/80 text-indigo-400",
										)}
									>
										<Paperclip className="w-4 h-4" />
										<span className="sr-only">Upload files</span>
									</Button>

									{/* Hidden file input */}
									<input
										type="file"
										ref={fileInputRef}
										className="hidden"
										multiple
										accept="image/*,.pdf,.md,.txt"
										onChange={handleFileChange}
									/>

									{/* Voice Recording Button */}
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={handleToggleRecording}
										className={cn(
											"rounded-full w-8 h-8 bg-neutral-800 border border-indigo-400/80 text-indigo-400",
											isRecording && "bg-red-500/10 text-red-500",
											isRecording && "opacity-50 cursor-not-allowed",
											browserCompatError && "opacity-50 cursor-not-allowed",
										)}
										disabled={!!browserCompatError}
									>
										{isRecording ? (
											<StopCircle className="w-4 h-4" />
										) : (
											<Mic className="w-6 h-6 text-indigo-400" />
										)}
									</Button>

									{/* Send Button */}
									<Button
										className={cn(
											"rounded-full w-8 h-8 bg-neutral-800 border border-indigo-400/80 text-indigo-400",
											"disabled:opacity-50 disabled:cursor-not-allowed",
										)}
										type="submit"
									>
										<SendIcon className="w-6 h-6 text-indigo-400" />
										<span className="sr-only">Send</span>
									</Button>
								</div>
							</form>
							{validationError.hasError && (
								<p className="text-sm text-red-500 mt-1">
									{validationError.message}
								</p>
							)}
						</div>
					</div>
				</motion.div>

				{isRecording || isConnecting ? (
					<div className="grid sm:grid-cols-1 gap-2 w-full mt-8">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							transition={{
								delay: 0.1,
								duration: 0.4,
								ease: "easeOut",
							}}
							className={"block h-full"}
						>
							<AudioStatus
								isRecording={isRecording}
								isConnecting={isConnecting}
							/>
						</motion.div>
					</div>
				) : null}
			</div>
		</div>
	);
}
