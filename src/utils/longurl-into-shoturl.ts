import axios from "axios";

export async function longUrlIntoShotUrl(url: string): Promise<{
  shortLink: string
}> {
  const response = await axios.post('http://3.17.13.157/shortLinks', {
    link: url
  })
  return response.data;
}