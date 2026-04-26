import { NextResponse } from "next/server";

const DEX_SCREENER = "https://api.dexscreener.com/latest/dex/tokens";

type DexScreenerToken = { symbol?: string };
type DexScreenerPair = {
  priceUsd?: string;
  baseToken?: DexScreenerToken;
};

type DexScreenerResponse = { pairs?: DexScreenerPair[] };

/**
 * Indicative last USD price from DexScreener (public API, cached 60s).
 * GET /api/token/quote?mint= optional; defaults to NEXT_PUBLIC_SAGEX_TOKEN_MINT.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromQuery = searchParams.get("mint");
  const fromEnv = process.env.NEXT_PUBLIC_SAGEX_TOKEN_MINT;
  const mint = (fromQuery && fromQuery.trim().length > 0
    ? fromQuery
    : fromEnv
  )?.trim();

  if (!mint) {
    return NextResponse.json({ priceUsd: null as number | null });
  }

  try {
    const res = await fetch(`${DEX_SCREENER}/${mint}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ priceUsd: null as number | null });
    }
    const data = (await res.json()) as DexScreenerResponse;
    const pair = data.pairs?.[0];
    const raw = pair?.priceUsd;
    const priceUsd =
      raw != null && raw !== "" ? Number.parseFloat(raw) : null;
    const symbol = pair?.baseToken?.symbol;
    return NextResponse.json({
      priceUsd: Number.isFinite(priceUsd) ? priceUsd : null,
      symbol: typeof symbol === "string" && symbol.length > 0 ? symbol : undefined,
    });
  } catch {
    return NextResponse.json({ priceUsd: null as number | null });
  }
}
