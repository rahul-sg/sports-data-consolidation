import PicksFeed from "@/components/PicksFeed";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Picks Feed</h1>
        <p className="text-sm text-zinc-500 mt-1">Live posts from Reddit, X, and Discord — all in one place</p>
      </header>
      <PicksFeed />
    </main>
  );
}
