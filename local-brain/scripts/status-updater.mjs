import fs from "fs";
import path from "path";

const statusDir = path.resolve("local-brain/status");
const examplePath = path.join(statusDir, "pipeline.example.json");
const runtimePath = path.join(statusDir, "pipeline.runtime.json");

const initialStatus = {
  updatedAt: null,
  isRunning: false,
  currentStep: null,
  lock: null,
  articles: {},
  log: [],
};

function ensureStatusDir() {
  fs.mkdirSync(statusDir, { recursive: true });
}

function parseJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function cloneInitialStatus() {
  return JSON.parse(JSON.stringify(initialStatus));
}

export function getRuntimeStatusPath() {
  return runtimePath;
}

export function readStatus() {
  ensureStatusDir();

  if (fs.existsSync(runtimePath)) {
    const runtime = parseJsonFile(runtimePath);
    if (runtime) return runtime;

    const backupPath = path.join(statusDir, `pipeline.runtime.corrupt-${Date.now()}.json`);
    fs.copyFileSync(runtimePath, backupPath);
  }

  if (fs.existsSync(examplePath)) {
    const template = parseJsonFile(examplePath);
    if (template) {
      writeStatus(template);
      return template;
    }
  }

  const initial = cloneInitialStatus();
  writeStatus(initial);
  return initial;
}

export function writeStatus(status) {
  ensureStatusDir();
  status.updatedAt = new Date().toISOString();
  const payload = JSON.stringify(status, null, 2);
  const tmpPath = `${runtimePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, payload, "utf-8");
  fs.renameSync(tmpPath, runtimePath);
}

export function withStatus(mutator) {
  const status = readStatus();
  mutator(status);
  writeStatus(status);
  return status;
}

export function appendLog(step, message, slug = null) {
  return withStatus((status) => {
    status.log = Array.isArray(status.log) ? status.log.slice(-199) : [];
    status.log.push({
      time: new Date().toISOString(),
      step: String(step || "system"),
      slug,
      message: String(message || ""),
    });
  });
}

export function setRunning(step, pid = null) {
  return withStatus((status) => {
    status.isRunning = true;
    status.currentStep = step;
    status.lock = {
      pid,
      step,
      startedAt: new Date().toISOString(),
    };
    if (!status.articles || typeof status.articles !== "object") status.articles = {};
  });
}

export function setIdle() {
  return withStatus((status) => {
    status.isRunning = false;
    status.currentStep = null;
    status.lock = null;
    if (!status.articles || typeof status.articles !== "object") status.articles = {};
  });
}

export function updateArticleStage(slug, stage, extra = {}) {
  return withStatus((status) => {
    if (!status.articles || typeof status.articles !== "object") status.articles = {};
    const current = status.articles[slug] ?? {
      slug,
      stage: "pending",
      errors: [],
    };

    status.articles[slug] = {
      ...current,
      ...extra,
      slug,
      stage,
    };
  });
}
