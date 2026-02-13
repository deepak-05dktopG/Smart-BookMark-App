'use client'
     import { supabase } from '@/utils/supabase'
     import { useRouter } from 'next/navigation'
     import { useEffect, useState } from 'react'

     export default function Home() {
       const router = useRouter()
       const [loading, setLoading] = useState(true)

       useEffect(() => {
         // Check if user is already logged in
         supabase.auth.getSession().then(({ data: { session } }) => {
           if (session) {
             router.push('/dashboard')
           }
           setLoading(false)
         })
       }, [router])

       const handleGoogleLogin = async () => {
         const { error } = await supabase.auth.signInWithOAuth({
           provider: 'google',
           options: {
             redirectTo: `${window.location.origin}/auth/callback`
           }
         })
         if (error) console.error('Error logging in:', error.message)
       }

       if (loading) {
         return (
           <div className="min-h-screen flex items-center justify-center">
             <p>Loading...</p>
           </div>
         )
       }

       return (
         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
           <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
             <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
               🔖 Smart Bookmark App
             </h1>
             <p className="text-center text-gray-600 mb-8">
               Save and organize your favorite links
             </p>
             <button
               onClick={handleGoogleLogin}
               className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
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
               Sign in with Google
             </button>
           </div>
         </div>
       )
     }