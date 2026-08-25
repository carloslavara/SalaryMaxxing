import type { LocationInput, OccupationMatch, SalaryProvider, SalaryResult, SalarySearchOptions } from "../salary-provider";

export const adzunaProvider: SalaryProvider = {
  id: "adzuna", name: "Adzuna", countries: ["CA", "US"], category: "market",
  async searchOccupations() { return []; },
  async getSalaryData(occupation: OccupationMatch, location: LocationInput, _options: SalarySearchOptions): Promise<SalaryResult[]> {
    const appId = process.env.ADZUNA_APP_ID; const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) return [];
    const country = location.country === "CA" ? "ca" : "us";
    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
    url.searchParams.set("app_id", appId); url.searchParams.set("app_key", appKey); url.searchParams.set("what", occupation.title); url.searchParams.set("where", location.raw); url.searchParams.set("results_per_page", "1"); url.searchParams.set("content-type", "application/json");
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) throw new Error("Adzuna request failed");
    const data = await response.json() as { mean?: number; location?: { display_name?: string } };
    if (!data.mean) return [];
    return [{ provider: "Adzuna", providerId: "adzuna", category: "market", occupationTitle: occupation.title, occupationCode: occupation.code, location: data.location?.display_name || location.raw, geographyLevel: "unknown", mean: data.mean, median: data.mean, currency: location.country === "CA" ? "CAD" : "USD", period: "annual", retrievedAt: new Date().toISOString(), compensationType: "base_salary", sourceUrl: "https://www.adzuna.com/" }];
  },
};
