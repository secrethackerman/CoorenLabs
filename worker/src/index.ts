import { resolveAnimelok } from "./animelok";
import { resolveMiruro } from "./miruro";
import { renderErrorHtml, renderPlayerHtml } from "./player";
import type { TrackOption } from "./types";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Health check endpoint
    if (pathname === "/" || pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "anime-player-worker",
          usage: "GET /:anilistId/:episode?ub=s or GET /player?id=:anilistId&ep=1&ub=d",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let anilistIdStr: string | null = null;
    let episodeNum = 1;

    // Parse route patterns
    // Pattern 1: /player?id=21&ep=1&ub=s
    if (pathname.startsWith("/player")) {
      anilistIdStr = url.searchParams.get("id") || url.searchParams.get("anilistId");
      if (url.searchParams.has("ep") || url.searchParams.has("episode")) {
        episodeNum = parseInt(url.searchParams.get("ep") || url.searchParams.get("episode") || "1", 10) || 1;
      }
    } else {
      // Pattern 2: /:anilistId or /:anilistId/:episode
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length >= 1 && /^\d+$/.test(segments[0])) {
        anilistIdStr = segments[0];
        if (segments.length >= 2 && /^\d+$/.test(segments[1])) {
          episodeNum = parseInt(segments[1], 10) || 1;
        }
      }
    }

    // Fallback search params if not specified in path
    if (!anilistIdStr && url.searchParams.has("id")) {
      anilistIdStr = url.searchParams.get("id");
    }
    if (url.searchParams.has("ep") || url.searchParams.has("episode")) {
      episodeNum = parseInt(url.searchParams.get("ep") || url.searchParams.get("episode") || "1", 10) || 1;
    }

    if (!anilistIdStr || !/^\d+$/.test(anilistIdStr)) {
      return new Response(
        renderErrorHtml("Please specify a valid AniList ID (e.g. /21 or /21/1 or /player?id=21&ep=1)", 400),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    const anilistId = parseInt(anilistIdStr, 10);

    // Track selection via &ub=s (sub) or &ub=d (dub)
    const ubParam = (url.searchParams.get("ub") || url.searchParams.get("track") || "s").toLowerCase();
    const trackPreference: TrackOption = ubParam === "d" || ubParam === "dub" ? "dub" : "sub";

    // Format query for JSON response option if requested
    const format = url.searchParams.get("format");

    // Try Miruro first
    let video = await resolveMiruro(anilistId, episodeNum, trackPreference);

    // Fall back to Animelok if Miruro yielded no source
    if (!video) {
      video = await resolveAnimelok(anilistId, episodeNum, trackPreference);
    }

    if (!video) {
      const msg = `No video stream found on Miruro or Animelok for AniList ID ${anilistId}, episode ${episodeNum} (${trackPreference.toUpperCase()}).`;
      if (format === "json") {
        return new Response(JSON.stringify({ error: msg }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(renderErrorHtml(msg, 404), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (format === "json") {
      return new Response(
        JSON.stringify({
          success: true,
          anilistId,
          episode: episodeNum,
          track: trackPreference,
          video,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const playerHtml = renderPlayerHtml(
      video,
      `Anime Player - AniList #${anilistId} EP ${episodeNum} (${trackPreference.toUpperCase()})`
    );

    return new Response(playerHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  },
};
