import { NextResponse } from "next/server";
import { filterCardsByIssuer, getCards, searchCards } from "@/lib/cards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const issuer = searchParams.get("issuer") || "";
  const q = searchParams.get("q") || "";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  let cards = await getCards();
  cards = filterCardsByIssuer(cards, issuer);
  cards = searchCards(cards, q);

  const total = cards.length;
  if (Number.isFinite(limit) && limit && limit > 0) {
    cards = cards.slice(0, limit);
  }

  return NextResponse.json({
    total,
    count: cards.length,
    cards,
  });
}
