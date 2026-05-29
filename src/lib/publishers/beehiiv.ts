// Beehiiv Publisher — Beehiiv API v2 publisher
// Publishes content to Beehiiv newsletters via the REST API
// API Docs: https://developers.beehiiv.com/

import { type PublishPayload, type PublishResult, type Publisher } from "./index";

class BeehiivPublisher implements Publisher {
  name = "Beehiiv";
  platform = "beehiiv" as const;

  async validate(credentials: Record<string, string>): Promise<boolean> {
    const { token, endpointUrl } = credentials;

    if (!token || !endpointUrl) return false;

    try {
      // endpointUrl stores the publication ID
      const pubId = endpointUrl;
      const response = await fetch(
        `https://api.beehiiv.com/v2/publications/${pubId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
        platform: "beehiiv",
        error: "Beehiiv API key is required",
      };
    }

    if (!endpointUrl) {
      return {
        success: false,
        platform: "beehiiv",
        error: "Beehiiv publication ID is required (set as endpointUrl)",
      };
    }

    try {
      const pubId = endpointUrl;
      const apiUrl = `https://api.beehiiv.com/v2/publications/${pubId}/posts`;

      // Beehiiv status values: draft, confirmed, queued
      // Map our status to beehiiv's
      let publishStatus: string;
      if (payload.status === "published") {
        publishStatus = "confirmed";
      } else {
        publishStatus = "draft";
      }

      // Build the request body
      const body: Record<string, unknown> = {
        title: payload.title,
        content: payload.body,
        status: publishStatus,
        content_format: "markdown",
      };

      // Add tags if provided
      if (payload.tags && payload.tags.length > 0) {
        body.tags = payload.tags;
      }

      // Add subtitle/excerpt if provided
      if (payload.excerpt) {
        body.subtitle = payload.excerpt;
      }

      // Add featured image if provided
      if (payload.featuredImage) {
        body.thumbnail_url = payload.featuredImage;
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
          platform: "beehiiv",
          error: `Beehiiv API error: ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        platform: "beehiiv",
        postId: data?.data?.id ? String(data.data.id) : undefined,
        postUrl: data?.data?.web_url || undefined,
        responsePayload: data,
      };
    } catch (error) {
      return {
        success: false,
        platform: "beehiiv",
        error:
          error instanceof Error ? error.message : "Beehiiv publish failed",
      };
    }
  }
}

export default new BeehiivPublisher();
