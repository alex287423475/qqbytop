import path from "path";
import { spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import { getAiEnvForChild } from "@/lib/pipeline-ai-config";

export const runtime = "nodejs";

const scriptMap: Record<string, string> = {
  generate: "generate-article.mjs",
  validate: "validate-article.mjs",
  approve: "approve-article.mjs",
  publish: "publish-article.mjs",
};

const statusPath = path.join(process.cwd(), "local-brain", "status", "pipeline.runtime.json");

async function readStatus() {
  try {
    const { readFile } = await import("fs/promises");
    return JSON.parse(await readFile(statusPath, "utf-8"));
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Pipeline console is disabled in production." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { step?: string; slug?: string; provider?: string };
  const step = body.step || "";
  const script = scriptMap[step];

  if (!script) {
    return NextResponse.json({ message: "Unknown step." }, { status: 400 });
  }

  const status = await readStatus();
  if (status?.isRunning) {
    return NextResponse.json({ message: "Another pipeline step is already running." }, { status: 409 });
  }

  const args = [path.join(process.cwd(), "local-brain", "scripts", script)];
  if (body.slug) {
    args.push("--slug", body.slug);
  }

  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...getAiEnvForChild(body.provider),
    },
    detached: true,
    stdio: "ignore",
  });

  child.unref();

  return NextResponse.json({
    success: true,
    pid: child.pid,
    step,
  });
}
