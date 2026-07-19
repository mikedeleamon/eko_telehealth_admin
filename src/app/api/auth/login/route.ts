import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const SESSION_COOKIE = "eko_session";

/**
 * Admin login. Authenticates against the backend, and only issues a session if
 * the account is an Admin. The access token is stored in an httpOnly cookie, so
 * it is never exposed to client-side JavaScript.
 */
export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message ?? "Invalid email or password." },
      { status: res.status },
    );
  }

  const session = await res.json();
  if (session.user?.accountType !== "Admin") {
    return NextResponse.json({ message: "This account is not an administrator." }, { status: 403 });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // matches the backend access-token TTL (1h)
  });

  return NextResponse.json({
    user: { name: `${session.user.firstName} ${session.user.lastName}`, email: session.user.email },
  });
}
