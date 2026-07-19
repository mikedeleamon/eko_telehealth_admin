import { NextResponse, type NextRequest } from "next/server";

// Mock mode needs no auth (demos click straight through). Live mode requires a
// session cookie for every page and every proxied API call.
const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true" || !process.env.NEXT_PUBLIC_API_URL;

const SESSION_COOKIE = "eko_session";

// Next 16 "proxy" convention (formerly middleware).
export function proxy(req: NextRequest) {
  if (USE_MOCK) return NextResponse.next();

  const { pathname } = req.nextUrl;
  // The login page and the login/logout handlers must stay reachable.
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
