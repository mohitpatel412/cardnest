import { load } from "cheerio";
import { normalizeText, toAbsoluteUrl, uniqueBy } from "./utils.mjs";

function hostnameMatches(url, allowedDomains = []) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function isIgnoredHref(href = "") {
  return !href || /^(#|javascript:|mailto:|tel:)/i.test(href);
}

function classifyPdfSourceType(url = "", text = "") {
  const corpus = `${url} ${text}`.toLowerCase();
  if (corpus.includes("mitc")) return "mitc_pdf";
  if (corpus.includes("lounge")) return "lounge_pdf";
  if (corpus.includes("reward")) return "rewards_pdf";
  if (corpus.includes("faq")) return "faq_pdf";
  if (/(fees?|charges?)/.test(corpus)) return "fees_pdf";
  return "generic_pdf";
}

function classifyHtmlSourceType(url = "", text = "") {
  const corpus = `${url} ${text}`.toLowerCase();
  if (corpus.includes("faq")) return "faq_page";
  if (corpus.includes("lounge")) return "lounge_page";
  if (corpus.includes("reward")) return "rewards_page";
  if (/(fees?|charges?)/.test(corpus)) return "fees_page";
  if (corpus.includes("term") || corpus.includes("condition") || corpus.includes("mitc")) return "terms_page";
  return "detail_page";
}

export function parseHtmlDocument(html) {
  const $ = load(html);
  const title = normalizeText($("title").first().text());
  return { $, title };
}

export function discoverDetailLinks(html, baseUrl, issuer) {
  const { $ } = parseHtmlDocument(html);
  const results = [];

  $("a[href]").each((_, anchor) => {
    const href = normalizeText($(anchor).attr("href") || "");
    if (isIgnoredHref(href)) return;

    const absoluteUrl = toAbsoluteUrl(href, baseUrl);
    if (!absoluteUrl || !hostnameMatches(absoluteUrl, issuer.allowedDomains)) return;

    const text = normalizeText($(anchor).text());
    const matchesPattern = (issuer.detailUrlPatterns || []).some((pattern) => pattern.test(absoluteUrl));
    if (!matchesPattern) return;

    results.push({
      url: absoluteUrl,
      sourceType: "detail_page",
      linkText: text,
    });
  });

  return uniqueBy(results, (item) => item.url);
}

export function discoverPdfLinks(html, baseUrl, issuer) {
  const { $ } = parseHtmlDocument(html);
  const results = [];

  $("a[href]").each((_, anchor) => {
    const href = normalizeText($(anchor).attr("href") || "");
    if (isIgnoredHref(href)) return;

    const absoluteUrl = toAbsoluteUrl(href, baseUrl);
    if (!absoluteUrl || !hostnameMatches(absoluteUrl, issuer.allowedDomains)) return;

    const text = normalizeText($(anchor).text());
    const corpus = `${absoluteUrl} ${text}`.toLowerCase();
    const matchesKeyword = (issuer.documentKeywords || []).some((keyword) => corpus.includes(keyword));
    if (!/\.pdf(?:$|[?#])/i.test(absoluteUrl) && !matchesKeyword) return;

    results.push({
      url: absoluteUrl,
      sourceType: classifyPdfSourceType(absoluteUrl, text),
      linkText: text,
    });
  });

  return uniqueBy(results, (item) => item.url);
}

export function discoverSupplementalHtmlLinks(html, baseUrl, issuer) {
  const { $ } = parseHtmlDocument(html);
  const results = [];

  $("a[href]").each((_, anchor) => {
    const href = normalizeText($(anchor).attr("href") || "");
    if (isIgnoredHref(href)) return;

    const absoluteUrl = toAbsoluteUrl(href, baseUrl);
    if (!absoluteUrl || !hostnameMatches(absoluteUrl, issuer.allowedDomains)) return;
    if (/\.pdf(?:$|[?#])/i.test(absoluteUrl)) return;

    const text = normalizeText($(anchor).text());
    const corpus = `${absoluteUrl} ${text}`.toLowerCase();
    const matchesPattern = (issuer.supplementalPathPatterns || []).some((pattern) => pattern.test(corpus));
    if (!matchesPattern) return;

    results.push({
      url: absoluteUrl,
      sourceType: classifyHtmlSourceType(absoluteUrl, text),
      linkText: text,
    });
  });

  return uniqueBy(results, (item) => item.url);
}

export function discoverApiEndpoints(html, baseUrl, issuer) {
  const results = [];
  const patterns = issuer.apiEndpointPatterns || [];
  const matches = html.match(/https?:\/\/[^\s"'<>]+|\/[A-Za-z0-9/_\-.?=&%]+/g) || [];

  for (const rawMatch of matches) {
    const absoluteUrl = toAbsoluteUrl(rawMatch, baseUrl);
    if (!absoluteUrl || !hostnameMatches(absoluteUrl, issuer.allowedDomains)) continue;
    if (!patterns.some((pattern) => pattern.test(absoluteUrl))) continue;
    results.push({
      url: absoluteUrl,
      sourceType: "api_response",
      linkText: "",
    });
  }

  return uniqueBy(results, (item) => item.url);
}

export function collectPageDiscoveries(html, baseUrl, issuer) {
  const { title } = parseHtmlDocument(html);
  return {
    title,
    detailLinks: discoverDetailLinks(html, baseUrl, issuer),
    pdfLinks: discoverPdfLinks(html, baseUrl, issuer),
    supplementalHtmlLinks: discoverSupplementalHtmlLinks(html, baseUrl, issuer),
    apiEndpoints: discoverApiEndpoints(html, baseUrl, issuer),
  };
}
