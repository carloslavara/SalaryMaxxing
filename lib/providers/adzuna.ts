import { matchOccupations } from "../occupation-matcher";
import type {
  LocationInput,
  LookupDebug,
  OccupationMatch,
  SalaryProvider,
} from "../salary-provider";

/**
 * Compatibility export for deployments that still include the former optional
 * Adzuna module in an incremental build. It deliberately performs no network
 * lookup: authoritative salary results now come from the local government
 * datasets in `government.ts`.
 */
export const adzunaProvider: SalaryProvider = {
  id: "ADZUNA_DISABLED",
  name: "Adzuna (disabled)",
  country: "US",
  classification: "SOC",
  async searchOccupations(jobTitle: string) {
    return matchOccupations(jobTitle, "US");
  },
  async lookup(
    occupation: OccupationMatch,
    location: LocationInput,
    _hoursPerWeek: number,
    _weeksPerYear: number,
  ) {
    const debug: LookupDebug = {
      country: location.country,
      provider: "ADZUNA_DISABLED",
      jobTitle: occupation.title,
      classification: occupation.classification,
      occupationCode: occupation.code,
      occupationTitle: occupation.title,
      inputCity: location.city,
      inputRegion: location.region,
      datasetQueried: [],
      recordsSearched: 0,
      matchesByLevel: {},
    };

    return { debug, reason: "DATASET_UNAVAILABLE" as const };
  },
};
