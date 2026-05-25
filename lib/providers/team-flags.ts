const flagCodeByTeamCode: Record<string, string> = {
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BRA: "br",
  CAN: "ca",
  CHE: "ch",
  CHL: "cl",
  CIV: "ci",
  CMR: "cm",
  COL: "co",
  CRC: "cr",
  CZE: "cz",
  DEU: "de",
  DNK: "dk",
  DZA: "dz",
  ECU: "ec",
  ESP: "es",
  FRA: "fr",
  GHA: "gh",
  HRV: "hr",
  HUN: "hu",
  IRN: "ir",
  ITA: "it",
  JPN: "jp",
  KOR: "kr",
  MAR: "ma",
  MEX: "mx",
  NGA: "ng",
  NLD: "nl",
  NOR: "no",
  NZL: "nz",
  PAN: "pa",
  PER: "pe",
  POL: "pl",
  PRT: "pt",
  PRY: "py",
  SEN: "sn",
  SRB: "rs",
  SWE: "se",
  TBC: "",
  TBA: "",
  TBD: "",
  TUR: "tr",
  UKR: "ua",
  URY: "uy",
  USA: "us",
  VEN: "ve",
};

export function getFlagUrlForTeamCode(
  teamCode: string,
  isTbd = false,
) {
  if (isTbd) {
    return undefined;
  }

  const countryCode = flagCodeByTeamCode[teamCode.toUpperCase()];

  if (!countryCode) {
    return undefined;
  }

  return `https://flagcdn.com/w80/${countryCode}.png`;
}
