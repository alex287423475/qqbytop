import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { appendLog, setIdle, setRunning, updateArticleStage } from "./status-updater.mjs";

const validatedDir = path.resolve("local-brain/validated");
const approvedDir = path.resolve("local-brain/approved");

function parseArgs() {
  const slugIndex = process.argv.indexOf("--slug");
  return {
    slug: slugIndex >= 0 ? process.argv[slugIndex + 1] : null,
  };
}

async function main() {
  const { slug } = parseArgs();
  if (!fs.existsSync(validatedDir)) {
    console.log("validated 目录不存在。");
    return;
  }

  const files = fs
    .readdirSync(validatedDir)
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !slug || file === `${slug}.md`);

  if (files.length === 0) {
    console.log("没有待审核文章。");
    return;
  }

  fs.mkdirSync(approvedDir, { recursive: true });
  setRunning("approve");
  appendLog("approve", `开始人工审核放行 ${files.length} 篇文章`);

  try {
    for (const file of files) {
      const sourcePath = path.join(validatedDir, file);
      const raw = fs.readFileSync(sourcePath, "utf-8");
      const { data } = matter(raw);
      const slugValue = data.slug || file.replace(/\.md$/, "");

      fs.renameSync(sourcePath, path.join(approvedDir, file));
      updateArticleStage(slugValue, "approved", {
        approvedAt: new Date().toISOString(),
        locale: data.locale || "zh",
      });
      appendLog("approve", `已审核通过：${slugValue}`, slugValue);
    }
  } finally {
    setIdle();
    appendLog("approve", "审核步骤完成");
  }
}

main().catch((error) => {
  appendLog("approve", `审核失败：${error.message}`);
  setIdle();
  console.error(error);
  process.exitCode = 1;
});

