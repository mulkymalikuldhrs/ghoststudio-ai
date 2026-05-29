// Page Interactions — All page interaction methods for browser automation
// Works with session-based browser manager

import { browserManager } from "./browser-manager";
import type { InteractionResult, BrowserAction } from "@/types/browser";

/**
 * Helper: create a standard InteractionResult
 */
function makeResult(
  success: boolean,
  action: BrowserAction,
  extra: Partial<InteractionResult> = {}
): InteractionResult {
  return {
    success,
    action,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

/**
 * Navigate to URL with waitUntil options
 */
export async function navigate(
  sessionId: string,
  url: string,
  options: {
    waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
    timeout?: number;
  } = {}
): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const waitUntil = options.waitUntil || "networkidle2";
    const timeout = options.timeout || 30000;

    await page.goto(url, { waitUntil, timeout });

    browserManager.updateSession(sessionId, {
      url: page.url(),
      status: "connected",
    });

    return makeResult(true, "navigate", {
      value: page.url(),
    });
  } catch (error) {
    return makeResult(false, "navigate", {
      error: error instanceof Error ? error.message : "Navigation failed",
    });
  }
}

/**
 * Click an element with wait
 */
export async function click(
  sessionId: string,
  selector: string,
  options: { delay?: number; timeout?: number } = {}
): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const timeout = options.timeout || 10000;

    await page.waitForSelector(selector, { timeout });
    await page.click(selector, { delay: options.delay || 0 });

    return makeResult(true, "click", { selector });
  } catch (error) {
    return makeResult(false, "click", {
      selector,
      error: error instanceof Error ? error.message : "Click failed",
    });
  }
}

/**
 * Type text into an input field with delay
 */
export async function type(
  sessionId: string,
  selector: string,
  text: string,
  options: { delay?: number; clear?: boolean; timeout?: number } = {}
): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const timeout = options.timeout || 10000;

    await page.waitForSelector(selector, { timeout });

    if (options.clear) {
      // Use $eval to truly clear the field value instead of pressing Backspace once
      await page.$eval(selector, (el: any) => {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      // Re-focus the element after clearing
      await page.click(selector);
    }

    await page.type(selector, text, { delay: options.delay || 50 });

    return makeResult(true, "type", { selector, value: text });
  } catch (error) {
    return makeResult(false, "type", {
      selector,
      value: text,
      error: error instanceof Error ? error.message : "Type failed",
    });
  }
}

/**
 * Scroll the page in a direction
 */
export async function scroll(
  sessionId: string,
  direction: "up" | "down" | "left" | "right" = "down",
  amount: number = 500
): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);

    const scrollMap: Record<string, { x: number; y: number }> = {
      up: { x: 0, y: -amount },
      down: { x: 0, y: amount },
      left: { x: -amount, y: 0 },
      right: { x: amount, y: 0 },
    };

    const { x, y } = scrollMap[direction] || scrollMap.down;

    await page.evaluate(
      (scrollX: number, scrollY: number) => {
        window.scrollBy(scrollX, scrollY);
      },
      x,
      y
    );

    return makeResult(true, "scroll", {
      value: `${direction} ${amount}px`,
    });
  } catch (error) {
    return makeResult(false, "scroll", {
      error: error instanceof Error ? error.message : "Scroll failed",
    });
  }
}

/**
 * Select a dropdown option
 */
export async function select(
  sessionId: string,
  selector: string,
  value: string,
  options: { timeout?: number } = {}
): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const timeout = options.timeout || 10000;

    await page.waitForSelector(selector, { timeout });
    const selectedValues = await page.select(selector, value);

    return makeResult(true, "select", {
      selector,
      value,
      data: { selectedValues },
    });
  } catch (error) {
    return makeResult(false, "select", {
      selector,
      value,
      error: error instanceof Error ? error.message : "Select failed",
    });
  }
}

/**
 * Wait for an element to appear
 */
export async function wait(
  sessionId: string,
  selector: string,
  options: { timeout?: number; visible?: boolean } = {}
): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const timeout = options.timeout || 10000;

    await page.waitForSelector(selector, {
      timeout,
      visible: options.visible,
    });

    return makeResult(true, "wait", { selector });
  } catch (error) {
    return makeResult(false, "wait", {
      selector,
      error: error instanceof Error ? error.message : "Wait timeout",
    });
  }
}

/**
 * Execute JavaScript expression on the page
 */
export async function evaluate(
  sessionId: string,
  expression: string
): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);

    // Use Function constructor for safe evaluation
    const result = await page.evaluate((expr: string) => {
      try {
        const fn = new Function(`return (${expr})`);
        return { success: true, value: fn() };
      } catch (e) {
        return {
          success: false,
          value: null,
          error: e instanceof Error ? e.message : "Evaluation error",
        };
      }
    }, expression);

    if (!result.success) {
      return makeResult(false, "evaluate", {
        value: expression,
        error: result.error || "Evaluation error",
      });
    }

    return makeResult(true, "evaluate", {
      value: expression,
      data: result.value,
    });
  } catch (error) {
    return makeResult(false, "evaluate", {
      value: expression,
      error: error instanceof Error ? error.message : "Evaluate failed",
    });
  }
}

/**
 * Get the full HTML content of the page
 */
export async function getContent(sessionId: string): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const html = await page.content();

    return makeResult(true, "getContent", {
      value: html.substring(0, 50000), // Limit to prevent huge responses
    });
  } catch (error) {
    return makeResult(false, "getContent", {
      error: error instanceof Error ? error.message : "Get content failed",
    });
  }
}

/**
 * Get the page title
 */
export async function getTitle(sessionId: string): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const title = await page.title();

    return makeResult(true, "getTitle", { value: title });
  } catch (error) {
    return makeResult(false, "getTitle", {
      error: error instanceof Error ? error.message : "Get title failed",
    });
  }
}

/**
 * Get the current URL
 */
export async function getUrl(sessionId: string): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const url = page.url();

    browserManager.updateSession(sessionId, { url });

    return makeResult(true, "getUrl", { value: url });
  } catch (error) {
    return makeResult(false, "getUrl", {
      error: error instanceof Error ? error.message : "Get URL failed",
    });
  }
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(
  sessionId: string,
  options: {
    waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
    timeout?: number;
  } = {}
): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const waitUntil = options.waitUntil || "networkidle2";
    const timeout = options.timeout || 30000;

    await page.waitForNavigation({ waitUntil, timeout });

    const url = page.url();
    browserManager.updateSession(sessionId, { url });

    return makeResult(true, "waitForNavigation", { value: url });
  } catch (error) {
    return makeResult(false, "waitForNavigation", {
      error: error instanceof Error ? error.message : "Wait for navigation failed",
    });
  }
}

/**
 * Navigate back in browser history
 */
export async function goBack(sessionId: string): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    await page.goBack({ waitUntil: "networkidle2", timeout: 30000 });

    const url = page.url();
    browserManager.updateSession(sessionId, { url });

    return makeResult(true, "goBack", { value: url });
  } catch (error) {
    return makeResult(false, "goBack", {
      error: error instanceof Error ? error.message : "Go back failed",
    });
  }
}

/**
 * Navigate forward in browser history
 */
export async function goForward(sessionId: string): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    await page.goForward({ waitUntil: "networkidle2", timeout: 30000 });

    const url = page.url();
    browserManager.updateSession(sessionId, { url });

    return makeResult(true, "goForward", { value: url });
  } catch (error) {
    return makeResult(false, "goForward", {
      error: error instanceof Error ? error.message : "Go forward failed",
    });
  }
}

/**
 * Reload / refresh the current page
 */
export async function refresh(sessionId: string): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    await page.reload({ waitUntil: "networkidle2", timeout: 30000 });

    const url = page.url();
    browserManager.updateSession(sessionId, { url });

    return makeResult(true, "refresh", { value: url });
  } catch (error) {
    return makeResult(false, "refresh", {
      error: error instanceof Error ? error.message : "Refresh failed",
    });
  }
}

/**
 * Upload a file to a file input element
 */
export async function upload(
  sessionId: string,
  selector: string,
  filePath: string,
  options: { timeout?: number } = {}
): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const timeout = options.timeout || 10000;

    await page.waitForSelector(selector, { timeout });
    const element = await page.$(selector);

    if (!element) {
      return makeResult(false, "upload", {
        selector,
        error: `Element not found: ${selector}`,
      });
    }

    await (element as import('puppeteer').ElementHandle<HTMLInputElement>).uploadFile(filePath);

    return makeResult(true, "upload", {
      selector,
      value: filePath,
    });
  } catch (error) {
    return makeResult(false, "upload", {
      selector,
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
}

/**
 * Hover over an element
 */
export async function hover(
  sessionId: string,
  selector: string,
  options: { timeout?: number } = {}
): Promise<InteractionResult> {
  try {
    const page = browserManager.getPage(sessionId);
    const timeout = options.timeout || 10000;

    await page.waitForSelector(selector, { timeout });
    await page.hover(selector);

    return makeResult(true, "hover", { selector });
  } catch (error) {
    return makeResult(false, "hover", {
      selector,
      error: error instanceof Error ? error.message : "Hover failed",
    });
  }
}

/**
 * Dispatch a browser action based on action type
 */
export async function dispatchInteraction(
  sessionId: string,
  action: BrowserAction,
  params: {
    url?: string;
    selector?: string;
    value?: string;
    filePath?: string;
    direction?: "up" | "down" | "left" | "right";
    amount?: number;
    delay?: number;
    clear?: boolean;
    timeout?: number;
    waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
    expression?: string;
    visible?: boolean;
  } = {}
): Promise<InteractionResult> {
  switch (action) {
    case "navigate":
      if (!params.url) {
        return makeResult(false, "navigate", {
          error: "URL is required for navigate action",
        });
      }
      return navigate(sessionId, params.url, {
        waitUntil: params.waitUntil,
        timeout: params.timeout,
      });

    case "click":
      if (!params.selector) {
        return makeResult(false, "click", {
          error: "Selector is required for click action",
        });
      }
      return click(sessionId, params.selector, {
        delay: params.delay,
        timeout: params.timeout,
      });

    case "type":
      if (!params.selector || !params.value) {
        return makeResult(false, "type", {
          error: "Selector and value are required for type action",
        });
      }
      return type(sessionId, params.selector, params.value, {
        delay: params.delay,
        clear: params.clear,
        timeout: params.timeout,
      });

    case "scroll":
      return scroll(
        sessionId,
        params.direction || "down",
        params.amount || 500
      );

    case "select":
      if (!params.selector || !params.value) {
        return makeResult(false, "select", {
          error: "Selector and value are required for select action",
        });
      }
      return select(sessionId, params.selector, params.value, {
        timeout: params.timeout,
      });

    case "wait":
      if (!params.selector) {
        return makeResult(false, "wait", {
          error: "Selector is required for wait action",
        });
      }
      return wait(sessionId, params.selector, {
        timeout: params.timeout,
        visible: params.visible,
      });

    case "evaluate":
      if (!params.expression) {
        return makeResult(false, "evaluate", {
          error: "Expression is required for evaluate action",
        });
      }
      return evaluate(sessionId, params.expression);

    case "getContent":
      return getContent(sessionId);

    case "getTitle":
      return getTitle(sessionId);

    case "getUrl":
      return getUrl(sessionId);

    case "waitForNavigation":
      return waitForNavigation(sessionId, {
        waitUntil: params.waitUntil,
        timeout: params.timeout,
      });

    case "goBack":
      return goBack(sessionId);

    case "goForward":
      return goForward(sessionId);

    case "refresh":
      return refresh(sessionId);

    case "hover":
      if (!params.selector) {
        return makeResult(false, "hover", {
          error: "Selector is required for hover action",
        });
      }
      return hover(sessionId, params.selector, {
        timeout: params.timeout,
      });

    case "upload":
      if (!params.selector || !params.filePath) {
        return makeResult(false, "upload", {
          error: "Selector and filePath are required for upload action",
        });
      }
      return upload(sessionId, params.selector, params.filePath, {
        timeout: params.timeout,
      });

    case "screenshot":
      // Screenshot is handled by a separate module
      return makeResult(false, "screenshot", {
        error: "Use the screenshot API endpoint instead",
      });

    default:
      return makeResult(false, action, {
        error: `Unknown action: ${action}`,
      });
  }
}
