import { describe, expect, it } from "vitest";
import { adzunaProvider } from "./adzuna";

describe("legacy Adzuna module compatibility", () => {
  it("implements the current provider contract without legacy type imports", async () => {
    const occupation = (await adzunaProvider.searchOccupations("software development manager"))[0];
    const response = await adzunaProvider.lookup(
      occupation,
      { city: "Austin", region: "TX", country: "US" },
      40,
      52,
    );

    expect(response).toMatchObject({ reason: "DATASET_UNAVAILABLE" });
  });
});
