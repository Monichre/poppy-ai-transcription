import axios from "axios";

export const getAssemblyToken = async () => {
	const res = await axios.post(
		`${process.env.NEXT_PUBLIC_SITE_URL}/api/assembly-ai/token`
	);
	return res.data;
};
