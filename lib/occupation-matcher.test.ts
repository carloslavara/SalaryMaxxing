import { describe, expect, it } from "vitest";
import { matchOccupations, normalizeTitle } from "./occupation-matcher";
import { normalizeCountry, parseLocation, parseNumeric } from "./salary-provider";

describe("country-specific occupation matching", () => {
  it("normalizes punctuation and only returns SOC matches for the US", () => {
    expect(normalizeTitle("Software-Development Manager! ")).toBe("software development manager");
    const matches = matchOccupations("Software Development Manager", "US");
    expect(matches[0]).toMatchObject({ code: "11-3021", country: "US", classification: "SOC" });
    expect(matches.every((match) => match.classification === "SOC")).toBe(true);
  });
  it("only returns NOC matches for Canada", () => expect(matchOccupations("Software Development Manager", "CA")[0]).toMatchObject({ code: "20012", country: "CA", classification: "NOC" }));
});

describe("input normalization", () => {
  it("normalizes supported country spellings", () => {
    for (const input of ["United States", "United States of America", "USA", "US", "U.S."]) expect(normalizeCountry(input)).toBe("US");
    for (const input of ["Canada", "CA", "CAN"]) expect(normalizeCountry(input)).toBe("CA");
    expect(parseLocation("Austin, TX, United States")).toEqual({ city: "Austin", region: "TX", country: "US" });
  });
  it("safely rejects suppressed wage values", () => {
    for (const input of ["*", "**", "#", "N/A", "—", null, ""]) expect(parseNumeric(input)).toBeUndefined();
  });
});
