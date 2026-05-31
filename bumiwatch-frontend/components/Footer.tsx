export default function Footer() {
  return (
    <footer className="border-t border-[rgba(82,183,136,0.1)] mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🌿</span>
            <span className="font-display text-sm text-[#D8F3DC]">Bumi Watch</span>
            <span className="text-[#52B788] text-xs">· Indonesia Environmental Intelligence</span>
          </div>

          <div className="flex items-center gap-6 text-[10px] text-[#52B788]">
            <span>Data: WAQI · NASA FIRMS · BMKG · Open-Meteo</span>
            <span>AI: Gemini 2.5 · Elastic MCP</span>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-[#52B788]">
            <a
              href="https://github.com/HanifWinson/bumi-watch-project"
              target="_blank"
              className="hover:text-[#D8F3DC] transition-colors"
            >
              GitHub
            </a>
            <span>·</span>
            <span>Google Cloud AI Hackathon 2026</span>
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-[#52B788] opacity-50">
          <em>Ask the Earth. It's Listening.</em>
        </div>
      </div>
    </footer>
  );
}
