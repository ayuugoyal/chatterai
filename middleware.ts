import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/chat",
  "/embed.js",
];

const authRoutes = ["/sign-in", "/sign-up"];

// CORS headers for public API routes
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a public API route used by embed script
  const isPublicApiRoute =
    pathname.startsWith("/api/chat/") ||
    pathname.startsWith("/api/agents/slug/") ||
    pathname.match(/^\/api\/agents\/[^/]+\/ui-config$/);

  // Handle CORS preflight OPTIONS requests for public API routes
  if (request.method === "OPTIONS" && isPublicApiRoute) {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Allow public routes and public API routes
  if (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    isPublicApiRoute
  ) {
    return NextResponse.next();
  }

  // Check for session
  const sessionToken = request.cookies.get("session_token")?.value;

  // If no session and trying to access protected route
  if (!sessionToken && !publicRoutes.includes(pathname)) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If has session and trying to access auth routes
  if (sessionToken && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
