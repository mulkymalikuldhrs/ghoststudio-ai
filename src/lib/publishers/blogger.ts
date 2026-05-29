// Blogger Publisher — Google Blogger API v3 publisher
// Publishes content to Blogger blogs via the Google Blogger API
// API Docs: https://developers.google.com/blogger/

import { type PublishPayload, type PublishResult, type Publisher } from "./index";

class BloggerPublisher implements Publisher {
  name = "Blogger";
  platform = "blogger" as const;

  async validate(credentials: Record<string, string>): Promise<boolean> {
    const { token } = credentials;

    if (!token) return false;

    try {
      const response = await fetch(
        "https://www.googleapis.com/blogger/v3/users/self",
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
        platform: "blogger",
        error: "Google OAuth2 access token is required",
      };
    }

    if (!endpointUrl) {
      return {
        success: false,
        platform: "blogger",
        error: "Blogger blog ID is required (set as endpointUrl)",
      };
    }

    try {
      const blogId = endpointUrl;
      const apiUrl = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts`;

      // Build the post body
      const body: Record<string, unknown> = {
        kind: "blogger#post",
        title: payload.title,
        content: payload.body,
      };

      // Set labels (Blogger's term for tags)
      if (payload.tags && payload.tags.length > 0) {
        body.labels = payload.tags;
      }

      // Determine if draft or published
      if (payload.status === "draft") {
        body.isDraft = true;
      }

      const response = await fetch(apiUrl, {
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
          platform: "blogger",
          error: `Blogger API error: ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        platform: "blogger",
        postId: data?.id ? String(data.id) : undefined,
        postUrl: data?.url || undefined,
        responsePayload: data,
      };
    } catch (error) {
      return {
        success: false,
        platform: "blogger",
        error: error instanceof Error ? error.message : "Blogger publish failed",
      };
    }
  }
}

export default new BloggerPublisher();
