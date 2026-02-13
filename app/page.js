"use client";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Search, Shield, ArrowRight, Zap, Globe, Layers } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
      setLoading(false);
    });
  }, [router]);

  const handleGoogleLogin = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        window.location.origin;
      const redirectTo = new URL("/auth/callback", baseUrl).toString();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) {
        console.error("Error logging in:", error.message);
        alert(`Google sign-in failed: ${error.message}`);
      }
    } catch (error) {
      console.error("Google sign-in failed:", error);
      alert(`Google sign-in failed: ${error?.message || "Unknown error"}`);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-6 h-6 text-neon-purple animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-neon-blue/30 bg-white/5 px-4 py-1.5 text-sm text-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.2)] backdrop-blur mb-6"
            >
              <Zap size={16} className="text-neon-pink" />
              <span className="font-mono tracking-wide">NEXT-GEN BOOKMARKING</span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Smart bookmarking, simplified.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-lg leading-relaxed">
              Save, search, and sync your links with secure Google sign-in.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 243, 255, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-white/10 px-8 py-4 font-bold text-white transition-all duration-300 border border-white/20 hover:bg-white/20 hover:border-neon-blue overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <svg
                  className="w-5 h-5 relative z-10"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    fill="#FFC107"
                    d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.093 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306 14.691l6.571 4.819C14.655 16.108 19.027 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.183 0-9.613-3.317-11.303-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611 20.083H42V20H24v8h11.303c-.802 2.11-2.3 3.89-4.087 5.173h.003l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                  />
                </svg>
                <span className="relative z-10">Continue with Google</span>
                {authLoading ? (
                  <div className="relative z-10 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                )}
              </motion.button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {[
                { label: "Synced", icon: Globe, value: "Real-time" },
                { label: "Speed", icon: Zap, value: "Instant" },
                { label: "Secure", icon: Shield, value: "Enterprise-grade" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 text-neon-blue mb-1">
                    <stat.icon size={14} />
                    <span className="text-xs font-mono uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Visuals */}
          <div className="relative h-[500px] hidden lg:block perspective-1000">
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="relative w-full max-w-md aspect-[3/4]">
                {/* Decorative Orbs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-neon-purple/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-neon-blue/20 rounded-full blur-3xl animate-pulse delay-1000" />

                {/* Glass Cards Stack */}
                <div className="relative w-full h-full">
                  {[
                    { title: "Design Resources", count: "12 links", color: "from-pink-500/20 to-purple-600/20" },
                    { title: "Dev Tools", count: "8 links", color: "from-blue-500/20 to-cyan-400/20" },
                    { title: "Inspiration", count: "24 links", color: "from-amber-400/20 to-orange-500/20" }
                  ].map((card, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: index * 60, scale: 1 - index * 0.05 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                      className={`absolute top-0 left-0 right-0 h-48 rounded-2xl border border-white/10 bg-gradient-to-br ${card.color} backdrop-blur-md p-6 shadow-xl z-${30 - index * 10}`}
                      style={{ top: index * 80, willChange: 'transform' }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg bg-white/10">
                          <Layers className="text-white" size={24} />
                        </div>
                        <span className="text-xs font-mono text-white/50">{card.count}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                      <div className="flex gap-2">
                        <div className="h-2 w-12 rounded-full bg-white/20" />
                        <div className="h-2 w-8 rounded-full bg-white/10" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
