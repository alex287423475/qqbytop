export function buildCategoryChipId(value: string) {
  return `blog-category-chip-${encodeURIComponent(value || "all")}`;
}

export function getCategoryScrollerClassName() {
  return "category-chip-scroller -mx-5 flex gap-3 overflow-x-auto px-5 whitespace-nowrap scroll-smooth md:mx-0 md:flex-wrap md:px-0";
}

export function getCategoryChipClassName(active: boolean) {
  return `inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-5 py-3 text-base font-medium whitespace-nowrap transition ${
    active
      ? "border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-100"
      : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand-300 hover:text-brand-700"
  }`;
}
