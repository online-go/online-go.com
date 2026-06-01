import * as React from "react";
import { render } from "@testing-library/react";
import * as preferences from "@/lib/preferences";
import { AccessibilityPreferences } from "./AccessibilityPreferences";

describe("AccessibilityPreferences", () => {
    afterEach(() => {
        preferences.set("accessibility.last-move-crosshair", false);
    });

    test("color and thickness controls are hidden when the crosshair is disabled", () => {
        preferences.set("accessibility.last-move-crosshair", false);
        const { container } = render(<AccessibilityPreferences />);
        expect(container.querySelector('input[type="color"]')).toBeNull();
        expect(container.querySelector('input[type="range"]')).toBeNull();
    });

    test("color and thickness controls are shown when the crosshair is enabled", () => {
        preferences.set("accessibility.last-move-crosshair", true);
        const { container } = render(<AccessibilityPreferences />);
        expect(container.querySelector('input[type="color"]')).not.toBeNull();
        expect(container.querySelector('input[type="range"]')).not.toBeNull();
    });
});
