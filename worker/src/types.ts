export type TrackOption = "sub" | "dub";

export type ResolvedVideo =
  | {
      type: "stream";
      provider: "miruro" | "animelok";
      url: string;
      format: "hls" | "mp4";
      headers?: Record<string, string>;
      subtitles?: { file: string; label?: string; kind?: string }[];
    }
  | {
      type: "embed";
      provider: "miruro" | "animelok";
      embedUrl: string;
      headers?: Record<string, string>;
    };
