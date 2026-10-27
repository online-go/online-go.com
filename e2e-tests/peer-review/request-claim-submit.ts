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
    const openQueueButton = reviewerPage.getByRole("button", { name: "Open my queue" });
    await expect(joinButton.or(rejoinButton).or(openQueueButton)).toBeVisible();
    if (await joinButton.isVisible()) {
        await joinButton.click();
    } else if (await rejoinButton.isVisible()) {
        await rejoinButton.click();
    } else {
        await openQueueButton.click();
    }
    await reviewerPage.waitForURL((url) => url.pathname === "/peer-review/mine");

    const row = reviewerPage.locator(".my-queue-table tr", { hasText: requesterName });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Claim", exact: true }).click();
    await reviewerPage.waitForURL((url) => /^\/review\/\d+/.test(url.pathname));

    await load(requesterPage, `/game/${gameId}`);
    await expect(requesterPage.getByText("Being reviewed by")).toBeVisible();
    // Once claimed the request is the reviewer's to finish: no withdraw.
    await expect(requesterPage.getByRole("button", { name: "Withdraw", exact: true })).toHaveCount(
        0,
    );
    await assertNotificationIndicatorActive(requesterPage, 1);

    await load(reviewerPage, "/peer-review/mine");
    await reviewerPage
        .locator(".ClaimedRequestCard", { hasText: requesterName })
        .getByRole("button", { name: "Submit", exact: true })
        .click();
    await reviewerPage
        .locator('[role="dialog"]')
        .getByRole("button", { name: "OK", exact: true })
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

    // The requester opens the review, which starts the feedback window, and rates it.
    // Reloading the game page also dismisses the notification list that covers the link.
    await load(requesterPage, `/game/${gameId}`);
    await requesterPage.getByRole("link", { name: "Peer review ready" }).click();
    await requesterPage.waitForURL((url) => /^\/review\/\d+/.test(url.pathname));
    const panel = requesterPage.locator(".PeerReviewFeedbackPanel");
    await expect(panel.getByText("Feedback closes")).toBeVisible();
    await panel.getByRole("radio", { name: "4 of 5" }).check();
    await panel.getByRole("textbox").fill("Thanks, the opening comments helped.");
    await expect(panel.getByRole("textbox")).toHaveValue("Thanks, the opening comments helped.");
    await panel.getByRole("button", { name: "Save", exact: true }).click();
    await expect(panel.getByText("Saved")).toBeVisible();

    // The reviewer reads it in My queue, which delivers it.
    await load(reviewerPage, "/peer-review/mine");
    const completed = reviewerPage.locator(".completed-reviews-table tr", {
        hasText: requesterName,
    });
    await expect(completed.getByText("Thanks, the opening comments helped.")).toBeVisible();
    await expect(completed.locator(".StarRating .star.filled")).toHaveCount(4);

    // Delivered feedback is frozen for the requester. The reviewer's page marks it
    // delivered without waiting, so reload until the requester sees it.
    await expect(async () => {
        await requesterPage.reload();
        await expect(panel.getByText("Delivered")).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20000 });

    await load(requesterPage, "/peer-review/finished");
    const finishedRow = requesterPage
        .locator(".peer-review-finished-table tr", { hasText: "E2E Peer Review Game" })
        .first();
    await expect(finishedRow.getByText("E2E_PEER_REVIEWER")).toBeVisible();

    await load(requesterPage, "/peer-review/reviewers");
    const reviewerRow = requesterPage.locator(".peer-reviewers-table tr", {
        hasText: "E2E_PEER_REVIEWER",
    });
    await expect(reviewerRow).toBeVisible();
    await expect(reviewerRow.locator(".completed")).not.toHaveText("0");
    // The rating given above means the reviewer has a score.
    await expect(reviewerRow.locator(".score")).not.toHaveText("–");
};
