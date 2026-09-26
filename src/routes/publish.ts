import { Hono } from "hono";
import { ulid } from "ulid";
import { CONFIG } from "../config.js";
import { isDiskFull } from "../health.js";
import { log } from "../logger.js";
import { writeArtifact } from "../storage.js";
import { extractOgMeta } from "../og.js";
import { op } from "../analytics.js";
import { getUserFromApiKey } from "./apikeys.js";
import type { ArtifactMeta, PublishRequest, PublishResponse } from "../types.js";

export const publishRoute = new Hono();

publishRoute.post("/publish", async (c) => {
  let body: PublishRequest;
  try {
    body = await c.req.json<PublishRequest>();
  } catch {
    log.warn("publish: invalid JSON body");
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Reject if disk is nearly full
  if (await isDiskFull()) {
    log.error("publish: rejected — disk usage above threshold");
    return c.json({ error: "Service temporarily unavailable — storage full" }, 503);
  }

  // Validate content
  if (typeof body.content !== "string" || body.content.length === 0) {
    return c.json({ error: "content is required and must be a non-empty string" }, 400);
  }

  // Resolve content type
  const contentType = body.content_type || "text/plain";
  if (!CONFIG.ALLOWED_CONTENT_TYPES.has(contentType)) {
    return c.json({ error: `Unsupported content type: ${contentType}` }, 415);
  }

  // Check if pinned (admin-only)
  const isPinned = body.pinned === true;
  if (isPinned) {
    const adminSecret = c.req.header("X-Admin-Secret");
    if (!CONFIG.ADMIN_SECRET || adminSecret !== CONFIG.ADMIN_SECRET) {
      return c.json({ error: "Unauthorized: admin secret required for pinned artifacts" }, 403);
    }
  }

  // Resolve TTL (pinned artifacts bypass TTL entirely)
  const now = new Date();
  let ttl: number;
  let expiresAt: Date;
  if (isPinned) {
    ttl = 0;
    expiresAt = new Date("9999-12-31T23:59:59Z");
  } else {
    ttl = body.ttl_seconds ?? CONFIG.DEFAULT_TTL_SECONDS;
    if (!Number.isInteger(ttl) || ttl <= 0 || ttl > CONFIG.MAX_TTL_SECONDS) {
      return c.json(
        { error: `ttl_seconds must be an integer between 1 and ${CONFIG.MAX_TTL_SECONDS}` },
        400,
      );
    }
    expiresAt = new Date(now.getTime() + ttl * 1000);
  }

  // Decode content
  const isBinary = CONFIG.BINARY_CONTENT_TYPES.has(contentType);
  let contentBuffer: Buffer;
  try {
    contentBuffer = isBinary
      ? Buffer.from(body.content, "base64")
      : Buffer.from(body.content, "utf-8");
  } catch {
    return c.json({ error: "Failed to decode content" }, 400);
  }

  // Check size
  if (contentBuffer.length > CONFIG.MAX_PAYLOAD_BYTES) {
    return c.json({ error: "Payload too large" }, 413);
  }

  // Generate ID
  const artifactId = ulid();

  // Extract OG metadata from text content
  const og = !isBinary
    ? extractOgMeta(body.content, contentType)
    : extractOgMeta("", contentType);

  const meta: ArtifactMeta = {
    artifact_id: artifactId,
    content_type: contentType,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    size_bytes: contentBuffer.length,
    og_title: og.og_title,
    og_description: og.og_description,
    ...(isPinned && { pinned: true }),
  };

  // Resolve user: 1) Bearer API key (any AI model), 2) legacy PUBTHIS_USER header
  let userId: string | null = null;
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerKey = authHeader.split(" ")[1];
    // If it looks like an API key (pk_...) look it up; otherwise treat as raw user ID (legacy)
    if (bearerKey.startsWith("pk_")) {
      userId = await getUserFromApiKey(bearerKey);
    } else {
      userId = bearerKey;
    }
  }
  // Legacy support: PUBTHIS_USER header
  if (!userId) {
    userId = c.req.header("PUBTHIS_USER") || null;
  }

  await writeArtifact(artifactId, contentBuffer, meta, userId ?? undefined);

  log.info(
    { artifact_id: artifactId, content_type: contentType, size_bytes: contentBuffer.length, ttl_seconds: ttl },
    "publish: artifact created",
  );

  op.track("artifact_published", {
    artifact_id: artifactId,
    content_type: contentType,
    size_bytes: contentBuffer.length,
    ttl_seconds: ttl,
  });

  const response: PublishResponse = {
    artifact_id: artifactId,
    url: `${CONFIG.BASE_URL}/a/${artifactId}`,
    expires_at: meta.expires_at,
    content_type: contentType,
    ...(isPinned && { pinned: true }),
  };

  return c.json(response, 201);
});
