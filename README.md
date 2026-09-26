# 🚀 PubThis

**PubThis** is an insanely simple, open-source publishing tool that lets you turn any AI-generated content (like markdown, code, PDFs, or HTML prototypes) into a **live, shareable web link** instantly. 

We took the original core open-source concept and entirely re-engineered it for production scale—giving every user their own Dashboard and Universal API Keys. 

---

## 🌟 What's New? (The Upgrades)

Since launching from the original boilerplate codebase, **PubThis** has drastically leveled up:

1. **🏰 Supabase Backend (PostgreSQL)**
   We ditched the local SQLite database. All data is now housed in a rock-solid, production-grade Supabase backend, making the app 100% cloud-native.
2. **🔐 Native Email Authentication**
   Instead of just saving usernames on a local disk, users now securely register, verify their emails, and log in through Supabase Native Auth. Row Level Security guarantees that absolutely no one but you can touch your files.
3. **🔑 Universal API Keys**
   PubThis is no longer tied strictly to Claude. From your Dashboard, you can generate as many secure **API Keys** as you want. You can plug these keys into ChatGPT, Gemini, simple Python scripts, or custom frontends to instantly publish files anywhere.
4. **🎨 Modern Glassmorphic Dashboard**
   We added a gorgeous, interactive web dashboard so you can safely view, manage, and delete the artifacts you publish, as well as generate and revoke API keys with one click.
5. **🌐 Cloud Deployment (AWS EC2 + NGINX)**
   The infrastructure has been completely updated to run flawlessly on an AWS EC2 instance using PM2 to guarantee 100% uptime, protected behind an Nginx reverse proxy.

---

## 🛠 How It Works

**1. Create a Key**
Sign up on your PubThis website, go to your Dashboard, and click **+ Generate New Key**. 

**2. Send a Request**
Use that key anywhere in the world. Ask your AI to fire a `POST` request to your server, or use a simple cURL command:
```bash
curl -X POST https://yourwebsite.com/v1/publish \
  -H "Authorization: Bearer pk_your_secret_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"content": "# Hello World!", "content_type": "text/markdown"}'
```

**3. Share the Link!**
PubThis instantly hands back a live, temporary web link (e.g., `https://yourwebsite.com/a/01JABCD`). Anyone you give the link to will see your beautifully rendered markdown, code, or image right in their browser.

---

## 🏗 Architecture (Simple Version)

- **Frontend UI:** Built with standard HTML, Hono, and vanilla CSS for a lightning-fast dashboard experience.
- **Backend API:** Built on **Node.js** and **Hono** (a fast web framework). It processes the files and talks to the database.
- **Database:** **Supabase (Postgres)** handles user accounts, stores the API keys, and securely saves the files.
- **Hosting:** Runs on a standard **Ubuntu Linux** server (AWS EC2). **PM2** keeps the app running 24/7, and **Nginx** handles incoming web traffic securely.

---

## 🚀 Getting Started (Self-Hosting)

Want to run your own PubThis server? 
1. Create a completely free [Supabase](https://supabase.com/) project.
2. Clone this repository to your computer or cloud server.
3. Take your Supabase URL and Service Key and put them in a `.env` file!
4. Run the Schema setup block provided in the codebase in your Supabase SQL Editor.
5. Type `npm install` and `npm run start`. You are fully online!
