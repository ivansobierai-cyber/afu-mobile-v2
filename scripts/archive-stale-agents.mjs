#!/usr/bin/env node
/**
 * Archive idle PR-approval cloud agents for afu-mobile-v2.
 *
 * Usage:
 *   CURSOR_API_KEY=your_key node scripts/archive-stale-agents.mjs
 *
 * API key: Cursor Dashboard → Settings → API Keys
 */

const API_KEY = process.env.CURSOR_API_KEY?.trim();
if (!API_KEY) {
  console.error("Set CURSOR_API_KEY (Cursor Dashboard → Settings → API Keys)");
  process.exit(1);
}
if (API_KEY === "sua_key" || API_KEY.length < 20) {
  console.error(
    "CURSOR_API_KEY inválida. Gere em https://cursor.com/dashboard?tab=settings → API Keys",
  );
  console.error("Exemplo: CURSOR_API_KEY=key_xxxxxxxx npm run agents:archive-stale");
  process.exit(1);
}

/** Keep this agent (active dev session). */
const KEEP = new Set(["bc-68c29171-17a6-414c-b76a-12cf0470fd64"]);

const STALE_PR_APPROVAL_AGENTS = [
  "bc-1ee065a9-c297-40e8-8912-597adf4413e4",
  "bc-7ac13057-953f-4147-9fb5-422a2acd9e7c",
  "bc-1965f340-08e7-45f4-8f84-2088d9960976",
  "bc-40a298fa-8193-4221-8938-6c876b80cb53",
  "bc-17d1f861-7427-4729-b2ce-1bf7a01f1ddb",
];

async function archiveAgent(id) {
  const res = await fetch(`https://api.cursor.com/v1/agents/${id}/archive`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${id}: HTTP ${res.status} ${body}`);
  }
}

let archived = 0;
for (const id of STALE_PR_APPROVAL_AGENTS) {
  if (KEEP.has(id)) {
    console.log(`skip (keep): ${id}`);
    continue;
  }
  try {
    await archiveAgent(id);
    console.log(`archived: ${id}`);
    archived += 1;
  } catch (err) {
    console.error(`failed: ${err.message}`);
  }
}

console.log(`Done. Archived ${archived}/${STALE_PR_APPROVAL_AGENTS.length} stale agents.`);
