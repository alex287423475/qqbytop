"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { buildCategoryChipId, getCategoryChipClassName, getCategoryScrollerClassName } from "./blog-category-chips.helpers";

export type BlogCategoryFacet = {
  label: string;
  value: string;
  count: number;
};

export function BlogCategoryChips({
  facets,
  activeCategory,
  hrefFor,
}: {
  facets: BlogCategoryFacet[];
  activeCategory: string;
  hrefFor: (category: string) => string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

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
    <div ref={scrollerRef} className={getCategoryScrollerClassName()}>
      {facets.map((facet) => {
        const active = facet.value === activeCategory;
        return (
          <Link key={facet.value} id={buildCategoryChipId(facet.value)} href={hrefFor(facet.value)} className={getCategoryChipClassName(active)}>
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
  );
}
