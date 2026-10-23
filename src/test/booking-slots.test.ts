import { describe, expect, it } from "vitest";
import { GRADUATION_TIMES, TIMES, joinSlots, splitSlots, toggleSlot, validSlotSelection, slotsOverlap, isDayFull } from "@/lib/site";

describe("Graduation booking slots", () => {
  it("accepts up to three hours but rejects four", () => {
    expect(validSlotSelection("graduation", GRADUATION_TIMES.slice(0, 3))).toBe(true);
    expect(validSlotSelection("graduation", GRADUATION_TIMES.slice(0, 4))).toBe(false);
    expect(toggleSlot("graduation", GRADUATION_TIMES.slice(0, 3), "10:00 – 11:00")).toEqual(GRADUATION_TIMES.slice(0, 3));
  });
  it("allows deselection and non-consecutive hours", () => {
    expect(toggleSlot("graduation", ["07:00 – 08:00"], "07:00 – 08:00")).toEqual([]);
    expect(validSlotSelection("graduation", ["07:00 – 08:00", "10:00 – 11:00", "17:00 – 18:00"])).toBe(true);
  });
  it("retains the 07:00 to 18:00 graduation window", () => {
    expect(GRADUATION_TIMES[0]).toBe("07:00 – 08:00");
    expect(GRADUATION_TIMES.at(-1)).toBe("17:00 – 18:00");
    expect(validSlotSelection("graduation", ["18:00 – 19:00"])).toBe(false);
  });
  it("keeps other services single-slot", () => {
    expect(validSlotSelection("casual", TIMES.slice(0, 2))).toBe(false);
    expect(toggleSlot("casual", TIMES.slice(0, 1), "Full day")).toEqual(["Full day"]);
  });
  it("preserves all selected hours without blocking gaps", () => {
    const saved = joinSlots(["07:00 – 08:00", "10:00 – 11:00", "17:00 – 18:00"]);
    expect(saved.length).toBeLessThanOrEqual(60);
    expect(splitSlots(saved)).toHaveLength(3);
    expect(slotsOverlap(saved, "10:00 – 11:00")).toBe(true);
    expect(slotsOverlap(saved, "08:00 – 09:00")).toBe(false);
    expect(slotsOverlap(saved, "Morning (8am – 12pm)")).toBe(true);
    expect(isDayFull([saved])).toBe(false);
    expect(isDayFull([joinSlots(["07:00 – 08:00", ...TIMES.slice(0, 4)])])).toBe(true);
  });
});