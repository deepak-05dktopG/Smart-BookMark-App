"use client";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
      setLoading(false);
    });
  }, [router]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error("Error logging in:", error.message);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 anim-fade-in">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="anim-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 shadow-sm backdrop-blur">
              <span aria-hidden>🔖</span>
              <span>Minimal, fast, synced</span>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Smart Bookmark App
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">
              Save links in seconds and keep them available everywhere you work.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={handleGoogleLogin}
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/10 px-6 py-3 font-medium text-white shadow-sm transition-colors transition-transform duration-200 hover:bg-white/15 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto backdrop-blur"
              >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
                <span>Continue with Google</span>
              </button>

              <p className="text-sm text-white/60">
                Sign in to view and manage your bookmarks.
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur anim-fade-up anim-delay-1">
                <p className="text-sm font-medium text-white">Instant</p>
                <p className="mt-1 text-sm text-white/70">See changes live.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur anim-fade-up anim-delay-2">
                <p className="text-sm font-medium text-white">Focused</p>
                <p className="mt-1 text-sm text-white/70">No clutter, just links.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur anim-fade-up anim-delay-3">
                <p className="text-sm font-medium text-white">Multi-tab</p>
                <p className="mt-1 text-sm text-white/70">Updates across tabs.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur sm:p-8 anim-fade-up anim-delay-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-medium text-white/60">Preview</p>
              <p className="mt-2 text-sm font-semibold text-white">Your dashboard</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-medium text-white truncate">Docs</p>
                  <p className="text-xs text-white/60 truncate">https://nextjs.org/docs</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-medium text-white truncate">Supabase</p>
                  <p className="text-xs text-white/60 truncate">https://supabase.com</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-medium text-white truncate">Design inspo</p>
                  <p className="text-xs text-white/60 truncate">https://dribbble.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

