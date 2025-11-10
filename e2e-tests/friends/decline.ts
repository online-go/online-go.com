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

import { expect, BrowserContext } from "@playwright/test";

import {
    newTestUsername,
    openUserDropdownFromOmniSearch,
    prepareNewUser,
    goToProfile,
    assertNotificationIndicatorActive,
    assertNotificationIndicatorInactive,
    dismissNotification,
} from "@helpers/user-utils";
import {} from "@helpers/challenge-utils";

export const declineFriendRequestNotificationTest = async ({
    createContext,
}: {
    createContext: (options?: any) => Promise<BrowserContext>;
}) => {
    const requestorUsername = newTestUsername("frDFRNReq"); // cspell:disable-line
    const { userPage: requestor } = await prepareNewUser(createContext, requestorUsername, "test");

    await goToProfile(requestor);

    await expect(requestor.getByText("Notify when declining")).not.toBeVisible();

    const declinerUsername = newTestUsername("frDFRNDec"); // cspell:disable-line
    const { userPage: decliner } = await prepareNewUser(createContext, declinerUsername, "test");

    await requestor.waitForTimeout(1000);
    // Requestor sends friend request
    await openUserDropdownFromOmniSearch(requestor, declinerUsername);

    await requestor.waitForTimeout(1000);

    await expect(requestor.getByRole("button", { name: /Add friend$/ })).toBeVisible();
    await requestor.getByRole("button", { name: /Add friend$/ }).click();

    await expect(requestor.getByText("Sent friend request").first()).toBeVisible();

    // Decliner should see a notification of the request
    await assertNotificationIndicatorActive(decliner, 1);

    // and the option to decline it
    await expect(decliner.getByText("Notify when declining")).toBeVisible();

    // Assert that the checkbox is not checked (unchecked by default)
    await expect(decliner.locator('input[id="notify-on-decline"]')).not.toBeChecked();

    // Decliner clicks the X to decline the friend request (target specific invitation by username)
    await decliner
        .locator(".friend-invitation", { has: decliner.getByText(requestorUsername) })
        .locator(".fa-times")
        .click();

    await assertNotificationIndicatorInactive(decliner);

    // Requestor should not see a notification of the decline
    await assertNotificationIndicatorInactive(requestor);

    // Try again, and notify this time of decline
    await openUserDropdownFromOmniSearch(requestor, declinerUsername);

    await expect(requestor.getByRole("button", { name: /Add friend$/ })).toBeVisible();
    await requestor.getByRole("button", { name: /Add friend$/ }).click();

    await expect(requestor.getByText("Sent friend request").first()).toBeVisible();

    await expect(decliner.getByText("Notify when declining")).toBeVisible();

    const notifyCheckbox = decliner.locator('input[id="notify-on-decline"]');
    await expect(notifyCheckbox).not.toBeChecked();

    await notifyCheckbox.check();

    await expect(notifyCheckbox).toBeChecked();

    await decliner
        .locator(".friend-invitation", { has: decliner.getByText(requestorUsername) })
        .locator(".fa-times")
        .click();

    await assertNotificationIndicatorInactive(decliner);

    await assertNotificationIndicatorActive(requestor, 1);

    await dismissNotification(requestor);

    await assertNotificationIndicatorInactive(requestor);
};
