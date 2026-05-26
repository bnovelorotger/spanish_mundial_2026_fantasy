export function buildPredictionsRedirectHref(
  params: Record<string, string>,
  hash?: string,
) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  const fragment = hash ? `#${hash}` : "";

  return query ? `/predictions?${query}${fragment}` : `/predictions${fragment}`;
}
