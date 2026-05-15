import { spawn } from "child_process";
import { createWriteStream, existsSync } from "fs";
import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";

export type QualityTaskType = "checkpoint" | "pytest" | "batch_mock" | "typecheck" | "build" | "full_gate";
export type QualityRunStatus = "running" | "passed" | "failed";

export type QualityRunRecord = {
  runId: string;
  taskType: QualityTaskType;
  status: QualityRunStatus;
  currentStep: string;
  steps: string[];
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  error?: string;
  outputDir: string;
  batchSummary?: QualityBatchSummary | null;
};

export type QualityBatchSummary = {
  outputDir: string;
  total: number;
  passed: number;
  failed: number;
  minRuleScore: number | null;
};

export type QualityStatusResponse = {
  enabled: boolean;
  activeRunId: string | null;
  latestRun: QualityRunRecord | null;
  latestCheckpoint: string | null;
  latestBatchSummary: QualityBatchSummary | null;
  paths: {
    projectRoot: string;
    sampleInputDir: string;
    batchOutputRoot: string;
    qualityRunRoot: string;
  };
};

export class QualityConsoleError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const rootDir = process.cwd();
const runsDir = path.join(rootDir, "test_outputs", "gaokao_quality_runs");
const batchOutputsDir = path.join(rootDir, "test_outputs", "gaokao_reports");
const sampleInputDir = path.join(rootDir, "test_inputs", "gaokao_essays");
const backendDir = path.join(rootDir, "backend");

let activeRunId: string | null = null;

export function isQualityConsoleEnabled() {
  return process.env.GAOKAO_QUALITY_CONSOLE_ENABLED === "true";
}

export async function getQualityStatus(): Promise<QualityStatusResponse> {
  await ensureRunsDir();
  const latestRun = await getLatestRun();
  if (latestRun?.status === "running") {
    activeRunId = latestRun.runId;
  } else if (activeRunId === latestRun?.runId) {
    activeRunId = null;
  }
  return {
    enabled: isQualityConsoleEnabled(),
    activeRunId,
    latestRun,
    latestCheckpoint: await getLatestCheckpoint(),
    latestBatchSummary: await getLatestBatchSummary(),
    paths: {
      projectRoot: rootDir,
      sampleInputDir,
      batchOutputRoot: batchOutputsDir,
      qualityRunRoot: runsDir,
    },
  };
}

export async function startQualityRun(taskType: QualityTaskType): Promise<QualityRunRecord> {
  if (!isQualityConsoleEnabled()) {
    throw new QualityConsoleError(403, "质量保障控制台未启用。请配置 GAOKAO_QUALITY_CONSOLE_ENABLED=true。");
  }
  if (!isKnownTask(taskType)) {
    throw new QualityConsoleError(400, "不支持的质量任务。");
  }
  const current = await getQualityStatus();
  if (current.activeRunId || current.latestRun?.status === "running") {
    throw new QualityConsoleError(409, "已有质量任务正在运行，请等待完成。");
  }

  await ensureRunsDir();
  const runId = createRunId(taskType);
  const outputDir = path.join(runsDir, runId);
  await mkdir(outputDir, { recursive: true });
  const record: QualityRunRecord = {
    runId,
    taskType,
    status: "running",
    currentStep: "queued",
    steps: getTaskSteps(taskType),
    startedAt: new Date().toISOString(),
    outputDir,
    batchSummary: null,
  };
  await writeRunRecord(record);

  activeRunId = runId;
  void executeQualityRun(record).finally(() => {
    if (activeRunId === runId) activeRunId = null;
  });
  return record;
}

export async function getQualityLogs(runId: string) {
  if (!/^[a-z0-9_.-]+$/i.test(runId)) {
    throw new QualityConsoleError(400, "runId 格式不正确。");
  }
  const dir = path.join(runsDir, runId);
  const [stdout, stderr, record] = await Promise.all([
    readTextIfExists(path.join(dir, "stdout.log")),
    readTextIfExists(path.join(dir, "stderr.log")),
    readRunRecord(runId),
  ]);
  return {
    runId,
    record,
    stdout: tailLines(stdout, 240),
    stderr: tailLines(stderr, 120),
  };
}

async function executeQualityRun(record: QualityRunRecord) {
  try {
    for (const step of record.steps) {
      record.currentStep = step;
      await writeRunRecord(record);
      const exitCode = await runFixedStep(step, record);
      if (exitCode !== 0) {
        throw new QualityConsoleError(500, `${step} failed with exit code ${exitCode}`);
      }
    }
    record.status = "passed";
    record.currentStep = "completed";
    record.exitCode = 0;
    record.finishedAt = new Date().toISOString();
    record.batchSummary = await getLatestBatchSummary();
    await writeRunRecord(record);
  } catch (error) {
    record.status = "failed";
    record.error = error instanceof Error ? error.message : "unknown";
    record.exitCode = error instanceof QualityConsoleError ? error.status : 1;
    record.finishedAt = new Date().toISOString();
    record.batchSummary = await getLatestBatchSummary();
    await writeRunRecord(record);
  }
}

function runFixedStep(step: string, record: QualityRunRecord) {
  const command = getStepCommand(step, record.runId);
  const stdoutPath = path.join(record.outputDir, "stdout.log");
  const stderrPath = path.join(record.outputDir, "stderr.log");
  const stdout = createWriteStream(stdoutPath, { flags: "a" });
  const stderr = createWriteStream(stderrPath, { flags: "a" });
  stdout.write(`\n\n== ${new Date().toISOString()} ${step} ==\n`);
  stderr.write(`\n\n== ${new Date().toISOString()} ${step} ==\n`);

  return new Promise<number>((resolve) => {
    const child = spawn(command.cmd, command.args, {
      cwd: command.cwd,
      env: process.env,
      shell: false,
      windowsHide: true,
    });
    child.stdout.on("data", (chunk) => stdout.write(chunk));
    child.stderr.on("data", (chunk) => stderr.write(chunk));
    child.on("error", (error) => {
      stderr.write(`${error.message}\n`);
      stdout.end();
      stderr.end();
      resolve(1);
    });
    child.on("close", (code) => {
      stdout.write(`\n== exit ${code ?? 1} ==\n`);
      stdout.end();
      stderr.end();
      resolve(code ?? 1);
    });
  });
}

function getStepCommand(step: string, runId: string) {
  const isWindows = process.platform === "win32";
  const npm = isWindows ? "npm.cmd" : "npm";
  const uv = isWindows ? "uv.exe" : "uv";
  switch (step) {
    case "checkpoint":
      if (isWindows) {
        return {
          cmd: "powershell.exe",
          args: ["-ExecutionPolicy", "Bypass", "-File", ".\\保存当前版本.ps1", "-Message", `checkpoint: quality console ${runId}`],
          cwd: rootDir,
        };
      }
      return {
        cmd: "bash",
        args: ["-lc", `git add -A && if git diff --cached --quiet; then echo "No staged changes"; else git commit -m "checkpoint: quality console ${runId}"; fi && git log -1 --oneline`],
        cwd: rootDir,
      };
    case "pytest":
      return { cmd: uv, args: ["run", "pytest"], cwd: backendDir };
    case "batch_mock":
      return {
        cmd: uv,
        args: [
          "run",
          "python",
          "tools/batch_report_tester.py",
          "--mode",
          "local",
          "--input",
          "../test_inputs/gaokao_essays",
          "--output",
          "../test_outputs/gaokao_reports",
          "--delay",
          "0",
          "--min-rule-score",
          "80",
          "--env-file",
          ".env.force-mock-missing",
        ],
        cwd: backendDir,
      };
    case "typecheck":
      return { cmd: npm, args: ["run", "typecheck"], cwd: rootDir };
    case "build":
      return { cmd: npm, args: ["run", "build"], cwd: rootDir };
    default:
      return { cmd: npm, args: ["--version"], cwd: rootDir };
  }
}

function getTaskSteps(taskType: QualityTaskType) {
  if (taskType === "full_gate") return ["checkpoint", "pytest", "batch_mock", "typecheck", "build"];
  return [taskType];
}

function isKnownTask(taskType: string): taskType is QualityTaskType {
  return ["checkpoint", "pytest", "batch_mock", "typecheck", "build", "full_gate"].includes(taskType);
}

function createRunId(taskType: QualityTaskType) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `${stamp}-${taskType}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureRunsDir() {
  await mkdir(runsDir, { recursive: true });
}

async function writeRunRecord(record: QualityRunRecord) {
  await writeFile(path.join(record.outputDir, "run.json"), JSON.stringify(record, null, 2), "utf-8");
}

async function readRunRecord(runId: string): Promise<QualityRunRecord | null> {
  try {
    const text = await readFile(path.join(runsDir, runId, "run.json"), "utf-8");
    return JSON.parse(text) as QualityRunRecord;
  } catch {
    return null;
  }
}

async function getLatestRun(): Promise<QualityRunRecord | null> {
  try {
    const names = await readdir(runsDir, { withFileTypes: true });
    const runIds = names.filter((item) => item.isDirectory()).map((item) => item.name).sort().reverse();
    for (const runId of runIds) {
      const record = await readRunRecord(runId);
      if (record) return record;
    }
  } catch {
    return null;
  }
  return null;
}

async function getLatestCheckpoint() {
  return new Promise<string | null>((resolve) => {
    const child = spawn("git", ["log", "-1", "--oneline"], { cwd: rootDir, windowsHide: true });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += String(chunk);
    });
    child.on("close", () => resolve(output.trim() || null));
    child.on("error", () => resolve(null));
  });
}

async function getLatestBatchSummary(): Promise<QualityBatchSummary | null> {
  try {
    if (!existsSync(batchOutputsDir)) return null;
    const names = await readdir(batchOutputsDir, { withFileTypes: true });
    const dirs = names.filter((item) => item.isDirectory()).map((item) => item.name).sort().reverse();
    for (const dir of dirs) {
      const summaryPath = path.join(batchOutputsDir, dir, "summary.csv");
      if (!existsSync(summaryPath)) continue;
      const csv = await readFile(summaryPath, "utf-8");
      const rows = parseSummaryCsv(csv);
      if (rows.length === 0) continue;
      const scores = rows.map((row) => Number(row.rule_score)).filter((value) => Number.isFinite(value));
      const failed = rows.filter((row) => row.status !== "ok" || String(row.schema_ok).toLowerCase() !== "true" || Number(row.rule_score) < 80).length;
      return {
        outputDir: path.join(batchOutputsDir, dir),
        total: rows.length,
        passed: rows.length - failed,
        failed,
        minRuleScore: scores.length ? Math.min(...scores) : null,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function parseSummaryCsv(csv: string) {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift()?.split(",") || [];
  return lines.map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])) as Record<string, string>;
  });
}

async function readTextIfExists(filePath: string) {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

function tailLines(text: string, lines: number) {
  const parts = text.split(/\r?\n/);
  return parts.slice(Math.max(0, parts.length - lines)).join("\n");
}
