// Hashnode Publisher — Hashnode GraphQL API publisher
// Publishes content to Hashnode blogs via the GraphQL API using a Personal Access Token
// API Docs: https://api.hashnode.com (GraphQL)

import { type PublishPayload, type PublishResult, type Publisher } from "./index";

const HASHNODE_API_URL = "https://api.hashnode.com";

class HashnodePublisher implements Publisher {
  name = "Hashnode";
  platform = "hashnode" as const;

  async validate(credentials: Record<string, string>): Promise<boolean> {
    const { token } = credentials;

    if (!token) return false;

    try {
      const query = `
        query Me {
          me {
            id
            username
          }
        }
      `;

      const response = await fetch(HASHNODE_API_URL, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return !data.errors && data?.data?.me != null;
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
        platform: "hashnode",
        error: "Hashnode Personal Access Token is required",
      };
    }

    if (!endpointUrl) {
      return {
        success: false,
        platform: "hashnode",
        error: "Hashnode publication ID is required (set as endpointUrl)",
      };
    }

    try {
      const publicationId = endpointUrl;

      // GraphQL mutation for creating a post
      const mutation = `
        mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) {
            post {
              id
              slug
              url
              title
            }
          }
        }
      `;

      // Build the input variables
      const input: Record<string, unknown> = {
        title: payload.title,
        contentMarkdown: payload.body,
        publicationId,
        isRepublished: null,
      };

      // Set publish status
      if (payload.status === "published") {
        input.isDraft = false;
      } else {
        input.isDraft = true;
      }

      // Add tags if provided
      if (payload.tags && payload.tags.length > 0) {
        input.tags = payload.tags.map((tag) => ({
          name: tag,
          slug: tag.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        }));
      }

      // Add subtitle/excerpt if provided
      if (payload.excerpt) {
        input.subtitle = payload.excerpt;
      }

      // Add cover image if provided
      if (payload.featuredImage) {
        input.coverImageOptions = {
          coverImageURL: payload.featuredImage,
          isCover: true,
        };
      }

      // Add canonical URL if provided in metadata
      if (payload.metadata?.canonicalUrl) {
        input.isRepublished = {
          originalArticleURL: payload.metadata.canonicalUrl,
        };
      }

      const response = await fetch(HASHNODE_API_URL, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: mutation,
          variables: { input },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          platform: "hashnode",
          error: `Hashnode API error: ${errorText}`,
        };
      }

      const data = await response.json();

      // Check for GraphQL errors
      if (data.errors) {
        const errorMsg = data.errors
          .map((e: { message: string }) => e.message)
          .join("; ");
        return {
          success: false,
          platform: "hashnode",
          error: `Hashnode GraphQL error: ${errorMsg}`,
          responsePayload: data,
        };
      }

      const post = data?.data?.createPost?.post;

      return {
        success: true,
        platform: "hashnode",
        postId: post?.id ? String(post.id) : undefined,
        postUrl: post?.url || undefined,
        responsePayload: data,
      };
    } catch (error) {
      return {
        success: false,
        platform: "hashnode",
        error:
          error instanceof Error ? error.message : "Hashnode publish failed",
      };
    }
  }
}

export default new HashnodePublisher();
