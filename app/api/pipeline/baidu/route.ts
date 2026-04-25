import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const defaultSite = "https://www.qqbytop.com";
const defaultSitemap = `${defaultSite}/sitemap.xml`;

type BaiduSubmitBody = {
  mode?: "single" | "batch" | "sitemap";
  url?: string;
  urls?: string[];
  limit?: number;
};

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), "local-brain", ".env");
  if (!fs.existsSync(envPath)) return {};

  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf-8")
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        if (index < 0) return null;
        const key = line.slice(0, index).trim();
        const value = line
          .slice(index + 1)
          .trim()
          .replace(/^["']|["']$/gu, "");
        return [key, value] as const;
      })
      .filter((entry): entry is readonly [string, string] => Boolean(entry)),
  );
}

function getEnvValue(env: Record<string, string>, key: string) {
  return process.env[key] || env[key] || "";
}

function buildEndpoint(env: Record<string, string>) {
  const endpoint = getEnvValue(env, "BAIDU_PUSH_ENDPOINT");
  if (endpoint) return endpoint;

  const site = getEnvValue(env, "BAIDU_SITE") || defaultSite;
  const token = getEnvValue(env, "BAIDU_PUSH_TOKEN");
  if (!token) return "";

  const url = new URL("http://data.zz.baidu.com/urls");
  url.searchParams.set("site", site);
  url.searchParams.set("token", token);
  return url.toString();
}

function getEndpointSite(endpoint: string) {
  if (!endpoint) return defaultSite;
  const url = new URL(endpoint);
  return url.searchParams.get("site") || defaultSite;
}

function redactEndpoint(endpoint: string) {
  if (!endpoint) return "";
  const url = new URL(endpoint);
  const token = url.searchParams.get("token");
  if (token) {
    url.searchParams.set("token", token.length > 8 ? `${token.slice(0, 4)}****${token.slice(-4)}` : "****");
  }
  return url.toString();
}

function normalizeToSite(urlValue: string, siteValue: string) {
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

function uniqueUrls(urls: string[], site: string) {
  const siteOrigin = new URL(site).origin;
  return Array.from(
    new Set(
      urls
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => normalizeToSite(url, site))
        .filter((url) => url.startsWith(siteOrigin)),
    ),
  );
}

function fetchText(url: string) {
  return execFileSync("curl.exe", ["-sL", url], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function readSitemapUrls(site: string) {
  const xml = fetchText(defaultSitemap);
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/giu)].map((match) => normalizeToSite(match[1].trim(), site));
}

function postUrls(endpoint: string, urls: string[]) {
  const text = execFileSync("curl.exe", ["-sS", "-X", "POST", "-H", "Content-Type: text/plain", "--data-binary", "@-", endpoint], {
    input: urls.join("\n"),
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Pipeline console is disabled in production." }, { status: 403 });
  }

  const env = loadLocalEnv();
  const endpoint = buildEndpoint(env);
  const site = endpoint ? getEndpointSite(endpoint) : getEnvValue(env, "BAIDU_SITE") || defaultSite;

  let sitemapPreview: string[] = [];
  try {
    sitemapPreview = uniqueUrls(readSitemapUrls(site), site).slice(0, 10);
  } catch {
    sitemapPreview = [];
  }

  return NextResponse.json({
    site,
    endpoint: redactEndpoint(endpoint),
    configured: Boolean(endpoint),
    sitemapUrl: defaultSitemap,
    sitemapPreview,
  });
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Pipeline console is disabled in production." }, { status: 403 });
  }

  const env = loadLocalEnv();
  const endpoint = buildEndpoint(env);
  if (!endpoint) {
    return NextResponse.json({ message: "Baidu push endpoint is not configured." }, { status: 400 });
  }

  const site = getEndpointSite(endpoint);
  const body = (await request.json().catch(() => ({}))) as BaiduSubmitBody;
  const mode = body.mode || "single";
  let urls: string[] = [];

  if (mode === "single") {
    urls = body.url ? [body.url] : [];
  } else if (mode === "batch") {
    urls = body.urls || [];
  } else {
    urls = readSitemapUrls(site);
  }

  urls = uniqueUrls(urls, site);

  if (body.limit && body.limit > 0) {
    urls = urls.slice(0, body.limit);
  }

  if (urls.length === 0) {
    return NextResponse.json({ message: "No valid URLs to submit." }, { status: 400 });
  }

  try {
    const result = postUrls(endpoint, urls);
    const hasError = typeof result === "object" && result !== null && "error" in result;
    return NextResponse.json(
      {
        site,
        endpoint: redactEndpoint(endpoint),
        submittedUrls: urls,
        result,
      },
      { status: hasError ? 400 : 200 },
    );
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Baidu submit failed." }, { status: 500 });
  }
}
