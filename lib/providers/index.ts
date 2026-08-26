import { blsOews, canadaJobBank } from "./government";
import type { CountryCode, SalaryProvider } from "../salary-provider";

export function providerFor(country: CountryCode): SalaryProvider {
  switch (country) { case "US": return blsOews; case "CA": return canadaJobBank; }
}
