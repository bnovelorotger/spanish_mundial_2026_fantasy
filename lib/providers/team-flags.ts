const flagCodeByTeamCode: Record<string, string> = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CHE: "ch",
  CHL: "cl",
  CIV: "ci",
  CMR: "cm",
  COD: "cd",
  COL: "co",
  CPV: "cv",
  CRC: "cr",
  CRO: "hr",
  CUW: "cw",
  CZE: "cz",
  DEU: "de",
  EGY: "eg",
  ENG: "gb-eng",
  DNK: "dk",
  DZA: "dz",
  ECU: "ec",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HAI: "ht",
  HRV: "hr",
  HUN: "hu",
  IRN: "ir",
  IRQ: "iq",
  ITA: "it",
  JPN: "jp",
  JOR: "jo",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NGA: "ng",
  NLD: "nl",
  NOR: "no",
  NZL: "nz",
  PAN: "pa",
  PAR: "py",
  PER: "pe",
  POL: "pl",
  POR: "pt",
  PRT: "pt",
  PRY: "py",
  QAT: "qa",
  RSA: "za",
  SCO: "gb-sct",
  SEN: "sn",
  SRB: "rs",
  SUI: "ch",
  SWE: "se",
  TUN: "tn",
  TBC: "",
  TBA: "",
  TBD: "",
  TUR: "tr",
  UKR: "ua",
  URY: "uy",
  USA: "us",
  UZB: "uz",
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
