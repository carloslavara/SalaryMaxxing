import usOccupations from "../data/salary/us/occupations.json";
import caOccupations from "../data/salary/ca/occupations.json";
import type { CountryCode, OccupationMatch } from "./salary-provider";

type Occupation = { code: string; title: string; aliases: string[] };
const catalogs: Record<CountryCode, Occupation[]> = { US: usOccupations, CA: caOccupations };
export const normalizeTitle = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (value: string) => new Set(normalizeTitle(value).split(" ").filter((word) => word.length > 1));

export function matchOccupations(jobTitle: string, country: CountryCode): OccupationMatch[] {
  const query = normalizeTitle(jobTitle); if (!query) return [];
  const queryTokens = tokens(query);
  return catalogs[country].map((occupation) => {
    const candidates = [occupation.title, ...occupation.aliases].map(normalizeTitle);
    let score = candidates.includes(query) ? 1 : 0;
    for (const candidate of candidates) {
      const candidateTokens = tokens(candidate);
      const overlap = [...candidateTokens].filter((term) => queryTokens.has(term)).length;
      score = Math.max(score, overlap / Math.max(1, new Set([...queryTokens, ...candidateTokens]).size));
    }
    return { country, classification: country === "US" ? "SOC" as const : "NOC" as const, code: occupation.code, title: occupation.title, score };
  }).filter((match) => match.score >= .12).sort((a, b) => b.score - a.score).slice(0, 4);
}
