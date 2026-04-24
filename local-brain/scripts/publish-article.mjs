import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import matter from "gray-matter";
import { normalizeLocale } from "./lib/normalize-locale.mjs";
import { appendLog, setIdle, setRunning, updateArticleStage } from "./status-updater.mjs";

const approvedDir = path.resolve("local-brain/approved");
const articlesDir = path.resolve("content/articles");

function parseArgs() {
  const slugIndex = process.argv.indexOf("--slug");
  return {
    slug: slugIndex >= 0 ? process.argv[slugIndex + 1] : null,
  };
}

function runGit(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function hasStagedChanges() {
  const output = runGit(["diff", "--cached", "--name-only", "--", "content/articles", "public/article-assets"]);
  return output.length > 0;
}

function publishToWebsite(slugs) {
  appendLog("publish", "开始推送到 GitHub，等待 Vercel 自动部署");

  runGit(["add", "--", "content/articles", "public/article-assets"]);

  if (!hasStagedChanges()) {
    appendLog("publish", "内容库没有新的可提交变更，跳过 Git 推送");
    return;
  }

  const commitSubject = slugs.length === 1 ? `content: publish ${slugs[0]}` : `content: publish ${slugs.length} SEO articles`;
  runGit(["commit", "-m", commitSubject]);
  appendLog("publish", `已创建提交：${commitSubject}`);

  const branch = runGit(["branch", "--show-current"]) || "main";
  runGit(["push", "origin", branch]);
  appendLog("publish", `已推送到 origin/${branch}，Vercel 将自动部署`);
}

async function main() {
  const { slug } = parseArgs();
  if (!fs.existsSync(approvedDir)) {
    console.log("approved 目录不存在。");
    return;
  }

  const files = fs
    .readdirSync(approvedDir)
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !slug || file === `${slug}.md`);

  if (files.length === 0) {
    console.log("没有待发布文章。");
    return;
  }

  setRunning("publish");
  appendLog("publish", `开始发布网站：${files.length} 篇文章`);

  const publishedSlugs = [];

  try {
    for (const file of files) {
      const sourcePath = path.join(approvedDir, file);
      const raw = fs.readFileSync(sourcePath, "utf-8");
      const parsed = matter(raw);
      const locale = normalizeLocale(parsed.data.locale);
      const slugValue = parsed.data.slug || file.replace(/\.md$/, "");
      const targetDir = path.join(articlesDir, locale, slugValue);
      parsed.data.locale = locale;

      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, "index.md"), matter.stringify(parsed.content, parsed.data), "utf-8");
      fs.unlinkSync(sourcePath);
      publishedSlugs.push(slugValue);

      updateArticleStage(slugValue, "published", {
        publishedAt: new Date().toISOString(),
        locale,
        errors: [],
      });
      appendLog("publish", `已写入网站内容库：${locale}/${slugValue}`, slugValue);
    }

    publishToWebsite(publishedSlugs);
  } finally {
    setIdle();
    appendLog("publish", "发布网站步骤完成");
  }
}

main().catch((error) => {
  appendLog("publish", `发布网站失败：${error.message}`);
  setIdle();
  console.error(error);
  process.exitCode = 1;
});
