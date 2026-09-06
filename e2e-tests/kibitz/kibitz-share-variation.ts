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

    // Start a draft with the "New variation" action in the action bar
    // (KibitzView.tsx, the "kibitz-new-variation" tab).
    //
    // The click can be a no-op if `getCurrentGameBaseSnapshotForVariation`
    // (KibitzInner.tsx) returns null because the watcher's main board
    // controller hasn't fully synced the live game state yet -- in that case
    // the handler shows a transient toast and bails. The button is not
    // visibly disabled while this is true. Retry the click until the draft
    // panel appears in the sidebar.
    const newVariationButton = watcherPage.locator('.GobanView-tab-button[title="New variation"]');
    await expect(newVariationButton).toBeVisible({ timeout: 15000 });
    console.log("[kibitz share-variation] starting a draft");

    const draftPanel = watcherPage.locator(".KibitzVariationPanel.draft");
    await expect(async () => {
        await newVariationButton.click();
        await expect(draftPanel).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20000, intervals: [500, 1000, 2000] });

    await waitForVariationLayoutStable(watcherPage);

    // Pre-flight: the draft board should load with the live game's current
    // state as the variation base -- the four prelude moves E5/G5/E7/G7.
    // Without this check, a broken base could still produce a
    // misleading-but-passing assertion later (e.g. an empty base + C3 click
    // would land at move 1 not 5, which fails the Move-5 check but masks
    // "base was wrong" as "variation didn't load"). cur_move should sit at
    // move 4 and the move tree should contain a node labeled "4".
    const moveNumber = watcherPage.locator(".MoveNumberControl");
    await expect(moveNumber).toHaveText(/Move 4/, { timeout: 15000 });
    await expect(
        watcherPage.locator("#kibitz-move-tree-container svg text", { hasText: /^4$/ }),
    ).toHaveCount(1, { timeout: 15000 });
    console.log("[kibitz share-variation] variation base loaded at Move 4");

    // Place a single move on the draft goban in the center. The source game
    // is 9x9 with stones at E5/G5/E7/G7 from the prelude; C3 is empty. The
    // live game's board sits in the left aside thumbnail and is not
    // interactive, so the center board holds the only pointer-bound layer
    // (the goban marks its event layer with data-pointers-bound).
    const draftGoban = watcherPage.locator(".GobanView-center [data-pointers-bound]");
    await expect(draftGoban).toBeVisible({ timeout: 15000 });
    console.log("[kibitz share-variation] placing analysis stone at C3");
    await clickOnGobanIntersection(watcherPage, "C3", "9x9", draftGoban);
    await expect(moveNumber).toHaveText(/Move 5/, { timeout: 15000 });

    // Post the variation. The composer renders in the draft panel with a
    // "Variation name..." input and a "Post variation" button
    // (KibitzVariationComposer.tsx). The name field is optional.
    const postVariationButton = await expectOGSClickableByName(watcherPage, /^Post variation$/);
    await expect(postVariationButton).toBeEnabled();
    console.log("[kibitz share-variation] posting variation");
    await postVariationButton.click();

    // Variation appears in the list. Each visible posted variation renders
    // as a wrapping `.variation-item` div (KibitzVariationList.tsx)
    // containing a `.variation-recall` button; counting wrappers gives a
    // clean 1:1 mapping with variations.
    await expect(variationList.locator(".variation-item")).toHaveCount(1, {
        timeout: 15000,
    });
    console.log("[kibitz share-variation] variation appeared in list");

    // Wait for the center to move from the draft to the posted variation.
    // This happens asynchronously after the chat round-trip surfaces the new
    // variation in displayedVariations: KibitzInner.tsx then calls
    // onOpenVariation, which rebuilds the center board for it and swaps the
    // sidebar panel to the "variation" mode.
    await expect(watcherPage.locator(".KibitzVariationPanel.variation")).toBeVisible({
        timeout: 15000,
    });

    // Signal A: the move-number control should read "Move 5" -- four prelude
    // moves (E5/G5/E7/G7) plus the C3 variation stone. If the board resets
    // to the variation's base instead of showing the variation, this reads
    // "Move 4" or "Move 0".
    await expect(moveNumber).toHaveText(/Move 5/, { timeout: 15000 });
    console.log("[kibitz share-variation] posted variation shows Move 5");

    // Signal B: the move tree should contain a node labeled "5".
    // SVGRenderer.move_tree_drawStone writes String(node.move_number) into
    // each node's <text> under the default "move-number" numbering mode. If
    // the variation move is missing from the tree, no "5" node exists. The
    // /^5$/ anchor prevents accidental matches against higher move numbers.
    await expect(
        watcherPage.locator("#kibitz-move-tree-container svg text", { hasText: /^5$/ }),
    ).toHaveCount(1, { timeout: 15000 });
    console.log("[kibitz share-variation] variation move (5) present in move tree");
};
