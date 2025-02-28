import { RealtimeTranscriber, type RealtimeTranscript } from "assemblyai";
import { getAssemblyToken } from "@/services/assemblyai/get-assembly-token";
import type { Dispatch, SetStateAction } from "react";

export async function createTranscriber(
	setTranscribedText: Dispatch<SetStateAction<string>>,
): Promise<RealtimeTranscriber | undefined> {
	const token = await getAssemblyToken();

	const transcriber = new RealtimeTranscriber({
		sampleRate: 48_000,
		token: token,

		endUtteranceSilenceThreshold: 1000,
		encoding: "pcm_s16le",
	});

	transcriber.on("open", ({ sessionId }) => {
		console.log(`Transcriber opened with session ID: ${sessionId}`);
	});

	transcriber.on("error", (error: Error) => {
		console.error("Transcriber error:", error);
		// TODO: close transcriber
		// await transcriber.close();
	});

	transcriber.on("close", (code: number, reason: string) => {
		console.log(`Transcriber closed with code ${code} and reason: ${reason}`);
		// TODO: clean up
		// transcriber = null;
	});

	transcriber.on("transcript.partial", (transcript: RealtimeTranscript) => {
		console.log("🚀 ~ transcriber.on ~ transcript:", transcript);

		if (!transcript.text) {
			//   console.error('Transcript is empty');
			return;
		}
		console.log("🚀 ~ transcriber.on ~ transcript partial:", transcript);

		// texts.push(transcript.text);
		// console.log("🚀 ~ transcriber.on ~ texts:", texts);
		setTranscribedText(transcript.text);
	});

	transcriber.on("transcript.final", (transcript: RealtimeTranscript) => {
		console.log("🚀 ~ transcriber.on ~ transcript:", transcript);

		if (!transcript.text) {
			//   console.error('Transcript is empty');
			return;
		}

		// Detect if we're asking something for the LLM

		console.log("[Transcript] Final:", transcript.text);
		setTranscribedText(transcript.text);
	});

	return transcriber;
}
