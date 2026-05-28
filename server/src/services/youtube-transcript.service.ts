import { HttpError } from "../utils/http.js";

export type YoutubeTranscriptResult = {
  videoId: string;
  language: string;
  transcript: string;
};

export function extractYoutubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

/**
 * Fetch YouTube captions via youtube-transcript (installed in phase 3).
 * Returns 422 with a friendly message when captions are unavailable.
 */
export async function fetchYoutubeTranscript(url: string): Promise<YoutubeTranscriptResult> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) throw new HttpError(400, "Invalid YouTube URL");

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import("youtube-transcript");
    const fetcher = mod.YoutubeTranscript ?? mod.default ?? mod;
    const items = await fetcher.fetchTranscript(videoId);
    const lines = (items as Array<{ text: string }>).map((i) => i.text).filter(Boolean);
    const transcript = lines.join(" ").replace(/\s+/g, " ").trim();
    if (!transcript) {
      throw new HttpError(
        422,
        "No captions found for this video. Upload your lecture notes as a PDF instead.",
      );
    }
    return { videoId, language: "en", transcript };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(
      422,
      "Could not load captions for this video. Upload your lecture notes as a PDF instead.",
    );
  }
}
