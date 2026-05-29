// WordPress Publisher — WordPress REST API publisher
// Publishes content to WordPress sites via the REST API

import { type PublishPayload, type PublishResult, type Publisher } from "./index";

class WordPressPublisher implements Publisher {
  name = "WordPress";
  platform = "wordpress" as const;

  async publish(
    payload: PublishPayload,
    credentials: Record<string, string>
  ): Promise<PublishResult> {
    const { endpointUrl, token } = credentials;

    if (!endpointUrl || !token) {
      return {
        success: false,
        platform: "wordpress",
        error: "WordPress URL and application password are required",
      };
    }

    try {
      const wpUrl = `${endpointUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`;

      const body = {
        title: payload.title,
        content: payload.body,
        excerpt: payload.excerpt || "",
        status: payload.status === "published" ? "publish" : "draft",
        categories: payload.categories || [],
        tags: payload.tags || [],
        featured_media: payload.featuredImage ? parseInt(payload.featuredImage) : undefined,
      };

      const response = await fetch(wpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${token}`, // Base64(username:application_password)
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          platform: "wordpress",
          error: `WordPress API error: ${error}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        platform: "wordpress",
        postId: String(data.id),
        postUrl: data.link,
        responsePayload: data,
      };
    } catch (error) {
      return {
        success: false,
        platform: "wordpress",
        error: error instanceof Error ? error.message : "WordPress publish failed",
      };
    }
  }

  async validate(credentials: Record<string, string>): Promise<boolean> {
    const { endpointUrl, token } = credentials;

    if (!endpointUrl || !token) return false;

    try {
      const wpUrl = `${endpointUrl.replace(/\/$/, "")}/wp-json/wp/v2/users/me`;
      const response = await fetch(wpUrl, {
        headers: {
          Authorization: `Basic ${token}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new WordPressPublisher();
