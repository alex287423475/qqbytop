import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { getAllArticleSlugs } from "@/lib/articles";
import { PipelineDashboard } from "@/components/pipeline/PipelineDashboard";

export const metadata: Metadata = {
  title: "SEO Pipeline",
  description: "Local Brain SEO content pipeline dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

function countDirItems(dirPath: string) {
  if (!fs.existsSync(dirPath)) return 0;
  return fs.readdirSync(dirPath).filter((item) => item.endsWith(".md")).length;
}

function getInitialPipelineStatus() {
  const statusPath = path.join(process.cwd(), "local-brain", "status", "pipeline.runtime.json");
  const examplePath = path.join(process.cwd(), "local-brain", "status", "pipeline.example.json");
  const keywordsPath = path.join(process.cwd(), "local-brain", "inputs", "keywords.csv");
  const status = fs.existsSync(statusPath)
    ? JSON.parse(fs.readFileSync(statusPath, "utf-8"))
    : fs.existsSync(examplePath)
      ? JSON.parse(fs.readFileSync(examplePath, "utf-8"))
      : {
          updatedAt: null,
          isRunning: false,
          currentStep: null,
          lock: null,
          articles: {},
          log: [],
        };

  const keywordCount = fs.existsSync(keywordsPath)
    ? fs
        .readFileSync(keywordsPath, "utf-8")
        .split(/\r?\n/)
        .filter((line, index) => index > 0 && line.trim().length > 0).length
    : 0;

  return {
    ...status,
    counts: {
      keywords: keywordCount,
      drafts: countDirItems(path.join(process.cwd(), "local-brain", "drafts")),
      validated: countDirItems(path.join(process.cwd(), "local-brain", "validated")),
      approved: countDirItems(path.join(process.cwd(), "local-brain", "approved")),
      published: getAllArticleSlugs().length,
    },
  };
}

export default function PipelinePage() {
  return <PipelineDashboard initialStatus={getInitialPipelineStatus()} />;
}
