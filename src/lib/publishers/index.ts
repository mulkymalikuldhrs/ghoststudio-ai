// Publisher Factory — 9 platforms
// WordPress, Medium, Blogger, Substack, Beehiiv, Dev.to, Hashnode, Ghost, Mirror

export type Platform =
  | "wordpress"
  | "medium"
  | "blogger"
  | "substack"
  | "beehiiv"
  | "devto"
  | "hashnode"
  | "ghost"
  | "mirror";

export interface PublishPayload {
  title: string;
  body: string;
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  featuredImage?: string;
  status?: "draft" | "published";
  metadata?: Record<string, unknown>;
}

export interface PublishResult {
  success: boolean;
  platform: Platform;
  postId?: string;
  postUrl?: string;
  error?: string;
  responsePayload?: Record<string, unknown>;
}

export interface Publisher {
  name: string;
  platform: Platform;
  publish(payload: PublishPayload, credentials: Record<string, string>): Promise<PublishResult>;
  validate(credentials: Record<string, string>): Promise<boolean>;
}

// Publisher registry
const publishers = new Map<Platform, Publisher>();

export function registerPublisher(publisher: Publisher): void {
  publishers.set(publisher.platform, publisher);
}

export function getPublisher(platform: Platform): Publisher | undefined {
  return publishers.get(platform);
}

export function getAllPublishers(): Publisher[] {
  return Array.from(publishers.values());
}

// Lazy-load and register all publishers on first use
let publishersLoaded = false;

async function ensurePublishersLoaded(): Promise<void> {
  if (publishersLoaded) return;
  publishersLoaded = true;

  try {
    const { default: wpPublisher } = await import("./wordpress");
    if (wpPublisher) registerPublisher(wpPublisher);
  } catch { /* skip */ }

  try {
    const { default: medPublisher } = await import("./medium");
    if (medPublisher) registerPublisher(medPublisher);
  } catch { /* skip */ }

  try {
    const { default: blogPublisher } = await import("./blogger");
    if (blogPublisher) registerPublisher(blogPublisher);
  } catch { /* skip */ }

  try {
    const { default: subPublisher } = await import("./substack");
    if (subPublisher) registerPublisher(subPublisher);
  } catch { /* skip */ }

  try {
    const { default: beePublisher } = await import("./beehiiv");
    if (beePublisher) registerPublisher(beePublisher);
  } catch { /* skip */ }

  try {
    const { default: devPublisher } = await import("./devto");
    if (devPublisher) registerPublisher(devPublisher);
  } catch { /* skip */ }

  try {
    const { default: hashPublisher } = await import("./hashnode");
    if (hashPublisher) registerPublisher(hashPublisher);
  } catch { /* skip */ }

  try {
    const { default: ghostPublisher } = await import("./ghost");
    if (ghostPublisher) registerPublisher(ghostPublisher);
  } catch { /* skip */ }

  try {
    const { default: mirrorPublisher } = await import("./mirror");
    if (mirrorPublisher) registerPublisher(mirrorPublisher);
  } catch { /* skip */ }
}

// Dynamic imports for DB and crypto to avoid initialization issues
async function getDb() {
  const { db } = await import("@/lib/db");
  return db;
}

async function getCrypto() {
  const { decrypt, isEncrypted } = await import("@/lib/crypto");
  return { decrypt, isEncrypted };
}

// Get credentials for a platform
export async function getCredentials(
  userId: string,
  platform: Platform
): Promise<Record<string, string> | null> {
  const db = await getDb();
  const { decrypt, isEncrypted } = await getCrypto();

  const credential = await db.apiCredential.findFirst({
    where: {
      userId,
      platform,
      isActive: true,
    },
  });

  if (!credential) return null;

  // Decrypt the token if it's encrypted, otherwise use as-is (legacy support)
  const token = isEncrypted(credential.encryptedToken)
    ? decrypt(credential.encryptedToken)
    : credential.encryptedToken;
  const refreshToken = credential.refreshToken
    ? (isEncrypted(credential.refreshToken) ? decrypt(credential.refreshToken) : credential.refreshToken)
    : "";

  return {
    token,
    refreshToken,
    endpointUrl: credential.endpointUrl || "",
  };
}

// Publish to a platform
export async function publishToPlatform(
  userId: string,
  platform: Platform,
  payload: PublishPayload
): Promise<PublishResult> {
  await ensurePublishersLoaded();

  const publisher = getPublisher(platform);

  if (!publisher) {
    return {
      success: false,
      platform,
      error: `No publisher registered for platform: ${platform}`,
    };
  }

  const credentials = await getCredentials(userId, platform);

  if (!credentials) {
    return {
      success: false,
      platform,
      error: `No credentials found for platform: ${platform}`,
    };
  }

  try {
    const result = await publisher.publish(payload, credentials);

    // Update last used timestamp
    const db = await getDb();
    await db.apiCredential.updateMany({
      where: { userId, platform, isActive: true },
      data: { lastUsed: new Date() },
    });

    return result;
  } catch (error) {
    return {
      success: false,
      platform,
      error: error instanceof Error ? error.message : "Unknown publish error",
    };
  }
}

// Dry run — validate without actually publishing
export async function dryRun(
  platform: Platform,
  payload: PublishPayload
): Promise<PublishResult> {
  await ensurePublishersLoaded();

  const publisher = getPublisher(platform);

  if (!publisher) {
    return {
      success: false,
      platform,
      error: `No publisher registered for platform: ${platform}`,
    };
  }

  return {
    success: true,
    platform,
    postId: "dry-run",
    postUrl: `https://${platform}.example.com/dry-run`,
    responsePayload: { dryRun: true, payload },
  };
}
