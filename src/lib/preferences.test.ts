import * as preferences from "@/lib/preferences";

describe("last-move crosshair preferences", () => {
    test("defaults are disabled, blue, thickness 0.1", () => {
        expect(preferences.get("accessibility.last-move-crosshair")).toBe(false);
        expect(preferences.get("accessibility.last-move-crosshair-color")).toBe("#1e6bff");
        expect(preferences.get("accessibility.last-move-crosshair-thickness")).toBe(0.1);
    });
});
