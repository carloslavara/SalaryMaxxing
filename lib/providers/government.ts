import { matchOccupations } from "../occupation-matcher";
import { annualize, type CountryCode, type LocationInput, type OccupationMatch, type SalaryProvider, type SalaryResult, type SalarySearchOptions } from "../salary-provider";

type GovernmentRecord = Omit<SalaryResult, "provider" | "providerId" | "category" | "retrievedAt" | "compensationType" | "annualized">;

/**
 * Official agencies currently publish bulk files rather than a stable public job-title API.
 * Deployments can point these variables at a licensed/official normalized JSON export. This
 * avoids scraping presentation pages and keeps parsing isolated from calculator code.
 */
class GovernmentProvider implements SalaryProvider {
  category = "government" as const;
  constructor(public id: string, public name: string, public countries: CountryCode[], private dataUrlEnv: string) {}
  async searchOccupations(jobTitle: string) { return matchOccupations(jobTitle, this.countries[0], this.id); }
  async getSalaryData(occupation: OccupationMatch, location: LocationInput, options: SalarySearchOptions): Promise<SalaryResult[]> {
    const endpoint = process.env[this.dataUrlEnv];
    if (!endpoint) return [];
    const url = new URL(endpoint);
    url.searchParams.set("occupationCode", occupation.code);
    url.searchParams.set("location", location.raw);
    const response = await fetch(url, { headers: { accept: "application/json" }, next: { revalidate: 86400 } });
    if (!response.ok) throw new Error(`${this.name} data request failed`);
    const records = (await response.json()) as GovernmentRecord[];
    const priority = ["metro", "province_state", "national", "unknown"] as const;
    const bestLevel = priority.find((level) => records.some((record) => record.geographyLevel === level));
    return records.filter((record) => record.geographyLevel === bestLevel).map((record) => ({ ...record, provider: this.name, providerId: this.id, category: this.category, occupationTitle: record.occupationTitle || occupation.title, occupationCode: record.occupationCode || occupation.code, geographyNote: record.geographyNote || (bestLevel !== "metro" ? `No city/metro result was available. Showing ${record.location} data instead.` : undefined), retrievedAt: new Date().toISOString(), compensationType: "base_salary", annualized: record.period === "hourly" ? { median: annualize(record.median, options.hoursPerWeek, options.weeksPerYear), low: annualize(record.low, options.hoursPerWeek, options.weeksPerYear), high: annualize(record.high, options.hoursPerWeek, options.weeksPerYear), ...options } : undefined }));
  }
}

export const canadaJobBank = new GovernmentProvider("job-bank", "Canada Job Bank", ["CA"], "JOB_BANK_DATA_URL");
export const blsOews = new GovernmentProvider("bls-oews", "BLS OEWS", ["US"], "BLS_OEWS_DATA_URL");
