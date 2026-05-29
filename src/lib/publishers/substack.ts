// Substack Publisher — Browser automation fallback
// Substack has no public API for publishing.
// This publisher indicates that browser automation is required and provides
// the publication URL for the browser-agent to navigate to.

import { type PublishPayload, type PublishResult, type Publisher } from "./index";

class SubstackPublisher implements Publisher {
  name = "Substack";
  platform = "substack" as const;

  async validate(credentials: Record<string, string>): Promise<boolean> {
    const { endpointUrl } = credentials;

    if (!endpointUrl) return false;

    try {
      // Check if the Substack publication URL is accessible
      const response = await fetch(endpointUrl, {
        method: "HEAD",
        redirect: "follow",
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
    const { endpointUrl, token } = credentials;

    if (!endpointUrl) {
      return {
        success: false,
        platform: "substack",
        error: "Substack publication URL is required (set as endpointUrl)",
      };
    }

    try {
      // Substack does not have a public API for programmatic publishing.
      // We return a result indicating that browser automation is needed.
      // The browser-agent should:
      //   1. Navigate to {endpointUrl}/admin/post/new
      //   2. Fill in the title and body
      //   3. Optionally add tags / featured image
      //   4. Click publish or save as draft

      const adminUrl = `${endpointUrl.replace(/\/$/, "")}/admin/post/new`;

      return {
        success: false,
        platform: "substack",
        error:
          "Substack does not have a public API. Browser automation is required to publish.",
        postId: `substack-pending-${Date.now()}`,
        postUrl: adminUrl,
        responsePayload: {
          requiresBrowserAutomation: true,
          publicationUrl: endpointUrl,
          adminUrl,
          postDraft: {
            title: payload.title,
            body: payload.body,
            tags: payload.tags || [],
            featuredImage: payload.featuredImage || null,
            status: payload.status || "draft",
          },
          instructions: [
            `Navigate to ${adminUrl}`,
            "Fill in the post title field",
            "Fill in the post body/content field",
            payload.tags?.length
              ? `Add tags: ${payload.tags.join(", ")}`
              : undefined,
            payload.featuredImage
              ? `Set featured image: ${payload.featuredImage}`
              : undefined,
            payload.status === "published"
              ? "Click the Publish button"
              : "Click Save Draft",
          ].filter(Boolean),
        },
      };
    } catch (error) {
      return {
        success: false,
        platform: "substack",
        error:
          error instanceof Error ? error.message : "Substack publish failed",
      };
    }
  }
}

export default new SubstackPublisher();
