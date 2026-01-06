import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  // Build Google OAuth URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  googleAuthUrl.searchParams.append("client_id", process.env.GOOGLE_CLIENT_ID || "");
  googleAuthUrl.searchParams.append("redirect_uri", process.env.GOOGLE_REDIRECT_URI || "");
  googleAuthUrl.searchParams.append("response_type", "code");
  googleAuthUrl.searchParams.append("scope", "openid email profile");
  googleAuthUrl.searchParams.append("access_type", "offline");
  googleAuthUrl.searchParams.append("prompt", "consent");
  googleAuthUrl.searchParams.append("state", redirectTo);

  return NextResponse.redirect(googleAuthUrl.toString());
}
