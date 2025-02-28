import { anthropic } from "@ai-sdk/anthropic";

import { streamText } from "ai";
import { z } from "zod";
import { scrapePoppyAiCompany } from "@/services/firecrawl/functions";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
	const { messages } = await req.json();

	const result = streamText({
		toolCallStreaming: true,

		model: anthropic("claude-3-7-sonnet-latest"),
		messages,
		tools: {
			// server-side tool with execute function:
			researchPoppyAI: {
				description:
					"If the user asks about Poppy AI research and provide information about Poppy AI from their website",
				parameters: z.object({
					query: z
						.string()
						.optional()
						.describe(
							"Specific aspect of Poppy AI to research (features, use cases, pricing, etc.)"
						),
				}),
				execute: async ({
					query,
				}: {
					query?: string;
				}) => {
					// Original Poppy AI research functionality
					if (query) {
						try {
							const scrapeResult = query
								? await scrapePoppyAiCompany(query)
								: await scrapePoppyAiCompany();

							if (scrapeResult.success) {
								const scrapedInfo = scrapeResult.data;
								console.log("🚀 ~ POST ~ scrapedInfo:", scrapedInfo);

								return scrapedInfo;
							}
						} catch (error) {
							console.error("Error researching Poppy AI:", error);
							return {
								error:
									error instanceof Error
										? error.message
										: "Failed to research Poppy AI",
							};
						}
					}
				},
			},

			// client-side tool that starts user interaction:
			askForConfirmation: {
				description: "Ask the user for confirmation.",
				parameters: z.object({
					message: z.string().describe("The message to ask for confirmation."),
				}),
			},
			// client-side tool that is automatically executed on the client:
		},
	});

	return result.toDataStreamResponse();
}
