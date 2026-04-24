"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  buildCategoryChipHref,
  buildCategoryChipId,
  getCategoryChipClassName,
  getCategoryScrollerClassName,
  getCategoryScrollerEdgeState,
  getCategoryScrollerShellClassName,
} from "./blog-category-chips.helpers";

export type BlogCategoryFacet = {
  label: string;
  value: string;
  count: number;
  href: string;
};

export function BlogCategoryChips({
  facets,
  activeCategory,
}: {
  facets: BlogCategoryFacet[];
  activeCategory: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [{ showLeftFade, showRightFade }, setFadeState] = useState({
    showLeftFade: false,
    showRightFade: false,
  });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const syncFadeState = () => {
      setFadeState(getCategoryScrollerEdgeState(scroller.scrollLeft, scroller.clientWidth, scroller.scrollWidth));
    };

    syncFadeState();
    scroller.addEventListener("scroll", syncFadeState, { passive: true });
    window.addEventListener("resize", syncFadeState);

    return () => {
      scroller.removeEventListener("scroll", syncFadeState);
      window.removeEventListener("resize", syncFadeState);
    };
  }, [facets]);

  useEffect(() => {
    const activeChip = document.getElementById(buildCategoryChipId(activeCategory));
    if (!activeChip) return;
    activeChip.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [activeCategory]);

  return (
    <div className={getCategoryScrollerShellClassName()}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-slate-50 to-transparent transition-opacity md:hidden ${
          showLeftFade ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-slate-50 to-transparent transition-opacity md:hidden ${
          showRightFade ? "opacity-100" : "opacity-0"
        }`}
      />
      <div ref={scrollerRef} className={getCategoryScrollerClassName()}>
        {facets.map((facet) => {
          const active = facet.value === activeCategory;
          return (
            <Link
              key={facet.value}
              id={buildCategoryChipId(facet.value)}
              href={buildCategoryChipHref(facet.href)}
              className={getCategoryChipClassName(active)}
            >
              <span>{facet.label}</span>
              <span
                className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {facet.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
