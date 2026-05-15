import { spawn } from "child_process";
import { createHash } from "crypto";
import { createWriteStream, existsSync } from "fs";
import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
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
  modelSettings: QualityModelSettings;
  promptSettings: QualityPromptSettings;
};

export type QualityModelSettings = {
  environment: string;
  llmProviderOrder: string;
  tencentTokenhubBaseUrl: string;
  tencentTokenhubFreeModel: string;
  tencentTokenhubPaidModel: string;
  tencentTokenhubFallbackModel: string;
  supportChatLlmEnabled: string;
  supportChatModel: string;
  configSources: string[];
};

export type QualityPromptSettings = {
  defaultPromptVersion: string;
  batchPromptA: string;
  batchPromptB: string;
  prompts: QualityPromptFileInfo[];
};

export type QualityPromptFileInfo = {
  version: string;
  label: string;
  filePath: string;
  exists: boolean;
  sizeBytes: number | null;
  updatedAt: string | null;
  sha256: string | null;
  preview: string;
};

export type EditableQualitySettings = {
  modelSettings: QualityModelSettings & {
    editableConfigPath: string;
  };
  prompts: Array<QualityPromptFileInfo & { content: string }>;
};

export type SaveQualitySettingsInput = {
  modelSettings?: Partial<
    Pick<
      QualityModelSettings,
      | "environment"
      | "llmProviderOrder"
      | "tencentTokenhubBaseUrl"
      | "tencentTokenhubFreeModel"
      | "tencentTokenhubPaidModel"
      | "tencentTokenhubFallbackModel"
      | "supportChatLlmEnabled"
    >
  >;
  prompts?: Array<{
    version: string;
    content: string;
  }>;
};

export type QualityCheckpoint = {
  type: "commit" | "tag";
  ref: string;
  subject: string;
  label: string;
};

export type RestoreCheckpointPreview = {
  ref: string;
  subject: string;
  changedFiles: string[];
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
const promptsDir = path.join(backendDir, "prompts");
const editableBackendEnvPath = path.join(backendDir, ".env.local-deepseek");

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
    modelSettings: await getModelSettings(),
    promptSettings: await getPromptSettings(),
  };
}

export async function getEditableQualitySettings(): Promise<EditableQualitySettings> {
  const [modelSettings, promptSettings] = await Promise.all([getModelSettings(), getPromptSettings()]);
  return {
    modelSettings: {
      ...modelSettings,
      editableConfigPath: editableBackendEnvPath,
    },
    prompts: await Promise.all(
      promptSettings.prompts.map(async (prompt) => ({
        ...prompt,
        content: prompt.exists ? await readFile(prompt.filePath, "utf-8") : "",
      })),
    ),
  };
}

export async function saveEditableQualitySettings(input: SaveQualitySettingsInput) {
  if (!isQualityConsoleEnabled()) {
    throw new QualityConsoleError(403, "质量保障控制台未启用。请配置 GAOKAO_QUALITY_CONSOLE_ENABLED=true。");
  }
  if (activeRunId) {
    throw new QualityConsoleError(409, "质量任务正在运行，不能修改模型或 Prompt 设置。");
  }

  await createPreSaveCheckpoint(input);
  if (input.modelSettings) {
    await saveModelSettings(input.modelSettings);
  }
  if (input.prompts?.length) {
    for (const prompt of input.prompts) {
      await savePromptContent(prompt.version, prompt.content);
    }
  }

  return getEditableQualitySettings();
}

export async function listQualityCheckpoints(): Promise<QualityCheckpoint[]> {
  const [tags, commits] = await Promise.all([
    runGitLines(["tag", "--list", "stable-*", "--sort=-creatordate"]),
    runGitLines(["log", "--format=%h%x09%s", "-20"]),
  ]);
  const checkpointTags = await Promise.all(
    tags.map(async (ref) => {
      const subject = (await runGitLines(["log", "-1", "--format=%s", ref]))[0] || "";
      return { type: "tag" as const, ref, subject, label: `${ref} | ${subject}` };
    }),
  );
  const checkpointCommits = commits
    .map((line): QualityCheckpoint | null => {
      const [ref, ...subjectParts] = line.split("\t");
      const subject = subjectParts.join("\t");
      return ref && subject ? { type: "commit" as const, ref, subject, label: `${ref} ${subject}` } : null;
    })
    .filter((item): item is QualityCheckpoint => Boolean(item));
  return [...checkpointTags, ...checkpointCommits];
}

export async function previewQualityCheckpointRestore(ref: string): Promise<RestoreCheckpointPreview> {
  const checkpoint = await getAllowedCheckpoint(ref);
  return {
    ref: checkpoint.ref,
    subject: checkpoint.subject,
    changedFiles: await runGitLines(["diff", "--name-status", checkpoint.ref, "--", "."]),
  };
}

export async function restoreQualityCheckpoint(ref: string): Promise<RestoreCheckpointPreview> {
  if (!isQualityConsoleEnabled()) {
    throw new QualityConsoleError(403, "质量保障控制台未启用。请配置 GAOKAO_QUALITY_CONSOLE_ENABLED=true。");
  }
  if (activeRunId) {
    throw new QualityConsoleError(409, "质量任务正在运行，不能恢复历史节点。");
  }
  const checkpoint = await getAllowedCheckpoint(ref);
  await createPreSaveCheckpoint({});
  const exitCode = await runGitCommand(["restore", "--source", checkpoint.ref, "--", "."]);
  if (exitCode !== 0) {
    throw new QualityConsoleError(500, "恢复历史节点失败。");
  }
  return previewQualityCheckpointRestore(checkpoint.ref);
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

async function getModelSettings(): Promise<QualityModelSettings> {
  const env = await readBackendEnvSnapshot();
  const providerOrder = readConfigValue(env, "LLM_PROVIDER_ORDER", "mock_deepseek,mock_qwen,mock_doubao");
  const freeModel = readConfigValue(env, "TENCENT_TOKENHUB_FREE_MODEL", "deepseek-v4-flash");
  return {
    environment: readConfigValue(env, "ENVIRONMENT", "development"),
    llmProviderOrder: providerOrder,
    tencentTokenhubBaseUrl: readConfigValue(env, "TENCENT_TOKENHUB_BASE_URL", "https://tokenhub.tencentmaas.com/v1"),
    tencentTokenhubFreeModel: freeModel,
    tencentTokenhubPaidModel: readConfigValue(env, "TENCENT_TOKENHUB_PAID_MODEL", "deepseek-v4-pro"),
    tencentTokenhubFallbackModel: readConfigValue(env, "TENCENT_TOKENHUB_FALLBACK_MODEL", "deepseek-v4-flash"),
    supportChatLlmEnabled: readConfigValue(env, "SUPPORT_CHAT_LLM_ENABLED", "false"),
    supportChatModel: freeModel,
    configSources: env.sources,
  };
}

async function getPromptSettings(): Promise<QualityPromptSettings> {
  return {
    defaultPromptVersion: "gaokao_default",
    batchPromptA: "gaokao_default",
    batchPromptB: "gaokao_experiment",
    prompts: await Promise.all([
      getPromptInfo("gaokao_default", "生产默认 Prompt"),
      getPromptInfo("gaokao_experiment", "实验对照 Prompt"),
    ]),
  };
}

async function getPromptInfo(version: string, label: string): Promise<QualityPromptFileInfo> {
  const filePath = path.join(promptsDir, `${version}.md`);
  try {
    const [content, info] = await Promise.all([readFile(filePath, "utf-8"), stat(filePath)]);
    return {
      version,
      label,
      filePath,
      exists: true,
      sizeBytes: info.size,
      updatedAt: info.mtime.toISOString(),
      sha256: createHash("sha256").update(content).digest("hex").slice(0, 16),
      preview: content.replace(/\s+/g, " ").trim().slice(0, 180),
    };
  } catch {
    return {
      version,
      label,
      filePath,
      exists: false,
      sizeBytes: null,
      updatedAt: null,
      sha256: null,
      preview: "",
    };
  }
}

async function saveModelSettings(settings: SaveQualitySettingsInput["modelSettings"]) {
  if (!settings) return;
  const nextValues: Record<string, string> = {};
  if (settings.environment !== undefined) nextValues.ENVIRONMENT = normalizeShortValue(settings.environment, "ENVIRONMENT");
  if (settings.llmProviderOrder !== undefined) nextValues.LLM_PROVIDER_ORDER = normalizeProviderOrder(settings.llmProviderOrder);
  if (settings.tencentTokenhubBaseUrl !== undefined) nextValues.TENCENT_TOKENHUB_BASE_URL = normalizeUrl(settings.tencentTokenhubBaseUrl, "TENCENT_TOKENHUB_BASE_URL");
  if (settings.tencentTokenhubFreeModel !== undefined) nextValues.TENCENT_TOKENHUB_FREE_MODEL = normalizeModelName(settings.tencentTokenhubFreeModel, "TENCENT_TOKENHUB_FREE_MODEL");
  if (settings.tencentTokenhubPaidModel !== undefined) nextValues.TENCENT_TOKENHUB_PAID_MODEL = normalizeModelName(settings.tencentTokenhubPaidModel, "TENCENT_TOKENHUB_PAID_MODEL");
  if (settings.tencentTokenhubFallbackModel !== undefined) nextValues.TENCENT_TOKENHUB_FALLBACK_MODEL = normalizeModelName(settings.tencentTokenhubFallbackModel, "TENCENT_TOKENHUB_FALLBACK_MODEL");
  if (settings.supportChatLlmEnabled !== undefined) nextValues.SUPPORT_CHAT_LLM_ENABLED = normalizeBooleanString(settings.supportChatLlmEnabled, "SUPPORT_CHAT_LLM_ENABLED");

  await updateDotEnvFile(editableBackendEnvPath, nextValues);
}

async function savePromptContent(version: string, content: string) {
  const safeVersion = PathSafePromptVersion.parse(version);
  const normalized = String(content || "").trim();
  if (normalized.length < 200) {
    throw new QualityConsoleError(400, `${safeVersion} 内容过短，拒绝保存。`);
  }
  if (normalized.length > 20000) {
    throw new QualityConsoleError(400, `${safeVersion} 内容过长，拒绝保存。`);
  }
  await writeFile(path.join(promptsDir, `${safeVersion}.md`), `${normalized}\n`, "utf-8");
}

async function createPreSaveCheckpoint(input: SaveQualitySettingsInput) {
  const labels = [
    input.modelSettings ? "model" : null,
    input.prompts?.length ? `prompt-${input.prompts.map((prompt) => prompt.version).join("-")}` : null,
  ].filter(Boolean);
  const message = `checkpoint: before quality settings ${labels.join("-") || "update"}`;
  const isWindows = process.platform === "win32";
  const command = isWindows
    ? {
        cmd: "powershell.exe",
        args: ["-ExecutionPolicy", "Bypass", "-File", ".\\保存当前版本.ps1", "-Message", message],
      }
    : {
        cmd: "bash",
        args: ["-lc", `git add -A && if git diff --cached --quiet; then echo "No staged changes"; else git commit -m "${message}"; fi && git log -1 --oneline`],
      };
  const exitCode = await runCheckpointCommand(command.cmd, command.args);
  if (exitCode !== 0) {
    throw new QualityConsoleError(500, "自动保存修改前节点失败，已取消本次设置保存。");
  }
}

function runCheckpointCommand(cmd: string, args: string[]) {
  return new Promise<number>((resolve) => {
    const child = spawn(cmd, args, {
      cwd: rootDir,
      env: process.env,
      shell: false,
      windowsHide: true,
    });
    child.on("error", () => resolve(1));
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function getAllowedCheckpoint(ref: string) {
  const normalized = String(ref || "").trim();
  const checkpoints = await listQualityCheckpoints();
  const checkpoint = checkpoints.find((item) => item.ref === normalized);
  if (!checkpoint) {
    throw new QualityConsoleError(400, "只允许恢复控制台列出的历史节点。");
  }
  const verifyExitCode = await runGitCommand(["rev-parse", "--verify", `${checkpoint.ref}^{commit}`]);
  if (verifyExitCode !== 0) {
    throw new QualityConsoleError(400, "历史节点不存在或不可恢复。");
  }
  return checkpoint;
}

function runGitLines(args: string[]) {
  return new Promise<string[]>((resolve) => {
    const child = spawn("git", args, { cwd: rootDir, windowsHide: true });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += String(chunk);
    });
    child.on("close", () => resolve(output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)));
    child.on("error", () => resolve([]));
  });
}

function runGitCommand(args: string[]) {
  return new Promise<number>((resolve) => {
    const child = spawn("git", args, { cwd: rootDir, windowsHide: true });
    child.on("error", () => resolve(1));
    child.on("close", (code) => resolve(code ?? 1));
  });
}

const PathSafePromptVersion = {
  parse(value: string) {
    const version = String(value || "").trim();
    if (!["gaokao_default", "gaokao_experiment"].includes(version)) {
      throw new QualityConsoleError(400, "只允许编辑 gaokao_default 或 gaokao_experiment。");
    }
    return version;
  },
};

async function updateDotEnvFile(filePath: string, updates: Record<string, string>) {
  let original = "";
  try {
    original = await readFile(filePath, "utf-8");
  } catch {
    original = "# Local editable Gaokao quality console model settings.\n";
  }
  const remaining = new Set(Object.keys(updates));
  const lines = original.split(/\r?\n/).map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!match || !(match[1] in updates)) return line;
    remaining.delete(match[1]);
    return `${match[1]}=${formatDotEnvValue(updates[match[1]])}`;
  });
  if (remaining.size) {
    if (lines.length && lines[lines.length - 1].trim() !== "") lines.push("");
    lines.push("# Editable from /admin/gaokao-essay quality gate.");
    for (const key of remaining) {
      lines.push(`${key}=${formatDotEnvValue(updates[key])}`);
    }
  }
  await writeFile(filePath, `${lines.join("\n").replace(/\n+$/g, "")}\n`, "utf-8");
}

function formatDotEnvValue(value: string) {
  if (/^[A-Za-z0-9_./:@,-]+$/.test(value)) return value;
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function normalizeShortValue(value: unknown, label: string) {
  const text = String(value || "").trim();
  if (!text || text.length > 80) throw new QualityConsoleError(400, `${label} 不合法。`);
  return text;
}

function normalizeProviderOrder(value: unknown) {
  const text = normalizeShortValue(value, "LLM_PROVIDER_ORDER");
  const providers = text.split(",").map((item) => item.trim()).filter(Boolean);
  const allowed = new Set(["tencent_tokenhub", "deepseek", "qwen", "doubao", "mock_deepseek", "mock_qwen", "mock_doubao"]);
  if (!providers.length || providers.some((provider) => !allowed.has(provider))) {
    throw new QualityConsoleError(400, "LLM_PROVIDER_ORDER 包含不支持的 provider。");
  }
  return providers.join(",");
}

function normalizeUrl(value: unknown, label: string) {
  const text = String(value || "").trim();
  if (!/^https?:\/\/[^\s]+$/.test(text)) throw new QualityConsoleError(400, `${label} 必须是 http/https URL。`);
  return text;
}

function normalizeModelName(value: unknown, label: string) {
  const text = String(value || "").trim();
  if (!/^[A-Za-z0-9._:/-]{2,120}$/.test(text)) throw new QualityConsoleError(400, `${label} 模型名不合法。`);
  return text;
}

function normalizeBooleanString(value: unknown, label: string) {
  const text = String(value || "").trim().toLowerCase();
  if (!["true", "false"].includes(text)) throw new QualityConsoleError(400, `${label} 只能是 true 或 false。`);
  return text;
}

async function readBackendEnvSnapshot() {
  const sources: string[] = ["Next.js process.env"];
  const values: Record<string, string> = {};
  const candidates = [path.join(backendDir, ".env"), path.join(backendDir, ".env.local-deepseek")];
  for (const filePath of candidates) {
    try {
      const text = await readFile(filePath, "utf-8");
      Object.assign(values, parseDotEnv(text));
      sources.push(filePath);
    } catch {
      // Optional local files are allowed to be missing.
    }
  }
  return { values, sources };
}

function readConfigValue(env: { values: Record<string, string> }, key: string, fallback: string) {
  return process.env[key] || env.values[key] || fallback;
}

function parseDotEnv(text: string) {
  const values: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
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
