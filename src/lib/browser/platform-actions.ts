// Platform Actions — Pre-built automation scripts for various platforms
// Each function uses page-interactions methods for consistent behavior
// Includes stealth measures: random delays, human-like mouse movements

import { browserManager } from "./browser-manager";
import * as interactions from "./page-interactions";
import type {
  PlatformActionResult,
  PlatformActionType,
  WordPressLoginParams,
  WordPressCreateDraftParams,
  WordPressPublishParams,
  TikTokLoginParams,
  TikTokUploadParams,
  YouTubeStudioLoginParams,
  GenericLoginParams,
} from "@/types/browser";

/**
 * Generate a random delay between min and max ms (stealth measure)
 */
function randomDelay(min = 200, max = 800): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Simulate human-like mouse movement to an element
 */
async function humanLikeMouseMove(
  sessionId: string,
  selector: string
): Promise<void> {
  try {
    const page = browserManager.getPage(sessionId);
    const element = await page.$(selector);
    if (!element) return;

    const box = await element.boundingBox();
    if (!box) return;

    // Move to element with slight randomness
    const targetX = box.x + box.width / 2 + (Math.random() - 0.5) * 10;
    const targetY = box.y + box.height / 2 + (Math.random() - 0.5) * 10;

    await page.mouse.move(targetX, targetY, {
      steps: Math.floor(Math.random() * 10) + 5,
    });
    await randomDelay(100, 300);
  } catch {
    // Non-critical: just proceed if mouse movement fails
  }
}

/**
 * Create a standard PlatformActionResult
 */
function makePlatformResult(
  success: boolean,
  platform: string,
  action: string,
  extra: Partial<PlatformActionResult> = {}
): PlatformActionResult {
  return {
    success,
    platform,
    action,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

/**
 * Login to WordPress
 */
export async function wordpressLogin(
  sessionId: string,
  url: string,
  username: string,
  password: string
): Promise<PlatformActionResult> {
  try {
    // Navigate to WordPress login page
    const loginUrl = url.endsWith("/wp-login.php")
      ? url
      : `${url.replace(/\/$/, "")}/wp-login.php`;

    const navResult = await interactions.navigate(sessionId, loginUrl);
    if (!navResult.success) {
      return makePlatformResult(false, "wordpress", "login", {
        error: navResult.error,
      });
    }

    await randomDelay(500, 1500);

    // Fill username
    await humanLikeMouseMove(sessionId, "#user_login");
    const typeUserResult = await interactions.type(
      sessionId,
      "#user_login",
      username,
      { delay: 80, clear: true }
    );
    if (!typeUserResult.success) {
      return makePlatformResult(false, "wordpress", "login", {
        error: `Failed to type username: ${typeUserResult.error}`,
      });
    }

    await randomDelay(300, 800);

    // Fill password
    await humanLikeMouseMove(sessionId, "#user_pass");
    const typePassResult = await interactions.type(
      sessionId,
      "#user_pass",
      password,
      { delay: 60, clear: true }
    );
    if (!typePassResult.success) {
      return makePlatformResult(false, "wordpress", "login", {
        error: `Failed to type password: ${typePassResult.error}`,
      });
    }

    await randomDelay(500, 1200);

    // Click login button
    await humanLikeMouseMove(sessionId, "#wp-submit");
    const clickResult = await interactions.click(sessionId, "#wp-submit");
    if (!clickResult.success) {
      return makePlatformResult(false, "wordpress", "login", {
        error: `Failed to click login: ${clickResult.error}`,
      });
    }

    // Wait for navigation after login
    await interactions.waitForNavigation(sessionId, { timeout: 15000 });

    // Verify we're logged in by checking for dashboard elements
    await randomDelay(1000, 2000);
    const page = browserManager.getPage(sessionId);
    const isLoggedIn = await page.evaluate(() => {
      return (
        document.querySelector("#wpadminbar") !== null ||
        document.querySelector(".wp-dashboard") !== null ||
        window.location.href.includes("/wp-admin")
      );
    });

    if (!isLoggedIn) {
      return makePlatformResult(false, "wordpress", "login", {
        error: "Login appears to have failed — dashboard not detected",
      });
    }

    const currentUrl = page.url();
    browserManager.updateSession(sessionId, { url: currentUrl });

    return makePlatformResult(true, "wordpress", "login", {
      result: { url: currentUrl, loggedIn: true },
    });
  } catch (error) {
    return makePlatformResult(false, "wordpress", "login", {
      error: error instanceof Error ? error.message : "WordPress login failed",
    });
  }
}

/**
 * Create a WordPress draft post
 */
export async function wordpressCreateDraft(
  sessionId: string,
  title: string,
  content: string,
  tags: string[] = []
): Promise<PlatformActionResult> {
  try {
    // Navigate to new post page
    const page = browserManager.getPage(sessionId);
    const currentUrl = page.url();
    const baseUrl = currentUrl.replace(/\/wp-admin.*/, "");
    const newPostUrl = `${baseUrl}/wp-admin/post-new.php`;

    const navResult = await interactions.navigate(sessionId, newPostUrl);
    if (!navResult.success) {
      return makePlatformResult(false, "wordpress", "create-draft", {
        error: navResult.error,
      });
    }

    await randomDelay(1000, 2000);

    // Wait for Gutenberg editor or classic editor
    const isGutenberg = await page.evaluate(() => {
      return document.querySelector(".block-editor") !== null;
    });

    if (isGutenberg) {
      // Gutenberg editor
      await randomDelay(500, 1000);

      // Click on title area
      const titleSelector =
        '.editor-post-title__input, [data-type="core/post-title"] textarea, .wp-block-post-title';
      await interactions.wait(sessionId, titleSelector, { timeout: 10000 });
      await humanLikeMouseMove(sessionId, titleSelector);
      await interactions.click(sessionId, titleSelector);
      await randomDelay(300, 600);
      await interactions.type(sessionId, titleSelector, title, { delay: 50 });

      await randomDelay(500, 1000);

      // Click on content area
      const contentSelector =
        '.block-editor-writing-flow, [data-type="core/paragraph"] .rich-text-editor, .wp-block-post-content';
      await interactions.click(sessionId, contentSelector);
      await randomDelay(300, 600);
      await page.keyboard.type(content, { delay: 30 });
    } else {
      // Classic editor
      const titleSelector = "#title";
      await interactions.wait(sessionId, titleSelector, { timeout: 10000 });
      await humanLikeMouseMove(sessionId, titleSelector);
      await interactions.click(sessionId, titleSelector);
      await randomDelay(300, 600);
      await interactions.type(sessionId, titleSelector, title, { delay: 50 });

      await randomDelay(500, 1000);

      // Switch to HTML mode for content
      const contentSelector = "#content";
      await interactions.click(sessionId, contentSelector);
      await randomDelay(200, 500);
      await page.keyboard.type(content, { delay: 30 });
    }

    // Add tags if provided
    if (tags.length > 0) {
      await randomDelay(500, 1000);
      try {
        const tagSelector = '.components-form-token-input, #new-tag-post_tag';
        await interactions.click(sessionId, tagSelector);
        for (const tag of tags) {
          await interactions.type(sessionId, tagSelector, tag, {
            delay: 50,
            clear: false,
          });
          await page.keyboard.press("Enter");
          await randomDelay(300, 600);
        }
      } catch {
        // Tags are optional, don't fail if tag input not found
      }
    }

    await randomDelay(500, 1000);

    // Save as draft
    const draftButtonSelector =
      '.editor-post-save-draft, #save-post, button.editor-post-switch-to-draft';
    const draftClick = await interactions.click(sessionId, draftButtonSelector);
    if (!draftClick.success) {
      // Try alternative: save button
      await interactions.click(
        sessionId,
        '.editor-post-save-panel__button, #publish'
      );
    }

    await randomDelay(1000, 2000);

    return makePlatformResult(true, "wordpress", "create-draft", {
      result: { title, contentLength: content.length, tags },
    });
  } catch (error) {
    return makePlatformResult(false, "wordpress", "create-draft", {
      error:
        error instanceof Error
          ? error.message
          : "WordPress create draft failed",
    });
  }
}

/**
 * Publish a WordPress post
 */
export async function wordpressPublish(
  sessionId: string,
  postId: string
): Promise<PlatformActionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const currentUrl = page.url();
    const baseUrl = currentUrl.replace(/\/wp-admin.*/, "");
    const editPostUrl = `${baseUrl}/wp-admin/post.php?post=${postId}&action=edit`;

    const navResult = await interactions.navigate(sessionId, editPostUrl);
    if (!navResult.success) {
      return makePlatformResult(false, "wordpress", "publish", {
        error: navResult.error,
      });
    }

    await randomDelay(1000, 2000);

    // Click publish button
    const publishButtonSelector =
      '.editor-post-publish-button, #publish, button.editor-post-publish-panel__toggle';
    await interactions.wait(sessionId, publishButtonSelector, {
      timeout: 10000,
    });
    await humanLikeMouseMove(sessionId, publishButtonSelector);
    await interactions.click(sessionId, publishButtonSelector);

    await randomDelay(1000, 2000);

    // Confirm publish (Gutenberg has a second confirm button)
    const confirmSelector =
      '.editor-post-publish-button.editor-post-publish-button__button:not([disabled])';
    try {
      await interactions.wait(sessionId, confirmSelector, { timeout: 5000 });
      await interactions.click(sessionId, confirmSelector);
    } catch {
      // Classic editor doesn't have a second confirm
    }

    await randomDelay(2000, 3000);

    // Verify publish
    const isPublished = await page.evaluate(() => {
      const indicators = [
        ".editor-post-publish-panel__postpublish-header",
        "#message.updated",
        ".notice-success",
      ];
      return indicators.some(
        (sel) => document.querySelector(sel) !== null
      );
    });

    return makePlatformResult(
      isPublished ? true : false,
      "wordpress",
      "publish",
      {
        result: { postId, published: isPublished },
        error: isPublished
          ? undefined
          : "Could not confirm post was published",
      }
    );
  } catch (error) {
    return makePlatformResult(false, "wordpress", "publish", {
      error:
        error instanceof Error
          ? error.message
          : "WordPress publish failed",
    });
  }
}

/**
 * Login to TikTok
 */
export async function tiktokLogin(
  sessionId: string,
  username: string,
  password: string
): Promise<PlatformActionResult> {
  try {
    const navResult = await interactions.navigate(
      sessionId,
      "https://www.tiktok.com/login/phone-or-email/email"
    );
    if (!navResult.success) {
      return makePlatformResult(false, "tiktok", "login", {
        error: navResult.error,
      });
    }

    await randomDelay(2000, 3000);

    // Fill username/email
    const usernameSelector =
      'input[name="username"], input[type="text"][placeholder*="email"], input[type="text"][placeholder*="Email"]';
    await interactions.wait(sessionId, usernameSelector, { timeout: 15000 });
    await humanLikeMouseMove(sessionId, usernameSelector);
    await interactions.type(sessionId, usernameSelector, username, {
      delay: 80,
      clear: true,
    });

    await randomDelay(500, 1200);

    // Fill password
    const passwordSelector =
      'input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]';
    await interactions.wait(sessionId, passwordSelector, { timeout: 10000 });
    await humanLikeMouseMove(sessionId, passwordSelector);
    await interactions.type(sessionId, passwordSelector, password, {
      delay: 60,
      clear: true,
    });

    await randomDelay(800, 1500);

    // Click login button
    const loginButtonSelector =
      'button[type="submit"], button[data-e2e="login-button"], button:has-text("Log in")';
    await humanLikeMouseMove(sessionId, loginButtonSelector);
    await interactions.click(sessionId, loginButtonSelector);

    await randomDelay(2000, 4000);

    // Wait for navigation or check for errors
    await interactions.waitForNavigation(sessionId, { timeout: 15000 }).catch(() => {});

    const page = browserManager.getPage(sessionId);
    const currentUrl = page.url();
    const loginFailed = currentUrl.includes("/login");
    const onFeed = currentUrl.includes("/@") || currentUrl.includes("/foryou");

    return makePlatformResult(onFeed || !loginFailed, "tiktok", "login", {
      result: { url: currentUrl, loggedIn: onFeed || !loginFailed },
      error:
        loginFailed && !onFeed
          ? "Login may have failed — still on login page"
          : undefined,
    });
  } catch (error) {
    return makePlatformResult(false, "tiktok", "login", {
      error: error instanceof Error ? error.message : "TikTok login failed",
    });
  }
}

/**
 * Upload a TikTok video
 */
export async function tiktokUpload(
  sessionId: string,
  videoPath: string,
  caption: string,
  tags: string[] = []
): Promise<PlatformActionResult> {
  try {
    // Navigate to upload page
    const navResult = await interactions.navigate(
      sessionId,
      "https://www.tiktok.com/creator#/upload"
    );
    if (!navResult.success) {
      return makePlatformResult(false, "tiktok", "upload", {
        error: navResult.error,
      });
    }

    await randomDelay(2000, 3000);

    // Upload video file
    const page = browserManager.getPage(sessionId);
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      return makePlatformResult(false, "tiktok", "upload", {
        error: "Could not find video upload input",
      });
    }

    await fileInput.uploadFile(videoPath);
    await randomDelay(3000, 5000);

    // Wait for upload to process
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector(
            '.upload-complete, [data-e2e="upload-complete"]'
          );
          return el !== null;
        },
        { timeout: 120000 }
      )
      .catch(() => {});

    await randomDelay(1000, 2000);

    // Add caption
    const captionSelector =
      '.public-DraftEditor-content, [data-e2e="caption-input"], .tiktok-caption-input, .editor-comp';
    try {
      await interactions.wait(sessionId, captionSelector, { timeout: 10000 });
      await interactions.click(sessionId, captionSelector);
      await randomDelay(300, 600);
      await page.keyboard.type(caption, { delay: 30 });

      // Add hashtags
      for (const tag of tags) {
        await page.keyboard.type(` #${tag}`, { delay: 30 });
      }
    } catch {
      // Caption input might have different selectors
    }

    await randomDelay(1000, 2000);

    // Click post button
    const postButtonSelector =
      '[data-e2e="post-button"], button:has-text("Post"), button:has-text("Publish")';
    try {
      await interactions.wait(sessionId, postButtonSelector, {
        timeout: 10000,
      });
      await humanLikeMouseMove(sessionId, postButtonSelector);
      await interactions.click(sessionId, postButtonSelector);
    } catch {
      return makePlatformResult(false, "tiktok", "upload", {
        error: "Could not find post button",
      });
    }

    await randomDelay(3000, 5000);

    return makePlatformResult(true, "tiktok", "upload", {
      result: {
        videoPath,
        captionLength: caption.length,
        tagsCount: tags.length,
      },
    });
  } catch (error) {
    return makePlatformResult(false, "tiktok", "upload", {
      error: error instanceof Error ? error.message : "TikTok upload failed",
    });
  }
}

/**
 * Login to YouTube Studio
 */
export async function youtubeStudioLogin(
  sessionId: string,
  email: string,
  password: string
): Promise<PlatformActionResult> {
  try {
    // Navigate to YouTube Studio login
    const navResult = await interactions.navigate(
      sessionId,
      "https://studio.youtube.com"
    );
    if (!navResult.success) {
      return makePlatformResult(false, "youtube-studio", "login", {
        error: navResult.error,
      });
    }

    await randomDelay(2000, 3000);

    const page = browserManager.getPage(sessionId);

    // Check if already logged in
    const currentUrl = page.url();
    if (currentUrl.includes("studio.youtube.com") && !currentUrl.includes("accounts.google.com")) {
      return makePlatformResult(true, "youtube-studio", "login", {
        result: { url: currentUrl, loggedIn: true },
      });
    }

    // Google account login flow
    // Step 1: Enter email
    const emailSelector =
      'input[type="email"], input[name="identifier"], #identifierId';
    await interactions.wait(sessionId, emailSelector, { timeout: 15000 });
    await humanLikeMouseMove(sessionId, emailSelector);
    await interactions.type(sessionId, emailSelector, email, {
      delay: 70,
      clear: true,
    });

    await randomDelay(500, 1200);

    // Click Next
    const nextButtonSelector =
      '#identifierNext, button:has-text("Next"), button[type="button"]';
    await interactions.click(sessionId, nextButtonSelector);

    await randomDelay(2000, 3000);

    // Step 2: Enter password
    const passwordSelector =
      'input[type="password"], input[name="password"]';
    await interactions.wait(sessionId, passwordSelector, { timeout: 15000 });
    await humanLikeMouseMove(sessionId, passwordSelector);
    await interactions.type(sessionId, passwordSelector, password, {
      delay: 60,
      clear: true,
    });

    await randomDelay(800, 1500);

    // Click Next (password step)
    const passwordNextSelector =
      '#passwordNext, button:has-text("Next")';
    await interactions.click(sessionId, passwordNextSelector);

    // Wait for navigation to YouTube Studio
    await randomDelay(3000, 5000);
    await interactions.waitForNavigation(sessionId, { timeout: 30000 }).catch(() => {});

    const finalUrl = page.url();
    const loggedIn = finalUrl.includes("studio.youtube.com");

    browserManager.updateSession(sessionId, { url: finalUrl });

    return makePlatformResult(loggedIn, "youtube-studio", "login", {
      result: { url: finalUrl, loggedIn },
      error: loggedIn
        ? undefined
        : "Login may have failed — not redirected to YouTube Studio",
    });
  } catch (error) {
    return makePlatformResult(false, "youtube-studio", "login", {
      error:
        error instanceof Error
          ? error.message
          : "YouTube Studio login failed",
    });
  }
}

/**
 * Generic login helper for any website
 */
export async function genericLogin(
  sessionId: string,
  url: string,
  usernameSelector: string,
  passwordSelector: string,
  submitSelector: string,
  username: string,
  password: string
): Promise<PlatformActionResult> {
  try {
    // Navigate to login page
    const navResult = await interactions.navigate(sessionId, url);
    if (!navResult.success) {
      return makePlatformResult(false, "generic", "login", {
        error: navResult.error,
      });
    }

    await randomDelay(1000, 2000);

    // Fill username
    await interactions.wait(sessionId, usernameSelector, { timeout: 15000 });
    await humanLikeMouseMove(sessionId, usernameSelector);
    await interactions.type(sessionId, usernameSelector, username, {
      delay: 70,
      clear: true,
    });

    await randomDelay(500, 1200);

    // Fill password
    await interactions.wait(sessionId, passwordSelector, { timeout: 10000 });
    await humanLikeMouseMove(sessionId, passwordSelector);
    await interactions.type(sessionId, passwordSelector, password, {
      delay: 60,
      clear: true,
    });

    await randomDelay(800, 1500);

    // Click submit
    await interactions.wait(sessionId, submitSelector, { timeout: 10000 });
    await humanLikeMouseMove(sessionId, submitSelector);
    await interactions.click(sessionId, submitSelector);

    // Wait for navigation after login
    await interactions.waitForNavigation(sessionId, { timeout: 15000 }).catch(() => {});

    const page = browserManager.getPage(sessionId);
    const finalUrl = page.url();

    browserManager.updateSession(sessionId, { url: finalUrl });

    // Basic check: if URL changed from the login page, assume success
    const urlChanged = finalUrl !== url;
    const stillOnLogin =
      finalUrl.includes("login") ||
      finalUrl.includes("signin") ||
      finalUrl.includes("sign-in");

    return makePlatformResult(
      urlChanged && !stillOnLogin,
      "generic",
      "login",
      {
        result: { url: finalUrl, loggedIn: urlChanged && !stillOnLogin },
        error:
          !urlChanged || stillOnLogin
            ? "Login may have failed — URL still indicates login page"
            : undefined,
      }
    );
  } catch (error) {
    return makePlatformResult(false, "generic", "login", {
      error: error instanceof Error ? error.message : "Generic login failed",
    });
  }
}

/**
 * Dispatch a platform action by type
 */
export async function dispatchPlatformAction(
  sessionId: string,
  actionType: PlatformActionType,
  params: Record<string, unknown>
): Promise<PlatformActionResult> {
  // Validate session exists
  if (!browserManager.hasSession(sessionId)) {
    return makePlatformResult(false, "unknown", actionType, {
      error: `Session not found: ${sessionId}`,
    });
  }

  switch (actionType) {
    case "wordpress-login": {
      const p = params as unknown as WordPressLoginParams;
      if (!p.url || !p.username || !p.password) {
        return makePlatformResult(false, "wordpress", "login", {
          error: "url, username, and password are required",
        });
      }
      return wordpressLogin(sessionId, p.url, p.username, p.password);
    }

    case "wordpress-create-draft": {
      const p = params as unknown as WordPressCreateDraftParams;
      if (!p.title || !p.content) {
        return makePlatformResult(false, "wordpress", "create-draft", {
          error: "title and content are required",
        });
      }
      return wordpressCreateDraft(sessionId, p.title, p.content, p.tags);
    }

    case "wordpress-publish": {
      const p = params as unknown as WordPressPublishParams;
      if (!p.postId) {
        return makePlatformResult(false, "wordpress", "publish", {
          error: "postId is required",
        });
      }
      return wordpressPublish(sessionId, p.postId);
    }

    case "tiktok-login": {
      const p = params as unknown as TikTokLoginParams;
      if (!p.username || !p.password) {
        return makePlatformResult(false, "tiktok", "login", {
          error: "username and password are required",
        });
      }
      return tiktokLogin(sessionId, p.username, p.password);
    }

    case "tiktok-upload": {
      const p = params as unknown as TikTokUploadParams;
      if (!p.videoPath || !p.caption) {
        return makePlatformResult(false, "tiktok", "upload", {
          error: "videoPath and caption are required",
        });
      }
      return tiktokUpload(sessionId, p.videoPath, p.caption, p.tags);
    }

    case "youtube-studio-login": {
      const p = params as unknown as YouTubeStudioLoginParams;
      if (!p.email || !p.password) {
        return makePlatformResult(false, "youtube-studio", "login", {
          error: "email and password are required",
        });
      }
      return youtubeStudioLogin(sessionId, p.email, p.password);
    }

    case "generic-login": {
      const p = params as unknown as GenericLoginParams;
      if (
        !p.url ||
        !p.usernameSelector ||
        !p.passwordSelector ||
        !p.submitSelector ||
        !p.username ||
        !p.password
      ) {
        return makePlatformResult(false, "generic", "login", {
          error:
            "url, usernameSelector, passwordSelector, submitSelector, username, and password are required",
        });
      }
      return genericLogin(
        sessionId,
        p.url,
        p.usernameSelector,
        p.passwordSelector,
        p.submitSelector,
        p.username,
        p.password
      );
    }

    default:
      return makePlatformResult(false, "unknown", actionType, {
        error: `Unknown platform action: ${actionType}`,
      });
  }
}
