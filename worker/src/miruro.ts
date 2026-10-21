import type { ResolvedVideo, TrackOption } from "./types";

const MIRURO_URL = "https://www.miruro.to";
const CATALOG_URL = `${MIRURO_URL}/api/v1`;
const CATALOG_KEY = new TextEncoder().encode("miruro/catalog");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  Referer: `${MIRURO_URL}/`,
};

type CatalogEntry = {
  id: string;
  format: string | null;
  external_ids?: { anilist?: string[] };
};

type PlaybackServer = {
  server: string;
  headers?: Record<string, string>;
  streams: { url: string; format: string }[];
};

type PlaybackProvider = {
  provider: string;
  subtitles?: { file: string; lang?: string; label?: string }[];
  servers: PlaybackServer[];
};

type Playback = {
  tracks: { track: string; providers: PlaybackProvider[] }[];
};

async function inflateGzip(buf: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  await writer.write(buf);
  await writer.close();
  const response = new Response(ds.readable);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function decodeCatalog<T>(contentType: string | null, bodyUint8: Uint8Array): Promise<T> {
  if (!contentType?.startsWith("application/octet-stream")) {
    return JSON.parse(new TextDecoder().decode(bodyUint8));
  }
  const body = new Uint8Array(bodyUint8);
  for (let i = 0; i < body.length; i++) {
    body[i] ^= CATALOG_KEY[i % CATALOG_KEY.length];
  }
  const decompressed = await inflateGzip(body);
  return JSON.parse(new TextDecoder().decode(decompressed));
}

async function catalogFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${CATALOG_URL}/${path}`, { headers: HEADERS });
    if (!res.ok) return null;
    const bodyUint8 = new Uint8Array(await res.arrayBuffer());
    return await decodeCatalog<T>(res.headers.get("content-type"), bodyUint8);
  } catch (err) {
    return null;
  }
}

async function lookupCatalogEntry(anilistId: number | string): Promise<CatalogEntry | null> {
  const id = Number(anilistId);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const res = await catalogFetch<{ data: CatalogEntry[] }>(`anime?anilist_id_in=${id}&limit=100`);
  if (!res || !Array.isArray(res.data)) return null;

  const match = res.data.find((item) => item.external_ids?.anilist?.includes(String(id)));
  return match ? { id: match.id, format: match.format } : null;
}

export async function resolveMiruro(
  anilistId: number | string,
  episode = 1,
  trackPreference: TrackOption = "sub"
): Promise<ResolvedVideo | null> {
  try {
    const entry = await lookupCatalogEntry(anilistId);
    if (!entry) return null;

    const playback = await catalogFetch<Playback>(`anime/${entry.id}/episodes/${episode}/play`);
    if (!playback || !Array.isArray(playback.tracks)) return null;

    const targetTrack = trackPreference === "dub" ? "dub" : "sub";

    // Find matching track, or fallback to any track if target not found
    let selectedTrackObj = playback.tracks.find((t) => t.track.toLowerCase() === targetTrack);
    if (!selectedTrackObj && playback.tracks.length > 0) {
      selectedTrackObj = playback.tracks[0];
    }

    if (!selectedTrackObj || !selectedTrackObj.providers.length) return null;

    for (const provider of selectedTrackObj.providers) {
      for (const server of provider.servers) {
        if (!server.streams || server.streams.length === 0) continue;

        const stream = server.streams.find((s) => s.format === "hls") || server.streams[0];
        if (stream && stream.url) {
          const format = stream.format === "hls" ? "hls" : "mp4";
          return {
            type: "stream",
            provider: "miruro",
            url: stream.url,
            format,
            headers: server.headers,
            subtitles: provider.subtitles?.map((s) => ({
              file: s.file,
              label: s.label || s.lang || "Subtitle",
            })),
          };
        }
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}
