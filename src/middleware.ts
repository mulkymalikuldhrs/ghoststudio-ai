import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Rate limiting store (in-memory, per-instance)
// NOTE: For production, replace with Redis-based rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = {
  api: 60,       // 60 requests per minute for API
  auth: 10,      // 10 requests per minute for auth
  generate: 5,   // 5 requests per minute for AI generation
  ai: 10,        // 10 requests per minute for AI agent routes
};

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or fallback to a default
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

function checkRateLimit(
  key: string,
  maxRequests: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    const key = getRateLimitKey(request);

    // Determine rate limit based on route
    let maxRequests = RATE_LIMIT_MAX.api;
    if (pathname.startsWith("/api/auth/")) {
      maxRequests = RATE_LIMIT_MAX.auth;
    } else if (pathname.includes("/generate")) {
      maxRequests = RATE_LIMIT_MAX.generate;
    } else if (pathname.startsWith("/api/ai/")) {
      maxRequests = RATE_LIMIT_MAX.ai;
    }

    const { allowed, remaining } = checkRateLimit(key, maxRequests);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  // Protect authenticated pages - check JWT token
  if (pathname.startsWith("/os") || pathname.startsWith("/dashboard")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      // Redirect to signin with callback URL
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/os/:path*",
  ],
};
