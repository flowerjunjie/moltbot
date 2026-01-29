import type { Page } from "playwright-core";

import { type AriaSnapshotNode, formatAriaSnapshot, type RawAXNode } from "./cdp.js";
import {
  buildRoleSnapshotFromAiSnapshot,
  buildRoleSnapshotFromAriaSnapshot,
  getRoleSnapshotStats,
  type RoleSnapshotOptions,
  type RoleRefMap,
} from "./pw-role-snapshot.js";
import {
  ensurePageState,
  getPageForTargetId,
  storeRoleRefsForTarget,
  type WithSnapshotForAI,
} from "./pw-session.js";

export async function snapshotAriaViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
  limit?: number;
}): Promise<{ nodes: AriaSnapshotNode[] }> {
  const limit = Math.max(1, Math.min(2000, Math.floor(opts.limit ?? 500)));
  const page = await getPageForTargetId({
    cdpUrl: opts.cdpUrl,
    targetId: opts.targetId,
  });
  ensurePageState(page);
  const session = await page.context().newCDPSession(page);
  try {
    await session.send("Accessibility.enable").catch(() => {});
    const res = (await session.send("Accessibility.getFullAXTree")) as {
      nodes?: RawAXNode[];
    };
    const nodes = Array.isArray(res?.nodes) ? res.nodes : [];
    return { nodes: formatAriaSnapshot(nodes, limit) };
  } finally {
    await session.detach().catch(() => {});
  }
}

export async function snapshotAiViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
  timeoutMs?: number;
  maxChars?: number;
}): Promise<{ snapshot: string; truncated?: boolean; refs: RoleRefMap }> {
  const page = await getPageForTargetId({
    cdpUrl: opts.cdpUrl,
    targetId: opts.targetId,
  });
  ensurePageState(page);

  const maybe = page as unknown as WithSnapshotForAI;
  if (!maybe._snapshotForAI) {
    throw new Error("Playwright _snapshotForAI is not available. Upgrade playwright-core.");
  }

  const result = await maybe._snapshotForAI({
    timeout: Math.max(500, Math.min(60_000, Math.floor(opts.timeoutMs ?? 5000))),
    track: "response",
  });
  let snapshot = String(result?.full ?? "");
  const maxChars = opts.maxChars;
  const limit =
    typeof maxChars === "number" && Number.isFinite(maxChars) && maxChars > 0
      ? Math.floor(maxChars)
      : undefined;
  let truncated = false;
  if (limit && snapshot.length > limit) {
    snapshot = `${snapshot.slice(0, limit)}\n\n[...TRUNCATED - page too large]`;
    truncated = true;
  }

  const built = buildRoleSnapshotFromAiSnapshot(snapshot);
  storeRoleRefsForTarget({
    page,
    cdpUrl: opts.cdpUrl,
    targetId: opts.targetId,
    refs: built.refs,
    mode: "aria",
  });
  return truncated ? { snapshot, truncated, refs: built.refs } : { snapshot, refs: built.refs };
}

export async function snapshotRoleViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
  selector?: string;
  frameSelector?: string;
  refsMode?: "role" | "aria";
  options?: RoleSnapshotOptions;
}): Promise<{
  snapshot: string;
  refs: Record<string, { role: string; name?: string; nth?: number }>;
  stats: { lines: number; chars: number; refs: number; interactive: number };
}> {
  const page = await getPageForTargetId({
    cdpUrl: opts.cdpUrl,
    targetId: opts.targetId,
  });
  ensurePageState(page);

  if (opts.refsMode === "aria") {
    if (opts.selector?.trim() || opts.frameSelector?.trim()) {
      throw new Error("refs=aria does not support selector/frame snapshots yet.");
    }
    const maybe = page as unknown as WithSnapshotForAI;
    if (!maybe._snapshotForAI) {
      throw new Error("refs=aria requires Playwright _snapshotForAI support.");
    }
    const result = await maybe._snapshotForAI({
      timeout: 5000,
      track: "response",
    });
    const built = buildRoleSnapshotFromAiSnapshot(String(result?.full ?? ""), opts.options);
    storeRoleRefsForTarget({
      page,
      cdpUrl: opts.cdpUrl,
      targetId: opts.targetId,
      refs: built.refs,
      mode: "aria",
    });
    return {
      snapshot: built.snapshot,
      refs: built.refs,
      stats: getRoleSnapshotStats(built.snapshot, built.refs),
    };
  }

  const frameSelector = opts.frameSelector?.trim() || "";
  const selector = opts.selector?.trim() || "";
  const locator = frameSelector
    ? selector
      ? page.frameLocator(frameSelector).locator(selector)
      : page.frameLocator(frameSelector).locator(":root")
    : selector
      ? page.locator(selector)
      : page.locator(":root");

  const ariaSnapshot = await locator.ariaSnapshot();
  const built = buildRoleSnapshotFromAriaSnapshot(String(ariaSnapshot ?? ""), opts.options);
  storeRoleRefsForTarget({
    page,
    cdpUrl: opts.cdpUrl,
    targetId: opts.targetId,
    refs: built.refs,
    frameSelector: frameSelector || undefined,
    mode: "role",
  });
  return {
    snapshot: built.snapshot,
    refs: built.refs,
    stats: getRoleSnapshotStats(built.snapshot, built.refs),
  };
}

// Build a DOM-based snapshot for pages without ARIA attributes
async function buildDomSnapshotFromPage(
  page: Page,
  options: RoleSnapshotOptions = {},
): Promise<{ snapshot: string; refs: Record<string, { role: string; name?: string }> }> {
  let counter = 0;
  const refs: Record<string, { role: string; name?: string }> = {};

  function nextRef(): string {
    counter++;
    return `e${counter}`;
  }

  function getRoleFromElement(el: Element): string {
    const tagName = el.tagName.toLowerCase();
    if (tagName === "button" || el.getAttribute("role") === "button") return "button";
    if (tagName === "a" || el.getAttribute("role") === "link") return "link";
    if (tagName === "input" || el.getAttribute("role") === "textbox") return "textbox";
    if (tagName === "select" || el.getAttribute("role") === "combobox") return "combobox";
    if (tagName === "textarea") return "textbox";
    if (el.getAttribute("role") === "checkbox" || (tagName === "input" && (el as HTMLInputElement).type === "checkbox"))
      return "checkbox";
    if (el.getAttribute("role") === "radio" || (tagName === "input" && (el as HTMLInputElement).type === "radio"))
      return "radio";
    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) return "heading";
    if (["div", "span", "p"].includes(tagName)) {
      if (el.getAttribute("role") === "heading") return "heading";
      if (el.getAttribute("role") === "button") return "button";
      if (el.getAttribute("role") === "link") return "link";
      return "generic";
    }
    if (tagName === "ul" || tagName === "ol") return "list";
    if (tagName === "li") return "listitem";
    return "generic";
  }

  function getNameFromElement(el: Element): string | undefined {
    return el.textContent?.trim().slice(0, 100) || el.getAttribute("aria-label") || el.getAttribute("title") || undefined;
  }

  function isInteractiveElement(el: Element): boolean {
    const role = getRoleFromElement(el);
    return (
      ["button", "link", "textbox", "checkbox", "radio", "combobox", "option", "menuitem", "tab"].includes(role) ||
      el.tagName === "BUTTON" ||
      el.tagName === "A" ||
      el.tagName === "INPUT" ||
      el.tagName === "SELECT" ||
      (el as HTMLElement).onclick !== null ||
      el.getAttribute("onmousedown") !== null ||
      el.getAttribute("onclick") !== null
    );
  }

  const INTERACTIVE_ROLES = new Set([
    "button",
    "link",
    "textbox",
    "checkbox",
    "radio",
    "combobox",
    "option",
    "menuitem",
    "tab",
  ]);
  const STRUCTURAL_ROLES = new Set(["generic", "group", "list", "listitem"]);

  function traverseElement(el: Element, depth: number, lines: string[]): void {
    if (options.maxDepth !== undefined && depth > options.maxDepth) return;

    const role = getRoleFromElement(el);
    const name = getNameFromElement(el);
    const interactive = isInteractiveElement(el);

    if (options.interactive && !interactive) return;
    if (options.compact && STRUCTURAL_ROLES.has(role) && !name) return;

    let line = `${"  ".repeat(depth)}- ${role}`;
    if (name) line += ` "${name}"`;

    // Add ref for interactive elements or named content
    if (interactive || (name && role === "heading")) {
      const ref = nextRef();
      line += ` [ref=${ref}]`;
      refs[ref] = { role, ...(name ? { name } : {}) };
    }

    lines.push(line);

    // Recurse into children
    const children = Array.from(el.children);
    for (const child of children) {
      traverseElement(child, depth + 1, lines);
    }
  }

  const lines: string[] = [];
  const rootHandle = await page.locator(":root").first().elementHandle();
  if (rootHandle) {
    const children = await rootHandle.$$(":scope > *");
    for (const child of children) {
      const element = await child.evaluateHandle((el) => el as Element);
      traverseElement(element as unknown as Element, 0, lines);
    }
  }

  return {
    snapshot: lines.join("\n") || "(no elements found)",
    refs,
  };
}

export async function snapshotDomViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
  options?: RoleSnapshotOptions;
}): Promise<{
  snapshot: string;
  refs: Record<string, { role: string; name?: string }>;
  stats: { lines: number; chars: number; refs: number; interactive: number };
}> {
  const page = await getPageForTargetId({
    cdpUrl: opts.cdpUrl,
    targetId: opts.targetId,
  });
  ensurePageState(page);

  const built = await buildDomSnapshotFromPage(page as Page, opts.options || {});

  return {
    snapshot: built.snapshot,
    refs: built.refs,
    stats: getRoleSnapshotStats(built.snapshot, built.refs),
  };
}

export async function navigateViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
  url: string;
  timeoutMs?: number;
}): Promise<{ url: string }> {
  const url = String(opts.url ?? "").trim();
  if (!url) throw new Error("url is required");
  const page = await getPageForTargetId(opts);
  ensurePageState(page);
  await page.goto(url, {
    timeout: Math.max(1000, Math.min(120_000, opts.timeoutMs ?? 20_000)),
  });
  return { url: page.url() };
}

export async function resizeViewportViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
  width: number;
  height: number;
}): Promise<void> {
  const page = await getPageForTargetId(opts);
  ensurePageState(page);
  await page.setViewportSize({
    width: Math.max(1, Math.floor(opts.width)),
    height: Math.max(1, Math.floor(opts.height)),
  });
}

export async function closePageViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
}): Promise<void> {
  const page = await getPageForTargetId(opts);
  ensurePageState(page);
  await page.close();
}

export async function pdfViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
}): Promise<{ buffer: Buffer }> {
  const page = await getPageForTargetId(opts);
  ensurePageState(page);
  const buffer = await (page as Page).pdf({ printBackground: true });
  return { buffer };
}
