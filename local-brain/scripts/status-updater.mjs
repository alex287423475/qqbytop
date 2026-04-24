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

export function getRuntimeStatusPath() {
  return runtimePath;
}

export function readStatus() {
  ensureStatusDir();

  if (fs.existsSync(runtimePath)) {
    return JSON.parse(fs.readFileSync(runtimePath, "utf-8"));
  }

  if (fs.existsSync(examplePath)) {
    const template = JSON.parse(fs.readFileSync(examplePath, "utf-8"));
    fs.writeFileSync(runtimePath, JSON.stringify(template, null, 2));
    return template;
  }

  fs.writeFileSync(runtimePath, JSON.stringify(initialStatus, null, 2));
  return structuredClone(initialStatus);
}

export function writeStatus(status) {
  ensureStatusDir();
  status.updatedAt = new Date().toISOString();
  fs.writeFileSync(runtimePath, JSON.stringify(status, null, 2));
}

export function withStatus(mutator) {
  const status = readStatus();
  mutator(status);
  writeStatus(status);
  return status;
}

export function appendLog(step, message, slug = null) {
  return withStatus((status) => {
    status.log = status.log.slice(-199);
    status.log.push({
      time: new Date().toISOString(),
      step,
      slug,
      message,
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
  });
}

export function setIdle() {
  return withStatus((status) => {
    status.isRunning = false;
    status.currentStep = null;
    status.lock = null;
  });
}

export function updateArticleStage(slug, stage, extra = {}) {
  return withStatus((status) => {
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

