import { describe, expect, it } from "vitest";
import { calculateSalary, hoursMinutes } from "./calculations";

describe("salary calculation", () => {
  it("calculates the example scenario", () => {
    const result = calculateSalary({ currentSalary: 120000, targetSalary: 150000, hoursPerDay: 8, daysPerWeek: 5 });
    expect(hoursMinutes(result.adjustedDay)).toBe("6h 24m");
    expect(hoursMinutes(result.dailyReduction)).toBe("1h 36m");
    expect(result.adjustedWeek).toBe(32);
  });
  it("keeps an equal salary at the baseline", () => {
    const result = calculateSalary({ currentSalary: 150000, targetSalary: 150000, hoursPerDay: 8, daysPerWeek: 5 });
    expect(result.adjustedDay).toBe(8); expect(result.dailyReduction).toBe(0); expect(result.meetsTarget).toBe(true);
  });
  it("caps above-target salary at the baseline", () => {
    const result = calculateSalary({ currentSalary: 175000, targetSalary: 150000, hoursPerDay: 8, daysPerWeek: 5 });
    expect(result.adjustedDay).toBe(8); expect(result.dailyReduction).toBe(0); expect(result.meetsTarget).toBe(true);
  });
  it("rounds 124k versus 175k to 5h 40m", () => {
    const result = calculateSalary({ currentSalary: 124000, targetSalary: 175000, hoursPerDay: 8, daysPerWeek: 5 });
    expect(hoursMinutes(result.adjustedDay)).toBe("5h 40m");
  });
});
