import axios from "axios";

export const getAssemblyToken = async () => {
	const res = await axios.post("http://localhost:3000/api/assembly-ai/token");
	return res.data;
};
