import { mergeBuffers } from "@/utils";

export function createMicrophone(stream: MediaStream) {
	let audioWorkletNode: AudioWorkletNode;
	let audioContext: AudioContext;
	let source: MediaStreamAudioSourceNode;
	let audioBufferQueue = new Int16Array(0);
	return {
		async startRecording(onAudioCallback: (buffer: Uint8Array) => void) {
			try {
				audioContext = new AudioContext({
					sampleRate: 48_000,
					latencyHint: "balanced",
				});
				source = audioContext.createMediaStreamSource(stream);

				await audioContext.audioWorklet.addModule("audio-processor.js");
				audioWorkletNode = new AudioWorkletNode(
					audioContext,
					"audio-processor",
				);

				source.connect(audioWorkletNode);
				audioWorkletNode.connect(audioContext.destination);
				audioWorkletNode.port.onmessage = (event) => {
					const currentBuffer = new Int16Array(event.data.audio_data);
					audioBufferQueue = mergeBuffers(audioBufferQueue, currentBuffer);

					const bufferDuration =
						(audioBufferQueue.length / audioContext.sampleRate) * 1000;

					// wait until we have 100ms of audio data
					if (bufferDuration >= 100) {
						const totalSamples = Math.floor(audioContext.sampleRate * 0.1);

						const finalBuffer = new Uint8Array(
							audioBufferQueue.subarray(0, totalSamples).buffer,
						);

						audioBufferQueue = audioBufferQueue.subarray(totalSamples);
						if (onAudioCallback) onAudioCallback(finalBuffer);
					}
				};
			} catch (error) {
				console.error("Error starting audio recording:", error);
				throw new Error(
					`Failed to start recording: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
			}
		},
		stopRecording() {
			try {
				if (stream) {
					for (const track of stream.getTracks()) {
						track.stop();
					}
				}
				if (audioContext) {
					audioContext.close();
				}
				audioBufferQueue = new Int16Array(0);
			} catch (error) {
				console.error("Error stopping recording:", error);
			}
		},
	};
}
/*

import { mergeBuffers } from "@/utils";
import { z } from "zod";

// Zod schema for the MediaStream
const MediaStreamSchema = z.instanceof(MediaStream);

// Zod schema for the audio callback function
const AudioCallbackSchema = z
	.function()
	.args(z.instanceof(Uint8Array))
	.returns(z.void());

// AudioWorkletNode type
type AudioProcessorNode = AudioWorkletNode & {
	port: MessagePort;
};

export function createMicrophone(stream: MediaStream) {
	// Validate the input stream
	// MediaStreamSchema.safeParse(stream);

	let audioWorkletNode: AudioProcessorNode;
	let audioContext: AudioContext;
	let source: MediaStreamAudioSourceNode;
	let audioBufferQueue = new Int16Array(0);

	return {
		async startRecording(onAudioCallback: (data: Uint8Array) => void) {
			// Validate the callback function

			audioContext = new AudioContext({
				sampleRate: 48_000,
				latencyHint: "balanced",
			});
			source = audioContext.createMediaStreamSource(stream);

			await audioContext.audioWorklet.addModule("audio-processor.js");
			audioWorkletNode = new AudioWorkletNode(
				audioContext,
				"audio-processor"
			) as AudioProcessorNode;

			source.connect(audioWorkletNode);
			audioWorkletNode.connect(audioContext.destination);
			audioWorkletNode.port.onmessage = (event) => {
				const currentBuffer = new Int16Array(event.data.audio_data);
				audioBufferQueue = mergeBuffers(audioBufferQueue, currentBuffer);

				const bufferDuration =
					(audioBufferQueue.length / audioContext.sampleRate) * 1000;

				// wait until we have 100ms of audio data
				if (bufferDuration >= 100) {
					const totalSamples = Math.floor(audioContext.sampleRate * 0.1);

					const finalBuffer = new Uint8Array(
						audioBufferQueue.subarray(0, totalSamples).buffer
					);

					audioBufferQueue = audioBufferQueue.subarray(totalSamples);
					if (onAudioCallback) onAudioCallback(finalBuffer);
				}
			};
		},
		stopRecording() {
			// Using for...of instead of forEach to satisfy the linter
			for (const track of stream?.getTracks() || []) {
				track.stop();
			}
			audioContext?.close();
			audioBufferQueue = new Int16Array(0);
		},
	};
}

*/
