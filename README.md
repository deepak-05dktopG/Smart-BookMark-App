<h1 align="center">🔖 Smart Bookmark App</h1>

<p align="center" style="font-size: 18px;">
  🚀 A secure, real-time, full-stack bookmark manager built with Next.js 16 and Supabase.<br/>
  Designed with production-grade authentication, strict data isolation, and instant multi-tab synchronization.
</p>

<p align="center">
  <a href="https://smart-bookmark-app-sand.vercel.app" target="_blank">
    <strong>🌐 Live Demo</strong>
  </a>
  &nbsp; | &nbsp;
  <a href="https://github.com/deepak-05dktopG/Smart-BookMark-App" target="_blank">
    <strong>📦 GitHub Repository</strong>
  </a>
</p>

<hr/>

<h2>🚀 Tech Stack</h2>
<ul>
  <li><strong>Framework:</strong> ⚡ Next.js 16 (App Router)</li>
  <li><strong>Authentication:</strong> 🔐 Supabase Auth (Google OAuth)</li>
  <li><strong>Database:</strong> 🗄 PostgreSQL (Supabase)</li>
  <li><strong>Real-time:</strong> ⚡ Supabase Realtime Subscriptions</li>
  <li><strong>Styling:</strong> 🎨 Tailwind CSS</li>
  <li><strong>Deployment:</strong> ▲ Vercel</li>
</ul>

<h2>✨ Features</h2>
<ul>
  <li>🔐 Secure Google OAuth authentication</li>
  <li>📌 Add and delete bookmarks instantly</li>
  <li>⚡ Real-time synchronization across multiple tabs</li>
  <li>🛡 Strict Row-Level Security (RLS) for user isolation</li>
  <li>📱 Fully responsive UI</li>
  <li>🚀 Production deployment with environment-safe configuration</li>
</ul>

<h2>🏗 Architecture Overview</h2>

<pre>
smart-bookmark-app/
├── app/
│   ├── auth/callback/route.js
│   ├── dashboard/page.js
│   ├── page.js
│   ├── layout.js
│   └── globals.css
├── utils/supabase.js
├── package.json
└── tailwind.config.js
</pre>

<h2>🧠 Engineering Challenges Solved</h2>

<ul>
  <li>
    <strong>⚡ Real-time Sync Fix:</strong><br/>
    Enabled Supabase Realtime replication and implemented filtered subscriptions to ensure user-specific updates.
  </li>
  <br/>
  <li>
    <strong>🔁 OAuth Redirect Loop (Production):</strong><br/>
    Fixed incorrect localhost redirects by dynamically resolving <code>window.location.origin</code> and updating Supabase + Google settings.
  </li>
  <br/>
  <li>
    <strong>📦 Deprecated Auth Package Migration:</strong><br/>
    Migrated from <code>@supabase/auth-helpers-nextjs</code> to <code>@supabase/ssr</code> to resolve build failures.
  </li>
  <br/>
  <li>
    <strong>🛡 Row-Level Security Hardening:</strong><br/>
    Implemented strict policies to guarantee complete user-level data isolation.
  </li>
</ul>

<h2>🛠️ Getting Started</h2>

<ol>
  <li>
    🧬 Clone the repository:
    <pre><code>git clone https://github.com/deepak-05dktopG/Smart-BookMark-App.git</code></pre>
  </li>
  <li>
    📦 Install dependencies:
    <pre><code>npm install</code></pre>
  </li>
  <li>
    🔧 Add environment variables in <code>.env.local</code>:
    <pre><code>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key</code></pre>
  </li>
  <li>
    🚀 Start development server:
    <pre><code>npm run dev</code></pre>
  </li>
</ol>

<h2>🧪 Testing Real-Time Functionality</h2>

<ol>
  <li>Login in one browser tab</li>
  <li>Open the app in a second tab</li>
  <li>Add or delete a bookmark</li>
  <li>Watch it update instantly without refreshing</li>
</ol>

<h2>👨‍💻 Developer</h2>

<ul>
  <li><strong>Name:</strong> Deepakkumar</li>
  <li><strong>GitHub:</strong> <a href="https://github.com/deepak-05dktopG" target="_blank">@deepak-05dktopG</a></li>
  <li><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/deepak-05dktopg/" target="_blank">LinkedIn Profile</a></li>
</ul>

<hr/>

<p align="center">
  ⭐ If this project impressed you, consider giving it a star!<br/>
  Feedback and contributions are always welcome.
</p>
