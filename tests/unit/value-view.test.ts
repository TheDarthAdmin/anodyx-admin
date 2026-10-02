import { describe, expect, it } from "vitest";

import { humanize, valuePairs } from "@/components/support/value-view";

describe("valuePairs", () => {
  it("pairs values with their units, including temperature ranges", () => {
    expect(
      valuePairs({
        voltValue: 42,
        voltUnit: "V",
        temperatureRangeLowerBoundaryValue: -10,
        temperatureRangeLowerBoundaryUnit: "°C",
      }),
    ).toEqual([
      ["Volt", "42 V"],
      ["Temperature Range Lower Boundary", "-10 °C"],
    ]);
  });

  it("handles several values per unit", () => {
    expect(valuePairs({ wattUnit: "W", wattValueAt20PercentStateOfCharge: 1, wattValueAt80PercentStateOfCharge: 2 })).toEqual([
      ["Watt At 20 Percent State Of Charge", "1 W"],
      ["Watt At 80 Percent State Of Charge", "2 W"],
    ]);
  });

  it("pairs a single unit with a differently named value", () => {
    expect(valuePairs({ percentUnit: "%", percentageValue: 25 })?.[0][1]).toBe("25 %");
    expect(valuePairs({ degreeCelsiusUnit: "°C", celsiusValue: 60 })?.[0][1]).toBe("60 °C");
    expect(valuePairs({ ampereHourMiliamperehourUnit: "Ah", amperehourMiliamperehourValue: 14 })?.[0][1]).toBe("14 Ah");
  });

  it("gives up on objects that are not value/unit shaped", () => {
    expect(valuePairs({ name: "Greencell", postalAddress: "Shenzhen" })).toBeNull();
    expect(valuePairs({ percentUnit: "%", other: 3 })).toBeNull();
  });

  it("humanizes field keys", () => {
    expect(humanize("performanceAndDurability.ratedCapacity")).toBe("Rated Capacity");
  });
});
