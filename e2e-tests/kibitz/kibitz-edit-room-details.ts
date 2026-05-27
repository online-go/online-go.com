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
import { newTestUsername, prepareNewUser } from "@helpers/user-utils";

import {
    createKibitzRoomForLiveGame,
    waitForKibitzLayoutStable,
    waitForKibitzReady,
} from "./kibitz-helpers";

/*
 * Verify that the owner of a Kibitz room can rename it and edit its
 * description (PUT /api/v1/kibitz/rooms/:id), and that a different
 * authenticated, non-owner user cannot -- the settings popover does not
 * expose the "Edit room details" affordance for them.
 *
 * Exercises the rename round-trip end-to-end and the server-driven
 * permission gating (compute_permissions -> can_edit_room) reflected in the
 * popover UI (KibitzRoomSettingsPopover.tsx).
 */
export const kibitzEditRoomDetailsTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { watcherPage, roomId } = await createKibitzRoomForLiveGame(createContext);

    // The desktop room header renders a gear button to the left of the room
    // title (KibitzRoomStage.tsx:5254 .board-settings-button). Click it to
    // open the room settings popover.
    const gearButton = watcherPage.locator(".board-settings-button");
    await expect(gearButton).toBeVisible({ timeout: 15000 });
    await expect(gearButton).toBeOGSClickable();
    console.log("[kibitz edit-room-details] opening room settings popover as owner");
    await gearButton.click();

    // The popover renders at the document root inside .popover-container
    // (lib/popover.ts) with the KibitzRoomSettingsPopover content. Scoping
    // further assertions to the popover avoids matching the page header
    // elements (which also contain the room title).
    const popover = watcherPage.locator(".popover-container .KibitzRoomSettingsPopover");
    await expect(popover).toBeVisible({ timeout: 15000 });

    // "Edit room details" is gated on canEditRoom || canDeleteRoom
    // (KibitzRoomSettingsPopover.tsx:179). The room owner has both, so the
    // button must be present.
    const editDetailsButton = popover.getByRole("button", { name: /^Edit room details$/ });
    await expect(editDetailsButton).toBeVisible({ timeout: 15000 });
    await expect(editDetailsButton).toBeOGSClickable();
    await editDetailsButton.click();

    // The edit form populates with the current title/description. Fill in new
    // values and confirm the inputs accepted them before submitting.
    const titleInput = popover.locator("#kibitz-room-title");
    const descriptionInput = popover.locator("#kibitz-room-description");
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await expect(descriptionInput).toBeVisible();

    const stamp = Date.now();
    const newTitle = `e2e renamed room ${stamp}`;
    const newDescription = `e2e description ${stamp}`;
    await titleInput.fill(newTitle);
    await expect(titleInput).toHaveValue(newTitle);
    await descriptionInput.fill(newDescription);
    await expect(descriptionInput).toHaveValue(newDescription);

    console.log("[kibitz edit-room-details] saving new title and description");
    const saveButton = popover.getByRole("button", { name: /^Save$/ });
    await expect(saveButton).toBeOGSClickable();
    await saveButton.click();

    // A successful save closes the popover (KibitzRoomSettingsPopover.tsx
    // onSave -> onClose at :127). The PUT response payload is threaded
    // through KibitzController.applyBackendRoomUpdate / setActiveRoom, so
    // the header .board-title rerenders with the new title.
    await expect(popover).toBeHidden({ timeout: 15000 });
    await expect(watcherPage.locator(".board-title")).toHaveText(newTitle, { timeout: 15000 });
    console.log("[kibitz edit-room-details] owner save reflected in header");

    // Reopen the popover to verify the description was also persisted -- the
    // .board-title only shows the title, but the popover form rebinds to
    // room.description on open (KibitzRoomSettingsPopover.tsx:53), so the
    // description field will show the saved value if the round-trip worked.
    await gearButton.click();
    await expect(popover).toBeVisible({ timeout: 15000 });
    await popover.getByRole("button", { name: /^Edit room details$/ }).click();
    await expect(popover.locator("#kibitz-room-description")).toHaveValue(newDescription, {
        timeout: 15000,
    });
    console.log("[kibitz edit-room-details] description persisted");

    // No popover dismiss needed: the next phase runs in a separate browser
    // context (nonOwnerPage), so the watcher's open popover does not shadow
    // the non-owner's page. The popover module (lib/popover.tsx) dismisses
    // only on backdrop click, container-edge click, or close_all_popovers --
    // there is no Escape handler -- so an explicit dismiss here would have
    // to go through the Cancel-then-Close two-click path, which is not worth
    // the complexity given the context separation.

    // Phase 2: a separate authenticated user (not the room owner, not in the
    // game) visits the same room. The desktop layout still renders the gear
    // button unconditionally (KibitzRoomStage.tsx:5254), but the popover gates
    // "Edit room details" on canEditRoom || canDeleteRoom -- both compute to
    // false for a non-owner non-moderator (kibitz/permissions.py:42-50), so
    // the affordance must be absent.
    console.log("[kibitz edit-room-details] creating non-owner user");
    const { userPage: nonOwnerPage } = await prepareNewUser(
        createContext,
        newTestUsername("kibVisit"), // cspell:disable-line
        "test",
    );
    // Mirror the watcher viewport so the same desktop branch of
    // KibitzRoomStage renders.
    await nonOwnerPage.setViewportSize({ width: 1920, height: 1080 });
    await load(nonOwnerPage, `/kibitz/${roomId}`);
    await waitForKibitzReady(nonOwnerPage);
    await waitForKibitzLayoutStable(nonOwnerPage);

    const nonOwnerGear = nonOwnerPage.locator(".board-settings-button");
    await expect(nonOwnerGear).toBeVisible({ timeout: 15000 });
    await expect(nonOwnerGear).toBeOGSClickable();
    await nonOwnerGear.click();

    const nonOwnerPopover = nonOwnerPage.locator(
        ".popover-container .KibitzRoomSettingsPopover",
    );
    await expect(nonOwnerPopover).toBeVisible({ timeout: 15000 });

    // Absence check -- the Edit affordance must not appear for a non-owner.
    // toHaveCount(0) is the unambiguous "not present" assertion in Playwright
    // (a bare .not.toBeVisible() also passes when the element is detached,
    // but the count form makes the intent explicit).
    await expect(
        nonOwnerPopover.getByRole("button", { name: /^Edit room details$/ }),
    ).toHaveCount(0);

    // Belt-and-braces: the popover shows the "no management access" note
    // (KibitzRoomSettingsPopover.tsx:227-233) when all three management
    // permissions are false, which is the state we expect for this user.
    await expect(nonOwnerPopover).toContainText("You do not have room management access yet.");
    console.log("[kibitz edit-room-details] non-owner has no Edit affordance");
};
