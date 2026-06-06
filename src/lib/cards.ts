import fs from "node:fs/promises";
import path from "node:path";

export type CardRecord = {
  slug: string;
  issuer: string;
  bank: string;
  cardName: string;
  cardType: string;
  network: string;
  annualFee: number | null;
  joiningFee: number | null;
  feeWaiverSpend: number | null;
  minIncome: number | null;
  rewardRateText: string;
  cashback: boolean;
  rewardPoints: boolean;
  loungeDomestic: boolean;
  loungeDomesticCount: string;
  loungeInternational: boolean;
  loungeInternationalCount: string;
  forexMarkup: number | null;
  fuelSurchargeWaiver: boolean;
  spendCategories: Record<string, number>;
  joiningBonus: string;
  highlights: string[];
  bestFor: string[];
  bestForTags: string[];
  applyUrl: string;
  tier: string;
  lastScraped: string;
  sourceUrl: string;
  detailUrl: string;
  sourcePage: string;
  pageSummary: string;
  publicHighlights: string[];
  keyHighlights: string[];
  eligibilityHints: string[];
  documentsRequired: unknown[];
  monetaryMentions: string[];
  networkHints: string[];
  evidenceSnippets: string[];
  faqPairs: Array<{ question: string; answer: string }>;
  tables: string[][][];
  jsonLdTypes: string[];
  relatedSources: string[];
  structuredFacts: Record<string, unknown>;
  rawRecord: unknown;
  disclaimer: string;
};

export type CardsPayload = {
  generatedAt: string;
  sourceGeneratedAt?: string;
  totalCards: number;
  cards: CardRecord[];
};

const CARDS_JSON_PATH = path.resolve(process.cwd(), "data", "cards.json");

let cachedCards: CardsPayload | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

export async function loadCardsPayload(): Promise<CardsPayload> {
  const now = Date.now();
  if (cachedCards && now - cachedAt < CACHE_TTL_MS) return cachedCards;

  const raw = await fs.readFile(CARDS_JSON_PATH, "utf8");
  const parsed = JSON.parse(raw) as CardsPayload;
  cachedCards = parsed;
  cachedAt = now;
  return parsed;
}

export async function getCards(): Promise<CardRecord[]> {
  const payload = await loadCardsPayload();
  return payload.cards;
}

export async function getCardBySlug(slug: string): Promise<CardRecord | null> {
  const payload = await loadCardsPayload();
  return payload.cards.find((card) => card.slug === slug) ?? null;
}

export function searchCards(cards: CardRecord[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return cards;

  return cards.filter((card) => {
    const haystack = [
      card.cardName,
      card.issuer,
      card.network,
      card.rewardRateText,
      card.joiningBonus,
      card.highlights.join(" "),
      card.bestFor.join(" "),
      card.pageSummary,
      card.keyHighlights.join(" "),
      card.eligibilityHints.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterCardsByIssuer(cards: CardRecord[], issuer: string) {
  const needle = issuer.trim().toLowerCase();
  if (!needle) return cards;
  return cards.filter((card) => card.issuer.toLowerCase().includes(needle));
}
