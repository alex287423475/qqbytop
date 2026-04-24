import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { appendLog, setIdle, setRunning, updateArticleStage } from "./status-updater.mjs";

const approvedDir = path.resolve("local-brain/approved");
const articlesDir = path.resolve("content/articles");

function parseArgs() {
  const slugIndex = process.argv.indexOf("--slug");
  return {
    slug: slugIndex >= 0 ? process.argv[slugIndex + 1] : null,
  };
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
  appendLog("publish", `开始发布 ${files.length} 篇文章`);

  try {
    for (const file of files) {
      const sourcePath = path.join(approvedDir, file);
      const raw = fs.readFileSync(sourcePath, "utf-8");
      const { data } = matter(raw);
      const locale = data.locale || "zh";
      const slugValue = data.slug || file.replace(/\.md$/, "");
      const targetDir = path.join(articlesDir, locale, slugValue);

      fs.mkdirSync(targetDir, { recursive: true });
      fs.copyFileSync(sourcePath, path.join(targetDir, "index.md"));
      fs.unlinkSync(sourcePath);

      updateArticleStage(slugValue, "published", {
        publishedAt: new Date().toISOString(),
        locale,
        errors: [],
      });
      appendLog("publish", `已发布：${locale}/${slugValue}`, slugValue);
    }
  } finally {
    setIdle();
    appendLog("publish", "发布步骤完成");
  }
}

main().catch((error) => {
  appendLog("publish", `发布失败：${error.message}`);
  setIdle();
  console.error(error);
  process.exitCode = 1;
});

