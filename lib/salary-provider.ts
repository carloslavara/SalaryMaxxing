export type SalaryQuery = { jobTitle: string; location: string; currency: string; yearsInRole?: number };
export type SalaryEstimate = { median: number; low?: number; high?: number; currency: string; compensationType: "base" | "total"; sourceName: string; sourceUrl: string; dataDate?: string; retrievedDate: string };
export interface SalaryProvider { name: string; search(query: SalaryQuery): Promise<SalaryEstimate[]> }

/** Providers can be registered here when a licensed API is configured. */
export const salaryProviders: SalaryProvider[] = [];
