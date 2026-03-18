export type HomepageVideoEntry = {
  domain?: string;
  videoUrl: string;
  posterUrl?: string;
};

export type HomepageVideoSettingsResponse = {
  defaultEntry: HomepageVideoEntry;
  overrides: HomepageVideoEntry[];
};

export type ResolvedHomepageVideoResponse = {
  resolved: HomepageVideoEntry;
};

export type HomepageVideoPresentation =
  | {
      kind: "embed";
      provider: "youtube" | "bilibili";
      src: string;
      posterUrl?: string;
      videoUrl: string;
    }
  | {
      kind: "direct";
      provider: "direct";
      src: string;
      posterUrl?: string;
      videoUrl: string;
    }
  | {
      kind: "empty";
      provider: "none";
      src: "";
      posterUrl?: string;
      videoUrl: string;
    };

export const DEFAULT_HOMEPAGE_VIDEO_SETTINGS: HomepageVideoSettingsResponse = {
  defaultEntry: {
    videoUrl: "https://www.youtube.com/watch?v=UW6DY6HQnmo",
    posterUrl: "",
  },
  overrides: [
    {
      domain: "cn-www.svc.plus",
      videoUrl:
        "https://www.bilibili.com/video/BV12DwazxEkL/?spm_id_from=333.1387.homepage.video_card.click&vd_source=e14d146f9a815c7d11e1a1fc23565ffd",
      posterUrl: "",
    },
  ],
};

function trimValue(value?: string): string {
  return value?.trim() ?? "";
}

export function normalizeHomepageVideoEntry(
  entry?: HomepageVideoEntry,
): HomepageVideoEntry {
  return {
    domain: trimValue(entry?.domain),
    videoUrl: trimValue(entry?.videoUrl),
    posterUrl: trimValue(entry?.posterUrl),
  };
}

function tryParseUrl(raw: string): URL | null {
  const trimmed = trimValue(raw);
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

function resolveYoutubeEmbed(url: URL): string | undefined {
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") {
    const videoId = url.pathname.replace(/^\/+/, "").split("/")[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
  }

  if (host.endsWith("youtube.com")) {
    if (url.pathname === "/watch") {
      const videoId = trimValue(url.searchParams.get("v") ?? "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const videoId = segments.at(-1);
    if (segments[0] === "embed" && videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if ((segments[0] === "shorts" || segments[0] === "live") && videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  return undefined;
}

function resolveBilibiliEmbed(url: URL): string | undefined {
  const host = url.hostname.toLowerCase();
  if (!host.endsWith("bilibili.com")) {
    return undefined;
  }

  const match = url.pathname.match(/\/video\/(BV[0-9A-Za-z]+)/i);
  const bvid = match?.[1];
  if (!bvid) {
    return undefined;
  }

  const page = trimValue(url.searchParams.get("p") ?? "1") || "1";
  return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&page=${encodeURIComponent(page)}`;
}

function isDirectVideoUrl(url: URL): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url.pathname);
}

export function resolveHomepageVideoPresentation(
  entry?: HomepageVideoEntry,
): HomepageVideoPresentation {
  const normalized = normalizeHomepageVideoEntry(entry);
  if (!normalized.videoUrl) {
    return {
      kind: "empty",
      provider: "none",
      src: "",
      posterUrl: normalized.posterUrl,
      videoUrl: "",
    };
  }

  const parsed = tryParseUrl(normalized.videoUrl);
  if (!parsed) {
    return {
      kind: "empty",
      provider: "none",
      src: "",
      posterUrl: normalized.posterUrl,
      videoUrl: "",
    };
  }

  const youtubeEmbed = resolveYoutubeEmbed(parsed);
  if (youtubeEmbed) {
    return {
      kind: "embed",
      provider: "youtube",
      src: youtubeEmbed,
      posterUrl: normalized.posterUrl,
      videoUrl: normalized.videoUrl,
    };
  }

  const bilibiliEmbed = resolveBilibiliEmbed(parsed);
  if (bilibiliEmbed) {
    return {
      kind: "embed",
      provider: "bilibili",
      src: bilibiliEmbed,
      posterUrl: normalized.posterUrl,
      videoUrl: normalized.videoUrl,
    };
  }

  if (isDirectVideoUrl(parsed)) {
    return {
      kind: "direct",
      provider: "direct",
      src: normalized.videoUrl,
      posterUrl: normalized.posterUrl,
      videoUrl: normalized.videoUrl,
    };
  }

  return {
    kind: "empty",
    provider: "none",
    src: "",
    posterUrl: normalized.posterUrl,
    videoUrl: normalized.videoUrl,
  };
}
