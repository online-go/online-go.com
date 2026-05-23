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

import { createKibitzRoomForLiveGame } from "./kibitz-helpers";

/*
 * Verify the basic room flow: an authenticated user can create a Kibitz
 * room pointing at a live in-progress game, the room renders correctly
 * (board, room list, presence panel), and the user can post a chat
 * message that shows up in the room stream.
 *
 * Exercises the create-room API path, the watcher navigation into the
 * room, and the comm-server kibitz-<roomId> Redis chat channel.
 */
export const kibitzBasicRoomTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { watcherPage, roomId } = await createKibitzRoomForLiveGame(createContext);

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
};
