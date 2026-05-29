// Medium Publisher — Medium REST API publisher
// Publishes content to Medium via the REST API using an integration token
// API Docs: https://github.com/Medium/medium-api-docs

import { type PublishPayload, type PublishResult, type Publisher } from "./index";

class MediumPublisher implements Publisher {
  name = "Medium";
  platform = "medium" as const;

  async validate(credentials: Record<string, string>): Promise<boolean> {
    const { token } = credentials;

    if (!token) return false;

    try {
      const response = await fetch("https://api.medium.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
        platform: "medium",
        error: "Medium integration token is required",
      };
    }

    try {
      // First, get the authenticated user's ID
      const meResponse = await fetch("https://api.medium.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!meResponse.ok) {
        const errorText = await meResponse.text();
        return {
          success: false,
          platform: "medium",
          error: `Medium authentication failed: ${errorText}`,
        };
      }

      const meData = await meResponse.json();
      const authorId = meData?.data?.id;

      if (!authorId) {
        return {
          success: false,
          platform: "medium",
          error: "Could not retrieve Medium user ID",
        };
      }

      // Determine the publish status
      // Medium supports: public, draft, unlisted
      const publishStatus =
        payload.status === "published" ? "public" : "draft";

      // Determine content format — default to markdown
      const contentFormat = "markdown";

      // Build the request body
      const body: Record<string, unknown> = {
        title: payload.title,
        contentFormat,
        content: payload.body,
        publishStatus,
      };

      // Add tags if provided (Medium allows up to 5 tags)
      if (payload.tags && payload.tags.length > 0) {
        body.tags = payload.tags.slice(0, 5);
      }

      // If a publication ID is provided via endpointUrl, publish to that publication
      // Otherwise, publish under the user's own profile
      let postUrl: string;
      if (endpointUrl && endpointUrl.trim() !== "") {
        // endpointUrl stores the publicationId
        postUrl = `https://api.medium.com/v1/publications/${endpointUrl}/posts`;
      } else {
        postUrl = `https://api.medium.com/v1/me/${authorId}/posts`;
      }

      const response = await fetch(postUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          platform: "medium",
          error: `Medium API error: ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        platform: "medium",
        postId: data?.data?.id ? String(data.data.id) : undefined,
        postUrl: data?.data?.url || undefined,
        responsePayload: data,
      };
    } catch (error) {
      return {
        success: false,
        platform: "medium",
        error: error instanceof Error ? error.message : "Medium publish failed",
      };
    }
  }
}

export default new MediumPublisher();
