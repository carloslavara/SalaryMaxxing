import { describe, expect, it } from "vitest";
import { matchOccupations, normalizeTitle } from "./occupation-matcher";
import { annualize, parseLocation } from "./salary-provider";

describe("occupation matching", () => {
  it("normalizes punctuation and capitalization", () => expect(normalizeTitle("Software-Development Manager! ")).toBe("software development manager"));
  it("offers the expected government management occupation first", () => {
    const canada = matchOccupations("Software Development Manager", "CA", "job-bank");
    const us = matchOccupations("Software Development Manager", "US", "bls-oews");
    expect(canada[0]).toMatchObject({ code: "20012", providerId: "job-bank" });
    expect(us[0]).toMatchObject({ code: "11-3021", providerId: "bls-oews" });
    expect(canada.length).toBeGreaterThan(1);
  });
});

describe("salary lookup helpers", () => {
  it("identifies supported countries", () => {
    expect(parseLocation("Vancouver, BC, Canada").country).toBe("CA");
    expect(parseLocation("Seattle, WA, United States").country).toBe("US");
    expect(parseLocation("San Francisco, CA").country).toBe("OTHER");
  });
  it("annualizes hourly government wages using the configured schedule", () => expect(annualize(72.12, 40, 52)).toBeCloseTo(150009.6));
});
