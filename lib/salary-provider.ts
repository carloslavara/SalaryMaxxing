export type CountryCode = "US" | "CA";
export type Classification = "SOC" | "NOC";
export type GeographyType = "metro" | "economic_region" | "state" | "province" | "national";

export interface LocationInput { city: string; region: string; country: CountryCode }
export interface OccupationMatch { country: CountryCode; classification: Classification; code: string; title: string; score: number }

export interface SalaryResult {
  provider: string; country: CountryCode; classification: Classification;
  occupationCode: string; occupationTitle: string;
  geographyType: GeographyType; geographyCode?: string; geographyName: string;
  medianAnnual?: number; meanAnnual?: number; lowAnnual?: number; highAnnual?: number;
  medianHourly?: number; meanHourly?: number; lowHourly?: number; highHourly?: number;
  currency: "USD" | "CAD"; dataYear?: number; annualizedFromHourly: boolean;
  salaryFieldSelected: "medianAnnual" | "medianHourly" | "meanAnnual" | "meanHourly" | "highAnnual" | "highHourly";
  suggestedAnnual: number; sourceUrl?: string; retrievedAt: string; fallbackMessage?: string;
}

export interface WageRecord {
  occupationCode: string; occupationTitle: string; geographyType: GeographyType;
  geographyCode?: string; geographyName: string; regionCode?: string;
  medianAnnual?: number | null; meanAnnual?: number | null; lowAnnual?: number | null; highAnnual?: number | null;
  medianHourly?: number | null; meanHourly?: number | null; lowHourly?: number | null; highHourly?: number | null;
  dataYear: number; sourceUrl: string;
}

export interface LookupDebug {
  country: CountryCode; provider: string; jobTitle: string; classification: Classification;
  occupationCode: string; occupationTitle: string; inputCity: string; inputRegion: string;
  resolvedGeography?: string; resolvedGeographyCode?: string; datasetQueried: string[];
  recordsSearched: number; matchesByLevel: Record<string, number>; salaryFieldSelected?: string;
  fallbackLevel?: GeographyType; matchedRecord?: WageRecord; exception?: string;
}

export interface SalaryProvider {
  country: CountryCode; classification: Classification; id: string; name: string;
  searchOccupations(jobTitle: string): Promise<OccupationMatch[]>;
  lookup(occupation: OccupationMatch, location: LocationInput, hoursPerWeek: number, weeksPerYear: number): Promise<{ result?: SalaryResult; debug: LookupDebug; reason?: "NO_WAGE" | "DATASET_UNAVAILABLE" }>;
}

export function parseNumeric(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string" || !value.trim() || /^(\*|\*\*|#|n\/?a|—|–|-|null)$/i.test(value.trim())) return undefined;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeCountry(value: string): CountryCode | undefined {
  const normalized = value.trim().toLowerCase().replace(/\./g, "");
  if (["united states", "united states of america", "usa", "us"].includes(normalized)) return "US";
  if (["canada", "can", "ca"].includes(normalized)) return "CA";
}

export function parseLocation(raw: string): LocationInput | undefined {
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 3) return undefined;
  const country = normalizeCountry(parts.at(-1)!);
  if (!country) return undefined;
  return { city: parts.slice(0, -2).join(", "), region: parts.at(-2)!.toUpperCase(), country };
}
