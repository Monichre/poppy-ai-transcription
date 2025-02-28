import { AssemblyAI } from "assemblyai";

// Only initialize the client on the server-side
const client = new AssemblyAI({
	apiKey: process.env.ASSEMBLYAI_API_KEY || "",
});

export default client;
