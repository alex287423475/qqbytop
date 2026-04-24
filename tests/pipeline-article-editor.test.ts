import test from "node:test";
import assert from "node:assert/strict";

import {
  canEditArticleStage,
  canCreateRevisionDraft,
  getArticleEditMessages,
  normalizeSiteLocale,
  shouldDeleteOriginalAfterSave,
} from "../lib/pipeline-article-editor.ts";

test("published articles stay editable but keep the published source file", () => {
  assert.equal(canEditArticleStage("published"), true);
  assert.equal(
    shouldDeleteOriginalAfterSave("published", "content/articles/zh/example/index.md", "local-brain/drafts/example.md"),
    false,
  );

  assert.deepEqual(getArticleEditMessages("published"), {
    responseMessage: "已从线上文章创建修订草稿。当前网站内容未变更，请重新执行校验、审核和发布网站。",
    logMessage: "已从线上文章创建修订草稿：example",
  });
});

test("non-published editable stages still replace their previous working file", () => {
  assert.equal(canEditArticleStage("draft"), true);
  assert.equal(
    shouldDeleteOriginalAfterSave("validated", "local-brain/validated/example.md", "local-brain/drafts/example.md"),
    true,
  );

  assert.deepEqual(getArticleEditMessages("validated"), {
    responseMessage: "已保存为草稿，请重新执行校验草稿。",
    logMessage: "已手动编辑并退回草稿：example",
  });
});

test("only published articles expose direct revision-draft creation", () => {
  assert.equal(canCreateRevisionDraft("published"), true);
  assert.equal(canCreateRevisionDraft("draft"), false);
  assert.equal(canCreateRevisionDraft("validated"), false);
});

test("locale variants collapse to site locales", () => {
  assert.equal(normalizeSiteLocale("zh-CN"), "zh");
  assert.equal(normalizeSiteLocale("ZH-hans"), "zh");
  assert.equal(normalizeSiteLocale("en-US"), "en");
  assert.equal(normalizeSiteLocale("ja-JP"), "ja");
  assert.equal(normalizeSiteLocale(""), "zh");
});
