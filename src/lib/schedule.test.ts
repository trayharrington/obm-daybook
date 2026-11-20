import { describe, it, expect } from "vitest";
import { todayInChicago } from "@/lib/schedule";

describe("todayInChicago", () => {
  it("R13 todayInChicago near midnight UTC", () => {
    expect(todayInChicago(new Date("2026-11-19T03:00:00Z"))).toBe("2026-11-18");
  });
});
