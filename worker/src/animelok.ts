import type { ResolvedVideo, TrackOption } from "./types";

const BASE_URL = "https://animelok.cc";
const SHORT_LINK = "https://short.icu/";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.6",
};

type UpstreamServer = {
  source?: string;
  server?: string;
  type?: string;
  language?: string | null;
  url?: string;
};

type AnimelokResponse = {
  servers?: UpstreamServer[];
};

function formatEmbedUrl(server: UpstreamServer, track: TrackOption): string | null {
  if (!server.url) return null;
  let url = server.url.startsWith(SHORT_LINK)
    ? `https://player.abyssplayer.com/${server.url.slice(SHORT_LINK.length)}`
    : server.url;

  if (server.source === "reanime" && track === "dub") {
    url += `${url.includes("?") ? "&" : "?"}a=1`;
  }
  return url;
}

export async function resolveAnimelok(
  anilistId: number | string,
  episode = 1,
  trackPreference: TrackOption = "sub"
): Promise<ResolvedVideo | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/anilist/${anilistId}/${episode}`, { headers: HEADERS });
    if (!res.ok) return null;

    const data: AnimelokResponse = await res.json();
    if (!data.servers || !Array.isArray(data.servers)) return null;

    const targetTrack = trackPreference === "dub" ? "dub" : "sub";

    // Filter servers for matching track preference
    let matchingServers = data.servers.filter((server) => {
      if (!server.url) return false;
      if (server.type === targetTrack) return true;
      if (server.type !== "sub" && server.type !== "dub") return true;
      return false;
    });

    if (matchingServers.length === 0 && data.servers.length > 0) {
      matchingServers = data.servers.filter((s) => !!s.url);
    }

    if (matchingServers.length === 0) return null;

    const chosenServer = matchingServers[0];
    const embedUrl = formatEmbedUrl(chosenServer, trackPreference);

    if (!embedUrl) return null;

    return {
      type: "embed",
      provider: "animelok",
      embedUrl,
    };
  } catch (err) {
    return null;
  }
}
