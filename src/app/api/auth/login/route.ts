import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionExpiry,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { normalizeLoginIdentifier, verifyPassword } from "@/lib/auth/password";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      identifier?: string;
      password?: string;
      remember?: boolean;
    };

    const username = process.env.LOGIN_USERNAME;
    const email = process.env.LOGIN_EMAIL;
    const passwordHash = process.env.LOGIN_PASSWORD_HASH;
    const authSecret = process.env.AUTH_SECRET;

    if (!username || !email || !passwordHash || !authSecret) {
      return NextResponse.json(
        { error: "Login is not configured. Please check server environment." },
        { status: 500 }
      );
    }

    const identifier = normalizeLoginIdentifier(body.identifier || "");
    const validIdentifier =
      identifier === normalizeLoginIdentifier(username) ||
      identifier === normalizeLoginIdentifier(email);

    if (!validIdentifier || !verifyPassword(body.password || "", passwordHash)) {
      return NextResponse.json(
        { error: "Invalid username, email, or password." },
        { status: 401 }
      );
    }

    const maxAge = body.remember ? REMEMBER_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;
    const token = await createSessionToken(
      {
        sub: "brothers-automobiles-admin",
        name: username,
        email,
        exp: getSessionExpiry(maxAge),
      },
      authSecret
    );

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });

    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to login. Please try again." }, { status: 500 });
  }
}
