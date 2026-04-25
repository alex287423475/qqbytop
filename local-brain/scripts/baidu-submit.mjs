import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const defaultSite = "https://www.qqbytop.com";
const defaultSitemap = `${defaultSite}/sitemap.xml`;

function loadLocalEnv() {
  const envPath = path.resolve("local-brain/.env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/u);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/gu, "");
  }
}

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function getArgValues(name) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) {
      values.push(process.argv[index + 1]);
    }
  }
  return values;
}

function buildEndpoint() {
  const endpoint = process.env.BAIDU_PUSH_ENDPOINT;
  if (endpoint) return endpoint;

  const site = process.env.BAIDU_SITE || defaultSite;
  const token = process.env.BAIDU_PUSH_TOKEN;
  if (!token) {
    throw new Error("Missing BAIDU_PUSH_ENDPOINT or BAIDU_PUSH_TOKEN. Put it in local-brain/.env.");
  }

  const url = new URL("http://data.zz.baidu.com/urls");
  url.searchParams.set("site", site);
  url.searchParams.set("token", token);
  return url.toString();
}

function getEndpointSite(endpoint) {
  const url = new URL(endpoint);
  return url.searchParams.get("site") || process.env.BAIDU_SITE || defaultSite;
}

function normalizeToSite(urlValue, siteValue) {
  const targetSite = new URL(siteValue);
  const source = new URL(urlValue);
  const targetApex = targetSite.hostname.replace(/^www\./u, "");
  const sourceApex = source.hostname.replace(/^www\./u, "");

  if (sourceApex === targetApex) {
    source.protocol = targetSite.protocol;
    source.hostname = targetSite.hostname;
    source.port = targetSite.port;
  }

  source.hash = "";
  return source.toString();
}

async function readSitemapUrls(sitemapUrl, site) {
  const xml = await fetchText(sitemapUrl);
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/giu)];
  return matches.map((match) => normalizeToSite(match[1].trim(), site));
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "qqbytop-baidu-submit/1.0",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    try {
      return execFileSync("curl.exe", ["-sL", url], {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {
      throw new Error(`Failed to read ${url}: ${error.message}`);
    }
  }
}

async function postUrls(endpoint, urls) {
  const body = urls.join("\n");
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "User-Agent": "qqbytop-baidu-submit/1.0",
      },
      body,
    });
    return {
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  } catch (error) {
    try {
      const text = execFileSync(
        "curl.exe",
        ["-sS", "-X", "POST", "-H", "Content-Type: text/plain", "--data-binary", "@-", endpoint],
        {
          input: body,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
      return { ok: true, status: 200, text };
    } catch {
      throw new Error(`Failed to post URLs: ${error.message}`);
    }
  }
}

function readFileUrls(filePath, site) {
  return fs
    .readFileSync(path.resolve(filePath), "utf-8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => normalizeToSite(url, site));
}

function uniqueUrls(urls, site) {
  const siteOrigin = new URL(site).origin;
  return Array.from(
    new Set(
      urls
        .map((url) => normalizeToSite(url, site))
        .filter((url) => url.startsWith(siteOrigin)),
    ),
  );
}

function redactEndpoint(endpoint) {
  const url = new URL(endpoint);
  if (url.searchParams.has("token")) {
    const token = url.searchParams.get("token") || "";
    const masked = token.length > 8 ? `${token.slice(0, 4)}****${token.slice(-4)}` : "****";
    url.searchParams.set("token", masked);
  }
  return url.toString();
}

async function collectUrls(site) {
  const directUrls = getArgValues("--url");
  const file = getArgValue("--file");
  const sitemap = getArgValue("--sitemap") || defaultSitemap;

  if (directUrls.length > 0) return uniqueUrls(directUrls, site);
  if (file) return uniqueUrls(readFileUrls(file, site), site);
  return uniqueUrls(await readSitemapUrls(sitemap, site), site);
}

async function main() {
  loadLocalEnv();

  const endpoint = buildEndpoint();
  const site = getEndpointSite(endpoint);
  const limitValue = getArgValue("--limit");
  const limit = limitValue ? Number.parseInt(limitValue, 10) : null;
  const dryRun = process.argv.includes("--dry-run");
  let urls = await collectUrls(site);

  if (Number.isInteger(limit) && limit > 0) {
    urls = urls.slice(0, limit);
  }

  if (urls.length === 0) {
    throw new Error("No URLs to submit.");
  }

  console.log(`Baidu endpoint: ${redactEndpoint(endpoint)}`);
  console.log(`Submitting site: ${site}`);
  console.log(`URL count: ${urls.length}`);
  for (const url of urls.slice(0, 10)) console.log(`- ${url}`);
  if (urls.length > 10) console.log(`... and ${urls.length - 10} more`);

  if (dryRun) {
    console.log("Dry run only. Nothing submitted.");
    return;
  }

  const response = await postUrls(endpoint, urls);
  const text = response.text;
  let result = text;
  try {
    result = JSON.parse(text);
  } catch {
    // Keep raw text when Baidu returns non-JSON diagnostics.
  }

  console.log("Baidu response:");
  console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));

  if (!response.ok || (typeof result === "object" && result !== null && "error" in result)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Baidu submit failed: ${error.message}`);
  process.exitCode = 1;
});
