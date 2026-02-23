import ThemeSwitcher from "@/components/ThemeSwitcher";
import PromptArchitect from "@/components/PromptArchitect";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-pink-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight">
                Grok Prompt Architect
              </h1>
              <p className="text-xs text-[var(--text-muted)] hidden sm:block">
                Img2Vid Master Prompt Generator
              </p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-6">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
            Architect Perfect{" "}
            <span className="bg-gradient-to-r from-[var(--accent)] to-pink-500 bg-clip-text text-transparent">
              Video Prompts
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Upload your starter frames, describe your vision, and let AI craft
            optimized 10-second Grok Img2Vid prompts with cinematic precision.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
        <PromptArchitect />
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Powered by Gemini AI &middot; Optimized for Grok Imagine Video
          </p>
        </div>
      </footer>
    </main>
  );
}
