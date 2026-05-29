// Testing Runner — E2E testing capabilities using Puppeteer
// Run automated tests, accessibility checks, visual regression, link checks, and performance metrics

import { browserManager } from "./browser-manager";
import * as interactions from "./page-interactions";
import sharp from "sharp";
import type {
  TestConfig,
  TestResult,
  TestStepResult,
  TestType,
  AccessibilityIssue,
  PerformanceMetrics,
  LinkCheckResult,
} from "@/types/browser";

/**
 * Run a custom test scenario with multiple steps
 */
export async function runTest(
  sessionId: string,
  testConfig: TestConfig
): Promise<TestResult> {
  const startTime = Date.now();
  const stepResults: TestStepResult[] = [];
  let allPassed = true;

  if (!browserManager.hasSession(sessionId)) {
    return {
      name: testConfig.name,
      type: testConfig.type,
      passed: false,
      steps: [],
      durationMs: Date.now() - startTime,
      error: `Session not found: ${sessionId}`,
    };
  }

  // Navigate to URL if provided
  if (testConfig.url) {
    const navResult = await interactions.navigate(sessionId, testConfig.url);
    if (!navResult.success) {
      return {
        name: testConfig.name,
        type: testConfig.type,
        passed: false,
        steps: [
          {
            action: "navigate",
            passed: false,
            error: navResult.error,
            durationMs: Date.now() - startTime,
          },
        ],
        durationMs: Date.now() - startTime,
        error: `Failed to navigate to ${testConfig.url}: ${navResult.error}`,
      };
    }
  }

  // Execute test steps if provided
  if (testConfig.steps && testConfig.steps.length > 0) {
    for (const step of testConfig.steps) {
      const stepStart = Date.now();
      let passed = true;
      let error: string | undefined;

      try {
        const result = await interactions.dispatchInteraction(sessionId, step.action, {
          selector: step.selector,
          value: step.value,
          url: step.url,
          timeout: step.timeout,
        });

        if (!result.success) {
          passed = false;
          error = result.error;
        }
      } catch (err) {
        passed = false;
        error = err instanceof Error ? err.message : "Step execution failed";
      }

      stepResults.push({
        action: step.action,
        passed,
        error,
        durationMs: Date.now() - stepStart,
      });

      if (!passed) {
        allPassed = false;
        break; // Stop on first failure
      }
    }
  }

  return {
    name: testConfig.name,
    type: testConfig.type,
    passed: allPassed,
    steps: stepResults,
    durationMs: Date.now() - startTime,
    error: allPassed ? undefined : "One or more steps failed",
  };
}

/**
 * Run a basic accessibility check on the current page
 */
export async function runAccessibilityCheck(
  sessionId: string
): Promise<TestResult> {
  const startTime = Date.now();

  if (!browserManager.hasSession(sessionId)) {
    return {
      name: "Accessibility Check",
      type: "accessibility",
      passed: false,
      durationMs: Date.now() - startTime,
      error: `Session not found: ${sessionId}`,
    };
  }

  try {
    const page = browserManager.getPage(sessionId);

    const issues: AccessibilityIssue[] = await page.evaluate(() => {
      const found: AccessibilityIssue[] = [];

      // Check for images without alt text
      const images = document.querySelectorAll("img");
      images.forEach((img, index) => {
        if (!img.alt || img.alt.trim() === "") {
          found.push({
            type: "error",
            rule: "img-alt",
            description: `Image #${index + 1} missing alt attribute`,
            selector: img.id
              ? `#${img.id}`
              : `img:nth-child(${index + 1})`,
            impact: "serious",
          });
        }
      });

      // Check for form inputs without labels
      const inputs = document.querySelectorAll(
        "input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select"
      );
      inputs.forEach((input, index) => {
        const inputEl = input as HTMLInputElement;
        const hasLabel = document.querySelector(`label[for="${inputEl.id}"]`);
        const hasAriaLabel =
          inputEl.getAttribute("aria-label") ||
          inputEl.getAttribute("aria-labelledby");
        const hasTitle = inputEl.getAttribute("title");

        if (!hasLabel && !hasAriaLabel && !hasTitle && !inputEl.id) {
          found.push({
            type: "error",
            rule: "label",
            description: `Form input #${index + 1} missing associated label`,
            selector: inputEl.id
              ? `#${inputEl.id}`
              : `${inputEl.tagName.toLowerCase()}:nth-child(${index + 1})`,
            impact: "critical",
          });
        }
      });

      // Check for buttons without accessible text
      const buttons = document.querySelectorAll("button, [role='button']");
      buttons.forEach((button, index) => {
        const text = button.textContent?.trim();
        const ariaLabel = button.getAttribute("aria-label");
        const ariaLabelledby = button.getAttribute("aria-labelledby");

        if (!text && !ariaLabel && !ariaLabelledby) {
          found.push({
            type: "error",
            rule: "button-name",
            description: `Button #${index + 1} missing accessible name`,
            selector: button.id
              ? `#${button.id}`
              : `button:nth-child(${index + 1})`,
            impact: "critical",
          });
        }
      });

      // Check for links without accessible text
      const links = document.querySelectorAll("a[href]");
      links.forEach((link, index) => {
        const text = link.textContent?.trim();
        const ariaLabel = link.getAttribute("aria-label");
        const titleAttr = link.getAttribute("title");

        if (!text && !ariaLabel && !titleAttr) {
          found.push({
            type: "warning",
            rule: "link-name",
            description: `Link #${index + 1} missing accessible text`,
            selector: link.id
              ? `#${link.id}`
              : `a:nth-child(${index + 1})`,
            impact: "serious",
          });
        }
      });

      // Check for proper heading hierarchy
      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      let lastLevel = 0;
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1));
        if (lastLevel > 0 && level > lastLevel + 1) {
          found.push({
            type: "warning",
            rule: "heading-order",
            description: `Heading hierarchy skipped from h${lastLevel} to h${level}`,
            selector: heading.id
              ? `#${heading.id}`
              : `${heading.tagName.toLowerCase()}:nth-of-type(1)`,
            impact: "moderate",
          });
        }
        lastLevel = level;
      });

      // Check for insufficient color contrast (basic check)
      const textElements = document.querySelectorAll(
        "p, span, div, a, button, label, h1, h2, h3, h4, h5, h6"
      );
      let lowContrastCount = 0;
      textElements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight);
        if (fontSize < 10 && fontWeight < 700) {
          lowContrastCount++;
        }
      });
      if (lowContrastCount > 0) {
        found.push({
          type: "info",
          rule: "font-size",
          description: `${lowContrastCount} elements have very small font sizes (< 10px)`,
          impact: "minor",
        });
      }

      // Check page title
      if (!document.title || document.title.trim() === "") {
        found.push({
          type: "error",
          rule: "document-title",
          description: "Page is missing a title",
          impact: "critical",
        });
      }

      // Check for main landmark
      const mainLandmarks = document.querySelectorAll(
        "main, [role='main']"
      );
      if (mainLandmarks.length === 0) {
        found.push({
          type: "warning",
          rule: "landmark-main",
          description: "Page is missing a main landmark",
          impact: "moderate",
        });
      }

      // Check lang attribute
      if (!document.documentElement.lang) {
        found.push({
          type: "error",
          rule: "html-lang",
          description: "HTML element is missing lang attribute",
          impact: "serious",
        });
      }

      return found;
    });

    const criticalIssues = issues.filter(
      (i) => i.impact === "critical" || i.type === "error"
    );
    const passed = criticalIssues.length === 0;

    return {
      name: "Accessibility Check",
      type: "accessibility",
      passed,
      durationMs: Date.now() - startTime,
      details: {
        totalIssues: issues.length,
        criticalCount: issues.filter((i) => i.impact === "critical").length,
        seriousCount: issues.filter((i) => i.impact === "serious").length,
        moderateCount: issues.filter((i) => i.impact === "moderate").length,
        minorCount: issues.filter((i) => i.impact === "minor").length,
        issues,
      },
      error: passed
        ? undefined
        : `Found ${criticalIssues.length} critical/serious accessibility issues`,
    };
  } catch (error) {
    return {
      name: "Accessibility Check",
      type: "accessibility",
      passed: false,
      durationMs: Date.now() - startTime,
      error:
        error instanceof Error
          ? error.message
          : "Accessibility check failed",
    };
  }
}

/**
 * Decode a base64 string to a Buffer
 */
function base64ToBuffer(base64: string): Buffer {
  // Strip data URL prefix if present (e.g. "data:image/png;base64,...")
  const raw = base64.includes(",")
    ? base64.split(",")[1]
    : base64;
  return Buffer.from(raw, "base64");
}

/**
 * Lightweight pixel-level image comparison using sharp.
 * Decodes both images, resizes to identical dimensions, then compares raw RGBA pixels.
 */
async function comparePixels(
  baselineBuf: Buffer,
  currentBuf: Buffer,
  thresholdPercent: number = 5
): Promise<{
  diffPercentage: number;
  totalPixels: number;
  differentPixels: number;
  diffImageBase64?: string;
}> {
  // Decode both images with sharp to get metadata
  const baselineMeta = await sharp(baselineBuf).metadata();
  const currentMeta = await sharp(currentBuf).metadata();

  // Use the smaller dimensions so both images can be resized to match
  const width = Math.min(baselineMeta.width || 1, currentMeta.width || 1);
  const height = Math.min(baselineMeta.height || 1, currentMeta.height || 1);

  // Resize both images to the same dimensions and get raw RGBA pixel data
  const [baselineRaw, currentRaw] = await Promise.all([
    sharp(baselineBuf)
      .resize(width, height)
      .raw()
      .toBuffer(),
    sharp(currentBuf)
      .resize(width, height)
      .raw()
      .toBuffer(),
  ]);

  const totalPixels = width * height;
  let differentPixels = 0;

  // Build a diff image for visual feedback (RGBA)
  const diffPixels = Buffer.alloc(width * height * 4);

  // Determine channel count (3 = RGB, 4 = RGBA)
  const baselineChannels = baselineMeta.channels || 3;
  const currentChannels = currentMeta.channels || 3;
  const maxChannels = Math.max(baselineChannels, currentChannels);

  for (let i = 0; i < totalPixels; i++) {
    const baseOffset = i * maxChannels;
    const currOffset = i * maxChannels;
    const diffOffset = i * 4;

    // Get pixel values (default alpha to 255 if not present)
    const br = baselineRaw[baseOffset] || 0;
    const bg = baselineRaw[baseOffset + 1] || 0;
    const bb = baselineRaw[baseOffset + 2] || 0;
    const ba = baselineChannels === 4 ? (baselineRaw[baseOffset + 3] || 0) : 255;

    const cr = currentRaw[currOffset] || 0;
    const cg = currentRaw[currOffset + 1] || 0;
    const cb = currentRaw[currOffset + 2] || 0;
    const ca = currentChannels === 4 ? (currentRaw[currOffset + 3] || 0) : 255;

    // Pixel is different if any channel differs beyond a small tolerance
    const tolerance = 3; // small tolerance for anti-aliasing / compression artifacts
    const isDifferent =
      Math.abs(br - cr) > tolerance ||
      Math.abs(bg - cg) > tolerance ||
      Math.abs(bb - cb) > tolerance ||
      Math.abs(ba - ca) > tolerance;

    if (isDifferent) {
      differentPixels++;
      // Highlight diff pixels in red
      diffPixels[diffOffset] = 255;     // R
      diffPixels[diffOffset + 1] = 0;   // G
      diffPixels[diffOffset + 2] = 0;   // B
      diffPixels[diffOffset + 3] = 255; // A
    } else {
      // Matching pixels: show as semi-transparent gray
      diffPixels[diffOffset] = br;
      diffPixels[diffOffset + 1] = bg;
      diffPixels[diffOffset + 2] = bb;
      diffPixels[diffOffset + 3] = 128;
    }
  }

  const diffPercentage = totalPixels > 0 ? (differentPixels / totalPixels) * 100 : 0;

  // Encode diff image to PNG base64 only if there are differences
  let diffImageBase64: string | undefined;
  if (differentPixels > 0) {
    const diffPng = await sharp(diffPixels, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer();
    diffImageBase64 = diffPng.toString("base64");
  }

  return {
    diffPercentage: Math.round(diffPercentage * 100) / 100,
    totalPixels,
    differentPixels,
    diffImageBase64,
  };
}

/**
 * Run visual regression test by comparing screenshots with pixel-level precision
 */
export async function runVisualRegression(
  sessionId: string,
  baselineScreenshot: string,
  options: { threshold?: number } = {}
): Promise<TestResult> {
  const startTime = Date.now();
  const threshold = options.threshold ?? 5; // 5% default diff threshold

  if (!browserManager.hasSession(sessionId)) {
    return {
      name: "Visual Regression",
      type: "visual-regression",
      passed: false,
      durationMs: Date.now() - startTime,
      error: `Session not found: ${sessionId}`,
    };
  }

  try {
    const page = browserManager.getPage(sessionId);

    // Take current screenshot as PNG for lossless pixel comparison
    const currentScreenshotBuf = await page.screenshot({
      type: "png",
      fullPage: true,
    });

    // Decode baseline from base64 to buffer
    const baselineBuf = base64ToBuffer(baselineScreenshot);

    // Current screenshot buffer
    const currentBuf = Buffer.isBuffer(currentScreenshotBuf)
      ? currentScreenshotBuf
      : Buffer.from(currentScreenshotBuf);

    // Perform pixel-level comparison
    const comparison = await comparePixels(baselineBuf, currentBuf, threshold);

    const passed = comparison.diffPercentage < threshold;

    return {
      name: "Visual Regression",
      type: "visual-regression",
      passed,
      durationMs: Date.now() - startTime,
      details: {
        diffPercentage: comparison.diffPercentage,
        totalPixels: comparison.totalPixels,
        differentPixels: comparison.differentPixels,
        threshold,
        diffImageBase64: comparison.diffImageBase64,
      },
      error: passed
        ? undefined
        : `Visual difference detected: ${comparison.diffPercentage.toFixed(2)}% pixels differ (${comparison.differentPixels}/${comparison.totalPixels}, threshold: ${threshold}%)`,
    };
  } catch (error) {
    return {
      name: "Visual Regression",
      type: "visual-regression",
      passed: false,
      durationMs: Date.now() - startTime,
      error:
        error instanceof Error
          ? error.message
          : "Visual regression check failed",
    };
  }
}

/**
 * Check for broken links on the current page
 */
export async function runLinkCheck(
  sessionId: string
): Promise<TestResult> {
  const startTime = Date.now();

  if (!browserManager.hasSession(sessionId)) {
    return {
      name: "Link Check",
      type: "link-check",
      passed: false,
      durationMs: Date.now() - startTime,
      error: `Session not found: ${sessionId}`,
    };
  }

  try {
    const page = browserManager.getPage(sessionId);

    // Extract all links from the page
    const links: { href: string; text: string }[] = await page.evaluate(() => {
      const anchors = document.querySelectorAll("a[href]");
      return Array.from(anchors).map((a) => ({
        href: (a as HTMLAnchorElement).href,
        text: a.textContent?.trim() || "",
      }));
    });

    // Filter out non-http links, javascript:, mailto:, etc.
    const validLinks = links.filter(
      (link) =>
        link.href.startsWith("http://") || link.href.startsWith("https://")
    );

    // Deduplicate by href
    const uniqueLinks = Array.from(
      new Map(validLinks.map((l) => [l.href, l])).values()
    );

    // Check each link (limit to 50 to prevent excessive requests)
    const linksToCheck = uniqueLinks.slice(0, 50);
    const results: LinkCheckResult[] = [];

    for (const link of linksToCheck) {
      try {
        // Use fetch to check link status (from page context to handle relative URLs)
        const status = await page.evaluate(async (url: string) => {
          try {
            const response = await fetch(url, {
              method: "HEAD",
              mode: "no-cors",
            });
            return response.status || 200;
          } catch {
            // Try with GET if HEAD fails
            try {
              const response = await fetch(url, {
                method: "GET",
                mode: "no-cors",
              });
              return response.status || 200;
            } catch {
              return "error";
            }
          }
        }, link.href);

        const statusCode =
          typeof status === "number" ? status : 0;
        const ok = typeof status === "number" && status < 400;

        results.push({
          url: link.href,
          status: ok ? statusCode : (status as number | "error"),
          ok,
          error: ok ? undefined : `HTTP ${status}`,
        });
      } catch (err) {
        results.push({
          url: link.href,
          status: "error",
          ok: false,
          error: err instanceof Error ? err.message : "Fetch failed",
        });
      }
    }

    const brokenLinks = results.filter((r) => !r.ok);
    const passed = brokenLinks.length === 0;

    return {
      name: "Link Check",
      type: "link-check",
      passed,
      durationMs: Date.now() - startTime,
      details: {
        totalLinks: links.length,
        checkedLinks: linksToCheck.length,
        brokenCount: brokenLinks.length,
        brokenLinks: brokenLinks.slice(0, 20), // Limit results
        allResults: results.slice(0, 50),
      },
      error: passed
        ? undefined
        : `Found ${brokenLinks.length} broken links`,
    };
  } catch (error) {
    return {
      name: "Link Check",
      type: "link-check",
      passed: false,
      durationMs: Date.now() - startTime,
      error:
        error instanceof Error ? error.message : "Link check failed",
    };
  }
}

/**
 * Run basic performance check on the current page
 */
export async function runPerformanceCheck(
  sessionId: string
): Promise<TestResult> {
  const startTime = Date.now();

  if (!browserManager.hasSession(sessionId)) {
    return {
      name: "Performance Check",
      type: "performance",
      passed: false,
      durationMs: Date.now() - startTime,
      error: `Session not found: ${sessionId}`,
    };
  }

  try {
    const page = browserManager.getPage(sessionId);

    // Collect performance metrics from the page
    const perfData = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

      const metrics: Record<string, number> = {};

      if (nav) {
        metrics.firstContentfulPaint =
          nav.loadEventEnd - nav.startTime || 0;
        metrics.domContentLoaded =
          nav.domContentLoadedEventEnd - nav.startTime || 0;
        metrics.loadComplete =
          nav.loadEventEnd - nav.startTime || 0;
        metrics.domInteractive =
          nav.domInteractive - nav.startTime || 0;
        metrics.redirectTime = nav.redirectEnd - nav.redirectStart || 0;
        metrics.dnsTime = nav.domainLookupEnd - nav.domainLookupStart || 0;
        metrics.tcpTime = nav.connectEnd - nav.connectStart || 0;
        metrics.ttfb = nav.responseStart - nav.requestStart || 0;
        metrics.downloadTime = nav.responseEnd - nav.responseStart || 0;
      }

      // Get resource counts
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      metrics.totalRequests = resources.length;

      // Total transfer size
      metrics.totalTransferSize = resources.reduce(
        (sum, r) => sum + (r.transferSize || 0),
        0
      );

      // JavaScript heap (if available)
      let jsHeapUsed = 0;
      if (
        "memory" in performance &&
        (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory
      ) {
        jsHeapUsed =
          (performance as unknown as { memory: { usedJSHeapSize: number } }).memory
            .usedJSHeapSize || 0;
      }

      return { metrics, jsHeapUsed };
    });

    const metrics: PerformanceMetrics = {
      firstContentfulPaint: perfData.metrics.firstContentfulPaint || 0,
      domContentLoaded: perfData.metrics.domContentLoaded || 0,
      loadComplete: perfData.metrics.loadComplete || 0,
      totalTransferSize: perfData.metrics.totalTransferSize || 0,
      totalRequests: perfData.metrics.totalRequests || 0,
      javascriptHeapUsed: perfData.jsHeapUsed || 0,
      timestamp: new Date().toISOString(),
    };

    // Determine pass/fail based on common thresholds
    const fcpThreshold = 3000; // 3s
    const loadThreshold = 5000; // 5s
    const requestThreshold = 100;

    const issues: string[] = [];

    if (metrics.firstContentfulPaint > fcpThreshold) {
      issues.push(
        `First Contentful Paint too slow: ${Math.round(metrics.firstContentfulPaint)}ms (threshold: ${fcpThreshold}ms)`
      );
    }
    if (metrics.loadComplete > loadThreshold) {
      issues.push(
        `Page load too slow: ${Math.round(metrics.loadComplete)}ms (threshold: ${loadThreshold}ms)`
      );
    }
    if (metrics.totalRequests > requestThreshold) {
      issues.push(
        `Too many requests: ${metrics.totalRequests} (threshold: ${requestThreshold})`
      );
    }

    const passed = issues.length === 0;

    return {
      name: "Performance Check",
      type: "performance",
      passed,
      durationMs: Date.now() - startTime,
      details: {
        metrics,
        additionalMetrics: perfData.metrics,
        issues,
      },
      error: passed
        ? undefined
        : `Performance issues found: ${issues.join("; ")}`,
    };
  } catch (error) {
    return {
      name: "Performance Check",
      type: "performance",
      passed: false,
      durationMs: Date.now() - startTime,
      error:
        error instanceof Error
          ? error.message
          : "Performance check failed",
    };
  }
}

/**
 * Dispatch a test by type
 */
export async function dispatchTest(
  sessionId: string,
  testType: TestType,
  testConfig?: TestConfig
): Promise<TestResult> {
  switch (testType) {
    case "accessibility":
      return runAccessibilityCheck(sessionId);

    case "visual-regression":
      if (!testConfig?.baselineScreenshot) {
        return {
          name: "Visual Regression",
          type: "visual-regression",
          passed: false,
          durationMs: 0,
          error: "baselineScreenshot is required for visual regression test",
        };
      }
      return runVisualRegression(
        sessionId,
        testConfig.baselineScreenshot,
        { threshold: (testConfig.options?.threshold as number) ?? 5 }
      );

    case "link-check":
      return runLinkCheck(sessionId);

    case "performance":
      return runPerformanceCheck(sessionId);

    case "custom":
      if (!testConfig) {
        return {
          name: "Custom Test",
          type: "custom",
          passed: false,
          durationMs: 0,
          error: "Test config is required for custom test",
        };
      }
      return runTest(sessionId, testConfig);

    default:
      return {
        name: "Unknown Test",
        type: testType,
        passed: false,
        durationMs: 0,
        error: `Unknown test type: ${testType}`,
      };
  }
}
