const UT_GRAPHQL_URL =
  "https://ut-backend-api-2-41145913385.europe-north1.run.app/internal/graphql";
const USER_AGENT = "Friluftskompis/1.0 (lag7@blank.no)";

export type UtFetchOptions = {
  signal?: AbortSignal;
  revalidate?: number;
};

export class UtApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "UtApiError";
  }
}

export async function utQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
  opts: UtFetchOptions = {},
): Promise<T> {
  const res = await fetch(UT_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      Origin: "https://ut.no",
    },
    body: JSON.stringify({ query, variables }),
    signal: opts.signal,
    next: opts.revalidate ? { revalidate: opts.revalidate } : undefined,
  });

  if (!res.ok) {
    throw new UtApiError(
      `ut.no ${res.status}: ${await res.text()}`,
      res.status,
    );
  }

  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new UtApiError(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) {
    throw new UtApiError("ut.no returned no data");
  }
  return json.data;
}
