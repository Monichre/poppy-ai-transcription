import client from "@/services/assemblyai/client";
import {
	AssemblyAI,
	type RealtimeTranscriber,
	type Transcript,
	type TranscriptError,
} from "assemblyai";

interface TranscriptionResult {
	text: string;
	isComplete: boolean;
}

interface TranscriptionOptions {
	apiKey?: string;
	language?: string;
	onPartialTranscript?: (text: string) => void;
	onFinalTranscript?: (text: string) => void;
	onError?: (error: string) => void;
}

export class TranscriptionService {
	private client: AssemblyAI;
	private transcriber: RealtimeTranscriber | null = null;
	private isConnected = false;

	constructor(
		apiKey: string = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || "",
	) {
		this.client = client;
		// If our imported client doesn't work, create a new one
		if (!this.client || !this.client.realtime) {
			this.client = new AssemblyAI({ apiKey });
		}
	}

	/**
	 * Initialize and connect to the real-time transcription service
	 */
	async connect(options: TranscriptionOptions = {}): Promise<boolean> {
		try {
			if (this.isConnected) {
				await this.disconnect();
			}

			// For browser environments, get token from server
			let token;
			if (typeof window !== 'undefined') {
				try {
					console.log("Fetching token from API...");
					const response = await fetch('/api/assemblyai-token');
					const data = await response.json();
					
					if (response.status !== 200) {
						console.error("Token API error:", data);
						throw new Error(data.error || data.details || "API returned error");
					}
					
					if (!data.token) {
						console.error("No token in response:", data);
						throw new Error("No token returned from API");
					}
					
					token = data.token;
					console.log("Token received successfully");
				} catch (error) {
					console.error("Error fetching token:", error);
					if (options.onError) {
						options.onError("Failed to get transcription token: " + 
							(error instanceof Error ? error.message : String(error)));
					}
					throw new Error("Could not get token for transcription");
				}
			}

			// In browser, use RealtimeTranscriber with token directly
			if (typeof window !== 'undefined' && token) {
				console.log("Initializing browser RealtimeTranscriber with token");
				// Use dynamic import for browser
				const { RealtimeTranscriber } = await import('assemblyai');
				
				// Create with token
				this.transcriber = new RealtimeTranscriber({
					token,
					sampleRate: 16000,
					language: options.language || "en",
					onTranscript: (transcript: Transcript) => {
						if (transcript.isPartial && options.onPartialTranscript) {
							options.onPartialTranscript(transcript.text);
						}
						if (!transcript.isPartial && options.onFinalTranscript) {
							options.onFinalTranscript(transcript.text);
						}
					},
					onError: (error: TranscriptError) => {
						if (options.onError) {
							options.onError(error.message);
						}
						console.error("AssemblyAI error:", error);
					}
				});
			} else {
				// Server environment uses the client approach
				console.log("Initializing server transcriber");
				
				if (!this.client || !this.client.realtime) {
					console.error("AssemblyAI client not properly initialized");
					throw new Error("AssemblyAI client not properly initialized");
				}
				
				this.transcriber = this.client.realtime.transcriber({
					sampleRate: 16000,
					language: options.language || "en",
					onTranscript: (transcript: Transcript) => {
						if (transcript.isPartial && options.onPartialTranscript) {
							options.onPartialTranscript(transcript.text);
						}
						if (!transcript.isPartial && options.onFinalTranscript) {
							options.onFinalTranscript(transcript.text);
						}
					},
					onError: (error: TranscriptError) => {
						if (options.onError) {
							options.onError(error.message);
						}
						console.error("AssemblyAI error:", error);
					},
				});
			}

			console.log("Connecting to AssemblyAI...");
			// Connect to AssemblyAI
			await this.transcriber.connect();
			console.log("Connected successfully");
			
			this.isConnected = true;
			return true;
		} catch (error) {
			if (options.onError) {
				options.onError("Failed to connect to transcription service: " + 
					(error instanceof Error ? error.message : String(error)));
			}
			console.error("Failed to connect to AssemblyAI:", error);
			return false;
		}
	}

	/**
	 * Disconnect from the transcription service
	 */
	async disconnect(): Promise<void> {
		if (this.transcriber && this.isConnected) {
			try {
				await this.transcriber.disconnect();
			} catch (error) {
				console.error("Error disconnecting from AssemblyAI:", error);
			} finally {
				this.isConnected = false;
				this.transcriber = null;
			}
		}
	}

	/**
	 * Send audio data for transcription
	 */
	async sendAudio(audioChunk: Blob): Promise<boolean> {
		if (!this.isConnected || !this.transcriber) {
			return false;
		}

		try {
			console.log("Processing audio chunk:", {
				type: audioChunk.type,
				size: audioChunk.size
			});

			// Convert blob to array buffer
			const arrayBuffer = await audioChunk.arrayBuffer();
			
			// Create audio context to properly decode the audio
			if (typeof window !== 'undefined') {
				const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
				const audioContext = new AudioContext({
					sampleRate: 16000 // Match the sample rate with what AssemblyAI expects
				});
				
				try {
					// Decode the audio data
					const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
					
					// Get the Float32Array from the first channel
					const float32Array = audioBuffer.getChannelData(0);
					
					console.log("Sending decoded audio data:", {
						length: float32Array.length,
						sampleRate: audioBuffer.sampleRate
					});
					
					// Send to transcriber
					this.transcriber.sendAudio(float32Array);
					return true;
				} catch (decodeError) {
					console.error("Failed to decode audio:", decodeError);
					
					// Fallback to direct approach if decoding fails
					console.log("Falling back to direct Float32Array conversion");
					const float32Array = new Float32Array(arrayBuffer);
					this.transcriber.sendAudio(float32Array);
					return true;
				}
			} else {
				// Server-side or fallback
				console.log("Using direct Float32Array conversion");
				const float32Array = new Float32Array(arrayBuffer);
				this.transcriber.sendAudio(float32Array);
				return true;
			}
		} catch (error) {
			console.error("Error sending audio to AssemblyAI:", error);
			return false;
		}
	}

	/**
	 * Check if currently connected to the transcription service
	 */
	isTranscriberConnected(): boolean {
		return this.isConnected;
	}
}

// Create a singleton instance
export const transcriptionService = new TranscriptionService(
	process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || "",
);
