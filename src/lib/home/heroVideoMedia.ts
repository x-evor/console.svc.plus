export type HeroVideoMedia = {
  posterUrl?: string;
  videoUrl?: string;
  title: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  statusLabel: {
    zh: string;
    en: string;
  };
  durationLabel: string;
  chapters: {
    zh: string;
    en: string;
  }[];
};

export const heroVideoMedia: HeroVideoMedia = {
  posterUrl: "",
  videoUrl: "",
  title: {
    zh: "用一段视频解释从灵感到上线的完整路径",
    en: "Show the full path from idea to launch in one video",
  },
  description: {
    zh: "建议后续放 60 到 120 秒的产品导览、集成配置流程，或真实部署 walkthrough。",
    en: "Best used for a 60-120 second product tour, integration setup flow, or real deployment walkthrough.",
  },
  statusLabel: {
    zh: "视频待接入",
    en: "Video pending",
  },
  durationLabel: "00:00 / 02:18",
  chapters: [
    { zh: "开场介绍", en: "Intro" },
    { zh: "集成配置", en: "Setup" },
    { zh: "上线演示", en: "Launch" },
  ],
};
