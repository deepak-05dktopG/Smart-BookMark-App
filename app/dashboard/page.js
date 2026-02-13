"use client";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
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

    // Keep the UI feeling instant; data integrity is handled by Supabase.

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

  if (loading && !user) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur">
            <p className="text-white/80">Loading your dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Top Bar */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                My Bookmarks
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Signed in as: {user?.email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 shadow-sm backdrop-blur">
                {bookmarks.length} saved
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors transition-transform duration-200 hover:bg-red-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Add Bookmark */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur sm:p-6">
              <h2 className="text-base font-semibold text-white">
                New bookmark
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Add a title and URL to save it.
              </p>

              <form onSubmit={handleAddBookmark} className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Project documentation"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white shadow-sm placeholder:text-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70">
                    URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="e.g., https://docs.example.com"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white shadow-sm placeholder:text-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={adding}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-500/90 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors transition-transform duration-200 hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  {adding ? "Saving…" : "Save bookmark"}
                </button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-white">Saved</h2>
                <p className="text-sm text-white/60">
                  {bookmarks.length} total
                </p>
              </div>

              {loading ? (
                <p className="text-white/70 text-center py-10">
                  Loading bookmarks…
                </p>
              ) : bookmarks.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-white font-medium">No bookmarks yet</p>
                  <p className="mt-1 text-sm text-white/60">
                    Create your first bookmark using the form.
                  </p>
                </div>
              ) : (
                <div className="mt-5 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5 backdrop-blur">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-center justify-between gap-4 p-4 transition-colors transition-transform duration-200 hover:bg-white/5 hover:-translate-y-[1px]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-medium text-white">
                            {bookmark.title}
                          </h3>
                          {String(bookmark.id).startsWith("optimistic-") ? (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70 animate-pulse">
                              Saving…
                            </span>
                          ) : null}
                        </div>
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block truncate text-sm text-indigo-300 hover:underline"
                        >
                          {bookmark.url}
                        </a>
                        <p className="mt-1 text-xs text-white/50">
                          {new Date(bookmark.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        className="inline-flex flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 shadow-sm transition-colors transition-transform duration-200 hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
