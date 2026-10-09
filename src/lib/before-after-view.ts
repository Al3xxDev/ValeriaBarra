import type { PublicBeforeAfterCase } from "@/lib/before-after";
import type { BeforeAfterCardData } from "@/components/before-after-card";

export function toBeforeAfterCardData(item: PublicBeforeAfterCase): BeforeAfterCardData {
  return {
    title: item.title,
    slug: item.slug,
    description: item.description,
    goal: item.goal,
    duration: item.duration,
    isDemo: item.isDemo,
    before: {
      src: item.isDemo ? item.beforeMedia?.url ?? "" : item.beforeMedia ? "/api/media/" + item.beforeMedia.id : "",
      alt: item.imageBeforeAlt ?? item.beforeMedia?.altText ?? "",
    },
    after: {
      src: item.isDemo ? item.afterMedia?.url ?? "" : item.afterMedia ? "/api/media/" + item.afterMedia.id : "",
      alt: item.imageAfterAlt ?? item.afterMedia?.altText ?? "",
    },
  };
}
