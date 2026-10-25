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

/** A browser id presented only on the socket reaches the moderator aliases table. */

import type { CreateContextOptions } from "@helpers";

import { randomUUID } from "node:crypto";
import { BrowserContext, expect } from "@playwright/test";
import {
    newTestUsername,
    prepareNewUser,
    setupSeededModerator,
    goToUsersProfile,
} from "../helpers/user-utils";
import { log } from "@helpers/logger";

export const socketDeviceIdCaptureTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Socket device id capture ===");
    const registeredDeviceId = randomUUID();
    const switchedDeviceId = randomUUID();
    const username = newTestUsername("SockBID");

    // Registration records registeredDeviceId through the login path.
    const { userPage, userContext } = await prepareNewUser(
        createContext,
        username,
        "test",
        registeredDeviceId,
    );
    const config = await userContext.request.get("/api/v1/ui/config");
    await expect(config).toBeOK();
    const userId: number = (await config.json()).user.id;

    // Change the stored id and reload. The socket re-authenticates with the new id;
    // no HTTP login happens, so only the socket path can deliver switchedDeviceId.
    await userPage.evaluate(
        (id) => localStorage.setItem("ogs.device.uuid", JSON.stringify(id)),
        switchedDeviceId,
    );
    await userPage.reload();
    await expect(userPage.locator(".username").getByText(username, { exact: true })).toBeVisible();
    log("Reloaded with the switched device id ✓");

    const { seededModeratorPage, seededModeratorContext } =
        await setupSeededModerator(createContext);

    // The report is asynchronous; wait for it to persist before driving the UI.
    await expect
        .poll(
            async () => {
                const response = await seededModeratorContext.request.get(
                    `/api/v1/players/${userId}/aliases/`,
                );
                await expect(response).toBeOK();
                const rows: { id: number; last_browser_id: string }[] = (await response.json())
                    .results;
                return rows.find((row) => row.id === userId)?.last_browser_id;
            },
            { timeout: 30000 },
        )
        .toBe(switchedDeviceId);
    log("Switched device id persisted ✓");

    await goToUsersProfile(seededModeratorPage, username);
    const aliases = seededModeratorPage.locator("table.aliases");
    await expect(aliases).toBeVisible();
    const row = aliases.locator("tr").filter({ hasText: username });
    await expect(row.locator("td.browser_id")).toContainText(switchedDeviceId);
    await expect(row.locator("td.last_active")).not.toHaveText("");
    log("Aliases table shows the socket-delivered id and Last Active ✓");

    await seededModeratorPage.getByRole("button", { name: "View History" }).click();
    const history = seededModeratorPage.locator("table.bid-history-table");
    await expect(history).toBeVisible();
    await expect(history.getByText(switchedDeviceId)).toBeVisible();
    await expect(history.getByText(registeredDeviceId)).toBeVisible();
    const switchedRow = history.locator("tr").filter({ hasText: switchedDeviceId });
    await expect(switchedRow.locator("td").first()).toHaveText(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    );
    log("History modal lists both ids with First Seen ✓");

    await userContext.close();
    await seededModeratorContext.close();
};
