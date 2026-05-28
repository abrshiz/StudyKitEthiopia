import { apiFetch } from "./client";

export async function fetchYoutubeTranscript(url: string) {
  return apiFetch<{
    videoId: string;
    language: string;
    transcript: string;
    length: number;
  }>("/youtube/transcript", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}
