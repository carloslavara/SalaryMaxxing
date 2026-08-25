import type { CountryCode, OccupationMatch } from "./salary-provider";

type Occupation = { code: string; title: string; aliases: string[] };

// A compact matching index, not wage data. Codes/titles follow the official NOC 2021 and SOC 2018 taxonomies.
const catalogs: Record<"CA" | "US", Occupation[]> = {
  CA: [
    { code: "20012", title: "Computer and information systems managers", aliases: ["software development manager", "it manager", "engineering manager", "technology manager", "director of engineering"] },
    { code: "21232", title: "Software developers and programmers", aliases: ["software developer", "software engineer", "application developer", "programmer"] },
    { code: "20010", title: "Engineering managers", aliases: ["engineering manager", "software engineering manager"] },
    { code: "11201", title: "Professional occupations in business management consulting", aliases: ["management consultant", "business consultant"] },
    { code: "10010", title: "Financial managers", aliases: ["finance manager", "controller"] },
    { code: "11200", title: "Human resources professionals", aliases: ["human resources", "hr manager", "recruiter"] },
    { code: "31301", title: "Registered nurses and registered psychiatric nurses", aliases: ["registered nurse", "rn", "nurse"] },
  ],
  US: [
    { code: "11-3021", title: "Computer and Information Systems Managers", aliases: ["software development manager", "it manager", "technology manager", "director of engineering"] },
    { code: "15-1252", title: "Software Developers", aliases: ["software developer", "software engineer", "application developer", "programmer"] },
    { code: "11-9041", title: "Architectural and Engineering Managers", aliases: ["engineering manager", "software engineering manager"] },
    { code: "13-1111", title: "Management Analysts", aliases: ["management consultant", "business consultant", "business analyst"] },
    { code: "11-3031", title: "Financial Managers", aliases: ["finance manager", "controller"] },
    { code: "13-1071", title: "Human Resources Specialists", aliases: ["human resources", "hr specialist", "recruiter"] },
    { code: "29-1141", title: "Registered Nurses", aliases: ["registered nurse", "rn", "nurse"] },
  ],
};

export const normalizeTitle = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (value: string) => new Set(normalizeTitle(value).split(" ").filter((word) => word.length > 1));

function score(query: string, occupation: Occupation) {
  const q = normalizeTitle(query);
  const candidates = [occupation.title, ...occupation.aliases].map(normalizeTitle);
  if (candidates.includes(q)) return { confidence: 1, terms: q.split(" ") };
  const queryTokens = tokens(q);
  let best = { confidence: 0, terms: [] as string[] };
  for (const candidate of candidates) {
    const overlap = [...tokens(candidate)].filter((term) => queryTokens.has(term));
    const union = new Set([...queryTokens, ...tokens(candidate)]).size;
    const confidence = union ? overlap.length / union : 0;
    if (confidence > best.confidence) best = { confidence, terms: overlap };
  }
  return best;
}

export function matchOccupations(jobTitle: string, country: CountryCode, providerId: string): OccupationMatch[] {
  if (country === "OTHER" || !normalizeTitle(jobTitle)) return [];
  return catalogs[country].map((occupation) => {
    const result = score(jobTitle, occupation);
    return { providerId, code: occupation.code, title: occupation.title, confidence: result.confidence, matchedTerms: result.terms };
  }).filter((match) => match.confidence >= 0.12).sort((a, b) => b.confidence - a.confidence).slice(0, 4);
}
