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

/*
 * Uses init_e2e data:
 * - E2E_PEER_REVIEWER : settled 1 dan, outside the pool at seed time
 */

import type { CreateContextOptions } from "@helpers";
import { BrowserContext, expect } from "@playwright/test";
import { load } from "@helpers";
import { assertNotificationIndicatorActive, setupSeededUser } from "@helpers/user-utils";
import { playFinishedGame, requestPeerReview } from "@helpers/peer-review-utils";

export const requestClaimSubmitTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { requesterPage, requesterName, gameId } = await playFinishedGame(
        createContext,
        "prLoop",
    );
    await requestPeerReview(requesterPage);

    const { userPage: reviewerPage } = await setupSeededUser(
        createContext,
        "E2E_PEER_REVIEWER",
        "/peer-review/join",
    );
    const joinButton = reviewerPage.getByRole("button", { name: "I agree, join the pool" });
    const rejoinButton = reviewerPage.getByRole("button", { name: "Rejoin the pool" });
    await expect(joinButton.or(rejoinButton)).toBeVisible();
    if (await rejoinButton.isVisible()) {
        await rejoinButton.click();
        await load(reviewerPage, "/peer-review/mine");
    } else {
        await joinButton.click();
    }
    await reviewerPage.waitForURL((url) => url.pathname === "/peer-review/mine");

    const row = reviewerPage.locator(".my-queue-table tr", { hasText: requesterName });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Claim" }).click();
    await reviewerPage.waitForURL((url) => /^\/review\/\d+/.test(url.pathname));

    await load(requesterPage, `/game/${gameId}`);
    await expect(requesterPage.getByText("Being reviewed by")).toBeVisible();
    await assertNotificationIndicatorActive(requesterPage, 1);

    await load(reviewerPage, "/peer-review/mine");
    await reviewerPage
        .locator(".ClaimedRequestCard", { hasText: requesterName })
        .getByRole("button", { name: "Submit" })
        .click();
    await expect(
        reviewerPage.locator(".ClaimedRequestCard", { hasText: requesterName }),
    ).toHaveCount(0);

    await load(requesterPage, `/game/${gameId}`);
    await expect(requesterPage.getByRole("link", { name: "Peer review ready" })).toBeVisible();
    await assertNotificationIndicatorActive(requesterPage, 2);
    await requesterPage.locator(".NotificationIndicator").click();
    await expect(
        requesterPage.getByText("Your peer review of E2E Peer Review Game is ready"),
    ).toBeVisible();

    await load(requesterPage, "/peer-review/finished");
    await expect(
        requesterPage.locator(".peer-review-finished-table").getByText("E2E_PEER_REVIEWER"),
    ).toBeVisible();
};
