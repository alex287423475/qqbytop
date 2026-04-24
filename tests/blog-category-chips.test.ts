import test from "node:test";
import assert from "node:assert/strict";

import { buildCategoryChipId, getCategoryChipClassName, getCategoryScrollerClassName } from "../components/shared/blog-category-chips.helpers.ts";

test("buildCategoryChipId normalizes category values for stable DOM ids", () => {
  assert.equal(buildCategoryChipId("all"), "blog-category-chip-all");
  assert.equal(buildCategoryChipId("法律翻译"), "blog-category-chip-%E6%B3%95%E5%BE%8B%E7%BF%BB%E8%AF%91");
});

test("getCategoryScrollerClassName enables horizontal scroll on mobile", () => {
  const className = getCategoryScrollerClassName();

  assert.match(className, /overflow-x-auto/);
  assert.match(className, /whitespace-nowrap/);
  assert.match(className, /md:flex-wrap/);
  assert.match(className, /category-chip-scroller/);
});

test("getCategoryChipClassName keeps active chips visually distinct and non-wrapping", () => {
  const activeClassName = getCategoryChipClassName(true);
  const inactiveClassName = getCategoryChipClassName(false);

  assert.match(activeClassName, /bg-brand-600/);
  assert.match(activeClassName, /shrink-0/);
  assert.match(activeClassName, /snap-start/);
  assert.match(inactiveClassName, /bg-white/);
  assert.match(inactiveClassName, /whitespace-nowrap/);
});
