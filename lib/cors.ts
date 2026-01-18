// lib/cors.ts
import { NextResponse } from "next/server";

/**
 * CORS headers for public API endpoints that need to be accessed from embedded widgets
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
};

/**
 * Handle preflight OPTIONS request for CORS
 */
export function handleCorsPreFlight() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Add CORS headers to a NextResponse
 */
export function withCors(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJsonResponse(data: unknown, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  return withCors(response);
}
