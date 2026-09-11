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
import { BrowserContext, expect, test } from "@playwright/test";
import {
    acceptDirectChallenge,
    createDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves, resignActiveGame } from "@helpers/game-utils";
import { expectOGSClickableByName } from "@helpers/matchers";

import { createKibitzRoomForLiveGame, waitForKibitzReady } from "./kibitz-helpers";

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
    // Two live games are played end to end (signup, challenge, moves, resign,
    // second challenge) before the board change is verified, which is longer
    // than the default test timeout allows.
    test.setTimeout(6 * 60 * 1000);
    const { watcherPage, blackPlayerPage, whitePlayerPage, whiteUsername, roomId } =
        await createKibitzRoomForLiveGame(createContext);

    // URL ends up at /kibitz/<roomId>.
    expect(watcherPage.url()).toMatch(new RegExp(`/kibitz/${roomId}$`));

    // Positive functional assertions on what the watcher sees: the room is
    // laid out on GobanView with the board painted in the center, a player
    // bar above and below it, and the two-tab chat in the sidebar.
    await expect(watcherPage.locator(".GobanView.Kibitz")).toBeVisible();
    await expect(
        watcherPage.locator(".GobanView-center .goban-container svg").first(),
    ).toBeVisible();
    await expect(watcherPage.locator(".GobanView-player-bar.top .PlayerBar")).toBeVisible();
    await expect(watcherPage.locator(".GobanView-player-bar.bottom .PlayerBar")).toBeVisible();
    await expect(watcherPage.locator(".KibitzChatPanel")).toBeVisible();

    // The active room is highlighted in the left aside (KibitzRoomList.tsx
    // adds the "active" class to the item matching the active room id).
    await expect(watcherPage.locator(".KibitzRoomList-item.active")).toHaveCount(1);

    // Post a chat message and verify it renders in the room chat.
    const message = `e2e kibitz chat ${Date.now()}`;
    console.log(`[kibitz basic-room] sending chat: "${message}"`);

    // The composer belongs to the "Kibitz chat" tab of KibitzChatPanel, the
    // default tab. The input id is `kibitz-chat-input-<roomId>` and Enter
    // sends: the onKeyPress handler trims the value, sends it on the room
    // channel, then clears the input.
    const kibitzChatTab = watcherPage.getByRole("tab", { name: /Kibitz chat/ });
    await expect(kibitzChatTab).toBeVisible({ timeout: 15000 });
    await kibitzChatTab.click();
    const chatInput = watcherPage.locator(`#kibitz-chat-input-${roomId}`);
    await expect(chatInput).toBeVisible({ timeout: 15000 });
    await expect(chatInput).toBeEnabled();

    await chatInput.fill(message);
    await expect(chatInput).toHaveValue(message);

    await chatInput.press("Enter");

    // After send the composer clears (input.value = "" on send).
    await expect(chatInput).toHaveValue("");

    // The message appears in the chat log.
    const roomFeed = watcherPage.locator(".KibitzChatPanel-log");
    await expect(roomFeed.getByText(message)).toBeVisible({ timeout: 10000 });
    console.log("[kibitz basic-room] chat message rendered in room chat");

    // Phase 2: change the room's watched game. The players end their current
    // game, start a fresh one, and the watcher (room owner) switches the
    // board via the settings popover.

    // The prelude only played 4 moves; OGS keeps "cancel game" (a different
    // confirmation dialog from the one resignActiveGame expects) available
    // while the game is within its first moves. Play four more so the game
    // is well past that window before blackPlayerPage resigns. Coordinates
    // are non-conflicting with the prelude's E5/G5/E7/G7.
    console.log("[kibitz basic-room] playing four more moves so resign is available");
    await playMoves(blackPlayerPage, whitePlayerPage, ["C3", "G3", "D2", "F2"], "9x9");

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
    // The white page is still on the finished first game; accepting loads
    // the home page and clicks Accept there. The challenge can land after
    // the home page's first render, so retry until the accept navigates.
    await expect(async () => {
        await acceptDirectChallenge(whitePlayerPage);
        await whitePlayerPage.waitForURL(/\/(game|play)\/\d+/, { timeout: 10000 });
    }).toPass({ timeout: 60000, intervals: [1000, 2000] });

    // Capture the second game's id from the white player URL, same approach
    // as the prelude.
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
    const gearButton = watcherPage.locator('.GobanView-tab-button[title="More actions"]');
    await expect(gearButton).toBeVisible({ timeout: 15000 });
    await expect(gearButton).toBeOGSClickable();
    await gearButton.click();

    const popover = watcherPage.locator(".KibitzMoreActionsPopover");
    await expect(popover).toBeVisible({ timeout: 15000 });

    const changeBoardMenuButton = popover.getByRole("button", { name: /Change live game$/ });
    await expect(changeBoardMenuButton).toBeVisible({ timeout: 15000 });
    await expect(changeBoardMenuButton).toBeOGSClickable();
    console.log("[kibitz basic-room] owner clicking Change live game");
    await changeBoardMenuButton.click();
    // Clicking Change live game closes the popover and opens the game-picker
    // overlay (KibitzView.tsx onRequestChangeBoard -> close -> onChangeBoard).
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
    // propagate, the room header carries the new game id (KibitzView.tsx
    // puts data-game-id on the room title), the More actions menu links to
    // the new game's SGF, and Game information shows the new game's name.
    // Three assertions: the structural id on the header (proves the room is
    // bound to the new game), the SGF href (proves the live controller was
    // rebuilt for it), and the game name (proves the new game's metadata,
    // not just its id, made it through). The text assertion uses a
    // head-anchored regex so a future truncation of the title would not
    // silently weaken the check.
    await expect(watcherPage.locator(".Kibitz-room-title")).toHaveAttribute(
        "data-game-id",
        String(secondGameId),
        { timeout: 15000 },
    );
    await waitForKibitzReady(watcherPage);
    await expect(watcherPage.locator(".PlayerBar.white .PlayerBar-name")).toContainText(
        whiteUsername,
    );

    const moreActionsButton = watcherPage.locator('.GobanView-tab-button[title="More actions"]');
    await expect(moreActionsButton).toBeOGSClickable();
    await moreActionsButton.click();
    const moreActions = watcherPage.locator(".popover-container .KibitzMoreActionsPopover");
    await expect(moreActions).toBeVisible({ timeout: 15000 });
    await expect(moreActions.locator("a", { hasText: "Download SGF" })).toHaveAttribute(
        "href",
        new RegExp(`/games/${secondGameId}/sgf$`),
    );
    // The menu items carry an icon before their label, so match by text.
    await moreActions.locator("button", { hasText: "Game information" }).click();
    const gameInfo = watcherPage.locator(".GameInfoModal");
    await expect(gameInfo).toBeVisible({ timeout: 15000 });
    await expect(gameInfo.locator("h2")).toHaveText(new RegExp(`^${secondGameTitleHead}`));
    await gameInfo.locator(".buttons button", { hasText: "Close" }).click();
    await expect(gameInfo).toBeHidden({ timeout: 15000 });
    console.log(`[kibitz basic-room] room now watching game ${secondGameId}`);
};
