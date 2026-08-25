export type CountryCode = "CA" | "US" | "OTHER";

export interface LocationInput {
  raw: string;
  country: CountryCode;
  city?: string;
  region?: string;
}

export interface OccupationMatch {
  providerId: string;
  code: string;
  title: string;
  confidence: number;
  matchedTerms: string[];
}

export interface SalarySearchOptions {
  hoursPerWeek: number;
  weeksPerYear: number;
}

export interface SalaryResult {
  provider: string;
  providerId: string;
  category: "government" | "market";
  occupationTitle: string;
  occupationCode?: string;
  location: string;
  geographyLevel: "metro" | "province_state" | "national" | "unknown";
  geographyNote?: string;
  median?: number;
  mean?: number;
  low?: number;
  high?: number;
  percentile10?: number;
  percentile25?: number;
  percentile75?: number;
  percentile90?: number;
  currency: string;
  period: "hourly" | "annual";
  annualized?: { median?: number; low?: number; high?: number; hoursPerWeek: number; weeksPerYear: number };
  sourceUrl?: string;
  dataYear?: number;
  dataDate?: string;
  retrievedAt: string;
  compensationType: "base_salary";
}

export interface SalaryProvider {
  id: string;
  name: string;
  countries: CountryCode[];
  category: "government" | "market";
  searchOccupations(jobTitle: string): Promise<OccupationMatch[]>;
  getSalaryData(occupation: OccupationMatch, location: LocationInput, options: SalarySearchOptions): Promise<SalaryResult[]>;
}

export function annualize(hourly: number | undefined, hoursPerWeek: number, weeksPerYear: number) {
  return hourly === undefined ? undefined : hourly * hoursPerWeek * weeksPerYear;
}

export function parseLocation(raw: string): LocationInput {
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  const normalized = raw.toLowerCase();
  // Do not interpret a bare "CA" as Canada: it commonly means California.
  const country: CountryCode = /\b(united states(?: of america)?|usa|u\.s\.a\.?|u\.s\.)\b/.test(normalized) || /,\s*us\s*$/i.test(raw)
    ? "US"
    : /\b(canada|can)\b/.test(normalized) ? "CA" : "OTHER";
  return { raw, country, city: parts[0], region: parts.length > 2 ? parts[1] : undefined };
}
