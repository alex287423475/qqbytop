import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCategoryChipHref,
  buildCategoryChipId,
  getCategoryChipClassName,
  getCategoryScrollerClassName,
  getCategoryScrollerEdgeState,
  getCategoryScrollerShellClassName,
} from "../components/shared/blog-category-chips.helpers.ts";

test("buildCategoryChipId normalizes category values for stable DOM ids", () => {
  assert.equal(buildCategoryChipId("all"), "blog-category-chip-all");
  assert.equal(buildCategoryChipId("法律翻译"), "blog-category-chip-%E6%B3%95%E5%BE%8B%E7%BF%BB%E8%AF%91");
});

test("buildCategoryChipHref anchors navigation back to the results area", () => {
  assert.equal(buildCategoryChipHref("/zh/blog"), "/zh/blog#blog-results");
  assert.equal(buildCategoryChipHref("/zh/blog?category=跨境合规"), "/zh/blog?category=跨境合规#blog-results");
});

test("getCategoryScrollerEdgeState hides fades when no horizontal overflow exists", () => {
  assert.deepEqual(getCategoryScrollerEdgeState(0, 320, 320), {
    showLeftFade: false,
    showRightFade: false,
  });
});

test("getCategoryScrollerEdgeState reflects left and right edge visibility while scrolling", () => {
  assert.deepEqual(getCategoryScrollerEdgeState(0, 320, 900), {
    showLeftFade: false,
    showRightFade: true,
  });
  assert.deepEqual(getCategoryScrollerEdgeState(120, 320, 900), {
    showLeftFade: true,
    showRightFade: true,
  });
  assert.deepEqual(getCategoryScrollerEdgeState(580, 320, 900), {
    showLeftFade: true,
    showRightFade: false,
  });
});

test("getCategoryScrollerClassName enables horizontal scroll on mobile", () => {
  const className = getCategoryScrollerClassName();

  assert.match(className, /overflow-x-auto/);
  assert.match(className, /whitespace-nowrap/);
  assert.match(className, /md:flex-wrap/);
  assert.match(className, /category-chip-scroller/);
});

test("getCategoryScrollerShellClassName adds mobile edge fade positioning", () => {
  const className = getCategoryScrollerShellClassName();

  assert.match(className, /relative/);
  assert.match(className, /-mx-5/);
  assert.match(className, /md:mx-0/);
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
