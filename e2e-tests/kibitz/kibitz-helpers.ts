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

import { expect, Page } from "@playwright/test";

export async function waitForKibitzReady(page: Page) {
    await expect(page.locator(".Kibitz")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".KibitzRoomStage")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".KibitzRoomStage-boards")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".board-panel.main-board")).toBeVisible({ timeout: 15000 });
    await expect(
        page.locator(".board-panel.main-board .KibitzBoard.main-board-surface"),
    ).toBeVisible({ timeout: 15000 });
    await expect(
        page.locator(".board-panel.main-board .KibitzBoard.main-board-surface .Goban").first(),
    ).toBeVisible({ timeout: 15000 });
}

export async function waitForStableRect(page: Page, selector: string, timeout = 5000) {
    await page.waitForFunction(
        ({ targetSelector }) => {
            const element = document.querySelector(targetSelector);
            if (!element) {
                return false;
            }

            const rect = element.getBoundingClientRect();
            const current = {
                top: Math.round(rect.top),
                left: Math.round(rect.left),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            };

            const key = `__kibitz_stable_rect_${targetSelector}`;
            const store = window as unknown as Record<string, unknown>;
            const previous = store[key] as typeof current | undefined;
            store[key] = current;

            return (
                previous != null &&
                previous.top === current.top &&
                previous.left === current.left &&
                previous.width === current.width &&
                previous.height === current.height &&
                current.width > 0 &&
                current.height > 0
            );
        },
        { targetSelector: selector },
        { timeout },
    );
}

export async function waitForKibitzLayoutStable(page: Page) {
    await waitForStableRect(page, ".KibitzRoomStage-boards");
    await waitForStableRect(page, ".board-panel.main-board .board-fit-slot");
}

export async function waitForCompareLayoutStable(page: Page) {
    await waitForKibitzLayoutStable(page);
    await waitForStableRect(page, ".board-panel.secondary-board .board-fit-slot");
}
