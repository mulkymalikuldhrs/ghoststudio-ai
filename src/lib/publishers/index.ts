/**
 * Publisher Factory — Returns the right publisher for each platform
 *
 * V1: Only WordPress is fully implemented.
 * Other platforms are stubbed and will throw "Coming in V2+" error.
 */

import { WordPressPublisher, type WordPressConfig } from './wordpress';

// ─── Type Definitions ────────────────────────────────────────────────────────

export type SupportedPlatform =
  | 'wordpress'
  | 'medium'
  | 'blogger'
  | 'substack'
  | 'beehiiv'
  | 'devto'
  | 'hashnode'
  | 'ghost'
  | 'mirror';

export interface PublisherCredentials {
  platform: SupportedPlatform;
  endpointUrl?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiSecret?: string;
  refreshToken?: string;
  additionalConfig?: Record<string, string>;
}

export interface Publisher {
  createDraft: (post: unknown) => Promise<unknown>;
  publish: (post: unknown) => Promise<unknown>;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
}

// ─── V2+ Stub Publisher ──────────────────────────────────────────────────────

class StubPublisher implements Publisher {
  private platform: string;

  constructor(platform: string) {
    this.platform = platform;
  }

  async createDraft(): Promise<never> {
    throw new Error(`${this.platform} publisher is coming in V2+. Stay tuned!`);
  }

  async publish(): Promise<never> {
    throw new Error(`${this.platform} publisher is coming in V2+. Stay tuned!`);
  }

  async testConnection(): Promise<{ success: false; error: string }> {
    return {
      success: false,
      error: `${this.platform} publisher is coming in V2+. Stay tuned!`,
    };
  }
}

// ─── Publisher Factory ───────────────────────────────────────────────────────

export function getPublisher(
  platform: SupportedPlatform,
  credentials: PublisherCredentials
): WordPressPublisher | StubPublisher {
  switch (platform) {
    case 'wordpress': {
      if (!credentials.endpointUrl || !credentials.username || !credentials.password) {
        throw new Error(
          'WordPress publisher requires: endpointUrl, username, and password (application password)'
        );
      }

      const wpConfig: WordPressConfig = {
        endpointUrl: credentials.endpointUrl,
        username: credentials.username,
        applicationPassword: credentials.password,
      };

      return new WordPressPublisher(wpConfig);
    }

    case 'medium':
      return new StubPublisher('Medium');

    case 'blogger':
      return new StubPublisher('Blogger');

    case 'substack':
      return new StubPublisher('Substack');

    case 'beehiiv':
      return new StubPublisher('Beehiiv');

    case 'devto':
      return new StubPublisher('Dev.to');

    case 'hashnode':
      return new StubPublisher('Hashnode');

    case 'ghost':
      return new StubPublisher('Ghost');

    case 'mirror':
      return new StubPublisher('Mirror');

    default:
      throw new Error(
        `Unsupported platform: ${platform}. Supported platforms: wordpress, medium, blogger, substack, beehiiv, devto, hashnode, ghost, mirror`
      );
  }
}

// ─── Get Supported Platforms ─────────────────────────────────────────────────

export function getSupportedPlatforms(): Array<{
  platform: SupportedPlatform;
  name: string;
  status: 'available' | 'coming_soon';
}> {
  return [
    { platform: 'wordpress', name: 'WordPress', status: 'available' },
    { platform: 'medium', name: 'Medium', status: 'coming_soon' },
    { platform: 'blogger', name: 'Blogger', status: 'coming_soon' },
    { platform: 'substack', name: 'Substack', status: 'coming_soon' },
    { platform: 'beehiiv', name: 'Beehiiv', status: 'coming_soon' },
    { platform: 'devto', name: 'Dev.to', status: 'coming_soon' },
    { platform: 'hashnode', name: 'Hashnode', status: 'coming_soon' },
    { platform: 'ghost', name: 'Ghost', status: 'coming_soon' },
    { platform: 'mirror', name: 'Mirror', status: 'coming_soon' },
  ];
}

// ─── Validate Credentials ────────────────────────────────────────────────────

export function validateCredentials(
  platform: SupportedPlatform,
  credentials: PublisherCredentials
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  switch (platform) {
    case 'wordpress':
      if (!credentials.endpointUrl) missing.push('endpointUrl');
      if (!credentials.username) missing.push('username');
      if (!credentials.password) missing.push('password');
      break;

    case 'medium':
      if (!credentials.apiKey) missing.push('apiKey');
      break;

    case 'blogger':
      if (!credentials.apiKey) missing.push('apiKey');
      break;

    case 'substack':
      if (!credentials.apiKey) missing.push('apiKey');
      break;

    case 'beehiiv':
      if (!credentials.apiKey) missing.push('apiKey');
      break;

    case 'devto':
      if (!credentials.apiKey) missing.push('apiKey');
      break;

    case 'hashnode':
      if (!credentials.apiKey) missing.push('apiKey');
      break;

    case 'ghost':
      if (!credentials.endpointUrl) missing.push('endpointUrl');
      if (!credentials.apiKey) missing.push('apiKey');
      break;

    case 'mirror':
      if (!credentials.apiKey) missing.push('apiKey');
      break;
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Re-export WordPress types for convenience
export type { WordPressConfig, WordPressPost, WordPressPostResponse } from './wordpress';
