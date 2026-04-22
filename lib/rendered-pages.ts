import fs from "node:fs";
import path from "node:path";
type ManifestEntry = {
  Index: number | string;
  Url: string;
  LocalFetchUrl: string;
  File: string;
  Status: number | string;
  ContentType: string;
  Bytes: number | string;
  Title: string;
  Error: string;
};

const contentRoot = path.join(process.cwd(), "content");
const pagesRoot = path.join(contentRoot, "pages");
const manifestPath = path.join(contentRoot, "manifest.json");

let manifestCache: ManifestEntry[] | null = null;
let routeCache: Map<string, ManifestEntry> | null = null;

function getManifest() {
  if (!manifestCache) {
    const raw = fs.readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, "");
    manifestCache = JSON.parse(raw) as ManifestEntry[];
  }

  return manifestCache;
}

function canonicalKeyFromUrl(url: string) {
  const parsed = new URL(url);
  return canonicalKey(parsed.pathname, parsed.searchParams);
}

function canonicalKey(pathname: string, params: URLSearchParams) {
  const entries = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const query = entries.map(([key, value]) => `${key}=${value}`).join("&");
  const cleanPath = pathname || "/";
  return query ? `${cleanPath}?${query}` : cleanPath;
}

function getRouteMap() {
  if (routeCache) return routeCache;

  const map = new Map<string, ManifestEntry>();
  for (const entry of getManifest()) {
    if (!entry.File) continue;

    const bytes = Number(entry.Bytes || 0);
    if (bytes < 500) continue;

    const key = canonicalKeyFromUrl(entry.Url);
    if (!map.has(key)) {
      map.set(key, entry);
    }
  }

  routeCache = map;
  return map;
}

function routeKey(slug: string[] | undefined, searchParams: URLSearchParams) {
  const pathname = slug?.length ? `/${slug.join("/")}` : "/";
  return canonicalKey(pathname, searchParams);
}

export function getPageHtml(slug: string[] | undefined, searchParams: URLSearchParams) {
  const key = routeKey(slug, searchParams);
  const entry = getRouteMap().get(key);

  if (!entry) return null;

  const filePath = path.join(pagesRoot, entry.File.replace(/^pages\//, ""));
  if (!fs.existsSync(filePath)) return null;

  const html = fs.readFileSync(filePath, "utf8");
  return html;
}
