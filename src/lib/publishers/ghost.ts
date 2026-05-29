// Ghost Publisher — Ghost Admin API publisher
// Publishes content to Ghost blogs via the Admin API using JWT authentication
// API Docs: https://ghost.org/docs/admin-api/
//
// The Admin API key format is "id:secret". We split it and generate a JWT
// using the id as the `kid` header and sign with the secret using HS256.

import { createHmac } from "crypto";
import { type PublishPayload, type PublishResult, type Publisher } from "./index";

/**
 * Generate a Ghost Admin API JWT token from the id:secret key pair.
 * The JWT has:
 *  - Header: { alg: "HS256", typ: "JWT", kid: id }
 *  - Payload: { iat: now, exp: now + 5min, aud: "/admin/" }
 */
function generateGhostToken(adminApiKey: string): string {
  const [id, secret] = adminApiKey.split(":");

  if (!id || !secret) {
    throw new Error(
      "Invalid Ghost Admin API key format. Expected 'id:secret'."
    );
  }

  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })
  ).toString("base64url");

  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iat: now,
      exp: now + 5 * 60, // 5 minutes
      aud: "/admin/",
    })
  ).toString("base64url");

  const signature = createHmac("sha256", Buffer.from(secret, "hex"))
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

class GhostPublisher implements Publisher {
  name = "Ghost";
  platform = "ghost" as const;

  async validate(credentials: Record<string, string>): Promise<boolean> {
    const { token, endpointUrl } = credentials;

    if (!token || !endpointUrl) return false;

    try {
      const ghostUrl = endpointUrl.replace(/\/$/, "");
      const jwt = generateGhostToken(token);

      const response = await fetch(
        `${ghostUrl}/ghost/api/admin/posts/?limit=1`,
        {
          headers: {
            Authorization: `Ghost ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async publish(
    payload: PublishPayload,
    credentials: Record<string, string>
  ): Promise<PublishResult> {
    const { token, endpointUrl } = credentials;

    if (!token) {
      return {
        success: false,
        platform: "ghost",
        error: "Ghost Admin API key is required (format: id:secret)",
      };
    }

    if (!endpointUrl) {
      return {
        success: false,
        platform: "ghost",
        error: "Ghost site URL is required (set as endpointUrl)",
      };
    }

    try {
      const ghostUrl = endpointUrl.replace(/\/$/, "");
      const jwt = generateGhostToken(token);
      const apiUrl = `${ghostUrl}/ghost/api/admin/posts/`;

      // Build the post body following Ghost Admin API spec
      const body: Record<string, unknown> = {
        posts: [
          {
            title: payload.title,
            html: payload.body,
            status: payload.status === "published" ? "published" : "draft",
          },
        ],
      };

      // Add feature image if provided
      if (payload.featuredImage) {
        (body.posts as Record<string, unknown>[])[0].feature_image =
          payload.featuredImage;
      }

      // Add excerpt if provided
      if (payload.excerpt) {
        (body.posts as Record<string, unknown>[])[0].custom_excerpt =
          payload.excerpt;
      }

      // Add tags if provided
      if (payload.tags && payload.tags.length > 0) {
        (body.posts as Record<string, unknown>[])[0].tags = payload.tags.map(
          (tag) => ({ name: tag })
        );
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Ghost ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          platform: "ghost",
          error: `Ghost API error: ${errorText}`,
        };
      }

      const data = await response.json();
      const post = data?.posts?.[0];

      return {
        success: true,
        platform: "ghost",
        postId: post?.id ? String(post.id) : undefined,
        postUrl: post?.url || undefined,
        responsePayload: data,
      };
    } catch (error) {
      // Handle JWT generation errors specifically
      if (
        error instanceof Error &&
        error.message.includes("Invalid Ghost Admin API key")
      ) {
        return {
          success: false,
          platform: "ghost",
          error: error.message,
        };
      }

      return {
        success: false,
        platform: "ghost",
        error: error instanceof Error ? error.message : "Ghost publish failed",
      };
    }
  }
}

export default new GhostPublisher();
