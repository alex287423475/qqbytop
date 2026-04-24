"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  buildCategoryChipHref,
  buildCategoryChipId,
  getCategoryChipClassName,
  getCategoryScrollerClassName,
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
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-slate-50 to-transparent md:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-slate-50 to-transparent md:hidden" />
      <div className={getCategoryScrollerClassName()}>
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
