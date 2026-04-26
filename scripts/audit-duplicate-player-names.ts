/**
 * Lists display names that appear on more than one player (case-insensitive).
 *
 * Run from the repo root with env loaded, e.g.:
 *   npx tsx --env-file=.env.local scripts/audit-duplicate-player-names.ts
 * or:
 *   npm run db:duplicates
 */
import { connectToDatabase } from "../src/lib/db";
import { PlayerRepository } from "../src/repositories/player.repo";

async function main() {
  await connectToDatabase();
  const rows = await PlayerRepository.aggregateDuplicateNameReport();

  if (rows.length === 0) {
    console.log("No duplicate pilot names (case-insensitive) found.");
    process.exit(0);
    return;
  }

  console.log(`Found ${rows.length} name group(s) with 2+ players:\n`);
  for (const row of rows) {
    const names = (row.displayNames as string[]).join(" | ");
    const ids = (row.playerIds as string[]).join(", ");
    console.log(`  "${row._id}"  (${row.count} docs)  names: [${names}]`);
    console.log(`    playerIds: ${ids}\n`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
