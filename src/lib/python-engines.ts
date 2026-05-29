// ────────────────────────────────────────────────────────────────────────────────
// Python Engine Proxy Utilities
// Shared helpers for proxying requests to Docker sidecar Python services
// ────────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

// ─── Engine URL Configuration ────────────────────────────────────────────────

const HEATMAP_CLIPPER_URL =
  process.env.HEATMAP_CLIPPER_URL || "http://localhost:5001";

const PIXELLE_VIDEO_URL =
  process.env.PIXELLE_VIDEO_URL || "http://localhost:8000";

/**
 * Returns the base URL for the Heatmap Clipper Python engine.
 */
export function getHeatmapClipperUrl(): string {
  return HEATMAP_CLIPPER_URL;
}

/**
 * Returns the base URL for the Pixelle Video Python engine.
 */
export function getPixelleVideoUrl(): string {
  return PIXELLE_VIDEO_URL;
}

// ─── Headers that should NOT be forwarded to the Python engine ───────────────

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

/**
 * Generic proxy function that forwards a NextRequest to a target URL.
 *
 * - Preserves the HTTP method, headers, and body
 * - Strips hop-by-hop headers that must not be forwarded
 * - Returns the upstream response with status and body preserved
 * - On connection failure, returns a 503 Service Unavailable response
 *
 * @param request - The incoming NextRequest to proxy
 * @param targetUrl - The full URL to forward the request to
 * @param options - Optional configuration (timeout in ms)
 * @returns NextResponse with the proxied result
 */
export async function proxyRequest(
  request: NextRequest,
  targetUrl: string,
  options?: { timeoutMs?: number }
): Promise<NextResponse> {
  const timeoutMs = options?.timeoutMs ?? 30_000;

  try {
    // Clone headers, removing hop-by-hop headers
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    // Read the request body (only for methods that carry a body)
    const method = request.method;
    let body: BodyInit | null = null;

    if (method === "POST" || method === "PUT" || method === "PATCH") {
      const contentType = request.headers.get("content-type") ?? "";

      if (contentType.includes("multipart/form-data")) {
        // For multipart form data, forward the raw ArrayBuffer
        body = await request.arrayBuffer();
      } else {
        // For JSON and other text-based payloads, forward as-is
        body = await request.arrayBuffer();
      }
    }

    // Create an AbortController for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal: controller.signal,
      // @ts-expect-error — Next.js / Node fetch duplex support
      duplex: body ? "half" : undefined,
    });

    clearTimeout(timeoutId);

    // Build the response, preserving status and headers
    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }

    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    // Handle timeout separately
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error(`[python-engines] Request to ${targetUrl} timed out after ${timeoutMs}ms`);
      return NextResponse.json(
        {
          error: "Service request timed out",
          code: "TIMEOUT",
          target: targetUrl,
        },
        { status: 504 }
      );
    }

    // Connection refused, DNS failure, etc.
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error(`[python-engines] Proxy to ${targetUrl} failed:`, message);

    return NextResponse.json(
      {
        error: "Service unavailable",
        code: "SERVICE_DOWN",
        target: targetUrl,
        detail: message,
      },
      { status: 503 }
    );
  }
}
