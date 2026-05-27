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
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves, resignActiveGame } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

import { createKibitzRoomForLiveGame } from "./kibitz-helpers";

/*
 * Verify the basic room flow end-to-end:
 *
 *   1. An authenticated user can create a Kibitz room pointing at a live
 *      in-progress game, the room renders correctly, and the user can post
 *      a chat message that shows up in the room stream.
 *   2. The room owner can change the watched game: the players end their
 *      first game, start a fresh one, and the owner switches the room's
 *      board via the settings popover -> game picker overlay -> Change board
 *      flow (POST /api/v1/kibitz/rooms/:id/change-board).
 *
 * Exercises the create-room API path, the comm-server kibitz-<roomId>
 * Redis chat channel, and the change-board endpoint plus its UIPush
 * propagation back to the watcher's room view.
 */
export const kibitzBasicRoomTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { watcherPage, blackPlayerPage, whitePlayerPage, whiteUsername, roomId } =
        await createKibitzRoomForLiveGame(createContext);

    // URL ends up at /kibitz/<roomId>.
    expect(watcherPage.url()).toMatch(new RegExp(`/kibitz/${roomId}$`));

    // Positive functional assertions on what the watcher sees. The goban
    // renders as SVG; the <svg> element under the main-board surface is the
    // unambiguous "board is painted" signal (the wrapping .Goban div has
    // multiple matches and the first one is an empty placeholder).
    await expect(watcherPage.locator(".KibitzRoomStage")).toBeVisible();
    await expect(
        watcherPage.locator(".board-panel.main-board .KibitzBoard.main-board-surface svg").first(),
    ).toBeVisible();
    await expect(watcherPage.locator(".KibitzPresence")).toBeVisible();

    // The active room is highlighted in the rail (KibitzRoomList.tsx adds
    // the "active" class to the item matching the active room id).
    await expect(watcherPage.locator(".KibitzRoomList-item.active")).toHaveCount(1);

    // Post a chat message and verify it renders in the room stream.
    const message = `e2e kibitz chat ${Date.now()}`;
    console.log(`[kibitz basic-room] sending chat: "${message}"`);

    // Composer lives inside the room pane of KibitzSharedStreamPanel.
    // The input id is `kibitz-chat-input-<roomId>` (KibitzSharedStreamPanel.tsx
    // line 873) and submission is via Enter -- the onKeyPress handler trims
    // the value and emits onSendMessage on Enter without Shift, then clears
    // the input (lines 704-721).
    const chatInput = watcherPage.locator(`#kibitz-chat-input-${roomId}`);
    await expect(chatInput).toBeVisible({ timeout: 15000 });
    await expect(chatInput).toBeEnabled();

    await chatInput.fill(message);
    await expect(chatInput).toHaveValue(message);

    await chatInput.press("Enter");

    // After send the composer clears (input.value = "" on send).
    await expect(chatInput).toHaveValue("");

    // The message appears in the room stream feed
    // (KibitzSharedStreamPanel-roomPane > KibitzSharedStreamPanel-paneFeed).
    const roomFeed = watcherPage.locator(
        ".KibitzSharedStreamPanel-roomPane .KibitzSharedStreamPanel-paneFeed",
    );
    await expect(roomFeed.getByText(message)).toBeVisible({ timeout: 10000 });
    console.log("[kibitz basic-room] chat message rendered in room stream");

    // Phase 2: change the room's watched game. The players end their current
    // game, start a fresh one, and the watcher (room owner) switches the
    // board via the settings popover.

    // The prelude only played 4 moves; OGS gates "resign" behind a 6-move
    // threshold (before that the action is "cancel game", which has a
    // different confirmation dialog that resignActiveGame doesn't match).
    // Play two more moves so the next turn (move 7) is resign-eligible for
    // blackPlayerPage. Coordinates are non-conflicting with the prelude's
    // E5/G5/E7/G7.
    console.log("[kibitz basic-room] playing two more moves so resign is available");
    await playMoves(blackPlayerPage, whitePlayerPage, ["C3", "G3"], "9x9");

    console.log("[kibitz basic-room] black resigning the first game");
    await resignActiveGame(blackPlayerPage);

    // Give the second game a title whose HEAD differs from the prelude's
    // first game ("E2E Kibitz live source game"). The board-subtitle-link
    // assertion below matches a head-anchored regex, so anchoring the
    // distinguishing prefix at character 0 makes the check robust against
    // future text-truncation (the title is currently rendered verbatim but
    // the CSS already truncates visually with ellipsis, and a future
    // refactor could JS-truncate too).
    const secondGameTitleHead = "Kibitz target";
    const secondGameName = `${secondGameTitleHead} (phase 2)`;
    console.log("[kibitz basic-room] starting a second live game between the same players");
    await createDirectChallenge(blackPlayerPage, whiteUsername, {
        ...defaultChallengeSettings,
        gameName: secondGameName,
        boardSize: "9x9",
        speed: "live",
        timeControl: "byoyomi",
        mainTime: "600",
        timePerPeriod: "60",
        periods: "5",
        ranked: false,
    });
    await acceptDirectChallenge(whitePlayerPage);

    // Capture the second game's id from the white player URL, same approach
    // as the prelude.
    await whitePlayerPage.waitForURL(/\/(game|play)\/\d+/, { timeout: 30000 });
    const secondGameUrl = new URL(whitePlayerPage.url());
    const secondGameMatch = secondGameUrl.pathname.match(/\/(game|play)\/(\d+)/);
    if (!secondGameMatch) {
        throw new Error(
            `Expected /game/<id> or /play/<id> URL on white player page after second challenge, got ${secondGameUrl.pathname}`,
        );
    }
    const secondGameId = Number(secondGameMatch[2]);
    console.log(`[kibitz basic-room] second game id: ${secondGameId}`);

    // Open the room settings popover and click "Change live game" -- this is
    // gated on canChangeBoard, which is owner-or-moderator
    // (kibitz/permissions.py:42-50). The watcher created the room, so they
    // have it.
    const gearButton = watcherPage.locator(".board-settings-button");
    await expect(gearButton).toBeVisible({ timeout: 15000 });
    await expect(gearButton).toBeOGSClickable();
    await gearButton.click();

    const popover = watcherPage.locator(".popover-container .KibitzRoomSettingsPopover");
    await expect(popover).toBeVisible({ timeout: 15000 });

    const changeBoardMenuButton = popover.getByRole("button", { name: /^Change live game$/ });
    await expect(changeBoardMenuButton).toBeVisible({ timeout: 15000 });
    await expect(changeBoardMenuButton).toBeOGSClickable();
    console.log("[kibitz basic-room] owner clicking Change live game");
    await changeBoardMenuButton.click();
    // Clicking Change live game closes the popover and opens the game-picker
    // overlay (KibitzRoomStage.tsx:1735-1738 -- close_all_popovers ->
    // onChangeBoard).
    await expect(popover).toBeHidden({ timeout: 15000 });

    // The game-picker overlay is the same component as the create-room flow,
    // in "change-board" mode (KibitzGamePickerOverlay.tsx). The game-id input
    // has the same id (kibitz-game-picker-input); the footer's confirm
    // button reads "Change board" instead of "Create room" in this mode.
    const overlay = watcherPage.locator(".KibitzGamePickerOverlay");
    await expect(overlay).toBeVisible({ timeout: 15000 });

    const gameIdInput = overlay.locator("#kibitz-game-picker-input");
    await expect(gameIdInput).toBeVisible({ timeout: 15000 });
    await gameIdInput.fill(String(secondGameId));
    await expect(gameIdInput).toHaveValue(String(secondGameId));

    const loadButton = await expectOGSClickableByName(watcherPage, /^Load$/);
    await loadButton.click();

    // Wait for the overlay's footer confirm button to enable, then click. The
    // disabled state lifts once the picker has resolved the entered game id
    // and built the preview (canChangeBoard becomes true in the component).
    const confirmChangeButton = overlay.getByRole("button", { name: /^Change board$/ });
    await expect(confirmChangeButton).toBeVisible({ timeout: 15000 });
    await expect(confirmChangeButton).toBeEnabled({ timeout: 15000 });
    console.log("[kibitz basic-room] confirming Change board");
    await confirmChangeButton.click();

    // After the POST /change-board round-trip and the board-changed UIPush
    // (KibitzRoomChangeBoard.post:329) propagate, the header's
    // .board-subtitle-link href should reference the new game id
    // (KibitzRoomStage.tsx:5281: href={`/game/${mainGame.game_id}`}). Two
    // assertions on the same element: the structural href attribute (proves
    // the room is bound to the new game's id) and the content-level text
    // (proves the new game's metadata, not just its id, made it through).
    // The text assertion uses a head-anchored regex so a future visual or
    // JS truncation of the title would not silently weaken the check.
    const boardSubtitleLink = watcherPage.locator(".board-subtitle-link");
    await expect(boardSubtitleLink).toHaveAttribute("href", `/game/${secondGameId}`, {
        timeout: 15000,
    });
    await expect(boardSubtitleLink).toHaveText(new RegExp(`^${secondGameTitleHead}`), {
        timeout: 15000,
    });
    console.log(`[kibitz basic-room] room now watching game ${secondGameId}`);
};
