import { firecrawlApp } from "@/services/firecrawl/client";
import { z } from "zod";
export const poppyAiCompanyFirecrawlSchema = z.object({
	overview: z.string(),
	features: z.array(z.string()),
	why: z.string(),
	results: z.array(z.string()),
	faq: z.array(z.string()),
});

export const scrapePoppyAiCompany = async (
	prompt = "Extract the overview, features, why, results, and faq from the page."
) => {
	const result = await firecrawlApp.extract(["https://getpoppy.ai"], {
		prompt: prompt,
		schema: poppyAiCompanyFirecrawlSchema,
	});

	return result;
};
