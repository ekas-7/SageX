/**
 * Public SAGEX / pump.dump (Solana) token surface — no secrets.
 * UI and optional quote API read mint + link overrides from env.
 */

function trim(s: string | undefined): string {
  return typeof s === "string" ? s.trim() : "";
}

export type SagexTokenPublic = {
  /** Display name for the token strip. */
  label: string;
  /** Mint if configured (may be empty if only hand links are set). */
  mint: string | null;
  /** True when at least one actionable link is available. */
  isConfigured: boolean;
  /** Primary buy / community page. */
  pumpUrl: string | null;
  /** Chart / DEX view. */
  dexScreenerUrl: string | null;
  /** Block explorer (Solscan) token view. */
  solscanUrl: string | null;
};

export function getSagexTokenPublic(): SagexTokenPublic {
  const mint = trim(process.env.NEXT_PUBLIC_SAGEX_TOKEN_MINT) || null;
  const pumpOverride = trim(process.env.NEXT_PUBLIC_SAGEX_PUMP_URL) || null;
  const dexOverride = trim(process.env.NEXT_PUBLIC_SAGEX_DEX_SCREENER_URL) || null;
  const label = trim(process.env.NEXT_PUBLIC_SAGEX_TOKEN_LABEL) || "SAGEX AI";

  const pumpUrl = pumpOverride || (mint ? `https://pump.fun/coin/${mint}` : null);
  const dexScreenerUrl = dexOverride || (mint ? `https://dexscreener.com/solana/${mint}` : null);
  const solscanUrl = mint ? `https://solscan.io/token/${mint}` : null;

  const isConfigured = Boolean(
    (mint && mint.length > 0) || pumpOverride || dexOverride
  );

  return {
    label,
    mint,
    isConfigured,
    pumpUrl,
    dexScreenerUrl,
    solscanUrl,
  };
}
