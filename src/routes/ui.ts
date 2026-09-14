import { html } from "hono/html";
import { Hono } from "hono";
import { getUserFromSession } from "./auth.js";
import { db } from "../db.js";
import { getCookie } from "hono/cookie";

export const uiRoute = new Hono();

const BaseHTML = (props: { title: string; children: any }) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${props.title} - pubthis</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-color: #f8fafc;
          --text-color: #0f172a;
          --accent: #3b82f6;
          --accent-hover: #2563eb;
          --glass-bg: rgba(255, 255, 255, 0.7);
          --glass-border: rgba(0, 0, 0, 0.1);
          --glass-glow: 0 8px 32px 0 rgba(0, 0, 0, 0.08);
        }
        
        * { box-sizing: border-box; font-family: 'Outfit', sans-serif; }
        
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        body {
          margin: 0;
          padding: 0;
          background-color: var(--bg-color);
          color: var(--text-color);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          /* Premium animated light gradient */
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 50% 80%, rgba(56, 189, 248, 0.1) 0%, transparent 40%);
          background-size: 200% 200%;
          animation: gradient-xy 15s ease infinite;
          position: relative;
        }

        /* Animated overlay noise for texture */
        body::before {
          content: "";
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: -1;
        }

        header {
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--glass-border);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.6);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .logo { font-size: 26px; font-weight: 800; color: #0f172a; text-decoration: none; display: flex; align-items: center; gap: 8px; letter-spacing: -0.5px;}
        .logo span { background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        nav a { color: #475569; text-decoration: none; margin-left: 20px; font-weight: 600; transition: color 0.3s; font-size: 15px; }
        nav a:hover { color: #0f172a; }

        .container {
          max-width: 1100px;
          margin: 60px auto;
          padding: 50px;
          background: var(--glass-bg);
          border-radius: 24px;
          border: 1px solid var(--glass-border);
          box-shadow: var(--glass-glow), inset 0 1px 0 rgba(255,255,255,1);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          position: relative;
          overflow: hidden;
        }

        h1 { 
          font-size: 48px; 
          margin-top: 0; 
          background: linear-gradient(180deg, #0f172a 0%, #334155 100%); 
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
          letter-spacing: -1px;
        }

        .btn {
          background: linear-gradient(135deg, var(--accent), #8b5cf6);
          color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);
        }
        .btn:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5); 
          background: linear-gradient(135deg, #8b5cf6, var(--accent));
        }

        /* Form elements */
        .input-group { margin-bottom: 24px; text-align: left; }
        label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;}
        input {
          width: 100%; padding: 14px 18px; background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; color: #0f172a; font-size: 16px; transition: all 0.3s;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }
        input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), inset 0 2px 4px rgba(0,0,0,0.05); }

        /* Table */
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th, td { padding: 18px 16px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.05); vertical-align:middle;}
        th { font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;}
        tr { transition: background 0.2s; }
        tr:hover { background: rgba(0,0,0,0.02); }
        .token-box { background: rgba(255,255,255,0.6); padding: 18px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.1); margin: 20px 0; font-family: 'JetBrains Mono', monospace; display: flex; justify-content: space-between; align-items:center; }
        
        .delete-btn { background: transparent; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 6px 12px; font-size: 13px; cursor: pointer; transition: all 0.2s; margin-left: 15px;}
        .delete-btn:hover { background: #ef4444; color: #fff;}
        .summary-text { font-size: 14px; color: #64748b; font-family: monospace; }
      </style>
    </head>
    <body>
      ${props.children}
      <script>
        // Simple JS for logout
        async function handleLogout() {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.href = '/';
        }
      </script>
    </body>
  </html>
`;

uiRoute.get("/", async (c) => {
  const sessionId = getCookie(c, "session_id");
  const user = await getUserFromSession(sessionId);

  return c.html(BaseHTML({
    title: "Home",
    children: html`
      <header>
        <a href="/" class="logo">pub<span>this</span></a>
        <nav>
          ${user 
            ? html`<a href="/dashboard" class="btn" style="padding: 8px 16px;">Go to Dashboard</a>`
            : html`<a href="/login" class="btn" style="padding: 8px 16px;">Login</a>`}
        </nav>
      </header>
      <div class="container" style="text-align: left; padding: 60px;">
        <h1 style="font-size: 52px; margin-bottom: 20px;">Publish content straight from Claude Code.</h1>
        <p style="font-size: 20px; color: #9ca3af; max-width: 700px; margin-bottom: 40px; line-height: 1.6;">
          <strong>pubthis</strong> takes your markdown, HTML, documents, and images straight from the terminal — and gives you a shareable link instantly. No config needed. Just content in, URL out.
        </p>
        
        <div style="background: rgba(255, 255, 255, 0.8); border: 1px solid var(--glass-border); border-radius: 12px; padding: 25px; margin-bottom: 40px; font-family: monospace; font-size: 16px; color: #334155;">
          <div style="color: #3b82f6; margin-bottom: 15px;">
            <span style="color: #64748b;">You:</span> "share this report as a link"
          </div>
          <div style="color: #8b5cf6; line-height: 1.5;">
            <span style="color: #64748b;">Claude:</span> I've published your report.<br>
            <a href="#" style="color: var(--accent); text-decoration: none;">https://pubthis.co/a/01JABCDEFG</a><br>
            <span style="color: #64748b; font-size: 14px;">Anyone with the link can view it.</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
           <div style="background: rgba(255,255,255,0.6); padding: 20px; border-radius: 12px; border: 1px solid var(--glass-border);">
              <h3 style="margin-top:0; color:#0f172a;">🔒 Self-Hosted & Secure</h3>
              <p style="color:#64748b; font-size: 15px; margin-bottom:0;">Because you are running this locally, you own the entire database. Your artifacts stay inside your personal cloud.</p>
           </div>
           <div style="background: rgba(255,255,255,0.6); padding: 20px; border-radius: 12px; border: 1px solid var(--glass-border);">
              <h3 style="margin-top:0; color:#0f172a;">📁 Persistent Tracking</h3>
              <p style="color:#64748b; font-size: 15px; margin-bottom:0;">Create a free account to tie every link Claude generates to your email. Monitor and delete old links via your Dashboard.</p>
           </div>
        </div>

        ${!user 
          ? html`<div style="text-align: center; margin-top: 50px;"><a href="/login" class="btn" style="font-size: 18px; padding: 16px 36px; border-radius: 50px;">Create your account to get started</a></div>`
          : html``}
      </div>
    `
  }));
});

uiRoute.get("/login", async (c) => {
  return c.html(BaseHTML({
    title: "Login",
    children: html`
      <header>
        <a href="/" class="logo">pub<span>this</span></a>
      </header>
      <div class="container" style="max-width: 450px;">
        <h2>Welcome Back</h2>
        <form id="loginForm" onsubmit="event.preventDefault(); submitForm(event);">
          <div class="input-group">
            <label>Email Address</label>
            <input type="email" id="email" required placeholder="you@example.com">
          </div>
          <div class="input-group">
            <label>Password</label>
            <input type="password" id="password" required placeholder="••••••••">
          </div>
          <p id="errorMsg" style="color: #ef4444; font-size: 14px; display: none;"></p>
          <button type="submit" class="btn" style="width: 100%;">Sign In / Register</button>
        </form>
      </div>

      <script>
        async function submitForm(e) {
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const errorMsg = document.getElementById('errorMsg');
          
          try {
            // Try login first
            let res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });

            if (res.ok) {
              window.location.href = '/dashboard';
              return;
            }

            // If login fails (either wrong password or user doesn't exist), try registering
            let regRes = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });

            if (regRes.ok) {
              // Successfully registered! Now login to create the session
              await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              });
              window.location.href = '/dashboard';
              return;
            }
            
            // If we get here, either they put the wrong password for an existing account, or the system failed
            errorMsg.innerText = 'Invalid credentials';
            errorMsg.style.display = 'block';
            
          } catch(err) {
            errorMsg.innerText = 'Server error';
            errorMsg.style.display = 'block';
          }
        }
      </script>
    `
  }));
});

uiRoute.get("/dashboard", async (c) => {
  const sessionId = getCookie(c, "session_id");
  const user = await getUserFromSession(sessionId);

  if (!user) {
    return c.redirect("/login");
  }

  // Fetch user's artifacts and a summary of the BLOB content
  const artifacts = db.prepare("SELECT id, content_type, published_at, substr(CAST(content AS TEXT), 1, 80) as summary FROM artifacts WHERE user_id = ? ORDER BY published_at DESC").all(user.id) as any[];

  return c.html(BaseHTML({
    title: "Dashboard",
    children: html`
      <header>
        <a href="/" class="logo">pub<span>this</span></a>
        <nav>
          <a href="#" onclick="handleLogout()">Logout</a>
        </nav>
      </header>
      <div class="container" style="max-width:1200px;">
        <h1>Dashboard</h1>
        <p>Logged in as <b>${user.email}</b></p>
        
        <h3 style="margin-top: 40px; color: #0f172a;">Claude Integration Setup</h3>
        <p style="color: #64748b;">To link Claude to your account, run this command in your terminal. We will use your User ID as the auth token for now.</p>
        <div class="token-box">
          <code>claude mcp add pubthis -e PUBTHIS_API_URL=http://localhost:3000 -e PUBTHIS_USER=${user.id} -- npx -y @pubthis/mcp-server</code>
        </div>

        <h3 style="margin-top: 40px; color: #0f172a;">Your Published Artifacts</h3>
        ${artifacts.length === 0 ? html`<p style="color:#64748b;">You haven't published anything yet.</p>` : html`
          <table>
            <thead>
              <tr>
                <th>Link ID</th>
                <th>Content Type</th>
                <th>Artifact Summary</th>
                <th>Published At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${artifacts.map(art => {
                // Strip HTML tags roughly for summary
                let cleanSummary = art.summary.replace(/<[^>]*>?/gm, '').trim();
                if(cleanSummary.length === 0) cleanSummary = "(Binary or Empty)";
                
                return html`
                <tr id="row-${art.id}">
                  <td><code>${art.id}</code></td>
                  <td><span style="background: rgba(59,130,246,0.1); color: #3b82f6; padding: 4px 8px; border-radius: 4px; font-size:12px; font-weight:600;">${art.content_type}</span></td>
                  <td><span class="summary-text">${cleanSummary}...</span></td>
                  <td style="color:#64748b;">${new Date(art.published_at).toLocaleString()}</td>
                  <td>
                     <a href="/a/${art.id}" target="_blank" style="color: var(--accent); text-decoration: none; font-weight: 600;">View File ↗</a>
                     <button onclick="handleDelete('${art.id}')" class="delete-btn">Delete</button>
                  </td>
                </tr>
              `})}
            </tbody>
          </table>
        `}
      </div>

      <script>
        async function handleDelete(id) {
           if (!confirm("Are you sure you want to delete this artifact?")) return;
           const res = await fetch('/api/artifacts/' + id, {method: 'DELETE'});
           if (res.ok) {
              document.getElementById('row-' + id).remove();
           } else {
              alert("Failed to delete");
           }
        }
      </script>
    `
  }));
});

// Delete API Route appended manually
uiRoute.delete("/api/artifacts/:id", async (c) => {
  const sessionId = getCookie(c, "session_id");
  const user = await getUserFromSession(sessionId);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  db.prepare("DELETE FROM artifacts WHERE id = ? AND user_id = ?").run(id, user.id);
  return c.json({ success: true });
});
