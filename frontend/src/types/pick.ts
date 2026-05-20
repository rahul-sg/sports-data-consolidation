export type Source = "reddit" | "twitter" | "discord";

export interface Pick {
  id: string;
  source: Source;
  author: string;
  author_url: string | null;
  content: string;
  url: string | null;
  community: string | null;
  channel: string | null;
  timestamp: string; // ISO string from backend
  raw: Record<string, unknown> | null;
}
