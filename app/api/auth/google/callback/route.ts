import { NextRequest, NextResponse } from "next/server";
import { handleGoogleCallback } from "@/lib/actions/auth-actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "/dashboard";
  const error = searchParams.get("error");

  // Handle OAuth error
  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent("Google sign-in failed")}`, request.url)
    );
  }

  // Validate code
  if (!code) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent("No authorization code received")}`, request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const googleUser = await userInfoResponse.json();

    // Create/update user and session
    const result = await handleGoogleCallback({
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });

    if (!result.success) {
      throw new Error("Failed to create user session");
    }

    // Redirect to dashboard or original destination
    return NextResponse.redirect(new URL(state, request.url));
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent("Failed to sign in with Google")}`,
        request.url
      )
    );
  }
}
