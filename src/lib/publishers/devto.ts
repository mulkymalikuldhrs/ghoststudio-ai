// Dev.to Publisher — Dev.to (Forem) API publisher
// Publishes content to Dev.to via the REST API using an api-key
// API Docs: https://developers.forem.com/api/

import { type PublishPayload, type PublishResult, type Publisher } from "./index";

class DevToPublisher implements Publisher {
  name = "Dev.to";
  platform = "devto" as const;

  async validate(credentials: Record<string, string>): Promise<boolean> {
    const { token } = credentials;

    if (!token) return false;

    try {
      const response = await fetch("https://dev.to/api/me", {
        headers: {
          "api-key": token,
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
    const { token } = credentials;

    if (!token) {
      return {
        success: false,
        platform: "devto",
        error: "Dev.to API key is required",
      };
    }

    try {
      const apiUrl = "https://dev.to/api/articles";

      // Build the article body
      const body: Record<string, unknown> = {
        article: {
          title: payload.title,
          body_markdown: payload.body,
          published: payload.status === "published",
        },
      };

      // Add tags if provided (Dev.to supports up to 4 tags, comma-separated)
      if (payload.tags && payload.tags.length > 0) {
        body.article = {
          ...(body.article as Record<string, unknown>),
          tags: payload.tags.slice(0, 4).join(","),
        };
      }

      // Add excerpt/description if provided
      if (payload.excerpt) {
        body.article = {
          ...(body.article as Record<string, unknown>),
          description: payload.excerpt,
        };
      }

      // Add canonical URL if provided in metadata
      if (payload.metadata?.canonicalUrl) {
        body.article = {
          ...(body.article as Record<string, unknown>),
          canonical_url: payload.metadata.canonicalUrl,
        };
      }

      // Add series if provided in metadata
      if (payload.metadata?.series) {
        body.article = {
          ...(body.article as Record<string, unknown>),
          series: payload.metadata.series,
        };
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "api-key": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          platform: "devto",
          error: `Dev.to API error: ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        platform: "devto",
        postId: data?.id ? String(data.id) : undefined,
        postUrl: data?.url || undefined,
        responsePayload: data,
      };
    } catch (error) {
      return {
        success: false,
        platform: "devto",
        error: error instanceof Error ? error.message : "Dev.to publish failed",
      };
    }
  }
}

export default new DevToPublisher();
