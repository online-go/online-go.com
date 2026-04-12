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

import { BrowserContext, expect } from "@playwright/test";
import { log } from "@helpers/logger";

export const puzzleTurnIndicatorTest = async ({
    createContext,
}: {
    createContext: (options?: any) => Promise<BrowserContext>;
}) => {
    log("=== Puzzle Turn Indicator Test (Anonymous) ===");

    const userContext = await createContext();
    const userPage = await userContext.newPage();

    await userPage.goto("/puzzle/1");

    const turnIndicator = userPage.locator(".game-state");

    await expect(turnIndicator).toBeVisible({ timeout: 15000 });

    await expect(turnIndicator).toHaveText(/Black to move|White to move/);

    const text = await turnIndicator.textContent();
    log(`Turn indicator found: "${text}"`);

    log("=== Puzzle Turn Indicator Test Complete ===");
};
