// A simple Node script to programmatically publish to your local server
const exampleWebsiteHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My First Published Link!</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; }
        .card { background: rgba(255,255,255,0.05); padding: 50px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(10px); max-width: 600px;}
        h1 { background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 3rem; margin-top:0;}
        p { font-size: 1.2rem; color: #94a3b8; line-height: 1.6; }
        .badge { background: #38bdf8; color: #0f172a; padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 20px;}
    </style>
</head>
<body>
    <div class="card">
        <h1>Hello from Antigravity! 🚀</h1>
        <p>This entire webpage was published purely through code and successfully saved to your private <strong>pubthis</strong> SQLite database.</p>
        <p>Because it was sent with your unique <code>PUBTHIS_USER</code> ID, it is now safely linked to your personal Dashboard!</p>
        <div class="badge">Status: Success</div>
    </div>
</body>
</html>
`;

async function run() {
  try {
    const res = await fetch("http://localhost:3000/v1/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PUBTHIS_USER": "YOUR_USER_ID_HERE" // Your personal ID
      },
      body: JSON.stringify({
        content: exampleWebsiteHtml,
        content_type: "text/html",
        ttl_seconds: 604800 // 7 days
      })
    });
    
    const data = await res.json();
    console.log("✅ Successfully Published!");
    console.log("ID:", data.artifact_id);
    console.log("View it here:", data.url);
  } catch (err) {
    console.error("❌ Failed to publish", err.message);
  }
}

run();
