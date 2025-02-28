"use client";

import { createMicrophone } from "@/lib";
import { createTranscriber } from "@/services/assemblyai/create-transcriber";

import type { RealtimeTranscriber } from "assemblyai";
import {
	useState,
	useCallback,
	type Dispatch,
	type SetStateAction,
} from "react";

interface AudioRecorderReturn {
	isRecording: boolean;
	transcriber: RealtimeTranscriber | undefined;
	initializeAssemblyAI: () => Promise<void>;
	toggleRecording: () => void;
	transcribedText: string;
	updateTranscribedText: Dispatch<SetStateAction<string>>;
	isConnecting: boolean;
	recordingOff: () => void;
	notConnected: () => void;
}

export function useAudioRecorder(): AudioRecorderReturn {
	const [transcribedText, setTranscribedText] = useState<string>("");

	console.log("🚀 ~ useAudioRecorder ~ transcribedText:", transcribedText);

	const [isRecording, setIsRecording] = useState<boolean>(false);
	const [isConnecting, setIsConnecting] = useState<boolean>(false);
	const [transcriber, setTranscriber] = useState<
		RealtimeTranscriber | undefined
	>(undefined);
	const [mic, setMic] = useState<
		| {
				startRecording(
					onAudioCallback: (buffer: Uint8Array) => void
				): Promise<void>;
				stopRecording(): void;
		  }
		| undefined
	>(undefined);

	const recordingOff = () => setIsRecording(false);
	const notConnected = () => setIsConnecting(false);
	const updateTranscribedText: Dispatch<SetStateAction<string>> =
		setTranscribedText;

	const initializeAssemblyAI = useCallback(async () => {
		const getMicrophoneStream = async () => {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 48_000, // Match AssemblyAI's expected sample rate
					channelCount: 1, // Mono audio is better for speech recognition
				},
			});

			console.log("🚀 ~ getMicrophoneStream ~ stream:", stream);

			return stream;
		};
		const mediaStream = await getMicrophoneStream();
		const transcriberInstance = await createTranscriber(setTranscribedText);

		if (!transcriberInstance) {
			console.error("Transcriber is not created");
			return;
		}
		await transcriberInstance.connect();
		setIsConnecting(true);
		if (!mediaStream) {
			console.error("No media stream found");
			return;
		}
		const mic = createMicrophone(mediaStream);

		mic.startRecording((audioData: Uint8Array) => {
			console.log("🚀 ~ mic.startRecording ~ audioData:", audioData);

			// @ts-ignore
			transcriberInstance.sendAudio(audioData);
		});
		setIsConnecting(false);
		setIsRecording(true);
		setMic(mic);
		setTranscriber(transcriberInstance);
	}, []);

	const toggleRecording = useCallback(async () => {
		if (isRecording) {
			setIsRecording(false);
			setIsConnecting(false);
			mic?.stopRecording();
			await transcriber?.close(false);
			// setMic(undefined);
			// setTranscriber(undefined);
		} else {
			initializeAssemblyAI();
		}
	}, [isRecording, initializeAssemblyAI, mic, transcriber]);

	return {
		isRecording,
		transcriber,
		initializeAssemblyAI,
		toggleRecording,
		transcribedText,
		updateTranscribedText,
		recordingOff,
		notConnected,
		isConnecting,
	};
}
