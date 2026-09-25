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
                    hasRightColumn: Boolean(root.querySelector(".GobanView-sidebar")),
                    hasNavigation: Boolean(root.querySelector(".GobanView-tab-bar")),
                    hasRightPlayerBars:
                        root.querySelectorAll(".GobanView-sidebar .GobanView-player-bar").length ===
                        2,
                    boardLeftOfRightColumn: (() => {
                        const board = root.querySelector<HTMLElement>(".Goban");
                        const right = root.querySelector<HTMLElement>(".GobanView-sidebar");
                        return Boolean(
                            board &&
                            right &&
                            board.getBoundingClientRect().right <=
                                right.getBoundingClientRect().left,
                        );
                    })(),
                    board: rect
                        ? { width: rect.width, height: rect.height, bottom: rect.bottom }
                        : null,
                    visibleHeight: window.visualViewport?.height ?? window.innerHeight,
                };
            });

            expect(layout.compact).toBe(true);
            expect(layout.hasDesktopAside).toBe(false);
            expect(layout.hasRightColumn).toBe(true);
            expect(layout.hasNavigation).toBe(true);
            expect(layout.hasRightPlayerBars).toBe(true);
            expect(layout.boardLeftOfRightColumn).toBe(true);
            expect(layout.board?.width).toBeGreaterThan(0);
            expect(layout.board?.bottom).toBeLessThanOrEqual(layout.visibleHeight + 1);

            const initialBoard = await page.locator(".Goban").boundingBox();
            for (const title of ["Game chat", "Kibitz chat", "Rooms", "Variations", "People"]) {
                await page.getByTitle(title, { exact: true }).click();
                await expect(page.locator(".GobanView.Kibitz.compactHorizontal")).toBeVisible();
                await expect(page.locator(".Goban")).toBeVisible();
                const board = await page.locator(".Goban").boundingBox();
                expect(board).not.toBeNull();
                expect(board?.x).toBeCloseTo(initialBoard?.x ?? 0, 0);
                expect(board?.y).toBeCloseTo(initialBoard?.y ?? 0, 0);
                expect(board?.width).toBeCloseTo(initialBoard?.width ?? 0, 0);
            }
        });
    }
});
