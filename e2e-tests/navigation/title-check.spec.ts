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

import { expect } from "@playwright/test";
import { ogsTest, load } from "@helpers";
import { registerNewUser, newTestUsername } from "@helpers/user-utils";

ogsTest("Navigation title check", async ({ page, createContext }) => {
    await load(page, "/");
    await expect(page).toHaveTitle("Games");

    const { userPage } = await registerNewUser(
        createContext,
        newTestUsername("TitleCheck"),
        "test",
    );

    await userPage.goto("/");
    await expect(userPage).toHaveTitle("OGS");

    // 1. Check static views
    // Note: Use real resources (dynamic board creation) for views that depend on engine state
    const views = [
        { path: "/developer", title: "Play Go at online-go.com!" },
        { path: "/docs/about", title: "About" },
        { path: "/docs/contact-information", title: "Play Go at online-go.com!" },
        { path: "/docs/go-rules-comparison-matrix", title: "Play Go at online-go.com!" },
        { path: "/docs/other-go-resources", title: "Other Go Resources" },
        { path: "/docs/privacy-policy", title: "Play Go at online-go.com!" },
        { path: "/docs/refund-policy", title: "Play Go at online-go.com!" },
        { path: "/docs/team", title: "Play Go at online-go.com!" },
        { path: "/docs/terms-of-service", title: "Play Go at online-go.com!" },
        { path: "/gotv", title: "GoTV" },
        { path: "/groups", title: "Groups" },
        { path: "/joseki", title: "Joseki" },
        { path: "/ladders", title: "Ladders" },
        { path: "/learn-to-play-go", title: "Learn to play Go" },
        { path: "/library/1", title: "Library" },
        { path: "/observe-games", title: "Games" },
        { path: "/play", title: "Play" },
        { path: "/puzzles", title: "Puzzles" },
        { path: "/rating-calculator", title: "Rating Calculator" },
        { path: "/redeem", title: "Play Go at online-go.com!" },
        { path: "/settings/link", title: "Settings" },
        { path: "/sponsorship-request", title: "Sponsorship Request" },
        { path: "/support", title: "Support OGS" },
        { path: "/tournaments", title: "Tournaments" },
        { path: "/whats-new", title: "What's New" },
    ];

    for (const view of views) {
        await load(userPage, view.path);
        await expect(userPage).toHaveTitle(view.title);
    }

    // Create a real demo board to verify the "Demo" title
    const { createDemoBoard } = await import("@helpers/demo-board-utils");
    await createDemoBoard(userPage, { gameName: "E2E Title Test" });
    await expect(userPage).toHaveTitle("Demo");

    // Check that it remains "Demo" even if we refresh or "state_text" is emitted
    await userPage.reload();
    await expect(userPage).toHaveTitle("Demo");

    // Now we test Review page
    // NOTE: We're only able to do this because Backend treats Review and Demo similarly.
    const demoUrl = userPage.url();

    const reviewUrl = demoUrl.replace("/demo/", "/review/");
    await load(userPage, reviewUrl);
    await expect(userPage).toHaveTitle("Review");

    await userPage.reload();
    await expect(userPage).toHaveTitle("Review");
});
