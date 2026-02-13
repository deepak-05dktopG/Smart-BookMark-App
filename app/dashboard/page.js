"use client";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ExternalLink, Search, LogOut, LayoutGrid, List } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const broadcastRef = useRef(null);
  const tabIdRef = useRef(null);

  const postBroadcast = (message) => {
    try {
      broadcastRef.current?.postMessage(message);
    } catch (error) {
      console.warn("BroadcastChannel postMessage failed:", error);
    }
  };

  useEffect(() => {
    // Check authentication
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }
      setUser(session.user);
      fetchBookmarks(session.user.id);
    };
    checkUser();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Same-browser multi-tab sync (works even if Supabase Realtime isn't configured).
  useEffect(() => {
    tabIdRef.current =
      tabIdRef.current ||
      (globalThis.crypto?.randomUUID?.() ??
        `tab-${Date.now()}-${Math.random()}`);

    if (typeof window === "undefined") return;
    if (typeof window.BroadcastChannel === "undefined") {
      console.warn(
        "BroadcastChannel not supported in this browser; multi-tab sync disabled",
      );
      return;
    }

    const channel = new BroadcastChannel("smart-bookmarks");
    broadcastRef.current = channel;

    channel.onmessage = (event) => {
      const message = event?.data;
      if (!message || typeof message !== "object") return;
      if (message.tabId && message.tabId === tabIdRef.current) return;

      // Only apply messages for the same signed-in user.
      if (!user?.id || message.userId !== user.id) return;

      if (message.type === "bookmark_add_optimistic") {
        const incoming = message.bookmark;
        if (!incoming) return;
        setBookmarks((current) => {
          if (
            current.some(
              (b) =>
                b.client_mutation_id &&
                b.client_mutation_id === incoming.client_mutation_id,
            )
          ) {
            return current;
          }
          if (current.some((b) => b.id === incoming.id)) {
            return current;
          }
          return [incoming, ...current];
        });
      }

      if (message.type === "bookmark_add_confirmed") {
        const incoming = message.bookmark;
        if (!incoming) return;
        const mutationId = message.mutationId;
        setBookmarks((current) => {
          const withoutOptimistic = mutationId
            ? current.filter((b) => b.client_mutation_id !== mutationId)
            : current;
          if (withoutOptimistic.some((b) => b.id === incoming.id))
            return withoutOptimistic;
          return [incoming, ...withoutOptimistic];
        });
      }

      if (message.type === "bookmark_add_failed") {
        const mutationId = message.mutationId;
        if (!mutationId) return;
        setBookmarks((current) =>
          current.filter((b) => b.client_mutation_id !== mutationId),
        );
      }

      if (message.type === "bookmark_delete") {
        const id = message.id;
        if (!id) return;
        setBookmarks((current) => current.filter((b) => b.id !== id));
      }

      if (message.type === "bookmark_delete_rollback") {
        const bookmark = message.bookmark;
        if (!bookmark) return;
        setBookmarks((current) => {
          if (current.some((b) => b.id === bookmark.id)) return current;
          return [bookmark, ...current];
        });
      }
    };

    return () => {
      try {
        channel.close();
      } catch {
        // ignore
      }
      if (broadcastRef.current === channel) broadcastRef.current = null;
    };
  }, [user]);

  const fetchBookmarks = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookmarks:", error);
    } else {
      setBookmarks(data || []);
    }
    setLoading(false);
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!user) {
      return;
    }

    const channel = supabase
      .channel("bookmarks-channel", {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setBookmarks((current) => {
            // Check if bookmark already exists to avoid duplicates
            if (current.some((b) => b.id === payload.new.id)) {
              return current;
            }
            return [payload.new, ...current];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setBookmarks((current) => {
            const filtered = current.filter((b) => b.id !== payload.old.id);
            return filtered;
          });
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.error("❌ Realtime subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAddBookmark = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    if (!user) return;

    setAdding(true);

    // Add https:// if no protocol specified
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    const trimmedTitle = title.trim();
    const mutationId =
      globalThis.crypto?.randomUUID?.() ?? `mut-${Date.now()}-${Math.random()}`;
    const optimisticId = `optimistic-${mutationId}`;
    const optimisticBookmark = {
      id: optimisticId,
      user_id: user.id,
      title: trimmedTitle,
      url: finalUrl,
      created_at: new Date().toISOString(),
      client_mutation_id: mutationId,
    };

    // Optimistic UI update so the bookmark shows instantly.
    setBookmarks((current) => [optimisticBookmark, ...current]);
    postBroadcast({
      type: "bookmark_add_optimistic",
      tabId: tabIdRef.current,
      userId: user.id,
      mutationId,
      bookmark: optimisticBookmark,
    });

    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .insert([{ user_id: user.id, title: trimmedTitle, url: finalUrl }])
        .select()
        .single();

      if (error) throw error;

      postBroadcast({
        type: "bookmark_add_confirmed",
        tabId: tabIdRef.current,
        userId: user.id,
        mutationId,
        bookmark: data,
      });

      // Replace the optimistic row with the real row (and avoid duplicates if realtime also inserted it).
      setBookmarks((current) => {
        const withoutOptimistic = current.filter((b) => b.id !== optimisticId);
        if (withoutOptimistic.some((b) => b.id === data.id))
          return withoutOptimistic;
        return [data, ...withoutOptimistic];
      });

      setTitle("");
      setUrl("");
    } catch (error) {
      console.error("Error adding bookmark:", error);
      setBookmarks((current) => current.filter((b) => b.id !== optimisticId));
      postBroadcast({
        type: "bookmark_add_failed",
        tabId: tabIdRef.current,
        userId: user.id,
        mutationId,
      });
      alert("Error adding bookmark: " + (error?.message || "Unknown error"));
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteBookmark = async (id) => {
    // Optimistic UI update so the bookmark disappears instantly.
    const deletedBookmark = bookmarks.find((b) => b.id === id);
    const previousBookmarks = bookmarks;
    setBookmarks((current) => current.filter((b) => b.id !== id));
    postBroadcast({
      type: "bookmark_delete",
      tabId: tabIdRef.current,
      userId: user?.id,
      id,
    });

    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting bookmark:", error);
      setBookmarks(previousBookmarks);
      if (deletedBookmark) {
        postBroadcast({
          type: "bookmark_delete_rollback",
          tabId: tabIdRef.current,
          userId: user?.id,
          bookmark: deletedBookmark,
        });
      }
      alert("Error deleting bookmark: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const formatBookmarkDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  };

  const filteredBookmarks = bookmarks.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !user) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full py-8 sm:py-10 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="text-neon-blue">⚡</span> My Bookmarks
            </h1>
            <p className="mt-1 text-sm text-white/60 break-words">
              Welcome back, <span className="text-white font-medium break-all">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-base sm:text-sm text-white focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all"
              />
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-12">

          {/* Add Bookmark - Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4"
          >
            <div className="glass-panel rounded-2xl p-6 lg:sticky lg:top-8">
              <div className="flex items-center gap-2 mb-6 text-neon-purple">
                <Plus size={20} />
                <h2 className="font-semibold text-white">Add New Bookmark</h2>
              </div>

              <form onSubmit={handleAddBookmark} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/70 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Awesome Project"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/50 transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/70 uppercase tracking-wider">URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/50 transition-all"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={adding}
                    className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-neon-purple to-pink-600 px-6 py-3.5 font-medium text-white shadow-lg transition-all hover:shadow-neon-purple/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center justify-center gap-2">
                      {adding ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span>Save Bookmark</span>
                          <Plus size={18} />
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Bookmarks List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-medium text-white/90">Saved Links ({bookmarks.length})</h2>
              {/* <div className="flex gap-2 text-white/40">
                <LayoutGrid size={18} className="cursor-pointer hover:text-white transition-colors" />
                <List size={18} className="cursor-pointer hover:text-white transition-colors text-neon-blue" />
              </div> */}
            </div>

            {loading ? (
              <div className="text-center py-20 text-white/30 animate-pulse">
                Loading your digital brain...
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center border-dashed border-white/10">
                <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
                  <Search className="text-white/20" size={32} />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No bookmarks found</h3>
                <p className="text-white/50 text-sm">Everything you save will appear here.</p>
              </div>
            ) : (
              <motion.div className="space-y-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredBookmarks.map((bookmark) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="glass-card group rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                      style={{ willChange: "transform, opacity" }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-neon-blue/30 transition-colors">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
                          alt=""
                          className="w-5 h-5 opacity-80"
                        />
                        <span className="hidden text-xs font-bold text-white/40">
                          {bookmark.title.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="flex-1 min-w-0 font-medium text-white text-base whitespace-normal break-words [overflow-wrap:anywhere] group-hover:text-neon-blue transition-colors">
                            {bookmark.title}
                          </h3>
                          {String(bookmark.id).startsWith("optimistic-") && (
                            <span className="shrink-0 text-[10px] uppercase tracking-wider font-bold text-neon-blue/70 animate-pulse">
                              Syncing
                            </span>
                          )}
                        </div>
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-white/40 block whitespace-normal break-all [overflow-wrap:anywhere] hover:text-white/60 transition-colors"
                        >
                          {bookmark.url}
                        </a>
                        {formatBookmarkDate(bookmark.created_at) && (
                          <div className="mt-1 text-xs text-white/30">
                            Saved {formatBookmarkDate(bookmark.created_at)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                          title="Open Link"
                        >
                          <ExternalLink size={18} />
                        </a>
                        <button
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

