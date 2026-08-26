import { describe, expect, it } from "vitest";
import { blsOews, canadaJobBank } from "./government";
import { matchOccupations } from "../occupation-matcher";

describe("local government salary pipelines", () => {
  it("resolves Austin SOC wages and falls back through state and national data", async () => {
    const occupation = matchOccupations("Software Development Manager", "US")[0];
    const metro = await blsOews.lookup(occupation, { city: "Austin", region: "TX", country: "US" }, 40, 52);
    expect(metro.result).toMatchObject({ country: "US", classification: "SOC", currency: "USD", geographyType: "metro" });
    expect(metro.debug.datasetQueried).toContain("metro"); expect(metro.result?.suggestedAnnual).toBeGreaterThan(0);
    const state = await blsOews.lookup(occupation, { city: "Unmapped city", region: "TX", country: "US" }, 40, 52);
    expect(state.result?.geographyType).toBe("state");
    const national = await blsOews.lookup(occupation, { city: "Unmapped city", region: "ZZ", country: "US" }, 40, 52);
    expect(national.result?.geographyType).toBe("national");
  });

  it("resolves Vancouver NOC wages, annualizes hourly data, and falls back", async () => {
    const occupation = matchOccupations("Software Development Manager", "CA")[0];
    const local = await canadaJobBank.lookup(occupation, { city: "Vancouver", region: "BC", country: "CA" }, 40, 52);
    expect(local.result).toMatchObject({ country: "CA", classification: "NOC", currency: "CAD", geographyType: "economic_region", annualizedFromHourly: true });
    expect(local.result?.suggestedAnnual).toBeCloseTo((local.result?.medianHourly || 0) * 40 * 52);
    const province = await canadaJobBank.lookup(occupation, { city: "Unmapped city", region: "BC", country: "CA" }, 40, 52);
    expect(province.result?.geographyType).toBe("province");
    const national = await canadaJobBank.lookup(occupation, { city: "Unmapped city", region: "ZZ", country: "CA" }, 40, 52);
    expect(national.result?.geographyType).toBe("national");
  });
});
