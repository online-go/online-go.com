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

import type { CreateContextOptions } from "@helpers";
import { BrowserContext, expect } from "@playwright/test";
import { playFinishedGame, requestPeerReview } from "@helpers/peer-review-utils";

export const withdrawAndRerequestTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { requesterPage } = await playFinishedGame(createContext, "prWd");
    await requestPeerReview(requesterPage);
    await requesterPage.getByRole("button", { name: "Withdraw", exact: true }).click();
    // A withdrawn request is inert: it does not use the weekly allowance and the same game may be requested again.
    await expect(requesterPage.getByRole("button", { name: "Request peer review" })).toBeVisible();
    await requestPeerReview(requesterPage);
    await expect(requesterPage.getByRole("button", { name: "Withdraw" })).toBeVisible();
};
