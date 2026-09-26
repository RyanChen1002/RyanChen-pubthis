import { html } from "hono/html";
import { Hono } from "hono";
import { getUserFromSession } from "./auth.js";
import { supabase } from "../supabase.js";
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
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
      <style>
        :root { --bg: #f8fafc; --accent: #3b82f6; --glass: rgba(255,255,255,0.7); --border: rgba(0,0,0,0.1); }
        * { box-sizing: border-box; font-family: 'Outfit', sans-serif; }
        @keyframes grad { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        body { margin:0; background:#f8fafc; color:#0f172a; min-height:100vh;
          background-image: radial-gradient(circle at 15% 50%,rgba(99,102,241,.08) 0%,transparent 40%),radial-gradient(circle at 85% 30%,rgba(168,85,247,.08) 0%,transparent 40%);
          background-size:200% 200%; animation:grad 15s ease infinite; }
        header { padding:20px 40px; display:flex; justify-content:space-between; align-items:center;
          border-bottom:1px solid var(--border); backdrop-filter:blur(20px);
          background:rgba(255,255,255,0.6); position:sticky; top:0; z-index:100; }
        .logo { font-size:26px; font-weight:800; color:#0f172a; text-decoration:none; }
        .logo span { background:linear-gradient(135deg,#3b82f6,#8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        nav a { color:#475569; text-decoration:none; margin-left:20px; font-weight:600; }
        .container { max-width:1100px; margin:60px auto; padding:50px; background:var(--glass);
          border-radius:24px; border:1px solid var(--border); backdrop-filter:blur(40px);
          box-shadow:0 8px 32px rgba(0,0,0,0.08); }
        h1 { font-size:48px; margin-top:0; background:linear-gradient(180deg,#0f172a,#334155);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-1px; }
        .btn { background:linear-gradient(135deg,#3b82f6,#8b5cf6); color:#fff; border:none;
          padding:12px 24px; border-radius:12px; font-size:15px; font-weight:600; cursor:pointer;
          transition:all .3s; text-decoration:none; display:inline-flex; align-items:center;
          box-shadow:0 4px 14px rgba(99,102,241,.39); }
        .btn:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(99,102,241,.5); }
        .btn-sm { padding:8px 16px; font-size:13px; border-radius:8px; }
        .input-group { margin-bottom:24px; }
        label { display:block; margin-bottom:8px; font-size:13px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.5px; }
        input { width:100%; padding:14px 18px; background:rgba(255,255,255,.8); border:1px solid rgba(0,0,0,.1);
          border-radius:12px; color:#0f172a; font-size:16px; transition:all .3s; }
        input:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.2); }
        table { width:100%; border-collapse:collapse; margin-top:16px; }
        th,td { padding:14px 16px; text-align:left; border-bottom:1px solid rgba(0,0,0,.05); vertical-align:middle; }
        th { font-weight:600; color:#64748b; font-size:13px; text-transform:uppercase; letter-spacing:1px; }
        tr:hover { background:rgba(0,0,0,.02); }
        .badge { background:rgba(59,130,246,.1); color:#3b82f6; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:600; }
        .delete-btn { background:transparent; color:#ef4444; border:1px solid rgba(239,68,68,.3); border-radius:6px; padding:6px 12px; font-size:13px; cursor:pointer; transition:all .2s; }
        .delete-btn:hover { background:#ef4444; color:#fff; }
        .section-card { background:rgba(255,255,255,.5); border:1px solid rgba(0,0,0,.07); border-radius:16px; padding:28px; margin-bottom:24px; }
        .new-key-box { display:none; background:#f0fdf4; border:1px solid #86efac; border-radius:12px; padding:20px; margin-top:16px; }
        .new-key-box code { font-family:monospace; font-size:15px; word-break:break-all; color:#166534; }
        .code-block { background:rgba(0,0,0,.04); border-radius:10px; padding:16px; margin-top:16px; font-family:monospace; font-size:13px; color:#334155; line-height:1.8; }
      </style>
    </head>
    <body>
      ${props.children}
      <script>async function handleLogout(){await fetch('/api/auth/logout',{method:'POST'});window.location.href='/'}</script>
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
        <nav>${user ? html`<a href="/dashboard" class="btn" style="padding:8px 16px;">Dashboard</a>` : html`<a href="/login" class="btn" style="padding:8px 16px;">Login</a>`}</nav>
      </header>
      <div class="container">
        <h1>Publish from any AI.<br>Share instantly.</h1>
        <p style="font-size:20px;color:#9ca3af;max-width:700px;margin-bottom:40px;line-height:1.6;">
          <strong>pubthis</strong> gives Claude, GPT, Gemini, or any custom tool a universal REST API to turn content into shareable links in seconds.
        </p>
        <div class="code-block">
          <span style="color:#3b82f6;"># Works with ANY AI model</span><br>
          POST /v1/publish<br>
          Authorization: Bearer pk_your_api_key<br>
          {"content": "# Hello", "content_type": "text/markdown"}<br>
          <span style="color:#10b981;">→ https://yourdomain.com/a/01JABCDEFG</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:40px 0;">
          <div style="background:rgba(255,255,255,.6);padding:20px;border-radius:12px;border:1px solid var(--border);">
            <h3 style="margin-top:0;">🔑 Universal API Keys</h3>
            <p style="color:#64748b;font-size:15px;margin:0;">Generate keys in your dashboard. Any model or integration can publish to your account using them.</p>
          </div>
          <div style="background:rgba(255,255,255,.6);padding:20px;border-radius:12px;border:1px solid var(--border);">
            <h3 style="margin-top:0;">🔒 Supabase Powered</h3>
            <p style="color:#64748b;font-size:15px;margin:0;">Row Level Security enforced at the database level. You own your data, no one else can see it.</p>
          </div>
        </div>
        ${!user ? html`<div style="text-align:center;"><a href="/login" class="btn" style="font-size:18px;padding:16px 36px;border-radius:50px;">Create your free account</a></div>` : html``}
      </div>
    `
  }));
});

uiRoute.get("/login", async (c) => {
  return c.html(BaseHTML({
    title: "Login",
    children: html`
      <header><a href="/" class="logo">pub<span>this</span></a></header>
      <div class="container" style="max-width:450px;">
        <h2>Welcome Back</h2>
        <form onsubmit="event.preventDefault();submitForm();">
          <div class="input-group"><label>Email</label><input type="email" id="email" required placeholder="you@example.com"></div>
          <div class="input-group"><label>Password</label><input type="password" id="password" required placeholder="••••••••"></div>
          <p id="errorMsg" style="color:#ef4444;font-size:14px;display:none;"></p>
          <button type="submit" class="btn" style="width:100%;">Sign In / Register</button>
        </form>
      </div>
      <script>
        async function submitForm() {
          const email=document.getElementById('email').value, password=document.getElementById('password').value;
          const err=document.getElementById('errorMsg');
          let res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
          if(res.ok){window.location.href='/dashboard';return;}
          let reg=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
          if(reg.ok){await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});window.location.href='/dashboard';return;}
          err.innerText='Invalid credentials';err.style.display='block';
        }
      </script>
    `
  }));
});

uiRoute.get("/dashboard", async (c) => {
  const sessionId = getCookie(c, "session_id");
  const user = await getUserFromSession(sessionId);
  if (!user) return c.redirect("/login");

  const { data: artifacts } = await supabase.from("artifacts").select("id,content_type,created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  const { data: apiKeys } = await supabase.from("api_keys").select("id,name,created_at,last_used_at").eq("user_id", user.id).order("created_at", { ascending: false });

  const arts = (artifacts || []) as any[];
  const keys = (apiKeys || []) as any[];

  return c.html(BaseHTML({
    title: "Dashboard",
    children: html`
      <header>
        <a href="/" class="logo">pub<span>this</span></a>
        <nav><a href="#" onclick="handleLogout()">Logout</a></nav>
      </header>
      <div class="container" style="max-width:1200px;">
        <h1>Dashboard</h1>
        <p>Logged in as <b>${user.email}</b></p>

        <div class="section-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
            <div>
              <h3 style="margin:0;">🔑 API Keys</h3>
              <p style="margin:4px 0 0;color:#64748b;font-size:14px;">Use with any AI model — Claude, GPT, Gemini, or your own code.</p>
            </div>
            <button class="btn btn-sm" onclick="generateKey()">+ Generate New Key</button>
          </div>

          <div class="new-key-box" id="newKeyDisplay">
            <p style="margin:0 0 8px;font-weight:600;color:#166534;">✅ Copy your new key now — it won't be shown again!</p>
            <code id="newKeyValue"></code>
            <button onclick="copyKey()" style="margin-left:12px;padding:6px 14px;border-radius:8px;border:1px solid #86efac;background:#dcfce7;color:#166534;cursor:pointer;font-weight:600;">Copy</button>
          </div>

          ${keys.length === 0
            ? html`<p style="color:#64748b;margin-top:16px;">No API keys yet. Generate one above!</p>`
            : html`<table>
              <thead><tr><th>Name</th><th>Created</th><th>Last Used</th><th>Action</th></tr></thead>
              <tbody>${keys.map(k => html`
                <tr id="key-row-${k.id}">
                  <td><b>${k.name}</b></td>
                  <td style="color:#64748b;">${new Date(k.created_at).toLocaleDateString()}</td>
                  <td style="color:#64748b;">${k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Never"}</td>
                  <td><button onclick="revokeKey('${k.id}')" class="delete-btn">Revoke</button></td>
                </tr>`)}</tbody>
            </table>`}

          <div class="code-block">
            <span style="color:#64748b;"># Example — any language, any model</span><br>
            curl -X POST https://yourdomain.com/v1/publish \<br>
            &nbsp;&nbsp;-H "Authorization: Bearer pk_your_key" \<br>
            &nbsp;&nbsp;-H "Content-Type: application/json" \<br>
            &nbsp;&nbsp;-d '{"content":"# Hello","content_type":"text/markdown"}'
          </div>
        </div>

        <div class="section-card">
          <h3 style="margin-top:0;">📄 Your Published Artifacts</h3>
          ${arts.length === 0
            ? html`<p style="color:#64748b;">You haven't published anything yet.</p>`
            : html`<table>
              <thead><tr><th>ID</th><th>Type</th><th>Published</th><th>Action</th></tr></thead>
              <tbody>${arts.map(a => html`
                <tr id="row-${a.id}">
                  <td><code style="font-size:12px;">${a.id}</code></td>
                  <td><span class="badge">${a.content_type}</span></td>
                  <td style="color:#64748b;">${new Date(a.created_at).toLocaleString()}</td>
                  <td>
                    <a href="/a/${a.id}" target="_blank" style="color:var(--accent);text-decoration:none;font-weight:600;">View ↗</a>
                    <button onclick="handleDelete('${a.id}')" class="delete-btn" style="margin-left:8px;">Delete</button>
                  </td>
                </tr>`)}</tbody>
            </table>`}
        </div>
      </div>

      <script>
        async function generateKey(){
          const name=prompt("Name this key (e.g. Claude, GPT-4, My Script):","Default Key");
          if(!name)return;
          const res=await fetch('/api/keys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
          const d=await res.json();
          if(d.key){document.getElementById('newKeyValue').textContent=d.key;document.getElementById('newKeyDisplay').style.display='block';setTimeout(()=>location.reload(),5000);}
        }
        function copyKey(){navigator.clipboard.writeText(document.getElementById('newKeyValue').textContent).then(()=>alert('Copied!'));}
        async function revokeKey(id){
          if(!confirm("Revoke this key?"))return;
          const res=await fetch('/api/keys/'+id,{method:'DELETE'});
          if(res.ok)document.getElementById('key-row-'+id).remove();
        }
        async function handleDelete(id){
          if(!confirm("Delete this artifact?"))return;
          const res=await fetch('/api/artifacts/'+id,{method:'DELETE'});
          if(res.ok)document.getElementById('row-'+id).remove();else alert("Failed");
        }
      </script>
    `
  }));
});

uiRoute.delete("/api/artifacts/:id", async (c) => {
  const sessionId = getCookie(c, "session_id");
  const user = await getUserFromSession(sessionId);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  await supabase.from("artifacts").delete().eq("id", id).eq("user_id", user.id);
  return c.json({ success: true });
});
