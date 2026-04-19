export type VibePrompt = {
  id: string;
  dateKey: string;
  title: string;
  description: string;
  buckets: string[];
};

export type VibeSubmission = {
  id: string;
  promptId: string;
  authorName: string;
  title: string;
  description?: string;
  code: {
    html: string;
    css: string;
    js: string;
  };
  stats: {
    upvotes: number;
  };
  createdAt?: string;
};

export type VibeLeaderboardEntry = {
  id: string;
  title: string;
  authorName: string;
  upvotes: number;
};

export type VibeEmbedCard = {
  id: string;
  title: string;
  authorName: string;
  promptTitle: string;
  upvotes: number;
  embedUrl: string;
  previewUrl: string;
  shareUrl: string;
  embedHtml: string;
};
