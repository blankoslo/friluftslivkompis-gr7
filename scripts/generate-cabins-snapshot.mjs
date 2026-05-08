#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const UT_GRAPHQL_URL =
  "https://ut-backend-api-2-41145913385.europe-north1.run.app/internal/graphql";
const USER_AGENT = "Friluftskompis/1.0 (lag7@blank.no)";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_FILE = resolve(__dirname, "..", "data", "snapshots", "dnt-cabins.json");

const PAGE_SIZE = 500;
const MAX_PAGES = 10;
const DETAIL_BATCH = 25;
const DETAIL_DELAY_MS = 150;

const LIST_QUERY = `
  query DntCabins($first: Int!, $after: ConnectionCursor) {
    cabins(paging: { first: $first, after: $after }, filter: { dntCabin: { is: true } }) {
      edges {
        node {
          id name serviceLevel dntCabin
          bedsStaffed bedsSelfService bedsNoService bedsExtra bedsWinter
          geojson
        }
      }
      pageInfo { hasNextPage endCursor }
      totalCount
    }
  }
`;

const DETAIL_QUERY = `
  query Cabin($id: Int!) {
    cabin(id: $id) {
      id name geojson serviceLevel dntCabin
      bedsStaffed bedsSelfService bedsNoService bedsExtra bedsWinter
      description phone email
    }
  }
`;

async function gql(query, variables) {
  const res = await fetch(UT_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      Origin: "https://ut.no",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`ut.no ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

async function fetchList() {
  const out = [];
  let after = null;
  let pages = 0;
  while (pages < MAX_PAGES) {
    const data = await gql(LIST_QUERY, { first: PAGE_SIZE, after });
    for (const edge of data.cabins.edges) out.push(edge.node);
    if (!data.cabins.pageInfo.hasNextPage) break;
    after = data.cabins.pageInfo.endCursor;
    pages++;
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchDetails(ids) {
  const detailed = [];
  for (let i = 0; i < ids.length; i += DETAIL_BATCH) {
    const slice = ids.slice(i, i + DETAIL_BATCH);
    const results = await Promise.all(
      slice.map(async (id) => {
        try {
          const data = await gql(DETAIL_QUERY, { id });
          return data.cabin;
        } catch (err) {
          console.warn(`  detail ${id} failed: ${err.message}`);
          return null;
        }
      }),
    );
    for (const c of results) if (c) detailed.push(c);
    process.stdout.write(`  ${Math.min(i + DETAIL_BATCH, ids.length)}/${ids.length}\r`);
    await sleep(DETAIL_DELAY_MS);
  }
  process.stdout.write("\n");
  return detailed;
}

async function main() {
  console.log("Fetching cabin list...");
  const list = await fetchList();
  console.log(`  got ${list.length} cabins`);

  const ids = list.map((c) => c.id);
  console.log("Fetching cabin details...");
  const cabins = await fetchDetails(ids);
  console.log(`  got ${cabins.length} detailed cabins`);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    source: "ut.no DNT GraphQL",
    count: cabins.length,
    cabins,
  };

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 0) + "\n");
  console.log(`Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
