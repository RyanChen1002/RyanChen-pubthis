import { Hono } from "hono";
import { publishRoute } from "./routes/publish.js";
import { serveRoute } from "./routes/serve.js";
import { authRoute } from "./routes/auth.js";
import { uiRoute } from "./routes/ui.js";
import { apiKeysRoute } from "./routes/apikeys.js";
import { rateLimiter } from "./middleware/rate-limit.js";
import { getDiskStatus } from "./health.js";

const WEBSITE_URL = "https://www.pubthis.co";

/** Paths served by the API — everything else redirects browsers to the website */
const API_PREFIXES = ["/v1/", "/a/", "/robots.txt", "/llms.txt"];

function isBrowser(accept: string): boolean {
  return accept.includes("text/html");
}

export function createApp(): Hono {
  const app = new Hono();

  app.get("/disk", async (c) => {
    try {
      const disk = await getDiskStatus();
      return c.json({ status: "ok", disk });
    } catch {
      return c.json({ status: "ok" });
    }
  });

  app.get("/robots.txt", (c) => {
    return c.text(
      `User-agent: *\nAllow: /a/\nHost: https://pubthis.co\n`,
      200,
      { "Content-Type": "text/plain" },
    );
  });

  app.get("/llms.txt", (c) => {
    return c.text(
      [
        "# /pub",
        "",
        "> Publish directly from Claude Code. Get a temporary, shareable link.",
        "",
        "/pub is a publishing tool for Claude Code. It lets you publish chats, markdown files, prototypes, and documents directly from Claude Code and get a temporary, shareable URL.",
        "",
        "## How it works",
        "",
        "- Ask Claude Code to share or publish something",
        "- Claude calls the /pub API with your content",
        "- You get back a temporary URL (expires in 7 days)",
        "- Anyone with the link can view the rendered content",
        "",
        "## API",
        "",
        "POST https://pubthis.co/v1/publish",
        "",
        "Request:",
        "- content (string, required): The content to publish",
        "- content_type (string): text/markdown, text/html, text/plain, application/pdf, image/png, image/jpeg, image/webp",
        "- ttl_seconds (integer): Time to live, max 604800 (7 days)",
        "",
        "Response:",
        "- artifact_id: ULID identifier",
        "- url: Shareable URL (https://pubthis.co/a/{id})",
        "- expires_at: ISO 8601 expiration timestamp",
        "- content_type: The content type used",
        "",
        "## Docs",
        "",
        "- [Quickstart](https://www.pubthis.co/docs)",
        "- [API Reference](https://www.pubthis.co/docs/api)",
        "",
        "## Source",
        "",
        "- GitHub: https://github.com/coreyrab/pubthis",
        "- Website: https://www.pubthis.co",
      ].join("\n"),
      200,
      { "Content-Type": "text/plain" },
    );
  });

  // Removed redirect since we have our own UI now

  app.use("/v1/*", rateLimiter());

  app.route("/v1", publishRoute);
  app.route("/a", serveRoute);
  app.route("/api/auth", authRoute);
  app.route("/", apiKeysRoute);
  app.route("/", uiRoute);

  return app;
}
