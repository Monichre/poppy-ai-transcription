import client from "@/services/assemblyai/client";

export async function POST() {
	const token = await client.realtime.createTemporaryToken({
		expires_in: 1000000,
	});

	return Response.json(token);
}
