import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Picks Aggregator",
  description: "Live picks from Reddit, Twitter/X, and Discord",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#111111] text-zinc-100 min-h-screen antialiased">{children}</body>
    </html>
  );
}
