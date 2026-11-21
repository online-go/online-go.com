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

import { load } from "@helpers";
import { createDemoBoard } from "@helpers/demo-board-utils";
import { clickOnGobanIntersection } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

import { waitForKibitzLayoutStable, waitForKibitzReady } from "./kibitz-helpers";

/*
 * A Kibitz room on a demo board: a presenter places stones on their demo
 * board, a watcher creates a room on it from the board's URL and sees the
 * presenter's stones arrive, the presenter goes on presenting from the room's
 * own board, and the watcher shares a variation of the position.
 */
export const kibitzDemoBoardTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: presenterPage } = await prepareNewUser(
        createContext,
        newTestUsername("kibDemoPres"), // cspell:disable-line
        "test",
    );
    await createDemoBoard(presenterPage, {
        gameName: "E2E Kibitz demo board",
        boardSize: "9x9",
    });
    await presenterPage.waitForURL(/\/demo\/(view\/)?\d+/, { timeout: 15000 });
    const demoMatch = new URL(presenterPage.url()).pathname.match(/\/demo\/(?:view\/)?(\d+)/);
    if (!demoMatch) {
        throw new Error(`Expected a /demo/<id> URL, got ${presenterPage.url()}`);
    }
    const demoUrl = `/demo/${demoMatch[1]}`;

    const presenterGoban = presenterPage.locator(".Goban[data-pointers-bound]").first();
    await expect(presenterGoban).toBeVisible({ timeout: 15000 });
    console.log(`[kibitz demo] presenter placing E5 on ${demoUrl}`);
    await clickOnGobanIntersection(presenterPage, "E5", "9x9", presenterGoban);

    const { userPage: watcherPage } = await prepareNewUser(
        createContext,
        newTestUsername("kibDemoWatch"), // cspell:disable-line
        "test",
    );
    await watcherPage.setViewportSize({ width: 1920, height: 1080 });
    await load(watcherPage, "/kibitz");
    const createRoomButton = watcherPage.locator(".KibitzRoomList-createButton");
    await expect(createRoomButton).toBeVisible({ timeout: 15000 });
    await createRoomButton.click();

    // The picker's ID field takes a demo board URL as well as a game id
    // (KibitzGamePickerOverlay.tsx, id="kibitz-game-picker-input").
    const boardInput = watcherPage.locator("#kibitz-game-picker-input");
    await expect(boardInput).toBeVisible({ timeout: 15000 });
    await boardInput.fill(demoUrl);
    await expect(boardInput).toHaveValue(demoUrl);
    const loadButton = await expectOGSClickableByName(watcherPage, /^Load$/);
    await loadButton.click();

    const roomNameInput = watcherPage.locator("#kibitz-room-name");
    await expect(roomNameInput).toBeVisible({ timeout: 15000 });
    await expect(roomNameInput).not.toHaveValue("");
    // The demo board's named players fill the selection card.
    await expect(watcherPage.locator(".KibitzGamePickerOverlay")).toContainText(
        "Demo Black Player",
    );

    const overlayFooter = watcherPage.locator(".KibitzGamePickerOverlay .buttons");
    const submitCreateButton = overlayFooter.getByRole("button", { name: /^Create room$/ });
    await expect(submitCreateButton).toBeEnabled({ timeout: 15000 });
    const pathBeforeCreate = new URL(watcherPage.url()).pathname;
    await submitCreateButton.click();
    await watcherPage.waitForURL(
        (url) =>
            /\/kibitz\/user-[a-zA-Z0-9-]+$/.test(url.pathname) && url.pathname !== pathBeforeCreate,
        { timeout: 15000 },
    );
    await waitForKibitzReady(watcherPage);
    await waitForKibitzLayoutStable(watcherPage);

    // The demo board's own page now shows that a room is watching it, as a
    // game's page does: the chat's user-list toggle takes the Kibitz icon.
    await expect(
        presenterPage.locator(".chat-input-player-list-toggle .KibitzUsersIcon"),
    ).toBeVisible({ timeout: 15000 });

    // The watcher's board follows the presenter: the stone already placed,
    // then one placed while the watcher is in the room.
    const moveNumber = watcherPage.locator(".MoveNumberControl");
    await expect(moveNumber).toHaveText(/Move 1\b/, { timeout: 15000 });
    await expect(watcherPage.getByRole("tab", { name: /Board chat/ })).toBeVisible();

    console.log("[kibitz demo] presenter placing G5 while the watcher is in the room");
    await clickOnGobanIntersection(presenterPage, "G5", "9x9", presenterGoban);
    await expect(moveNumber).toHaveText(/Move 2\b/, { timeout: 15000 });

    // The presenter joins the room. Their stone on its main board is a move
    // of the demo board, not a draft of their own.
    const roomUrl = new URL(watcherPage.url()).pathname;
    await presenterPage.setViewportSize({ width: 1920, height: 1080 });
    await load(presenterPage, roomUrl);
    await waitForKibitzReady(presenterPage);
    await waitForKibitzLayoutStable(presenterPage);
    await expect(presenterPage.locator(".Kibitz-header-presenting")).toBeVisible({
        timeout: 15000,
    });
    await expect(presenterPage.locator(".MoveNumberControl")).toHaveText(/Move 2\b/, {
        timeout: 15000,
    });
    const presenterRoomGoban = presenterPage.locator(".GobanView-center [data-pointers-bound]");
    await expect(presenterRoomGoban).toBeVisible({ timeout: 15000 });
    console.log("[kibitz demo] presenter placing E7 from the room");
    await clickOnGobanIntersection(presenterPage, "E7", "9x9", presenterRoomGoban);
    await expect(moveNumber).toHaveText(/Move 3\b/, { timeout: 15000 });
    await expect(presenterPage.locator(".KibitzVariationPanel.draft")).toBeHidden();
    await expect(watcherPage.locator(".Kibitz-header-presenting")).toBeHidden();

    // A variation of the presenter's position, posted to the room.
    const variationList = watcherPage.locator(".KibitzVariationList");
    const newVariationButton = variationList.getByRole("button", {
        name: "Variation",
        exact: true,
    });
    const draftPanel = watcherPage.locator(".KibitzVariationPanel.draft");
    await expect(async () => {
        await newVariationButton.click();
        await expect(draftPanel).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20000, intervals: [500, 1000, 2000] });
    await expect(moveNumber).toHaveText(/Move 3\b/, { timeout: 15000 });

    const draftGoban = watcherPage.locator(".GobanView-center [data-pointers-bound]");
    await expect(draftGoban).toBeVisible({ timeout: 15000 });
    await clickOnGobanIntersection(watcherPage, "C3", "9x9", draftGoban);
    await expect(moveNumber).toHaveText(/Move 4\b/, { timeout: 15000 });

    const postVariationButton = await expectOGSClickableByName(watcherPage, /^Post variation$/);
    await expect(postVariationButton).toBeEnabled();
    await postVariationButton.click();

    await expect(variationList.locator(".variation-item")).toHaveCount(1, { timeout: 15000 });
    await expect(watcherPage.locator(".KibitzVariationPanel.variation")).toBeVisible({
        timeout: 15000,
    });
    // The three presenter stones and the variation's own: the variation sits
    // on the presenter's position, not on an empty board.
    await expect(moveNumber).toHaveText(/Move 4\b/, { timeout: 15000 });
};
