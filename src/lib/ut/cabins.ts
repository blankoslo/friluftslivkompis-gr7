import { utQuery, type UtFetchOptions } from "./client";

export type CabinListItem = {
  id: number;
  name: string;
  serviceLevel: string | null;
  dntCabin: boolean;
  bedsStaffed: number | null;
  bedsSelfService: number | null;
  bedsNoService: number | null;
  bedsExtra: number | null;
  bedsWinter: number | null;
  lat: number;
  lon: number;
};

type Edge = {
  node: {
    id: number;
    name: string;
    serviceLevel: string | null;
    dntCabin: boolean;
    bedsStaffed: number | null;
    bedsSelfService: number | null;
    bedsNoService: number | null;
    bedsExtra: number | null;
    bedsWinter: number | null;
    geojson: { type: "Point"; coordinates: [number, number] | [number, number, number] } | null;
  };
};

const CABINS_QUERY = /* GraphQL */ `
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

type Response = {
  cabins: {
    edges: Edge[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    totalCount: number;
  };
};

const PAGE_SIZE = 500;
const MAX_PAGES = 10;

export async function fetchAllDntCabins(
  opts: UtFetchOptions = {},
): Promise<CabinListItem[]> {
  const cabins: CabinListItem[] = [];
  let after: string | null = null;
  let pages = 0;

  while (pages < MAX_PAGES) {
    const data: Response = await utQuery<Response>(
      CABINS_QUERY,
      { first: PAGE_SIZE, after },
      { revalidate: 86400, ...opts },
    );

    for (const edge of data.cabins.edges) {
      const coords = edge.node.geojson?.coordinates;
      if (!coords || coords.length < 2) continue;
      cabins.push({
        id: edge.node.id,
        name: edge.node.name,
        serviceLevel: edge.node.serviceLevel,
        dntCabin: edge.node.dntCabin,
        bedsStaffed: edge.node.bedsStaffed,
        bedsSelfService: edge.node.bedsSelfService,
        bedsNoService: edge.node.bedsNoService,
        bedsExtra: edge.node.bedsExtra,
        bedsWinter: edge.node.bedsWinter,
        lon: coords[0],
        lat: coords[1],
      });
    }

    if (!data.cabins.pageInfo.hasNextPage) break;
    after = data.cabins.pageInfo.endCursor;
    pages++;
  }

  return cabins;
}
