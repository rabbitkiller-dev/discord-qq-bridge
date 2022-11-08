import axios from "axios";

export async function longUrlIntoShotUrl(url: string): Promise<{
  shortLink: string
}> {
	const response = await axios.post("https://rabbitkiller.dev/shortLinks", {
		link: url
	});
	return response.data;
}
