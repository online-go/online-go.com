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

import { createKibitzRoomForLiveGame, waitForCompareLayoutStable } from "./kibitz-helpers";

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

    // Before posting, the variation list is empty.
    const variationList = watcherPage.locator(".KibitzVariationList");
    await expect(variationList).toBeVisible({ timeout: 15000 });
    await expect(variationList.locator(".variation-item")).toHaveCount(0);

    // Open the variation composer by clicking the "New variation" button on
    // the main board's transport row (KibitzRoomStage.tsx line 3251: class
    // `kibitz-move-control create-variation-button`, scoped to
    // `.main-board-new-variation-action`). This action is only present
    // while the secondary pane is hidden.
    //
    // The click can be a no-op if `getCurrentGameBaseSnapshotForVariation`
    // (KibitzInner.tsx ~1134) returns null because the watcher's main
    // board controller hasn't fully synced the live game state yet -- in
    // that case the handler shows a transient toast and bails. The button
    // is not visibly disabled while this is true. Retry the click until
    // the secondary pane actually leaves the `collapsed` state.
    const newVariationButton = watcherPage.locator(
        ".board-panel.main-board .main-board-new-variation-action .create-variation-button",
    );
    await expect(newVariationButton).toBeVisible({ timeout: 15000 });
    console.log("[kibitz share-variation] opening secondary analysis board");

    const secondaryBoard = watcherPage.locator(".board-panel.secondary-board");
    await expect(async () => {
        await newVariationButton.click();
        await expect(secondaryBoard).not.toHaveClass(/(^|\s)collapsed(\s|$)/, {
            timeout: 1000,
        });
    }).toPass({ timeout: 20000, intervals: [500, 1000, 2000] });

    await expect(secondaryBoard).toBeVisible();
    await waitForCompareLayoutStable(watcherPage);

    // Place a single move on the secondary (analysis) goban. The source
    // game is 9x9 with stones at E5/G5/E7/G7 from the prelude; C3 is empty.
    // Both boards may carry `.Goban[data-pointers-bound]` in compare mode,
    // so scope the click to the secondary board's pointer-bound goban.
    const secondaryGoban = watcherPage.locator(
        ".board-panel.secondary-board .KibitzBoard.secondary-board-surface .Goban[data-pointers-bound]",
    );
    await expect(secondaryGoban).toBeVisible({ timeout: 15000 });
    console.log("[kibitz share-variation] placing analysis stone at C3");
    await clickOnGobanIntersection(watcherPage, "C3", "9x9", secondaryGoban);

    // Post the variation. The composer renders below the secondary board
    // with a "Variation name..." input and a "Post variation" button
    // (KibitzVariationComposer.tsx line 78). The name field is optional.
    const postVariationButton = await expectOGSClickableByName(watcherPage, /^Post variation$/);
    await expect(postVariationButton).toBeEnabled();
    console.log("[kibitz share-variation] posting variation");
    await postVariationButton.click();

    // Variation appears in the list. Each posted variation renders as a
    // wrapping `.variation-item` div (KibitzVariationList.tsx line 254)
    // containing a `.variation-recall` button; counting wrappers gives a
    // clean 1:1 mapping with variations.
    await expect(variationList.locator(".variation-item")).toHaveCount(1, {
        timeout: 15000,
    });
    console.log("[kibitz share-variation] variation appeared in list");
};
