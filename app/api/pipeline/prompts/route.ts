import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const promptsDir = path.join(process.cwd(), "local-brain", "prompts");

const promptRegistry = {
  "generate-system": {
    key: "generate-system",
    label: "生成文章 System",
    description: "控制文章生成 Agent 的身份、语气和总体写作边界。",
    fileName: "article-system.md",
  },
  "generate-user": {
    key: "generate-user",
    label: "生成文章 User",
    description: "控制生成文章时必须包含的结构、SEO 要求和输出格式。",
    fileName: "article-user.md",
  },
  review: {
    key: "review",
    label: "AI质检",
    description: "控制模型B如何检查格式、SEO、内链、重复度、AI味和合规风险。",
    fileName: "review-agent.md",
  },
  rewrite: {
    key: "rewrite",
    label: "AI重写",
    description: "控制模型B如何根据质检报告重写文章。",
    fileName: "rewrite-agent.md",
  },
} as const;

type PromptKey = keyof typeof promptRegistry;

function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Prompt editor is disabled in production." }, { status: 403 });
  }

  return null;
}

function isPromptKey(key: string): key is PromptKey {
  return key in promptRegistry;
}

function readPrompt(key: PromptKey) {
  const meta = promptRegistry[key];
  const filePath = path.join(promptsDir, meta.fileName);

  return {
    ...meta,
    filePath,
    content: fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "",
  };
}

export async function GET() {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  return NextResponse.json({
    prompts: (Object.keys(promptRegistry) as PromptKey[]).map((key) => readPrompt(key)),
  });
}

export async function PUT(request: NextRequest) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const body = (await request.json().catch(() => ({}))) as { key?: string; content?: string };
  const key = String(body.key || "");
  const content = typeof body.content === "string" ? body.content : "";

  if (!isPromptKey(key)) {
    return NextResponse.json({ message: "Unknown prompt key." }, { status: 400 });
  }

  if (!content.trim()) {
    return NextResponse.json({ message: "Prompt content cannot be empty." }, { status: 400 });
  }

  fs.mkdirSync(promptsDir, { recursive: true });
  const filePath = path.join(promptsDir, promptRegistry[key].fileName);
  fs.writeFileSync(filePath, content.trimEnd() + "\n", "utf-8");

  return NextResponse.json({
    success: true,
    prompt: readPrompt(key),
  });
}
