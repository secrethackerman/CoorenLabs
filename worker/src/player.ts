import type { ResolvedVideo } from "./types";

export function renderPlayerHtml(video: ResolvedVideo, title: string): string {
  if (video.type === "embed") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background-color: #000; overflow: hidden; font-family: sans-serif; }
    iframe { width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <iframe src="${escapeHtml(video.embedUrl)}" allowfullscreen allow="autoplay; encrypted-media; fullscreen"></iframe>
</body>
</html>`;
  }

  const subtitlesJson = JSON.stringify(video.subtitles || []);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js"></script>
  <script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background-color: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .plyr-container { width: 100%; height: 100%; max-width: 100%; }
    .plyr { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div class="plyr-container">
    <video id="player" playsinline controls></video>
  </div>
  <script>
    const streamUrl = ${JSON.stringify(video.url)};
    const isHls = ${JSON.stringify(video.format === "hls")};
    const subtitles = ${subtitlesJson};
    const videoElement = document.getElementById('player');

    // Add subtitle tracks
    if (Array.isArray(subtitles)) {
      subtitles.forEach((sub, idx) => {
        if (!sub.file) return;
        const track = document.createElement('track');
        track.kind = 'captions';
        track.label = sub.label || \`Subtitle \${idx + 1}\`;
        track.srclang = 'en';
        track.src = sub.file;
        if (idx === 0) track.default = true;
        videoElement.appendChild(track);
      });
    }

    let defaultOptions = {
      controls: [
        'play-large', 'play', 'progress', 'current-time', 'duration',
        'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
      ],
      captions: { active: true, update: true, language: 'en' }
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(videoElement);
      hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        const availableQualities = hls.levels.map((l) => l.height);
        availableQualities.unshift(0); // Auto

        defaultOptions.quality = {
          default: 0,
          options: availableQualities,
          forced: true,
          onChange: (e) => {
            if (e === 0) {
              hls.currentLevel = -1;
            } else {
              hls.levels.forEach((level, levelIndex) => {
                if (level.height === e) {
                  hls.currentLevel = levelIndex;
                }
              });
            }
          },
        };
        new Plyr(videoElement, defaultOptions);
      });
    } else {
      videoElement.src = streamUrl;
      new Plyr(videoElement, defaultOptions);
    }
  </script>
</body>
</html>`;
}

export function renderErrorHtml(message: string, status = 404): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Not Found - ${status}</title>
  <style>
    body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; margin: 0; }
    .card { background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; max-width: 400px; }
    h1 { color: #f43f5e; margin-bottom: 0.5rem; font-size: 1.5rem; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Unable to Play Video</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
