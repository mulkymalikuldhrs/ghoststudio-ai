/**
 * WordPress Publisher Adapter
 *
 * Publishes content to WordPress via the REST API v2.
 * Uses Application Passwords for authentication (Base64 encoded).
 * Includes retry logic and comprehensive error handling.
 */

import { db } from '@/lib/db';

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface WordPressConfig {
  endpointUrl: string;
  username: string;
  applicationPassword: string;
}

export interface WordPressPost {
  title: string;
  content: string; // HTML content
  status: 'draft' | 'publish' | 'future' | 'pending' | 'private';
  slug: string;
  categories?: number[];
  tags?: number[];
  featuredMedia?: number;
  excerpt?: string;
  date?: string; // ISO 8601 date string for scheduling
}

export interface WordPressPostResponse {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  type: string;
  categories: number[];
  tags: number[];
  featured_media: number;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

// ─── WordPress Publisher Class ───────────────────────────────────────────────

export class WordPressPublisher {
  private config: WordPressConfig;
  private baseUrl: string;
  private authHeader: string;
  private retryConfig: RetryConfig;

  constructor(config: WordPressConfig, retryConfig?: Partial<RetryConfig>) {
    this.config = config;
    this.baseUrl = `${config.endpointUrl.replace(/\/$/, '')}/wp-json/wp/v2`;
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64')}`;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    this.logAction('publisher_initialized', 'WordPress publisher initialized');
  }

  // ─── Create Draft ──────────────────────────────────────────────────────

  async createDraft(post: Omit<WordPressPost, 'status'>): Promise<WordPressPostResponse> {
    const draftPost: WordPressPost = {
      ...post,
      status: 'draft',
    };

    this.logAction('create_draft', `Creating draft: ${post.title}`);

    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/posts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(draftPost),
        });

        if (!res.ok) {
          const errorBody = await res.text();
          throw new Error(`WordPress API error (${res.status}): ${errorBody}`);
        }

        return res.json() as Promise<WordPressPostResponse>;
      });

      this.logAction('draft_created', `Draft created: ID=${response.id}, title="${post.title}"`);
      return response;
    } catch (error) {
      this.logError('draft_creation_failed', `Failed to create draft: ${post.title}`, error);
      throw new Error(
        `Failed to create WordPress draft: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ─── Publish ───────────────────────────────────────────────────────────

  async publish(post: WordPressPost): Promise<WordPressPostResponse> {
    const publishPost: WordPressPost = {
      ...post,
      status: 'publish',
    };

    this.logAction('publish', `Publishing: ${post.title}`);

    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/posts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(publishPost),
        });

        if (!res.ok) {
          const errorBody = await res.text();
          throw new Error(`WordPress API error (${res.status}): ${errorBody}`);
        }

        return res.json() as Promise<WordPressPostResponse>;
      });

      this.logAction('published', `Published: ID=${response.id}, link="${response.link}"`);
      return response;
    } catch (error) {
      this.logError('publish_failed', `Failed to publish: ${post.title}`, error);
      throw new Error(
        `Failed to publish to WordPress: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ─── Schedule ──────────────────────────────────────────────────────────

  async schedule(
    post: Omit<WordPressPost, 'status' | 'date'>,
    publishDate: Date
  ): Promise<WordPressPostResponse> {
    const scheduledPost: WordPressPost = {
      ...post,
      status: 'future',
      date: publishDate.toISOString(),
    };

    this.logAction('schedule', `Scheduling: ${post.title} for ${publishDate.toISOString()}`);

    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/posts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(scheduledPost),
        });

        if (!res.ok) {
          const errorBody = await res.text();
          throw new Error(`WordPress API error (${res.status}): ${errorBody}`);
        }

        return res.json() as Promise<WordPressPostResponse>;
      });

      this.logAction(
        'scheduled',
        `Scheduled: ID=${response.id}, date=${publishDate.toISOString()}`
      );
      return response;
    } catch (error) {
      this.logError('schedule_failed', `Failed to schedule: ${post.title}`, error);
      throw new Error(
        `Failed to schedule WordPress post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ─── Update Post ───────────────────────────────────────────────────────

  async updatePost(
    postId: number,
    post: Partial<WordPressPost>
  ): Promise<WordPressPostResponse> {
    this.logAction('update_post', `Updating post: ID=${postId}`);

    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/posts/${postId}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(post),
        });

        if (!res.ok) {
          const errorBody = await res.text();
          throw new Error(`WordPress API error (${res.status}): ${errorBody}`);
        }

        return res.json() as Promise<WordPressPostResponse>;
      });

      this.logAction('post_updated', `Updated post: ID=${postId}`);
      return response;
    } catch (error) {
      this.logError('update_failed', `Failed to update post: ID=${postId}`, error);
      throw new Error(
        `Failed to update WordPress post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ─── Attach Tags ───────────────────────────────────────────────────────

  async attachTags(postId: number, tags: number[]): Promise<WordPressPostResponse> {
    this.logAction('attach_tags', `Attaching tags to post: ID=${postId}, tags=[${tags.join(',')}]`);

    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/posts/${postId}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ tags }),
        });

        if (!res.ok) {
          const errorBody = await res.text();
          throw new Error(`WordPress API error (${res.status}): ${errorBody}`);
        }

        return res.json() as Promise<WordPressPostResponse>;
      });

      this.logAction('tags_attached', `Tags attached: post ID=${postId}`);
      return response;
    } catch (error) {
      this.logError('attach_tags_failed', `Failed to attach tags: post ID=${postId}`, error);
      throw new Error(
        `Failed to attach tags to WordPress post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ─── Get Categories ────────────────────────────────────────────────────

  async getCategories(): Promise<WordPressCategory[]> {
    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/categories?per_page=100`, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        if (!res.ok) {
          const errorBody = await res.text();
          throw new Error(`WordPress API error (${res.status}): ${errorBody}`);
        }

        return res.json() as Promise<WordPressCategory[]>;
      });

      return response;
    } catch (error) {
      this.logError('get_categories_failed', 'Failed to get categories', error);
      throw new Error(
        `Failed to get WordPress categories: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ─── Get Tags ──────────────────────────────────────────────────────────

  async getTags(): Promise<WordPressTag[]> {
    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/tags?per_page=100`, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        if (!res.ok) {
          const errorBody = await res.text();
          throw new Error(`WordPress API error (${res.status}): ${errorBody}`);
        }

        return res.json() as Promise<WordPressTag[]>;
      });

      return response;
    } catch (error) {
      this.logError('get_tags_failed', 'Failed to get tags', error);
      throw new Error(
        `Failed to get WordPress tags: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ─── Find or Create Tag ────────────────────────────────────────────────

  async findOrCreateTag(tagName: string): Promise<number> {
    try {
      // Search for existing tag
      const res = await fetch(
        `${this.baseUrl}/tags?search=${encodeURIComponent(tagName)}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (res.ok) {
        const tags = (await res.json()) as WordPressTag[];
        const existing = tags.find(
          (t) => t.name.toLowerCase() === tagName.toLowerCase()
        );
        if (existing) return existing.id;
      }

      // Create new tag
      const createRes = await fetch(`${this.baseUrl}/tags`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name: tagName }),
      });

      if (!createRes.ok) {
        const errorBody = await createRes.text();
        throw new Error(`Failed to create tag: ${errorBody}`);
      }

      const newTag = (await createRes.json()) as WordPressTag;
      this.logAction('tag_created', `Created tag: ${tagName} (ID=${newTag.id})`);
      return newTag.id;
    } catch (error) {
      this.logError('find_or_create_tag_failed', `Failed for tag: ${tagName}`, error);
      throw error;
    }
  }

  // ─── Test Connection ───────────────────────────────────────────────────

  async testConnection(): Promise<{ success: boolean; siteName?: string; error?: string }> {
    this.logAction('test_connection', 'Testing WordPress API connectivity');

    try {
      const res = await fetch(`${this.baseUrl}/posts?per_page=1`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        const errorMessage = `WordPress API returned ${res.status}: ${errorBody}`;
        this.logError('connection_test_failed', errorMessage, null);
        return { success: false, error: errorMessage };
      }

      // Try to get site info
      let siteName: string | undefined;
      try {
        const siteRes = await fetch(
          `${this.config.endpointUrl.replace(/\/$/, '')}/wp-json`,
          {
            method: 'GET',
            headers: this.getHeaders(),
          }
        );
        if (siteRes.ok) {
          const siteInfo = (await siteRes.json()) as { name?: string };
          siteName = siteInfo.name;
        }
      } catch {
        // Site info is optional
      }

      this.logAction('connection_test_passed', `Connection successful: ${siteName || 'Unknown site'}`);
      return { success: true, siteName };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      this.logError('connection_test_failed', errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  // ─── Get Post by ID ────────────────────────────────────────────────────

  async getPost(postId: number): Promise<WordPressPostResponse> {
    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/posts/${postId}`, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        if (!res.ok) {
          const errorBody = await res.text();
          throw new Error(`WordPress API error (${res.status}): ${errorBody}`);
        }

        return res.json() as Promise<WordPressPostResponse>;
      });

      return response;
    } catch (error) {
      this.logError('get_post_failed', `Failed to get post: ID=${postId}`, error);
      throw new Error(
        `Failed to get WordPress post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ─── Delete Post ───────────────────────────────────────────────────────

  async deletePost(postId: number, force: boolean = false): Promise<void> {
    this.logAction('delete_post', `Deleting post: ID=${postId}, force=${force}`);

    try {
      await this.withRetry(async () => {
        const res = await fetch(
          `${this.baseUrl}/posts/${postId}?force=${force}`,
          {
            method: 'DELETE',
            headers: this.getHeaders(),
          }
        );

        if (!res.ok) {
          const errorBody = await res.text();
          throw new Error(`WordPress API error (${res.status}): ${errorBody}`);
        }

        return null;
      });

      this.logAction('post_deleted', `Post deleted: ID=${postId}`);
    } catch (error) {
      this.logError('delete_failed', `Failed to delete post: ID=${postId}`, error);
      throw new Error(
        `Failed to delete WordPress post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ─── Private: Request Headers ──────────────────────────────────────────

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.authHeader,
      'User-Agent': 'AI-Media-Intelligence-OS/1.0',
    };
  }

  // ─── Private: Retry Logic ──────────────────────────────────────────────

  private async withRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.retryConfig.maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        this.retryConfig.baseDelayMs * Math.pow(2, attempt - 1) +
          Math.random() * 500,
        this.retryConfig.maxDelayMs
      );

      this.logAction(
        'retry',
        `Retrying attempt ${attempt + 1}/${this.retryConfig.maxRetries} after ${Math.round(delay)}ms`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.withRetry(fn, attempt + 1);
    }
  }

  // ─── Private: Logging ──────────────────────────────────────────────────

  private async logAction(action: string, message: string): Promise<void> {
    try {
      await db.systemLog.create({
        data: {
          service: 'publisher',
          level: 'info',
          action,
          message,
          platform: 'wordpress',
          metadataJson: JSON.stringify({
            endpointUrl: this.config.endpointUrl,
            username: this.config.username,
          }),
        },
      });
    } catch {
      // Logging failure should not break publishing
    }
  }

  private async logError(
    action: string,
    message: string,
    error: unknown
  ): Promise<void> {
    try {
      await db.systemLog.create({
        data: {
          service: 'publisher',
          level: 'error',
          action,
          message,
          platform: 'wordpress',
          metadataJson: JSON.stringify({
            endpointUrl: this.config.endpointUrl,
            username: this.config.username,
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      });
    } catch {
      // Logging failure should not break publishing
    }
  }
}
