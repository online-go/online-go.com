/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { expect } from "@playwright/test";
import { ogsTest, load } from "@helpers";

const compactSizes = [
    [844, 390],
    [932, 430],
] as const;

ogsTest.describe("@Kibitz responsive layout", () => {
    for (const [width, height] of compactSizes) {
        ogsTest(`keeps the compact board visible at ${width}x${height}`, async ({ page }) => {
            await page.setViewportSize({ width, height });
            await load(page, "/kibitz/preset-english-chat-live");
            await expect(page.locator(".GobanView.Kibitz")).toBeVisible();

            const layout = await page.locator(".GobanView.Kibitz").evaluate((root) => {
                const board = root.querySelector<HTMLElement>(".Goban");
                const rect = board?.getBoundingClientRect();
                return {
                    compact: root.classList.contains("compactHorizontal"),
                    hasDesktopAside: Boolean(root.querySelector(".GobanView-left-aside")),
                    hasDesktopSidebar: Boolean(root.querySelector(".GobanView-sidebar")),
                    hasNavigation: Boolean(root.querySelector(".GobanView-tab-bar")),
                    board: rect
                        ? { width: rect.width, height: rect.height, bottom: rect.bottom }
                        : null,
                    visibleHeight: window.visualViewport?.height ?? window.innerHeight,
                };
            });

            expect(layout.compact).toBe(true);
            expect(layout.hasDesktopAside).toBe(false);
            expect(layout.hasDesktopSidebar).toBe(false);
            expect(layout.hasNavigation).toBe(true);
            expect(layout.board?.width).toBeGreaterThan(0);
            expect(layout.board?.bottom).toBeLessThanOrEqual(layout.visibleHeight + 1);
        });
    }
});
