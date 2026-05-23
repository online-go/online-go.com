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
 * Verify that an authenticated user can create a Kibitz room pointing at
 * a live in-progress game and is navigated into the room with the board,
 * room list, and presence panel rendering correctly.
 */
export const kibitzCreateRoomTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { watcherPage, roomId } = await createKibitzRoomForLiveGame(createContext);

    // URL ends up at /kibitz/<roomId>.
    expect(watcherPage.url()).toMatch(new RegExp(`/kibitz/${roomId}$`));

    // Positive functional assertions on what the watcher sees.
    await expect(watcherPage.locator(".KibitzRoomStage")).toBeVisible();
    await expect(
        watcherPage.locator(".board-panel.main-board .KibitzBoard.main-board-surface .Goban"),
    ).toBeVisible();
    await expect(watcherPage.locator(".KibitzPresence")).toBeVisible();

    // The active room is highlighted in the rail (KibitzRoomList.tsx adds
    // the "active" class to the item matching the active room id).
    await expect(watcherPage.locator(".KibitzRoomList-item.active")).toHaveCount(1);
};
