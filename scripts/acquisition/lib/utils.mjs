export const REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; CardNestAcquisitionBot/3.0; +https://github.com/mohitpatel412/cardnest)",
  "Accept-Language": "en-IN,en;q=0.9",
};

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeText(value = "") {
  return String(value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function slugify(value = "") {
  return normalizeText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toAbsoluteUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

export function isHttpUrl(value = "") {
  return /^https?:\/\//i.test(value);
}

export function uniqueBy(items, keyFn) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

export function chunk(items, size) {
  const groups = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

export async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runNext() {
    const index = cursor++;
    if (index >= items.length) return;
    results[index] = await worker(items[index], index);
    return runNext();
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runNext()));
  return results;
}

export function getFileExtensionFromContentType(contentType = "") {
  const value = String(contentType).toLowerCase();
  if (value.includes("text/html")) return "html";
  if (value.includes("application/json")) return "json";
  if (value.includes("application/pdf")) return "pdf";
  if (value.includes("text/plain")) return "txt";
  if (value.includes("application/xml") || value.includes("text/xml")) return "xml";
  if (value.includes("javascript")) return "js";
  return "bin";
}

export function isLikelyHtml(contentType = "", url = "") {
  return String(contentType).toLowerCase().includes("text/html") || /\.html?(?:$|[?#])/i.test(url);
}

export function isLikelyJson(contentType = "", url = "") {
  return String(contentType).toLowerCase().includes("application/json") || /\.json(?:$|[?#])/i.test(url);
}

export function isPdfUrl(url = "") {
  return /\.pdf(?:$|[?#])/i.test(url);
}
