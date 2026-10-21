# Anime Player Cloudflare Worker (Miruro + Animelok)

A lightweight, standalone Cloudflare Worker that resolves anime video streams using **Miruro** with fallback to **Animelok**, rendering an embedded video player (powered by Plyr and HLS.js for master/nested `.m3u8` playlists or responsive embed iframe).

## Features

- **AniList ID Resolution**: Pass any AniList anime ID directly.
- **Miruro & Animelok Fallback**: Automatically attempts Miruro resolution first; if video is unavailable, seamlessly falls back to Animelok.
- **Sub / Dub Selection**: Seamlessly specify subtitled (`&ub=s`) or dubbed (`&ub=d`) tracks via URL query parameters.
- **Embedded Player**: Renders an HTML5 video player (Plyr.js with HLS master/nested stream support and subtitle tracks) or responsive iframe player.
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

## Deployment to Cloudflare

You can deploy this worker to Cloudflare using **either** direct GitHub integration or the Wrangler CLI:

### Option A: Direct GitHub Integration (Point Cloudflare at Repository)

Yes! You can connect your GitHub repository directly to Cloudflare Workers / Pages:

1. Push this repository to GitHub.
2. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Navigate to **Workers & Pages** > **Create application**.
4. Select the **Pages** or **Workers** tab and choose **Connect to Git**.
5. Select your repository and set the **Root Directory** to `worker`.
6. Set the Build settings:
   - **Framework preset**: None
   - **Build command**: `bun install && bun run typecheck`
   - **Build output directory**: (Leave empty for Workers)
7. Click **Save and Deploy**. Cloudflare will automatically build and deploy the worker whenever you push commits to GitHub.

---

### Option B: Deploy via Wrangler CLI

1. Install dependencies inside the `worker` directory:
   ```bash
   cd worker
   bun install
   ```

2. Run local development server to test:
   ```bash
   bun run dev
   ```

3. Authenticate and deploy directly to Cloudflare:
   ```bash
   npx wrangler login
   bun run deploy
   ```
