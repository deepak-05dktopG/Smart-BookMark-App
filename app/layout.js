import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Smart Bookmark App",
  description: "Save and organize your favorite links.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-[100dvh]`}
      >
        <div className="h-[100dvh] flex flex-col">
          <main className="flex-1 overflow-y-auto">{children}</main>
          <footer className="shrink-0 border-t border-white/10 bg-black/20 backdrop-blur">
            <div className="mx-auto max-w-5xl px-4 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-white/50 truncate max-w-[52%]">
                  Developed by{' '}
                  <a
                    href="https://deepakdigitalcraft.works/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-white/80 transition-colors"
                  >
                    deepakdigitalcraft.works
                  </a>
                </p>

                <div className="flex items-center gap-2">
              <a
                href="https://www.linkedin.com/in/deepak-05dktopg/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/70 shadow-sm backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V9h4v2a4 4 0 0 1 2-3Z" />
                  <path d="M2 9h4v12H2z" />
                  <path d="M4 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                </svg>
                <span className="hidden sm:inline">LinkedIn</span>
              </a>

              <a
                href="https://github.com/deepak-05dktopG/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/70 shadow-sm backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
                aria-label="GitHub"
                title="GitHub"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 9l-3 3 3 3" />
                  <path d="M16 9l3 3-3 3" />
                  <path d="M14 7l-4 10" />
                </svg>
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <a
                href="https://deepakdigitalcraft.works/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/70 shadow-sm backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Portfolio"
                title="Portfolio"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
                </svg>
                <span className="hidden sm:inline">Portfolio</span>
              </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
