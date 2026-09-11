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

// (No seeded data in use)

import type { CreateContextOptions } from "@helpers";
import { BrowserContext, expect } from "@playwright/test";

import { expectOGSClickableByName } from "@helpers/matchers";
import { clickOnGobanIntersection } from "@helpers/game-utils";

import { createKibitzRoomForLiveGame, waitForVariationLayoutStable } from "./kibitz-helpers";

/*
 * Verify that an authenticated user can share an analysis variation in a
 * Kibitz room and the variation appears in the room's variation list.
 *
 * Exercises the typed-body chat path (SerializedAnalysisChatLineBody with
 * embedded game_id) end-to-end through comm-server, plus the client-side
 * derivation of the variation list from chat history.
 */
export const kibitzShareVariationTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { watcherPage } = await createKibitzRoomForLiveGame(createContext);

    // Before posting, the variation list in the left aside is empty.
    const variationList = watcherPage.locator(".KibitzVariationList");
    await expect(variationList).toBeVisible({ timeout: 15000 });
    await expect(variationList.locator(".variation-item")).toHaveCount(0);

    // The New variation action is a no-op, with a transient toast, until the
    // watcher's main board has a usable trunk, and it is not disabled while
    // that is true. Retry until the draft panel appears.
    const newVariationButton = watcherPage.locator('.GobanView-tab-button[title="New variation"]');
    await expect(newVariationButton).toBeVisible({ timeout: 15000 });
    console.log("[kibitz share-variation] starting a draft");

    const draftPanel = watcherPage.locator(".KibitzVariationPanel.draft");
    await expect(async () => {
        await newVariationButton.click();
        await expect(draftPanel).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20000, intervals: [500, 1000, 2000] });

    await waitForVariationLayoutStable(watcherPage);

    // The draft must start from the live game's current position, the four
    // prelude moves. Checking that here keeps a wrong base from being read
    // later as "the variation did not load".
    const moveNumber = watcherPage.locator(".MoveNumberControl");
    await expect(moveNumber).toHaveText(/Move 4/, { timeout: 15000 });
    await expect(
        watcherPage.locator("#kibitz-move-tree-container svg text", { hasText: /^4$/ }),
    ).toHaveCount(1, { timeout: 15000 });
    console.log("[kibitz share-variation] variation base loaded at Move 4");

    // C3 is empty on this 9x9. The thumbnail board is not interactive, so the
    // centre holds the only pointer-bound layer.
    const draftGoban = watcherPage.locator(".GobanView-center [data-pointers-bound]");
    await expect(draftGoban).toBeVisible({ timeout: 15000 });
    console.log("[kibitz share-variation] placing analysis stone at C3");
    await clickOnGobanIntersection(watcherPage, "C3", "9x9", draftGoban);
    await expect(moveNumber).toHaveText(/Move 5/, { timeout: 15000 });

    // Post it. The name field is optional.
    const postVariationButton = await expectOGSClickableByName(watcherPage, /^Post variation$/);
    await expect(postVariationButton).toBeEnabled();
    console.log("[kibitz share-variation] posting variation");
    await postVariationButton.click();

    // One `.variation-item` per visible variation.
    await expect(variationList.locator(".variation-item")).toHaveCount(1, {
        timeout: 15000,
    });
    console.log("[kibitz share-variation] variation appeared in list");

    // The centre swaps from the draft to the posted variation once the chat
    // round-trip surfaces it.
    await expect(watcherPage.locator(".KibitzVariationPanel.variation")).toBeVisible({
        timeout: 15000,
    });

    // Four prelude moves plus the C3 stone. A board that reset to the base
    // would read Move 4 or Move 0.
    await expect(moveNumber).toHaveText(/Move 5/, { timeout: 15000 });
    console.log("[kibitz share-variation] posted variation shows Move 5");

    // And the move tree carries the node, anchored so 15 cannot match.
    await expect(
        watcherPage.locator("#kibitz-move-tree-container svg text", { hasText: /^5$/ }),
    ).toHaveCount(1, { timeout: 15000 });
    console.log("[kibitz share-variation] variation move (5) present in move tree");
};
