"use client";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Search, Shield, ArrowRight, Zap, Globe, Layers } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

            <h1 className="text-4xl sm:text-7xl font-bold tracking-tight text-white leading-tight">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple neon-text">Future</span> of <br />
              Web Organization
            </h1>

            <p className="mt-6 text-lg text-gray-300 max-w-lg leading-relaxed">
              Experience a quantum leap in bookmark management.
              Sync continuously across dimensions (and devices).
              Secure, lightning-fast, and undeniably stylish.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 243, 255, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGoogleLogin}
                className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-white/10 px-8 py-4 font-bold text-white transition-all duration-300 border border-white/20 hover:bg-white/20 hover:border-neon-blue overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                  <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="relative z-10">Sign in with Google</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {[
                { label: "Synced", icon: Globe, value: "Real-time" },
                { label: "Speed", icon: Zap, value: "Instant" },
                { label: "Secure", icon: Shield, value: "Military Grade" },
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
