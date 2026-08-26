import { matchOccupations } from "../occupation-matcher";
import type { CountryCode, GeographyType, LookupDebug, OccupationMatch, SalaryProvider, SalaryResult, WageRecord, LocationInput } from "../salary-provider";
import usMetros from "../../data/salary/us/metros.json"; import usStates from "../../data/salary/us/states.json"; import usNational from "../../data/salary/us/national.json"; import usGeo from "../../data/salary/us/geographies.json";
import caRegions from "../../data/salary/ca/regions.json"; import caProvinces from "../../data/salary/ca/provinces.json"; import caNational from "../../data/salary/ca/national.json"; import caGeo from "../../data/salary/ca/geographies.json";

const now = () => new Date().toISOString();
const records = (value: unknown) => value as WageRecord[];

function selectSalary(record: WageRecord, country: CountryCode, hours: number, weeks: number) {
  const annualize = (value?: number | null) => value == null ? undefined : value * hours * weeks;
  if (record.medianAnnual != null) return { field: "medianAnnual" as const, annual: record.medianAnnual, annualized: false };
  if (record.medianHourly != null) return { field: "medianHourly" as const, annual: annualize(record.medianHourly)!, annualized: true };
  if (country === "US" && record.meanAnnual != null) return { field: "meanAnnual" as const, annual: record.meanAnnual, annualized: false };
  if (country === "US" && record.meanHourly != null) return { field: "meanHourly" as const, annual: annualize(record.meanHourly)!, annualized: true };
  if (country === "CA" && record.highAnnual != null) return { field: "highAnnual" as const, annual: record.highAnnual, annualized: false };
  if (country === "CA" && record.highHourly != null) return { field: "highHourly" as const, annual: annualize(record.highHourly)!, annualized: true };
}

class LocalGovernmentProvider implements SalaryProvider {
  constructor(public country: CountryCode, public classification: "SOC" | "NOC", public id: string, public name: string) {}
  async searchOccupations(jobTitle: string) { return matchOccupations(jobTitle, this.country); }
  async lookup(occupation: OccupationMatch, location: LocationInput, hours: number, weeks: number) {
    const datasets = this.country === "US"
      ? [{ type: "metro" as const, values: records(usMetros) }, { type: "state" as const, values: records(usStates) }, { type: "national" as const, values: records(usNational) }]
      : [{ type: "economic_region" as const, values: records(caRegions) }, { type: "province" as const, values: records(caProvinces) }, { type: "national" as const, values: records(caNational) }];
    const cityKey = `${location.city.toLowerCase()}|${location.region}`;
    const geo = this.country === "US" ? (usGeo.cities as Record<string, { code: string; name: string }>)[cityKey] : (caGeo.cities as Record<string, { code: string; name: string }>)[cityKey];
    const debug: LookupDebug = { country: this.country, provider: this.id, jobTitle: occupation.title, classification: this.classification, occupationCode: occupation.code, occupationTitle: occupation.title, inputCity: location.city, inputRegion: location.region, resolvedGeography: geo?.name, resolvedGeographyCode: geo?.code, datasetQueried: [], recordsSearched: 0, matchesByLevel: {} };
    for (const [index, dataset] of datasets.entries()) {
      debug.datasetQueried.push(dataset.type); debug.recordsSearched += dataset.values.length;
      const matches = dataset.values.filter((record) => record.occupationCode === occupation.code && (dataset.type === "national" || dataset.type === "metro" || dataset.type === "economic_region" ? dataset.type === "national" || record.geographyCode === geo?.code : record.regionCode === location.region));
      debug.matchesByLevel[dataset.type] = matches.length;
      const matched = matches.find((record) => selectSalary(record, this.country, hours, weeks));
      if (!matched) continue;
      const selected = selectSalary(matched, this.country, hours, weeks)!;
      debug.matchedRecord = matched; debug.salaryFieldSelected = selected.field; debug.fallbackLevel = dataset.type; debug.resolvedGeography = matched.geographyName; debug.resolvedGeographyCode = matched.geographyCode;
      const fallbackMessage = index === 0 ? undefined : `We couldn't find ${location.city}-specific wage data for this occupation. Using the ${matched.geographyName} estimate instead.`;
      const result: SalaryResult = { provider: this.name, country: this.country, classification: this.classification, occupationCode: matched.occupationCode, occupationTitle: matched.occupationTitle, geographyType: matched.geographyType, geographyCode: matched.geographyCode, geographyName: matched.geographyName, medianAnnual: matched.medianAnnual ?? undefined, meanAnnual: matched.meanAnnual ?? undefined, lowAnnual: matched.lowAnnual ?? undefined, highAnnual: matched.highAnnual ?? undefined, medianHourly: matched.medianHourly ?? undefined, meanHourly: matched.meanHourly ?? undefined, lowHourly: matched.lowHourly ?? undefined, highHourly: matched.highHourly ?? undefined, currency: this.country === "US" ? "USD" : "CAD", dataYear: matched.dataYear, annualizedFromHourly: selected.annualized, salaryFieldSelected: selected.field, suggestedAnnual: selected.annual, sourceUrl: matched.sourceUrl, retrievedAt: now(), fallbackMessage };
      console.info("salary_lookup", debug); return { result, debug };
    }
    console.warn("salary_lookup_no_wage", debug); return { debug, reason: "NO_WAGE" as const };
  }
}

export const blsOews = new LocalGovernmentProvider("US", "SOC", "BLS_OEWS", "BLS OEWS");
export const canadaJobBank = new LocalGovernmentProvider("CA", "NOC", "CANADA_JOB_BANK", "Canada Job Bank");
