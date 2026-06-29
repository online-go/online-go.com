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

    // Pre-flight: the secondary (analysis) board should load with the live
    // game's current state as the variation base -- the four prelude moves
    // E5/G5/E7/G7. Without this check, a broken base could still produce a
    // misleading-but-passing assertion later (e.g. an empty base + C3 click
    // would land at move 1 not 5, which fails the Move-5 check but masks
    // "base was wrong" as "variation didn't load"). cur_move should sit at
    // move 4 and the move tree should contain a node labeled "4".
    await expect(secondaryBoard.locator(".move-number")).toHaveText("Move 4", {
        timeout: 15000,
    });
    await expect(
        secondaryBoard.locator("#kibitz-secondary-move-tree-container svg text", {
            hasText: /^4$/,
        }),
    ).toHaveCount(1, { timeout: 15000 });
    console.log("[kibitz share-variation] variation base loaded at Move 4");

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

    // Wait for the secondary pane to transition from "drafting" into the
    // "posted-variation" branch (KibitzRoomStage.tsx:3429+). This happens
    // asynchronously after the chat round-trip surfaces the new variation in
    // displayedVariations: KibitzInner.tsx:1846-1871 then calls
    // onOpenVariation, which puts the pane into that branch. Gating on this
    // class avoids reading the drafting subtree's move-tree SVG -- both
    // branches mount a container with the same id.
    await expect(secondaryBoard.locator(".board-content-posted-variation")).toBeVisible({
        timeout: 15000,
    });

    // Bug #1 signal A: the secondary board's move-number control should read
    // "Move 5" -- four prelude moves (E5/G5/E7/G7) plus the C3 variation
    // stone. If the board resets to the variation's base instead of showing
    // the variation, this reads "Move 0". KibitzBoardControls.tsx:206
    // renders the .move-number span; the secondary board's "full" variant
    // has only one.
    await expect(secondaryBoard.locator(".move-number")).toHaveText("Move 5", {
        timeout: 15000,
    });
    console.log("[kibitz share-variation] secondary board shows Move 5");

    // Bug #1 signal B: the secondary board's move tree should contain a node
    // labeled "5". SVGRenderer.move_tree_drawStone
    // (submodules/goban/src/Goban/SVGRenderer.ts:4577-4590) writes
    // String(node.move_number) into each node's <text> under the default
    // "move-number" numbering mode. If the variation move is missing from
    // the tree, no "5" node exists. The /^5$/ anchor prevents accidental
    // matches against future higher move numbers (e.g. "15").
    await expect(
        secondaryBoard.locator("#kibitz-secondary-move-tree-container svg text", {
            hasText: /^5$/,
        }),
    ).toHaveCount(1, { timeout: 15000 });
    console.log("[kibitz share-variation] variation move (5) present in move tree");
};
