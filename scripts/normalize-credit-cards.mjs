import fs from "node:fs/promises";
import path from "node:path";

const NORMALIZED_OUTPUT_PATH = path.resolve(process.cwd(), "data", "cards.json");
const PRIMARY_RAW_PATH = path.resolve(process.cwd(), "data", "cards.raw.json");
const LEGACY_RAW_PATH = path.resolve(process.cwd(), "data", "credit-cards.raw.json");

const normalizeText = (value = "") =>
  String(value)
    .replace(/â‚¹/g, "₹")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function unique(values) {
  return [...new Set((values || []).map((value) => normalizeText(value)).filter(Boolean))];
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readSourceText(card) {
  return normalizeText([
    card.cardName,
    card.pageSummary,
    card.contentText || "",
    card.structuredFacts?.contentText || "",
    ...(card.publicHighlights || []),
    ...(card.keyHighlights || []),
    ...(card.eligibilityHints || []),
    ...(card.networkHints || []),
    ...(card.evidenceSnippets || []),
    ...(card.joiningAndAnnualFeeText || []),
    ...(card.monetaryMentions || []),
    card.structuredFacts?.summary || "",
    card.structuredFacts?.metaDescription || "",
    card.structuredFacts?.ogDescription || "",
    ...(card.structuredFacts?.feeLines || []),
    ...(card.structuredFacts?.benefitLines || []),
    ...(card.structuredFacts?.eligibilityLines || []),
    ...(card.structuredFacts?.networkLines || []),
    ...(card.structuredFacts?.jsonLdText || []),
    ...(card.structuredFacts?.faqPairs || []).flatMap((pair) => [pair.question, pair.answer]),
    ...(card.structuredFacts?.tables || []).flatMap((table) => table.flat()),
  ].join(". "));
}

function parseMoneyValue(input) {
  const text = normalizeText(input).toLowerCase();
  if (!text) return null;
  if (/\b(free|nil|zero|waived|no annual fee|lifetime free)\b/.test(text)) return 0;

  const match = text.match(/(?:₹|rs\.?|inr)\s*([\d,.]+)\s*(k|l|lac|lakh|m)?/i) || text.match(/([\d,.]+)\s*(k|l|lac|lakh|m)\b/i);
  if (!match) return null;

  const numeric = Number.parseFloat((match[1] || "").replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;

  const unit = (match[2] || "").toLowerCase();
  if (unit === "k") return Math.round(numeric * 1000);
  if (unit === "l" || unit === "lac" || unit === "lakh") return Math.round(numeric * 100000);
  if (unit === "m") return Math.round(numeric * 1000000);
  return Math.round(numeric);
}

function findMoneyFromLines(lines, regex) {
  for (const line of lines) {
    if (!regex.test(normalizeText(line).toLowerCase())) continue;
    const value = parseMoneyValue(line);
    if (value !== null) return value;
  }
  return null;
}

function extractTextMatch(lines, regex) {
  return lines.find((line) => regex.test(normalizeText(line).toLowerCase())) || "";
}

function deriveNetwork(card, text) {
  const haystack = normalizeText([
    card.networkHints || [],
    card.structuredFacts?.networkLines || [],
    text,
  ].flat().join(" ")).toLowerCase();
  if (haystack.includes("visa")) return "Visa";
  if (haystack.includes("mastercard")) return "Mastercard";
  if (haystack.includes("rupay")) return "RuPay";
  if (haystack.includes("amex") || haystack.includes("american express")) return "American Express";
  return "";
}

function deriveRewardRateText(card, text) {
  const candidates = [
    ...((card.structuredFacts?.benefitLines || [])),
    ...(card.keyHighlights || []),
    ...(card.publicHighlights || []),
    ...(card.evidenceSnippets || []),
  ].map(normalizeText);

  const rateLine =
    candidates.find((line) => /(?:\d+(?:\.\d+)?%|\d+\s*pts?|points?|miles?|cashback)/i.test(line)) ||
    extractTextMatch(candidates, /(cashback|points|miles|rewards)/i) ||
    extractTextMatch([text], /(cashback|points|miles|rewards)/i);

  return normalizeText(rateLine);
}

function deriveSpendCategories(text, tags) {
  const corpus = normalizeText([text, ...(tags || [])].join(" ")).toLowerCase();
  const categories = {
    online: 0,
    dining: 0,
    travel: 0,
    groceries: 0,
    fuel: 0,
    entertainment: 0,
    shopping: 0,
  };

  const score = (key, value) => {
    categories[key] = Math.max(categories[key], value);
  };

  if (/(amazon|flipkart|shopping|e-commerce|online|cashback|wallet|myntra|ajio|nykaa)/.test(corpus)) score("online", 5);
  if (/(amazon|flipkart|shopping|cashback)/.test(corpus)) score("shopping", 4);
  if (/(dining|restaurant|food|swiggy|zomato|caf[eé]|delivery)/.test(corpus)) score("dining", 5);
  if (/(travel|flight|airport|lounge|miles|irctc|rail|hotel)/.test(corpus)) score("travel", 5);
  if (/(grocery|groceries|supermarket|mart|daily essentials)/.test(corpus)) score("groceries", 4);
  if (/(fuel|petrol|diesel|petrol pump|surcharge waiver)/.test(corpus)) score("fuel", 5);
  if (/(movie|movies|entertainment|bookmyshow|ott|streaming)/.test(corpus)) score("entertainment", 4);

  if (!Object.values(categories).some(Boolean)) {
    if (/(rewards|cashback|benefits)/.test(corpus)) score("online", 2);
  }

  return categories;
}

function deriveBestFor(tags, spendCategories, text) {
  const result = unique(tags);
  const categoryLabels = {
    online: "online shopping",
    dining: "dining",
    travel: "travel",
    groceries: "groceries",
    fuel: "fuel",
    entertainment: "entertainment",
    shopping: "shopping",
  };

  for (const [category, score] of Object.entries(spendCategories || {})) {
    if (score >= 4 && categoryLabels[category]) result.push(categoryLabels[category]);
  }

  const corpus = normalizeText(text).toLowerCase();
  if (/(cashback|cash back)/.test(corpus)) result.push("cashback");
  if (/(lounge|travel|air|airport|miles)/.test(corpus)) result.push("travel perks");
  if (/(fuel|petrol|diesel)/.test(corpus)) result.push("fuel benefits");
  if (/(reward points?|points?|miles?)/.test(corpus)) result.push("rewards");

  return unique(result).slice(0, 10);
}

function deriveTier(card, fee, text) {
  const corpus = normalizeText([text, card.cardName].join(" ")).toLowerCase();
  if (fee === 0 && /(lifetime free|free)/.test(corpus)) return "entry";
  if (fee !== null && fee <= 500) return "entry";
  if (fee !== null && fee <= 1500) return "mid";
  if (fee !== null && fee <= 4999) return /lounge|travel|premium/.test(corpus) ? "premium" : "mid";
  return "super-premium";
}

function pickHighlights(card, text) {
  return unique([
    ...(card.keyHighlights || []),
    ...(card.publicHighlights || []),
    ...(card.structuredFacts?.benefitLines || []),
    ...(card.structuredFacts?.faqPairs || []).flatMap((pair) => [pair.question, pair.answer]),
  ])
    .filter((line) => line.length > 0)
    .slice(0, 12);
}

function deriveEligibilityHints(card, text) {
  const hints = unique([
    ...(card.eligibilityHints || []),
    ...(card.structuredFacts?.eligibilityLines || []),
  ]);
  const lines = normalizeText(text)
    .split(/(?<=[.?!])\s+/)
    .map((line) => normalizeText(line))
    .filter(Boolean);

  for (const line of lines) {
    if (/(eligible|eligibility|income|salary|cibil|credit score|salaried|self-employed|resident|kyc|age|document)/i.test(line)) {
      hints.push(line);
    }
  }

  return unique(hints).slice(0, 20);
}

function deriveDocumentsRequired(card, text) {
  const docs = [];
  const lines = [
    ...(card.documentsRequired || []),
    ...(card.structuredFacts?.faqPairs || []).map((pair) => `${pair.question} ${pair.answer}`),
    ...(card.structuredFacts?.evidenceLines || []),
    ...normalizeText(text)
      .split(/(?<=[.?!])\s+/)
      .map((line) => normalizeText(line))
      .filter(Boolean),
  ];

  for (const line of lines) {
    if (/(document|documents|kyc|proof|identity|address|income|pan|aadhaar|passport|salary slip|bank statement)/i.test(line)) {
      docs.push(line);
    }
  }

  return unique(docs).slice(0, 12);
}

function deriveMonetaryMentions(text, card) {
  return unique([
    ...(card.monetaryMentions || []),
    ...((text.match(/(?:₹\s?[\d,]+(?:\.\d+)?(?:\s?(?:lakh|lac|k|m))?|rs\.?\s?[\d,]+|inr\s?[\d,]+|[\d,]+%|free|nil|zero)/gi) || [])),
  ]).slice(0, 20);
}

function buildNormalizedCard(card) {
  const text = readSourceText(card);
  const sourceFeeLines = unique([
    ...(card.joiningAndAnnualFeeText || []),
    ...(card.structuredFacts?.feeLines || []),
  ]);
  const eligibilityLines = unique([
    ...(card.eligibilityHints || []),
    ...(card.structuredFacts?.eligibilityLines || []),
  ]);
  const feeLines = unique(sourceFeeLines);

  const annualFee =
    findMoneyFromLines(feeLines, /(annual|renewal|membership)/i) ??
    findMoneyFromLines(feeLines, /fee/i) ??
    parseMoneyValue(extractTextMatch(feeLines, /(annual|renewal|membership)/i));

  const joiningFee =
    findMoneyFromLines(feeLines, /(joining|welcome|one-time|acquisition)/i) ??
    parseMoneyValue(extractTextMatch(feeLines, /(joining|welcome|one-time|acquisition)/i));

  const feeWaiverSpend =
    findMoneyFromLines(feeLines, /(waiver|reversal|spend|waived)/i) ??
    parseMoneyValue(extractTextMatch(feeLines, /(waiver|reversal|spend|waived)/i));

  const minIncome =
    findMoneyFromLines(eligibilityLines, /(income|salary|annual income|monthly income)/i) ??
    parseMoneyValue(extractTextMatch(eligibilityLines, /(income|salary|annual income|monthly income)/i));

  const spendCategories = deriveSpendCategories(text, [...(card.bestForTags || []), ...(card.structuredFacts?.bestForTags || [])]);
  const network = deriveNetwork(card, text);
  const rewardRateText = deriveRewardRateText(card, text);
  const cashback = /cash\s*back|cashback/i.test(text);
  const rewardPoints = /(reward points?|points?|miles?)/i.test(text) && !cashback;
  const loungeDomestic = /(domestic lounge|airport lounge|lounge access|domestic airport lounge)/i.test(text);
  const loungeInternational = /(international lounge|global lounge|intl lounge|visa airport companion|priority pass)/i.test(text);
  const loungeDomesticCount = normalizeText((text.match(/(\d+)\s*(?:domestic|airport)?\s*lounge/gi) || [])[0] || "");
  const loungeInternationalCount = normalizeText((text.match(/(\d+)\s*(?:international|intl)\s*lounge/gi) || [])[0] || "");
  const forexMarkupMatch = text.match(/(?:forex|foreign exchange|markup|transaction fee)[^?%]{0,40}(\d+(?:\.\d+)?)\s*%/i) || text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:forex|markup|foreign exchange|transaction fee)/i);
  const forexMarkup = forexMarkupMatch ? Number.parseFloat(forexMarkupMatch[1]) : null;
  const fuelSurchargeWaiver = /fuel surcharge waiver/i.test(text);
  const bestForTags = deriveBestFor(
    [...(card.bestForTags || []), ...(card.structuredFacts?.bestForTags || [])],
    spendCategories,
    text
  );
  const keyHighlights = unique([
    ...(card.keyHighlights || []),
    ...(card.publicHighlights || []),
    ...(card.structuredFacts?.benefitLines || []),
    ...(card.structuredFacts?.faqPairs || []).flatMap((pair) => [pair.question, pair.answer]),
  ]).slice(0, 16);
  const eligibilityHints = deriveEligibilityHints(card, text);
  const documentsRequired = deriveDocumentsRequired(card, text);
  const monetaryMentions = deriveMonetaryMentions(text, card);
  const joiningBonus = normalizeText(
    extractTextMatch(
      [
        ...(card.keyHighlights || []),
        ...(card.publicHighlights || []),
        ...(card.evidenceSnippets || []),
        ...(card.structuredFacts?.benefitLines || []),
      ],
      /(welcome|joining|bonus|benefit|voucher|reward)/i
    )
  );

  return {
    slug: slugify(`${card.issuer}-${card.cardName}`),
    issuer: card.issuer,
    bank: card.issuer,
    cardName: card.cardName,
    cardType: card.cardType || "unknown",
    network,
    annualFee: annualFee ?? null,
    joiningFee: joiningFee ?? null,
    feeWaiverSpend: feeWaiverSpend ?? null,
    minIncome: minIncome ?? null,
    rewardRateText,
    cashback,
    rewardPoints,
    loungeDomestic,
    loungeDomesticCount: loungeDomesticCount || "",
    loungeInternational,
    loungeInternationalCount: loungeInternationalCount || "",
    forexMarkup,
    fuelSurchargeWaiver,
    spendCategories,
    joiningBonus,
    highlights: pickHighlights(card, text),
    bestFor: bestForTags,
    bestForTags,
    applyUrl: card.sourceUrl,
    tier: card.tier || deriveTier(card, annualFee, text),
    lastScraped: card.scrapedAt || "",
    sourceUrl: card.sourceUrl,
    detailUrl: card.detailUrl || card.sourceUrl,
    sourcePage: card.sourcePage || "",
    pageSummary: card.pageSummary || "",
    publicHighlights: card.publicHighlights || [],
    keyHighlights,
    eligibilityHints,
    documentsRequired,
    monetaryMentions,
    networkHints: card.networkHints || [],
    evidenceSnippets: card.evidenceSnippets || [],
    faqPairs: card.faqPairs || [],
    tables: card.tables || [],
    jsonLdTypes: card.jsonLdTypes || [],
    relatedSources: card.relatedSources || [],
    structuredFacts: card.structuredFacts || {},
    rawRecord: card,
    disclaimer: card.disclaimer || "Public webpage metadata only. Verify all details on issuer website before use.",
  };
}

async function main() {
  let rawPayload = null;

  for (const filePath of [PRIMARY_RAW_PATH, LEGACY_RAW_PATH]) {
    try {
      const contents = await fs.readFile(filePath, "utf8");
      rawPayload = JSON.parse(contents);
      break;
    } catch {
      // keep trying fallback paths
    }
  }

  if (!rawPayload || !Array.isArray(rawPayload.cards)) {
    throw new Error(`Could not read scraped cards from ${PRIMARY_RAW_PATH} or ${LEGACY_RAW_PATH}`);
  }

  const cards = rawPayload.cards.map(buildNormalizedCard).sort((a, b) => a.issuer.localeCompare(b.issuer) || a.cardName.localeCompare(b.cardName));

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceGeneratedAt: rawPayload.generatedAt || "",
    totalCards: cards.length,
    cards,
  };

  await fs.mkdir(path.dirname(NORMALIZED_OUTPUT_PATH), { recursive: true });
  await fs.writeFile(NORMALIZED_OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8");

  console.log(`Saved ${payload.totalCards} normalized cards to ${NORMALIZED_OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
