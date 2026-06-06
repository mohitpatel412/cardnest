const DEFAULT_DOCUMENT_KEYWORDS = [
  "mitc",
  "terms",
  "conditions",
  "fees",
  "charges",
  "reward",
  "lounge",
  "faq",
  "benefits",
  "guide",
  "brochure",
];

const DEFAULT_API_PATTERNS = [
  /\/api\//i,
  /graphql/i,
  /\.json(?:$|[?#])/i,
];

export const ISSUER_CATALOG = [
  {
    issuerId: "sbi",
    issuerName: "SBI Card",
    strategy: "fetch",
    seeds: [
      { url: "https://www.sbicard.com/en/personal/credit-cards.html", sourceType: "listing_page" },
    ],
    allowedDomains: ["www.sbicard.com", "sbicard.com"],
    detailUrlPatterns: [/\/personal\/credit-cards\//i, /\/credit-cards\//i],
    supplementalPathPatterns: [/faq/i, /fees?/i, /charges?/i, /reward/i, /lounge/i, /terms?/i, /mitc/i],
    documentKeywords: DEFAULT_DOCUMENT_KEYWORDS,
    apiEndpointPatterns: DEFAULT_API_PATTERNS,
  },
  {
    issuerId: "hdfc",
    issuerName: "HDFC Bank",
    strategy: "fetch",
    seeds: [
      { url: "https://www.hdfcbank.com/personal/pay/cards/credit-cards", sourceType: "listing_page" },
    ],
    allowedDomains: ["www.hdfcbank.com", "hdfcbank.com"],
    detailUrlPatterns: [/\/credit-cards\//i, /\/cards\/credit-cards\//i],
    supplementalPathPatterns: [/faq/i, /fees?/i, /charges?/i, /reward/i, /lounge/i, /terms?/i, /mitc/i],
    documentKeywords: DEFAULT_DOCUMENT_KEYWORDS,
    apiEndpointPatterns: DEFAULT_API_PATTERNS,
  },
  {
    issuerId: "icici",
    issuerName: "ICICI Bank",
    strategy: "fetch",
    seeds: [
      { url: "https://www.icicibank.com/personal-banking/cards/credit-card", sourceType: "listing_page" },
    ],
    allowedDomains: ["www.icicibank.com", "icicibank.com"],
    detailUrlPatterns: [/\/credit-card/i, /\/cards\/credit-card/i],
    supplementalPathPatterns: [/faq/i, /fees?/i, /charges?/i, /reward/i, /lounge/i, /terms?/i, /mitc/i],
    documentKeywords: DEFAULT_DOCUMENT_KEYWORDS,
    apiEndpointPatterns: DEFAULT_API_PATTERNS,
  },
  {
    issuerId: "axis",
    issuerName: "Axis Bank",
    strategy: "fetch",
    seeds: [
      { url: "https://www.axisbank.com/retail/cards/credit-card", sourceType: "listing_page" },
    ],
    allowedDomains: ["www.axisbank.com", "axisbank.com"],
    detailUrlPatterns: [/\/cards\/credit-card\//i, /commercial-credit-card/i],
    supplementalPathPatterns: [/faq/i, /fees?/i, /charges?/i, /reward/i, /lounge/i, /terms?/i, /mitc/i],
    documentKeywords: DEFAULT_DOCUMENT_KEYWORDS,
    apiEndpointPatterns: DEFAULT_API_PATTERNS,
  },
  {
    issuerId: "kotak",
    issuerName: "Kotak Mahindra Bank",
    strategy: "fetch",
    seeds: [
      { url: "https://www.kotak.com/en/personal-banking/cards/credit-cards.html", sourceType: "listing_page" },
    ],
    allowedDomains: ["www.kotak.com", "kotak.com"],
    detailUrlPatterns: [/credit-cards/i, /card-details/i],
    supplementalPathPatterns: [/faq/i, /fees?/i, /charges?/i, /reward/i, /lounge/i, /terms?/i, /mitc/i],
    documentKeywords: DEFAULT_DOCUMENT_KEYWORDS,
    apiEndpointPatterns: DEFAULT_API_PATTERNS,
  },
];

export function filterIssuersByEnv(issuerCatalog, rawValue) {
  const needles = String(rawValue || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!needles.length) return issuerCatalog;

  return issuerCatalog.filter((issuer) =>
    needles.some((needle) =>
      issuer.issuerId.includes(needle) || issuer.issuerName.toLowerCase().includes(needle)
    )
  );
}
