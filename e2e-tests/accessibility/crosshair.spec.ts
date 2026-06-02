/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ogsTest } from "@helpers";
import { expect, Locator } from "@playwright/test";
import { newTestUsername, registerNewUser } from "@helpers/user-utils";

// Set the value of a controlled React <input> (color / range) and fire the
// events React listens to. Native colour/range inputs can't be driven with
// Playwright's fill(), so we use the native value setter + an input event,
// which is the React-compatible way to simulate user input.
async function setReactInput(input: Locator, value: string) {
    await input.evaluate((el: HTMLInputElement, v: string) => {
        const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
        )?.set;
        setter?.call(el, v);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
}

// The Canvas renderer draws the crosshair on its own dedicated, otherwise-empty
// canvas, so we can read its pixels directly: any visible pixel belongs to a
// crosshair line, and a fully-opaque pixel is exactly the crosshair colour.
async function readCrosshairCanvas(
    canvas: Locator,
): Promise<{ visible: number; color: string | null }> {
    return canvas.evaluate((el: HTMLCanvasElement) => {
        const ctx = el.getContext("2d");
        if (!ctx) {
            return { visible: 0, color: null as string | null };
        }
        const { data } = ctx.getImageData(0, 0, el.width, el.height);
        let visible = 0;
        let color: string | null = null;
        const hex = (n: number) => n.toString(16).padStart(2, "0");
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                visible++;
            }
            if (!color && data[i + 3] === 255) {
                color = `#${hex(data[i])}${hex(data[i + 1])}${hex(data[i + 2])}`;
            }
        }
        return { visible, color };
    });
}

ogsTest.describe("Accessibility: last-move crosshair", () => {
    ogsTest(
        "toggle, colour and thickness drive the crosshair (SVG and old canvas renderer)",
        async ({ createContext }) => {
            // registerNewUser (not prepareNewUser) — we just need a logged-in user;
            // the rank-chooser onboarding step isn't relevant and we go straight to
            // the settings page. A fresh user uses the default SVG renderer, so the
            // crosshair is two <line>s whose stroke / stroke-width we can assert.
            const { userPage: page } = await registerNewUser(
                createContext,
                newTestUsername("Crosshair"), // cspell:disable-line
                "test",
            );

            await page.goto("/settings/accessibility");
            await expect(page.locator(".AccessibilityPreferences")).toBeVisible();

            const toggle = page.locator(".AccessibilityPreferences .Toggle");
            const preview = page.locator(".AccessibilityPreferences .crosshair-preview");
            const colorInput = page.locator('.AccessibilityPreferences input[type="color"]');
            const thicknessInput = page.locator('.AccessibilityPreferences input[type="range"]');
            // The SVG renderer draws the crosshair as <line>s in a .crosshair-layer group.
            const crosshairLine = preview.locator(".crosshair-layer line").first();

            // 1. ENABLED — off by default, no preview; toggling on draws the crosshair.
            await expect(toggle).toHaveClass(/off/);
            await expect(preview).toHaveCount(0);

            await toggle.click();
            await expect(toggle).toHaveClass(/on/);
            await expect(preview).toBeVisible();
            await expect(crosshairLine).toBeAttached();

            // 2. COLOUR — defaults to #1e6bff, and changing it updates the stroke.
            await expect(crosshairLine).toHaveAttribute("stroke", "#1e6bff");

            await setReactInput(colorInput, "#12ab34");
            await expect(colorInput).toHaveValue("#12ab34");
            // The preview re-mounts on change; the new line uses the new colour.
            await expect(preview.locator(".crosshair-layer line").first()).toHaveAttribute(
                "stroke",
                "#12ab34",
            );

            // 3. THICKNESS — increasing it makes the lines thicker (larger stroke-width).
            const thinWidth = parseFloat(
                (await preview
                    .locator(".crosshair-layer line")
                    .first()
                    .getAttribute("stroke-width")) ?? "0",
            );

            await setReactInput(thicknessInput, "0.4");
            await expect(thicknessInput).toHaveValue("0.4");
            await expect
                .poll(async () =>
                    parseFloat(
                        (await preview
                            .locator(".crosshair-layer line")
                            .first()
                            .getAttribute("stroke-width")) ?? "0",
                    ),
                )
                .toBeGreaterThan(thinWidth);

            // 4. OLD CANVAS RENDERER — switch to it via Themes & Visuals. The
            //    crosshair is then drawn on a dedicated <canvas class="CrosshairLayer">
            //    under the stones instead of SVG <line>s.
            await page.goto("/settings/theme");
            const canvasToggle = page
                .locator(".PreferenceLine", { hasText: "Use old canvas goban renderer" })
                .locator(".Toggle");
            await expect(canvasToggle).toHaveClass(/off/);
            await canvasToggle.click();
            await expect(canvasToggle).toHaveClass(/on/);

            await page.goto("/settings/accessibility");
            await expect(preview).toBeVisible();
            const canvasLayer = preview.locator("canvas.CrosshairLayer").first();
            await expect(canvasLayer).toBeAttached();

            // Colour on canvas — the dedicated crosshair canvas's opaque pixels are
            // the crosshair colour (still #12ab34 from the SVG phase above).
            await expect
                .poll(async () => (await readCrosshairCanvas(canvasLayer)).color)
                .toBe("#12ab34");

            // Thickness on canvas — a thinner line paints fewer pixels than a thick one.
            await setReactInput(thicknessInput, "0.02");
            await expect(thicknessInput).toHaveValue("0.02");
            let thinPixels = 0;
            await expect
                .poll(async () => {
                    thinPixels = (await readCrosshairCanvas(canvasLayer)).visible;
                    return thinPixels;
                })
                .toBeGreaterThan(0);

            await setReactInput(thicknessInput, "0.4");
            await expect(thicknessInput).toHaveValue("0.4");
            await expect
                .poll(async () => (await readCrosshairCanvas(canvasLayer)).visible)
                .toBeGreaterThan(thinPixels);

            // Disable again: the preview (and the crosshair) go away.
            await toggle.click();
            await expect(toggle).toHaveClass(/off/);
            await expect(preview).toHaveCount(0);
        },
    );
});
