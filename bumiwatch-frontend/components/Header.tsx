"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(82,183,136,0.15)] bg-[rgba(10,24,18,0.95)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1A7A4A] flex items-center justify-center glow">
            <span className="text-sm">🌿</span>
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#D8F3DC] leading-none tracking-wide">BUMI WATCH</h1>
            <p className="text-[10px] text-[#52B788] tracking-[0.2em] uppercase">Environmental Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#52B788] pulse" />
          <span className="text-xs text-[#74C69D]">Live · Indonesia</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#74C69D]">
          <a href="#dashboard" className="hover:text-[#D8F3DC] transition-colors">Dashboard</a>
          <a href="#chat"      className="hover:text-[#D8F3DC] transition-colors">Ask Bumi</a>
          <a href="https://github.com/HanifWinson/bumi-watch-project" target="_blank" className="hover:text-[#D8F3DC] transition-colors">GitHub</a>
        </nav>
      </div>
    </header>
  );
}
