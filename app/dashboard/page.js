'use client'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    // Check authentication
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      setUser(session.user)
      fetchBookmarks(session.user.id)
    }
    checkUser()

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/')
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const fetchBookmarks = async (userId) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookmarks:', error)
    } else {
      console.log('Fetched bookmarks:', data)
      setBookmarks(data || [])
    }
    setLoading(false)
  }

  // Set up realtime subscription
  useEffect(() => {
    if (!user) {
      console.log('No user, skipping realtime setup')
      return
    }

    console.log('Setting up realtime for user:', user.id)

    const channel = supabase
      .channel('bookmarks-channel', {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🟢 INSERT event received:', payload)
          setBookmarks((current) => {
            // Check if bookmark already exists to avoid duplicates
            if (current.some(b => b.id === payload.new.id)) {
              console.log('Bookmark already exists, skipping')
              return current
            }
            console.log('Adding new bookmark to list')
            return [payload.new, ...current]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔴 DELETE event received:', payload)
          setBookmarks((current) => {
            const filtered = current.filter((b) => b.id !== payload.old.id)
            console.log('Removed bookmark from list')
            return filtered
          })
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Realtime subscription status:', status)
        if (err) {
          console.error('❌ Realtime subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates!')
        }
      })

    return () => {
      console.log('Cleaning up realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleAddBookmark = async (e) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    if (!user) return

    setAdding(true)
    
    // Add https:// if no protocol specified
    let finalUrl = url.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }

    const trimmedTitle = title.trim()
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticBookmark = {
      id: optimisticId,
      user_id: user.id,
      title: trimmedTitle,
      url: finalUrl,
      created_at: new Date().toISOString(),
    }

    console.log('Adding bookmark:', { title: trimmedTitle, url: finalUrl })

    // Optimistic UI update so the bookmark shows instantly.
    setBookmarks((current) => [optimisticBookmark, ...current])

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert([{ user_id: user.id, title: trimmedTitle, url: finalUrl }])
        .select()
        .single()

      if (error) throw error

      console.log('Bookmark added successfully:', data)

      // Replace the optimistic row with the real row (and avoid duplicates if realtime also inserted it).
      setBookmarks((current) => {
        const withoutOptimistic = current.filter((b) => b.id !== optimisticId)
        if (withoutOptimistic.some((b) => b.id === data.id)) return withoutOptimistic
        return [data, ...withoutOptimistic]
      })

      setTitle('')
      setUrl('')
    } catch (error) {
      console.error('Error adding bookmark:', error)
      setBookmarks((current) => current.filter((b) => b.id !== optimisticId))
      alert('Error adding bookmark: ' + (error?.message || 'Unknown error'))
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteBookmark = async (id) => {
    console.log('Deleting bookmark:', id)

    // Optimistic UI update so the bookmark disappears instantly.
    const previousBookmarks = bookmarks
    setBookmarks((current) => current.filter((b) => b.id !== id))

    const { error } = await supabase.from('bookmarks').delete().eq('id', id)

    if (error) {
      console.error('Error deleting bookmark:', error)
      setBookmarks(previousBookmarks)
      alert('Error deleting bookmark: ' + error.message)
    } else {
      console.log('Bookmark deleted successfully')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🔖 My Bookmarks</h1>
              <p className="text-gray-600 mt-1">Welcome, {user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Add Bookmark Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Bookmark</h2>
          <form onSubmit={handleAddBookmark} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Google"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., google.com or https://google.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-400"
            >
              {adding ? 'Adding...' : '+ Add Bookmark'}
            </button>
          </form>
        </div>

        {/* Bookmarks List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Saved Bookmarks ({bookmarks.length})
          </h2>
          {loading ? (
            <p className="text-gray-600 text-center py-8">Loading bookmarks...</p>
          ) : bookmarks.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No bookmarks yet. Add your first one above! 👆
            </p>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {bookmark.title}
                    </h3>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm truncate block"
                    >
                      {bookmark.url}
                    </a>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(bookmark.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    className="ml-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
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
  )
}