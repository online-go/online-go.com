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

// cspell:words MRFM MRFMVic MRFMOpp MRFMRep

/*
 * Tests covering the act of filing a malicious_report from the standard
 * PlayerDetails -> Report dialog (per the 2026-06-18 design):
 *
 *  1. A CM with HANDLE_MALICIOUS_REPORT navigates to a source report,
 *     opens the source reporter's PlayerDetails -> Report dialog, picks
 *     "Malicious Report", submits, and a new malicious_report is created
 *     with the back-link URL pointing to the source report.
 *  2. Closing the Report dialog after typing a note does not create a
 *     report.
 *
 * Uses init_e2e data:
 * - E2E_CM_MR_FILER : CM with HANDLE_MALICIOUS_REPORT + HANDLE_ESCAPING
 *
 * Source-report victim, opponent and source reporter are created dynamically
 * each run. Source reporter is a third-party user (not a game player) — see
 * `setupEscapingSourceGame` for why.
 */

import type { CreateContextOptions } from "@helpers";
import { BrowserContext, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

import {
    navigateToReport,
    newTestUsername,
    openPlayerDetailsPopover,
    prepareNewUser,
    setupSeededCM,
} from "@helpers/user-utils";

import { expectOGSClickableByName } from "@helpers/matchers";
import { log } from "@helpers/logger";
import { withReportCountTracking } from "@helpers/report-utils";
import {
    cancelOwnReport,
    createSourceEscapingReport,
    fileMaliciousReport,
    readOwnReportIds,
    setupEscapingSourceGame,
    waitForNewOwnReport,
} from "@helpers/malicious-report-utils";

export const cmFileMaliciousReportTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 300 * 1000;
    // The setup before withReportCountTracking (3 fresh users + game + source
    // report) is the heaviest part of this test and easily exceeds the
    // Playwright default 180s when combined with the post-resignation flake
    // budget on the existing reportUser/captureReportNumber helpers. Bump
    // the test-wide timeout up front; withReportCountTracking will also call
    // setTimeout but only after this setup completes.
    testInfo.setTimeout(TIMEOUT_MS);

    log(`[MR/file] Phase 0: creating game players (victim + opponent)`);
    const victimUsername = newTestUsername("MRFMVic"); // cspell:disable-line
    const { userPage: victimPage } = await prepareNewUser(createContext, victimUsername, "test");

    const opponentUsername = newTestUsername("MRFMOpp"); // cspell:disable-line
    const { userPage: opponentPage } = await prepareNewUser(
        createContext,
        opponentUsername,
        "test",
    );

    // Opponent resigns so victim wins; escaping report against the victim is
    // applicable. The source reporter is created later as a fresh third party.
    const gameUrl = await setupEscapingSourceGame(victimPage, opponentPage, opponentUsername);

    const { sourceReporterPage, sourceReporterUsername, sourceReportNumber } =
        await createSourceEscapingReport(
            createContext,
            gameUrl,
            victimUsername,
            "MRFMRep", // cspell:disable-line
            "E2E test: source escaping report - this is going to be flagged malicious",
        );

    await withReportCountTracking(
        sourceReporterPage,
        testInfo,
        async () => {
            // CM filer logs in. Capture their baseline My-Own-Reports count so
            // we can verify Cancel doesn't create a report, regardless of any
            // leftover reports from prior runs.
            const { seededCMPage: filerPage, seededCMContext: filerContext } = await setupSeededCM(
                createContext,
                "E2E_CM_MR_FILER",
            );

            // Baseline: every own-report-id the filer currently sees. Used
            // below to (a) verify Cancel doesn't create a report and (b)
            // identify the new malicious_report after we file it.
            const initialOwnReportIds = await readOwnReportIds(filerPage);

            // ========================================
            // Test 2: Closing the Report dialog does nothing
            // ========================================
            log(`[MR/file] Test 2: Close-without-submit creates no report`);
            await navigateToReport(filerPage, sourceReportNumber);

            // Open PlayerDetails on the source report's reporter, click Report.
            const reporterLink = filerPage
                .locator(`a.Player[data-ready="true"]:has-text("${sourceReporterUsername}")`)
                .first();
            await openPlayerDetailsPopover(filerPage, reporterLink);

            const reportButton = await expectOGSClickableByName(filerPage, /Report$/);
            await reportButton.click();
            await expect(filerPage.getByText("Request Moderator Assistance")).toBeVisible();

            // Pick "Malicious Report" from the type-picker
            await filerPage.selectOption(".type-picker select", { value: "malicious_report" });

            // Type something then click Close (no report should be created)
            const notesBox = filerPage.locator("textarea.notes");
            await notesBox.fill("Some text we will discard via Close");
            await expect(notesBox).toHaveValue("Some text we will discard via Close");

            const closeButton = await expectOGSClickableByName(filerPage, /^Close$/);
            await closeButton.click();
            await expect(filerPage.getByText("Request Moderator Assistance")).not.toBeVisible();

            // No submission happened — the success toast should never appear.
            // (A direct "own-report-count unchanged" check races against the
            // client-side report_manager re-syncing the filer's list after
            // navigation. The toast is the unambiguous submit signal.)
            await filerPage.waitForTimeout(1000);
            await expect(filerPage.getByText("Thanks for the report!")).toHaveCount(0);

            // ========================================
            // Test 1: File a malicious_report successfully
            // ========================================
            log(`[MR/file] Test 1: file malicious_report successfully`);
            await navigateToReport(filerPage, sourceReportNumber);

            const filerNote =
                "E2E test: filing malicious_report against the source reporter for bad-faith reporting.";
            await fileMaliciousReport(filerPage, sourceReporterUsername, filerNote);

            // Wait for the new malicious_report to surface in My Own Reports,
            // identifying it as the ID that wasn't present before.
            const maliciousReportNumber = await waitForNewOwnReport(filerPage, initialOwnReportIds);
            expect(maliciousReportNumber).not.toBe(sourceReportNumber);

            // Verify the new malicious_report's metadata via UI
            await navigateToReport(filerPage, maliciousReportNumber);
            await expect(filerPage.locator(".report-type-selector")).toContainText(
                "Malicious Report",
            );

            // Back-link to the source report
            const sourceReportId = sourceReportNumber.replace(/^R/, "");
            await expect(
                filerPage.locator(`a[href="/reports-center/all/${sourceReportId}"]`),
            ).toBeVisible();

            // Filer's note is shown
            await expect(filerPage.getByText(filerNote)).toBeVisible();

            // Reported user is the source reporter (now accused of malicious reporting)
            await expect(
                filerPage.locator(".reported-user").getByText(sourceReporterUsername),
            ).toBeVisible();

            // Source report is unchanged: still escaping, not retyped to malicious.
            await navigateToReport(filerPage, sourceReportNumber);
            await expect(filerPage.locator(".report-type-selector")).toContainText(
                "Stopped Playing",
            );

            log(`[MR/file] Cleanup`);
            // Cleanup: the malicious_report we filed never gets resolved
            // in this test, so cancel it so the seeded CM filer doesn't
            // accumulate pending reports across runs. The source escaping
            // report is owned by an ephemeral fresh user; we don't bother
            // cancelling it.
            await cancelOwnReport(filerPage, maliciousReportNumber);

            await filerContext.close();
        },
        TIMEOUT_MS,
    );
};
