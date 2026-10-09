"use client";

import { useLayoutEffect } from "react";

const revealSelectors = [
  ".intro-section",
  ".method-section",
  ".services-section",
  ".quote-band",
  ".journal-section",
  ".recipe-strip",
  ".stories-teaser",
  ".final-cta",
  ".about-story",
  ".values-section",
  ".about-cta",
  ".path-item",
  ".note-panel",
  ".page-cta",
  ".listing-filters",
  ".listing-empty",
  ".article-body",
  ".story-detail-grid",
  ".story-testimonial",
  ".story-detail-note",
  ".story-detail-actions",
  ".booking-form-wrap",
  ".admin-recent",
  ".admin-toolbar",
  ".content-tabs",
  ".content-items",
  ".content-item",
  ".admin-content-form",
  ".settings-form",
];

const staggerGroups: Array<[string, string]> = [
  [".service-grid", ".service-card"],
  [".editorial-grid", ".editorial-card"],
  [".recipe-grid", ".recipe-card"],
  [".article-list", ".article-list-item"],
  [".recipe-mini-list", ".recipe-mini"],
  [".path-list", ".path-item"],
  [".method-steps", "article"],
  [".values-section", "article"],
  [".admin-stat-grid", "article"],
  [".content-items", ".content-item"],
  [".stories-list", ".story-card"],
];

const revealSelector = [
  ...revealSelectors,
  ...staggerGroups.map(([, itemSelector]) => itemSelector),
].join(",");

function getBottomMargin(height: number): number {
  if (height <= 680) {
    return Math.round(Math.max(height * 0.14, 70));
  }
  if (height <= 960) {
    return Math.round(height * 0.17);
  }
  return Math.min(Math.round(height * 0.17), 180);
}

export function MotionEnhancer() {
  useLayoutEffect(() => {
    const root = document.getElementById("main-content");
    if (!root || !("IntersectionObserver" in window) || !("adoptedStyleSheets" in document)) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let revealSheet: CSSStyleSheet;
    try {
      revealSheet = new CSSStyleSheet();
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, revealSheet];
    } catch {
      return;
    }

    let observer: IntersectionObserver | null = null;
    let active = false;
    let currentBottomMargin = getBottomMargin(window.innerHeight);
    const revealed = new Set<HTMLElement>();
    const observing = new Set<HTMLElement>();
    const staggerIndex = new WeakMap<HTMLElement, number>();

    const find = (scope: ParentNode, selector: string) => {
      const matches = Array.from(scope.querySelectorAll<HTMLElement>(selector));
      if (scope instanceof HTMLElement && scope.matches(selector)) matches.unshift(scope);
      return matches;
    };

    const selectorFor = (element: HTMLElement) => {
      const segments: string[] = [];
      let current: HTMLElement | null = element;
      while (current && current !== root) {
        const tag = current.tagName.toLowerCase();
        const classes = Array.from(current.classList, (name) => `.${CSS.escape(name)}`).join("");
        const parent: HTMLElement | null = current.parentElement;
        if (!parent) return null;
        const tagName = current.tagName;
        const siblings: Element[] = Array.from(parent.children).filter((sibling: Element) => sibling.tagName === tagName);
        const position = siblings.indexOf(current) + 1;
        segments.unshift(`${tag}${classes}:nth-of-type(${position})`);
        current = parent;
      }
      if (current !== root || segments.length === 0) return null;
      return `#main-content > ${segments.join(" > ")}`;
    };

    const refreshRules = () => {
      const rules: string[] = [];
      for (const element of revealed) {
        if (!element.isConnected || !root.contains(element)) {
          revealed.delete(element);
          continue;
        }
        const selector = selectorFor(element);
        if (!selector) continue;
        const delay = Math.min(staggerIndex.get(element) ?? 0, 3);
        rules.push(`${selector}{opacity:1;transform:translate3d(0,0,0);transition-delay:calc(${delay} * var(--motion-stagger-step));}`);
      }
      revealSheet.replaceSync(rules.join("\n"));
    };

    const prepare = (element: HTMLElement) => {
      if (revealed.has(element) || observing.has(element)) return;
      const rect = element.getBoundingClientRect();
      const inInitialView = rect.top < (window.innerHeight - currentBottomMargin) && rect.bottom > 0;
      if (inInitialView) {
        revealed.add(element);
      } else if (observer) {
        observing.add(element);
        observer.observe(element);
      }
    };

    const scan = (scope: ParentNode = root) => {
      if (!active) return;
      for (const selector of revealSelectors) find(scope, selector).forEach(prepare);
      for (const [groupSelector, itemSelector] of staggerGroups) {
        find(scope, groupSelector).forEach((group) => {
          find(group, itemSelector).forEach((item, index) => {
            staggerIndex.set(item, Math.min(index, 3));
            prepare(item);
          });
        });
      }
    };

    const onIntersection: IntersectionObserverCallback = (entries) => {
      let changed = false;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        observing.delete(element);
        observer?.unobserve(element);
        revealed.add(element);
        changed = true;
      }
      if (changed) refreshRules();
    };

    const focusReveal = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const element = target.closest<HTMLElement>(revealSelector);
      if (!element || revealed.has(element)) return;
      observing.delete(element);
      observer?.unobserve(element);
      revealed.add(element);
      refreshRules();
    };

    const createObserver = (bottomMargin: number) => {
      return new IntersectionObserver(onIntersection, {
        rootMargin: `0px 0px -${bottomMargin}px 0px`,
        threshold: 0,
      });
    };

    const enable = () => {
      if (active) return;
      active = true;
      currentBottomMargin = getBottomMargin(window.innerHeight);
      observer = createObserver(currentBottomMargin);
      document.documentElement.classList.add("motion-preparing");
      scan();
      refreshRules();
      root.getBoundingClientRect();
      document.documentElement.classList.remove("motion-preparing");
      document.documentElement.classList.add("motion-enhanced");
    };

    const disable = () => {
      active = false;
      observer?.disconnect();
      observer = null;
      observing.clear();
      revealSheet.replaceSync("");
      document.documentElement.classList.remove("motion-preparing");
      document.documentElement.classList.remove("motion-enhanced");
    };

    const onPreferenceChange = () => {
      if (preference.matches) disable();
      else enable();
    };

    let resizeTimer: number | null = null;
    const onResize = () => {
      if (!active) return;
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const newMargin = getBottomMargin(window.innerHeight);
        if (Math.abs(newMargin - currentBottomMargin) >= 20) {
          currentBottomMargin = newMargin;
          observer?.disconnect();
          observer = createObserver(currentBottomMargin);
          for (const el of observing) {
            observer.observe(el);
          }
        }
      }, 150);
    };

    const mutationObserver = new MutationObserver((records) => {
      if (!active) return;
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) scan(node);
        });
      }
      refreshRules();
    });

    if (!preference.matches) enable();
    mutationObserver.observe(root, { childList: true, subtree: true });
    root.addEventListener("focusin", focusReveal);
    window.addEventListener("resize", onResize);
    preference.addEventListener("change", onPreferenceChange);

    return () => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      mutationObserver.disconnect();
      observer?.disconnect();
      root.removeEventListener("focusin", focusReveal);
      preference.removeEventListener("change", onPreferenceChange);
      document.documentElement.classList.remove("motion-preparing");
      document.documentElement.classList.remove("motion-enhanced");
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((sheet) => sheet !== revealSheet);
    };
  }, []);

  return null;
}
