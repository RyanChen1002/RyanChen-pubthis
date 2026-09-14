import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { ulid } from "ulid";
import { db } from "../db.js";

export const authRoute = new Hono();

// Register new user
authRoute.post("/register", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const userId = ulid();

  try {
    const insert = db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)");
    insert.run(userId, email, hash);
    return c.json({ success: true, message: "User created" });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return c.json({ error: "Email already in use" }, 400);
    }
    return c.json({ error: "Database error" }, 500);
  }
});

// Login
authRoute.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  // Create a session
  const sessionId = ulid();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(sessionId, user.id, expiresAt.toISOString());

  setCookie(c, "session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });

  return c.json({ success: true, message: "Logged in" });
});

// Logout
authRoute.post("/logout", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (sessionId) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    deleteCookie(c, "session_id", { path: "/" });
  }
  return c.json({ success: true, message: "Logged out" });
});

export async function getUserFromSession(sessionId: string | undefined) {
  if (!sessionId) return null;
  const session = db.prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?").get(sessionId) as any;
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }

  return db.prepare("SELECT id, email FROM users WHERE id = ?").get(session.user_id) as any;
}
