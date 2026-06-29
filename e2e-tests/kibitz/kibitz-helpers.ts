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
import type { BrowserContext } from "@playwright/test";
import type { CreateContextOptions } from "@helpers";
import { load } from "@helpers";
import { newTestUsername, prepareNewUser } from "@helpers/user-utils";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

export async function waitForKibitzReady(page: Page) {
    await expect(page.locator(".Kibitz")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".KibitzRoomStage")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".KibitzRoomStage-boards")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".board-panel.main-board")).toBeVisible({ timeout: 15000 });
    await expect(
        page.locator(".board-panel.main-board .KibitzBoard.main-board-surface"),
    ).toBeVisible({ timeout: 15000 });
    // The inner `.Goban` div selector resolves to multiple elements (the library
    // creates a nested .Goban .Goban structure) and the first match is not the
    // painted one, so `toBeVisible` can wrongly report "hidden" even when the
    // board is fully rendered. The goban renders via SVG -- the <svg> element
    // is the unambiguous "board is painted" signal.
    await expect(
        page.locator(".board-panel.main-board .KibitzBoard.main-board-surface svg").first(),
    ).toBeVisible({ timeout: 15000 });
}

export async function waitForStableRect(page: Page, selector: string, timeout = 5000) {
    // Clear any rect cached on `window` from a prior call against the same
    // selector. The polled callback compares the current rect against
    // window.__kibitz_stable_rect_<selector> and returns true on a match;
    // without this clear, a second call would see the leftover value on its
    // very first poll and return immediately, skipping the intended two-poll
    // stability confirmation.
    await page.evaluate((targetSelector) => {
        delete (window as unknown as Record<string, unknown>)[
            `__kibitz_stable_rect_${targetSelector}`
        ];
    }, selector);

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

export interface KibitzPreludeResult {
    watcherPage: Page;
    blackPlayerPage: Page;
    whitePlayerPage: Page;
    blackUsername: string;
    whiteUsername: string;
    gameId: number;
    roomId: string;
}

/**
 * Prepare a Kibitz room watching a live, in-progress game.
 *
 * Creates three users (two players + one watcher), starts a live 9x9 game
 * between the players with generous time controls so it does not time out
 * during the test, plays a few moves so the game has visible content, then
 * has the watcher open the Kibitz view and create a room pointing at that
 * game.
 *
 * The two player pages are returned so the caller can keep them open; the
 * game must remain in-progress for the duration of the calling test.
 */
export async function createKibitzRoomForLiveGame(
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>,
): Promise<KibitzPreludeResult> {
    console.log("[kibitz prelude] preparing three users (black, white, watcher)");
    // 1. Three users. Role prefixes <= 20 chars per newTestUsername contract.
    const blackUsername = newTestUsername("kibBlk"); // cspell:disable-line
    const { userPage: blackPlayerPage } = await prepareNewUser(
        createContext,
        blackUsername,
        "test",
    );
    const whiteUsername = newTestUsername("kibWht"); // cspell:disable-line
    const { userPage: whitePlayerPage } = await prepareNewUser(
        createContext,
        whiteUsername,
        "test",
    );
    const { userPage: watcherPage } = await prepareNewUser(
        createContext,
        newTestUsername("kibWatch"), // cspell:disable-line
        "test",
    );

    // 2. Live game with generous time controls so it cannot time out during
    //    the test. 9x9 keeps the play loop short. Analysis stays enabled
    //    (default for direct challenges) so the Kibitz create-room rule for
    //    live games is satisfied.
    console.log("[kibitz prelude] starting live 9x9 game between black and white");
    await createDirectChallenge(blackPlayerPage, whiteUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E Kibitz live source game",
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "600",
        timePerPeriod: "60",
        periods: "5",
        ranked: false,
    });
    await acceptDirectChallenge(whitePlayerPage);

    // After accepting, the white player page navigates to /game/<id> or /play/<id>.
    // Capture the game id from the white player URL before continuing.
    await whitePlayerPage.waitForURL(/\/(game|play)\/\d+/, { timeout: 30000 });
    const whitePlayUrl = new URL(whitePlayerPage.url());
    const whitePlayMatch = whitePlayUrl.pathname.match(/\/(game|play)\/(\d+)/);
    if (!whitePlayMatch) {
        throw new Error(
            `Expected /game/<id> or /play/<id> URL on white player page, got ${whitePlayUrl.pathname}`,
        );
    }
    const gameId = Number(whitePlayMatch[2]);

    // Navigate the black player directly to the game. The black player page
    // may be on the opponent's profile page after "Waiting for opponent" closes
    // and may not auto-navigate to the game.
    await load(blackPlayerPage, `/game/${gameId}`);
    await blackPlayerPage
        .locator(".Goban[data-pointers-bound]")
        .waitFor({ state: "visible", timeout: 30000 });

    console.log(`[kibitz prelude] game ${gameId} accepted; playing four opening moves`);
    // 3. A few moves so the game has visible content. Do NOT pass or
    //    resign -- the game must stay in-progress.
    await playMoves(blackPlayerPage, whitePlayerPage, ["E5", "G5", "E7", "G7"], "9x9");

    console.log("[kibitz prelude] watcher opening Kibitz and creating room");
    // 5. Watcher opens Kibitz and creates a room from the captured game id.
    //    Kibitz is a wide multi-pane desktop layout; the default 1280x720
    //    viewport leaves very little room for the board panel. Set a larger
    //    viewport so layout-driven flake is one less thing to worry about.
    await watcherPage.setViewportSize({ width: 1920, height: 1080 });
    await load(watcherPage, "/kibitz");
    await expect(watcherPage.locator(".Kibitz")).toBeVisible({ timeout: 15000 });

    // Open the create-room overlay (KibitzRoomList.tsx, button class
    // "KibitzRoomList-createButton" + text "Create room").
    const createRoomButton = await expectOGSClickableByName(watcherPage, /^Create room$/);
    await createRoomButton.click();

    // Game ID input on the desktop layout (KibitzGamePickerOverlay.tsx,
    // id="kibitz-game-picker-input").
    const gameIdInput = watcherPage.locator("#kibitz-game-picker-input");
    await expect(gameIdInput).toBeVisible({ timeout: 15000 });
    await gameIdInput.fill(String(gameId));
    await expect(gameIdInput).toHaveValue(String(gameId));

    // "Load" button resolves the game and populates the preview.
    const loadButton = await expectOGSClickableByName(watcherPage, /^Load$/);
    await loadButton.click();

    // Wait for the selection card to appear (game resolved) and for the
    // room-name field to be populated by the auto-name effect in the
    // overlay (KibitzGamePickerOverlay.tsx lines 237-249).
    const roomNameInput = watcherPage.locator("#kibitz-room-name");
    await expect(roomNameInput).toBeVisible({ timeout: 15000 });
    await expect(roomNameInput).not.toHaveValue("");

    // Confirm create. Scope to the overlay footer so we don't match the
    // rail "Create room" button (which is also present at this point).
    const overlayFooter = watcherPage.locator(".KibitzGamePickerOverlay-footer");
    await expect(overlayFooter).toBeVisible({ timeout: 15000 });
    const submitCreateButton = overlayFooter
        .getByRole("button", { name: /^Create room$/ })
        .or(overlayFooter.getByRole("link", { name: /^Create room$/ }));
    await expect(submitCreateButton).toBeVisible({ timeout: 15000 });
    await expect(submitCreateButton).toBeEnabled();
    await submitCreateButton.click();

    // After create, KibitzInner navigates to /kibitz/<roomId>; the id is
    // shaped like "user-<pk>" per the Kibitz backend.
    await watcherPage.waitForURL(/\/kibitz\/user-[a-zA-Z0-9-]+/, { timeout: 15000 });
    await waitForKibitzReady(watcherPage);
    await waitForKibitzLayoutStable(watcherPage);

    const roomMatch = watcherPage.url().match(/\/kibitz\/(user-[a-zA-Z0-9-]+)/);
    if (!roomMatch) {
        throw new Error(`Expected /kibitz/user-<id> URL on watcher page, got ${watcherPage.url()}`);
    }
    const roomId = roomMatch[1];
    console.log(`[kibitz prelude] room ${roomId} created and rendered for watcher`);

    return {
        watcherPage,
        blackPlayerPage,
        whitePlayerPage,
        blackUsername,
        whiteUsername,
        gameId,
        roomId,
    };
}
