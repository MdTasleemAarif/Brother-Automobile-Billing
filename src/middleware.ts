import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/BA-logo.png" ||
    pathname === "/BA-logo2.png" ||
    pathname === "/loginProfile.jpeg" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || isPublicAsset(pathname);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    if (pathname === "/login") {
      const session = await verifySessionToken(
        req.cookies.get(SESSION_COOKIE_NAME)?.value,
        process.env.AUTH_SECRET
      );

      if (session) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  }

  const session = await verifySessionToken(
    req.cookies.get(SESSION_COOKIE_NAME)?.value,
    process.env.AUTH_SECRET
  );

  if (session) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", `${pathname}${req.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
