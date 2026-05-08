#!/usr/bin/env node
import { argv, exit } from "node:process";

const UT_GRAPHQL_URL =
  "https://ut-backend-api-2-41145913385.europe-north1.run.app/internal/graphql";
const USER_AGENT = "Friluftskompis/1.0 (lag7@blank.no)";

const SEARCH_QUERY = `
  query Search($q: String!) {
    search(input: { searchString: $q, fullResult: true }) {
      prioritizedResult
      result
    }
  }
`;

const CABIN_QUERY = `
  query Cabin($id: Int!) {
    cabin(id: $id) {
      id name dntCabin serviceLevel
      bedsStaffed bedsSelfService bedsNoService
      geojson
    }
  }
`;

async function utQuery(query, variables) {
  const res = await fetch(UT_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      Origin: "https://ut.no",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`UT ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

function parseRow(row) {
  const parts = row.split(";");
  if (parts.length < 4 || parts[0] !== "d") return null;
  const id = Number(parts[1]);
  const [lon, lat] = parts[2].split(",").map(Number);
  return {
    id,
    name: parts[3],
    lat,
    lon,
    subtype: parts[4] ?? null,
    dnt: parts[5] === "1",
  };
}

async function main() {
  const q = argv.slice(2).join(" ").trim() || "Gjendesheim";
  console.log(`search: "${q}"`);

  const data = await utQuery(SEARCH_QUERY, { q });
  const rows = [...data.search.prioritizedResult, ...data.search.result];
  const cabins = rows.map(parseRow).filter(Boolean);
  const dnt = cabins.find((c) => c.dnt);

  if (!dnt) {
    console.error("no DNT cabin in results");
    exit(1);
  }

  console.log(`hit: ${dnt.name} id=${dnt.id} (${dnt.lat}, ${dnt.lon})`);

  const detail = await utQuery(CABIN_QUERY, { id: dnt.id });
  const c = detail.cabin;
  console.log("detail:", {
    id: c.id,
    name: c.name,
    dntCabin: c.dntCabin,
    serviceLevel: c.serviceLevel,
    beds: {
      staffed: c.bedsStaffed,
      selfService: c.bedsSelfService,
      noService: c.bedsNoService,
    },
  });

  if (c.dntCabin !== true) {
    console.error("FAIL: dntCabin not true");
    exit(1);
  }
  console.log("OK");
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  exit(1);
});
