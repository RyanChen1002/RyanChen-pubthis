import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { supabase } from "../supabase.js";

export const authRoute = new Hono();

// Register new user
authRoute.post("/register", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  // Native Supabase Auth Registration
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Supabase Register Error:", error);
    return c.json({ error: error.message }, 400);
  }

  // Supabase has email confirmations enabled by default in the dashboard
  // We inform the frontend to tell the user
  return c.json({ success: true, message: "Registration successful. Please check your email to verify your account before logging in." });
});

// Login
authRoute.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  // Native Supabase SignIn
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    console.error("Supabase Login Error:", error?.message);
    return c.json({ error: error?.message || "Invalid credentials" }, 401);
  }

  // Save the JWT access_token to the cookie so the server knows who is logged in
  setCookie(c, "sb-auth-token", data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return c.json({ success: true, message: "Logged in" });
});

// Logout
authRoute.post("/logout", async (c) => {
  deleteCookie(c, "sb-auth-token", { path: "/" });
  return c.json({ success: true, message: "Logged out" });
});

export async function getUserFromSession(token: string | undefined) {
  if (!token) return null;

  // Native Supabase User extraction from JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}
