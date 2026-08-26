import { adzunaProvider } from "./adzuna";
import { blsOews, canadaJobBank } from "./government";
import type { CountryCode, SalaryProvider } from "../salary-provider";

export const providers: SalaryProvider[] = [canadaJobBank, blsOews, adzunaProvider];
export function providersFor(country: CountryCode) { return providers.filter((provider) => provider.countries.includes(country)); }
export function providerById(id: string) { return providers.find((provider) => provider.id === id); }
