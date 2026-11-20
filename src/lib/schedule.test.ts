import { describe, it, expect } from "vitest";
import { todayInChicago, addDays } from "@/lib/schedule";

describe("todayInChicago", () => {
  it("R13 todayInChicago near midnight UTC", () => {
    expect(todayInChicago(new Date("2026-11-19T03:00:00Z"))).toBe("2026-11-18");
  });
});

describe("addDays", () => {
  it("rolls over a month end", () => {
    expect(addDays("2026-11-28", 7)).toBe("2026-12-05");
  });
  it("rolls over a year end", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });
});
