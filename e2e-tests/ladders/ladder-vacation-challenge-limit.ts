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
 * A ladder player may have at most three open games they initiated. A game
 * whose opponent is on vacation is paused, so it should not occupy one of
 * those slots - and a player already on vacation cannot be challenged at all.
 *
 * Flow:
 * 1. P1 creates a public group; P1-P6 join it and its 9x9 ladder in order,
 *    so P6 sits at the bottom and can challenge everyone above.
 * 2. P6 challenges P1, P2 and P3 - at the cap. P4 reports 0x005.
 * 3. P5, never challenged, goes on vacation. P5's row is dimmed with the
 *    umbrella and reports 0x009.
 * 4. P1 goes on vacation. P6's count drops to two and P4 becomes challengeable.
 * 5. P6 challenges P4 - four open games, three counting.
 * 6. P5 ends vacation (row clears), then P1 ends vacation: P6 is at four
 *    counting, and P5 reports 0x005 again.
 * 7. Teardown (in a finally, so it runs even when an assertion fails): P1
 *    deletes the group, taking its three ladders with it, and the test
 *    confirms they are gone.
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, Page, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

import { setupSeededUser } from "@helpers/user-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { log } from "@helpers/logger";

const LADDER_PLAYERS = [
    "E2E_LADDER_P1",
    "E2E_LADDER_P2",
    "E2E_LADDER_P3",
    "E2E_LADDER_P4",
    "E2E_LADDER_P5",
    "E2E_LADDER_P6",
];

/** Open a ladder row's popover by the player's username. */
const openRowPopover = async (page: Page, username: string) => {
    const row = page.locator(".LadderRow").filter({ hasText: username });
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.click();
};

/** Challenge a player from the ladder page, confirming the dialog. */
const challengePlayer = async (page: Page, ladderUrl: string, username: string) => {
    await page.goto(ladderUrl);
    await openRowPopover(page, username);

    const challengeButton = await expectOGSClickableByName(page, /^Challenge$/);
    await challengeButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText(/Are you ready to start your game with/)).toBeVisible();
    const yesButton = await expectOGSClickableByName(page, /^Yes!$/);
    await yesButton.click();

    await expect(dialog).not.toBeVisible({ timeout: 30000 });
};

/**
 * Delete the test's group as its founder, removing its ladders with it.
 * Verify the selectors against src/views/Group/Group.tsx before relying on them.
 */
const deleteGroup = async (page: Page, groupUrl: string) => {
    await page.goto(groupUrl);

    // The pencil toggles edit mode; "Delete Group" only renders while editing.
    const editToggle = page.locator("i.fa-pencil").first();
    await expect(editToggle).toBeVisible({ timeout: 15000 });
    await editToggle.click();

    const deleteButton = await expectOGSClickableByName(page, /Delete Group/);
    await deleteButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText(/Are you SURE you want to delete this group/)).toBeVisible();
    const okButton = dialog.getByRole("button", { name: "OK" });
    await expect(okButton).toBeVisible();
    await okButton.click();

    // deleteGroup() redirects to /groups/ on success.
    await page.waitForURL(/\/groups\/?$/, { timeout: 30000 });
};

/** Toggle the signed-in user's vacation from the settings page. */
const setVacation = async (page: Page, on: boolean) => {
    await page.goto("/user/settings");
    // Scoped to the desktop selector list: the mobile dropdown (#SettingsGroupDropdown)
    // also renders the text "Vacation" as its current value once vacation has been
    // selected before, which this test does repeatedly on the same seeded pages -
    // an unscoped getByText("Vacation") becomes a strict-mode violation on revisits.
    const vacationTab = page.locator("#SettingsGroupSelector").getByText("Vacation", {
        exact: true,
    });
    await expect(vacationTab).toBeVisible({ timeout: 10000 });
    await vacationTab.click();

    const label = on ? /Go on vacation/ : /End vacation/;
    const button = await expectOGSClickableByName(page, label);
    await button.click();

    // Confirm the toggle took before moving on.
    const confirmation = on ? /End vacation/ : /Go on vacation/;
    await expect(page.getByRole("button", { name: confirmation })).toBeVisible({
        timeout: 15000,
    });
};

/**
 * Make sure the signed-in user is not on vacation, whatever state they are in.
 * Safe to call when they are already off vacation. Used in teardown:
 * P1 and P5 are shared seeded accounts, so if an earlier assertion in this test
 * fails before the flow gets around to ending their vacation, a plain setVacation
 * call would itself fail (there is no "End vacation" button to click when the
 * account is already off vacation) and leave the account on vacation for every
 * run afterwards - as happened once during development of this test.
 */
const ensureVacationOff = async (page: Page) => {
    await page.goto("/user/settings");
    const vacationTab = page.locator("#SettingsGroupSelector").getByText("Vacation", {
        exact: true,
    });
    await expect(vacationTab).toBeVisible({ timeout: 10000 });
    await vacationTab.click();

    const endVacationButton = page.getByRole("button", { name: /End vacation/ });
    if (await endVacationButton.isVisible().catch(() => false)) {
        await endVacationButton.click();
        await expect(page.getByRole("button", { name: /Go on vacation/ })).toBeVisible({
            timeout: 15000,
        });
    }
};

export const ladderVacationChallengeLimitTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    // @Slow: this test signs in six seeded players, creates a group, joins six
    // players to a ladder and starts four correspondence games to build up the
    // open-challenge state the assertions check. The time is cumulative setup,
    // not an explicit wait - see e2e-tests/CLAUDE.md for the rule.
    const TIMEOUT_MS = 600 * 1000;
    testInfo.setTimeout(TIMEOUT_MS);

    log("=== Ladder Vacation Challenge Limit Test ===");

    // 1. Sign in all six seeded players.
    const pages: Page[] = [];
    for (const username of LADDER_PLAYERS) {
        const { userPage } = await setupSeededUser(createContext, username);
        pages.push(userPage);
    }
    // Indices 0, 4 and 5 are P1, P5 and P6 - the only pages the flow drives
    // directly after everyone has joined.
    const [p1Page, , , , p5Page, p6Page] = pages;

    // 2. P1 creates a public group. A fresh group means a fresh ladder, which is
    //    what keeps these reused seeded accounts free of prior-run state.
    log("P1 creating a group...");

    // Declared outside the try so the finally below can still reach them to tear
    // the group down, even if a step inside the try throws before both are
    // assigned - see the undefined check in the finally.
    let groupUrl: string | undefined;
    let ladderUrl: string | undefined;

    try {
        // The try opens right after this navigation: from here on a group may
        // exist in the database, so everything that follows - including reading
        // back the group's URL and looking up its ladder link - runs inside the
        // block whose finally deletes it.
        await p1Page.goto("/group/create");

        const groupName = `E2E Ladder Vac ${Date.now()}`;
        const groupNameInput = p1Page.locator("#group-create-name");
        await expect(groupNameInput).toBeVisible();
        await groupNameInput.fill(groupName);
        await expect(groupNameInput).toHaveValue(groupName);

        // Public by default (GroupCreate.tsx) - assert rather than toggle.
        await expect(p1Page.locator("#group-create-public")).toBeChecked();

        const createGroupButton = await expectOGSClickableByName(p1Page, /Create your group!/);
        await createGroupButton.click();
        await p1Page.waitForURL(/\/group\/\d+/, { timeout: 30000 });

        groupUrl = p1Page.url();
        log(`Group created at: ${groupUrl}`);

        // Find the 9x9 ladder URL from the group page.
        const ladderLink = p1Page.getByRole("link", { name: "9x9 Ladder" });
        await expect(ladderLink).toBeVisible();
        const ladderHref = await ladderLink.getAttribute("href");
        ladderUrl = ladderHref as string;
        log(`9x9 ladder at: ${ladderUrl}`);

        // 3. Each player joins the group, then the ladder, in order. Join order sets
        //    ladder rank, so P6 ends up at the bottom.
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const username = LADDER_PLAYERS[i];

            if (i > 0) {
                // P1 created the group and is already a member.
                await page.goto(groupUrl);
                const joinGroup = await expectOGSClickableByName(page, /Join Group/);
                await joinGroup.click();
            }

            await page.goto(ladderUrl);
            const joinLadder = await expectOGSClickableByName(page, /Join Ladder/);
            await joinLadder.click();
            await expect(page.getByRole("button", { name: /Drop out from ladder/ })).toBeVisible({
                timeout: 15000,
            });
            log(`${username} joined the ladder at rank ${i + 1}`);
        }

        // 4. P6 challenges P1, P2 and P3 - three open games, at the cap.
        //    challengePlayer navigates first, so each challenge starts from a fresh
        //    page: creating one invalidates the ladder list behind the popover.
        for (const username of ["E2E_LADDER_P1", "E2E_LADDER_P2", "E2E_LADDER_P3"]) {
            await challengePlayer(p6Page, ladderUrl, username);
            log(`P6 challenged ${username}`);
        }

        // P4 is now blocked by the cap.
        await p6Page.goto(ladderUrl);
        await openRowPopover(p6Page, "E2E_LADDER_P4");
        await expect(p6Page.getByText("Already playing 3 games you've initiated")).toBeVisible({
            timeout: 15000,
        });
        log("P6 is at the cap: P4 reports 0x005");

        // 5. P5 goes on vacation, having never been challenged.
        await setVacation(p5Page, true);
        log("P5 is on vacation");

        await p6Page.goto(ladderUrl);
        const p5Row = p6Page.locator(".LadderRow").filter({ hasText: "E2E_LADDER_P5" });
        await expect(p5Row).toHaveClass(/on-vacation/, { timeout: 15000 });
        await expect(p5Row.locator(".on-vacation-icon")).toBeVisible();

        await openRowPopover(p6Page, "E2E_LADDER_P5");
        await expect(p6Page.getByText("Player is on vacation")).toBeVisible({ timeout: 15000 });
        log("P5 shows the vacation indicator and reports 0x009");

        // 6. P1 goes on vacation: P6's discounted count drops to two, freeing a slot.
        await setVacation(p1Page, true);
        log("P1 is on vacation");

        await p6Page.goto(ladderUrl);
        await openRowPopover(p6Page, "E2E_LADDER_P4");
        const challengeP4 = await expectOGSClickableByName(p6Page, /^Challenge$/);
        await expect(challengeP4).toBeVisible();
        log("P4 is challengeable again - the vacation discount applied");

        // 7. P6 challenges P4 - four open games, three counting.
        await challengePlayer(p6Page, ladderUrl, "E2E_LADDER_P4");
        log("P6 challenged P4");

        // 8. P5 comes back: the indicator clears.
        await setVacation(p5Page, false);
        await p6Page.goto(ladderUrl);
        const p5RowBack = p6Page.locator(".LadderRow").filter({ hasText: "E2E_LADDER_P5" });
        await expect(p5RowBack).not.toHaveClass(/on-vacation/, { timeout: 15000 });
        await expect(p5RowBack.locator(".on-vacation-icon")).toHaveCount(0);
        log("P5's vacation indicator cleared");

        // 9. P1 comes back: P6 is at four counting games, over the cap. P5 is the
        //    only player P6 has not challenged, and is no longer on vacation, so P5
        //    is the row that must now report the cap.
        await setVacation(p1Page, false);
        await p6Page.goto(ladderUrl);
        await openRowPopover(p6Page, "E2E_LADDER_P5");
        await expect(p6Page.getByText("Already playing 4 games you've initiated")).toBeVisible({
            timeout: 15000,
        });
        log("P6 is over the cap with everyone back - no games were cancelled");

        log("=== Ladder Vacation Challenge Limit Test Complete ===");
    } finally {
        // 10. P1 and P5 are shared seeded accounts reused by every run of this test.
        //     If an assertion above failed before steps 8/9 turned their vacation
        //     back off, leaving either on vacation would break every subsequent run
        //     (a player already on vacation cannot be challenged at all - the very
        //     rule this test is checking). Restore both unconditionally. Each call
        //     is isolated in its own try/catch: a navigation or locator timeout in
        //     one - the same risk every other step in this test carries - is
        //     logged rather than thrown, so it can never suppress the other restore
        //     or block the group deletion below, the one guarantee here that is
        //     non-negotiable.
        log("Ensuring P1 and P5 are not left on vacation...");
        try {
            await ensureVacationOff(p1Page);
        } catch (error) {
            log(`Failed to ensure P1 is off vacation: ${String(error)}`);
        }

        try {
            await ensureVacationOff(p5Page);
        } catch (error) {
            log(`Failed to ensure P5 is off vacation: ${String(error)}`);
        }

        // 11. Drop the group. Its three ladders go with it (LadderTournament.group
        //     is on_delete=CASCADE), which stops every run leaving ladders behind.
        //     Skipped only when group creation itself never got far enough to
        //     yield a URL, in which case there is nothing in the database to
        //     remove.
        if (groupUrl === undefined) {
            log("Group was never created - nothing to delete.");
        } else {
            log(`Deleting group ${groupUrl}...`);
            await deleteGroup(p1Page, groupUrl);

            // /group/:id and /ladder/:id match unconditionally in routes.tsx - only
            // genuinely unmatched paths hit PageNotFound - so navigating to a
            // deleted group or ladder still gets a 200-status page load; React
            // Router renders the view, which then fails to load its data. The real
            // proof the group and ladder are gone is the API call each view makes
            // to resolve itself: assert that call's response status directly, not
            // the outer navigation.
            const groupId = groupUrl.match(/\/group\/(\d+)/)?.[1];
            const ladderId = ladderUrl?.match(/\/ladder\/(\d+)/)?.[1];
            if (!groupId || !ladderUrl || !ladderId) {
                throw new Error(
                    `Could not parse ids from groupUrl=${groupUrl} ladderUrl=${ladderUrl}`,
                );
            }

            const [groupApiResponse] = await Promise.all([
                p1Page.waitForResponse((res) => res.url().endsWith(`/api/v1/groups/${groupId}`)),
                p1Page.goto(groupUrl),
            ]);
            expect(groupApiResponse.status()).toBe(404);

            const [ladderApiResponse] = await Promise.all([
                p1Page.waitForResponse((res) => res.url().endsWith(`/api/v1/ladders/${ladderId}`)),
                p1Page.goto(ladderUrl),
            ]);
            expect(ladderApiResponse.status()).toBe(404);
            log("Group and its ladders confirmed deleted (API returns 404 for both)");
        }
    }
};
