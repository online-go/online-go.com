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
 * Tests covering the act of filing a malicious_report from the moderator-ui
 * report view (tests 1-3 in the malicious-report design spec):
 *
 *  1. A CM with HANDLE_MALICIOUS_REPORT can open the modal, sees the submit
 *     button disabled until they type a note, submits, and a new
 *     malicious_report is created linked back to the source report.
 *  2. Cancelling the modal closes it and does not create a report.
 *  3. Viewing a malicious_report does not show the "Mark as malicious report"
 *     button (no recursion).
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
    prepareNewUser,
    setupSeededCM,
} from "@helpers/user-utils";

import { expectOGSClickableByName } from "@helpers/matchers";
import { withReportCountTracking } from "@helpers/report-utils";
import {
    createSourceEscapingReport,
    dismissPendingAcks,
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
    const TIMEOUT_MS = 180 * 1000;

    // Game players (fresh each run)
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

            // Clear any leftover acks from previous runs.
            await dismissPendingAcks(filerPage);

            // Baseline: every own-report-id the filer currently sees. Used
            // below to (a) verify Cancel doesn't create a report and (b)
            // identify the new malicious_report after we file it.
            const initialOwnReportIds = await readOwnReportIds(filerPage);

            // ========================================
            // Test 2: Cancel does nothing
            // ========================================
            await navigateToReport(filerPage, sourceReportNumber);

            const markButton = await expectOGSClickableByName(
                filerPage,
                /Mark as malicious report/,
            );
            await markButton.click();

            const modal = filerPage.locator(".MarkAsMaliciousModal");
            await expect(modal).toBeVisible();

            const textarea = modal.locator("textarea");
            const submitButton = modal.locator("button.reject");

            // Submit is disabled while textarea is empty
            await expect(submitButton).toBeDisabled();

            // Typing enables submit
            await textarea.fill("Some text we will discard via Cancel");
            await expect(textarea).toHaveValue("Some text we will discard via Cancel");
            await expect(submitButton).toBeEnabled();

            // Cancel: modal closes, no report created
            const cancelButton = await expectOGSClickableByName(filerPage, /^Cancel$/);
            await cancelButton.click();
            await expect(modal).toBeHidden();

            const afterCancelOwnReportIds = await readOwnReportIds(filerPage);
            expect(afterCancelOwnReportIds).toEqual(initialOwnReportIds);

            // ========================================
            // Test 1: File a malicious_report successfully
            // ========================================
            await navigateToReport(filerPage, sourceReportNumber);
            await expect(
                filerPage.getByRole("button", { name: /Mark as malicious report/ }),
            ).toBeVisible();

            const filerNote =
                "E2E test: filing malicious_report against the source reporter for bad-faith reporting.";
            await fileMaliciousReport(filerPage, filerNote);

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

            // ========================================
            // Test 3: Recursion guard - no "Mark as malicious" button on a malicious_report
            // ========================================
            await expect(
                filerPage.getByRole("button", { name: /Mark as malicious report/ }),
            ).toHaveCount(0);

            // Source report is unchanged: still escaping, not retyped to malicious.
            await navigateToReport(filerPage, sourceReportNumber);
            await expect(filerPage.locator(".report-type-selector")).toContainText(
                "Stopped Playing",
            );

            await filerContext.close();
        },
        TIMEOUT_MS,
    );
};
