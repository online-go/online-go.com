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
                    hasMobilePlayerBars: root.querySelectorAll(".GobanView-player-bar").length > 0,
                    playerCardWidths: Array.from(
                        root.querySelectorAll<HTMLElement>(
                            ".Kibitz-compact-player-cards .player-container",
                        ),
                    ).map((card) => card.getBoundingClientRect().width),
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
            expect(layout.hasMobilePlayerBars).toBe(false);
            expect(layout.playerCardWidths).toHaveLength(2);
            expect(layout.playerCardWidths[0]).toBeCloseTo(layout.playerCardWidths[1], 0);
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

            await page.getByTitle("Rooms", { exact: true }).click();
            const body = page.locator(".GobanView-sidebar-content");
            const playerCards = page.locator(".Kibitz-compact-player-cards");
            const moveControls = page.locator(".MoveNumberControl");
            const tabs = page.locator(".GobanView-tab-bar");
            await expect(body).toHaveJSProperty("scrollHeight", expect.any(Number));
            const beforeScroll = await playerCards.boundingBox();
            const boardBeforeScroll = await page.locator(".Goban").boundingBox();
            await body.evaluate((element) => {
                element.scrollTop = element.scrollHeight;
            });
            const afterScroll = await playerCards.boundingBox();
            expect(afterScroll?.bottom ?? 0).toBeLessThanOrEqual(
                (await body.boundingBox())?.y ?? 0,
            );
            expect(await moveControls.isVisible()).toBe(true);
            expect(await tabs.isVisible()).toBe(true);
            expect(await page.locator(".Goban").boundingBox()).toEqual(boardBeforeScroll);
            expect(beforeScroll).not.toBeNull();
        });
    }
});
