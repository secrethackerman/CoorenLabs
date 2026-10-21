# Anime Player Cloudflare Worker (Miruro + Animelok)

A lightweight, standalone Cloudflare Worker that resolves anime video streams using **Miruro** with fallback to **Animelok**, and renders an embedded video player (powered by Plyr and HLS.js or responsive embed iframe).

## Features

- **AniList ID Resolution**: Pass any AniList anime ID directly.
- **Miruro & Animelok Fallback**: Automatically attempts Miruro resolution first; if video is unavailable, seamlessly falls back to Animelok.
- **Sub / Dub Selection**: Seamlessly specify subtitled (`&ub=s`) or dubbed (`&ub=d`) tracks via URL query parameters.
- **Embedded Player**: Renders an HTML5 video player (Plyr.js with HLS stream support and subtitle tracks) or responsive iframe player.
- **JSON Endpoint Option**: Optional `&format=json` query parameter to return raw stream details instead of HTML.

---

## URL Structure & Examples

### 1. Path-based Routes (Recommended)

- `GET /:anilistId`
  *Plays Episode 1 (subbed by default)*
  Example: `https://worker.domain.com/21`

- `GET /:anilistId/:episode`
  *Plays specified Episode (subbed by default)*
  Example: `https://worker.domain.com/21/2`

- `GET /:anilistId/:episode?ub=s` or `?ub=d`
  *Plays specified Episode with Subbed (`ub=s`) or Dubbed (`ub=d`) preference*
  Example: `https://worker.domain.com/21/1?ub=d`

### 2. Query Parameter Route

- `GET /player?id=:anilistId&ep=:episode&ub=s`
  Example: `https://worker.domain.com/player?id=21&ep=1&ub=s`

---

## Query Parameters

| Parameter | Options | Default | Description |
|-----------|---------|---------|-------------|
| `ub` (or `track`) | `s` (Subbed), `d` (Dubbed) | `s` | Language track preference. |
| `ep` (or `episode`) | Integer (e.g. `1`, `2`, `12`) | `1` | Episode number. |
| `format` | `json` | (HTML player) | Set `format=json` to return JSON payload with resolved video URL instead of rendering HTML player. |

---

## Development & Deployment

### Prerequisites

- Node.js / Bun installed
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Local Testing

1. Install dependencies:
   ```bash
   cd worker
   bun install
   ```

2. Run local development server:
   ```bash
   bun run dev
   ```

3. Test in your browser:
   `http://localhost:8787/21?ub=s`

### Type Checking

```bash
bun run typecheck
```

### Deployment to Cloudflare Workers

Deploy directly to your Cloudflare account using Wrangler:

```bash
bun run deploy
```
