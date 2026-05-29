// Mirror Publisher — Browser automation fallback
// Mirror (mirror.xyz) uses Web3/Aragon for publishing and has no standard API.
// This publisher indicates that browser automation is required and provides
// the profile URL for the browser-agent to navigate to.

import { type PublishPayload, type PublishResult, type Publisher } from "./index";

class MirrorPublisher implements Publisher {
  name = "Mirror";
  platform = "mirror" as const;

  async validate(credentials: Record<string, string>): Promise<boolean> {
    const { endpointUrl } = credentials;

    if (!endpointUrl) return false;

    try {
      // Check if the Mirror profile URL is accessible
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
    const { endpointUrl } = credentials;

    if (!endpointUrl) {
      return {
        success: false,
        platform: "mirror",
        error: "Mirror profile URL is required (set as endpointUrl)",
      };
    }

    try {
      // Mirror uses Web3/Aragon for publishing and does not have a
      // standard REST API for programmatic content creation.
      // We return a result indicating that browser automation is needed.
      // The browser-agent should:
      //   1. Navigate to the Mirror dashboard
      //   2. Connect the Ethereum wallet (if not already connected)
      //   3. Create a new entry
      //   4. Fill in the title and body (markdown supported)
      //   5. Sign the transaction via Aragon
      //   6. Publish to the blockchain

      const dashboardUrl = `${endpointUrl.replace(/\/$/, "")}/dashboard`;

      return {
        success: false,
        platform: "mirror",
        error:
          "Mirror uses Web3/Aragon for publishing. Browser automation is required to publish.",
        postId: `mirror-pending-${Date.now()}`,
        postUrl: dashboardUrl,
        responsePayload: {
          requiresBrowserAutomation: true,
          profileUrl: endpointUrl,
          dashboardUrl,
          postDraft: {
            title: payload.title,
            body: payload.body,
            tags: payload.tags || [],
            featuredImage: payload.featuredImage || null,
            status: payload.status || "draft",
          },
          instructions: [
            `Navigate to ${dashboardUrl}`,
            "Ensure the Ethereum wallet is connected",
            "Click 'New Entry' or navigate to the writing editor",
            "Fill in the post title field",
            "Fill in the post body/content field (Markdown supported)",
            payload.featuredImage
              ? `Set featured image: ${payload.featuredImage}`
              : undefined,
            "Sign the publishing transaction via Arragon wallet",
            "Confirm the transaction on the blockchain",
          ].filter(Boolean),
          web3Info: {
            protocol: "Aragon",
            chain: "Ethereum/Optimism",
            note: "Mirror publishes entries on-chain. Each post requires a wallet signature and gas fees may apply.",
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        platform: "mirror",
        error:
          error instanceof Error ? error.message : "Mirror publish failed",
      };
    }
  }
}

export default new MirrorPublisher();
