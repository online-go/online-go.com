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

// cspell:words MRNM MRNMRep MRNMVic

/*
 * Test 5 in the malicious-report design spec:
 * CMs vote `no_malicious_report` on a malicious_report. The accused (source
 * reporter) receives nothing; the filing CM receives an AccountWarningAck
 * with the no_malicious_report_evident canned message.
 *
 * Uses init_e2e data:
 * - E2E_CM_MR_FILER (set up by setupMaliciousReport)
 * - E2E_CM_MR_CM_V1, V2, V3 : CMs who vote
 */

import type { CreateContextOptions } from "@helpers";
import { BrowserContext, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

import { navigateToReport, setupSeededCM } from "@helpers/user-utils";
import { expectOGSClickableByName } from "@helpers/matchers";
import { withReportCountTracking } from "@helpers/report-utils";
import { setupMaliciousReport } from "@helpers/malicious-report-utils";

const CM_VOTERS = ["E2E_CM_MR_CM_V1", "E2E_CM_MR_CM_V2", "E2E_CM_MR_CM_V3"];

export const cmVoteNoMaliciousReportTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 180 * 1000;

    const setup = await setupMaliciousReport(createContext, {
        sourceReporterRolePrefix: "MRNMRep", // cspell:disable-line
        victimRolePrefix: "MRNMVic", // cspell:disable-line
    });

    await withReportCountTracking(
        setup.sourceReporterPage,
        testInfo,
        async () => {
            // 3 CMs vote no_malicious_report — consensus → ack to filer, nothing to accused
            const cmContexts: BrowserContext[] = [];
            for (const cmUser of CM_VOTERS) {
                const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                    createContext,
                    cmUser,
                );
                cmContexts.push(cmContext);

                await navigateToReport(cmPage, setup.maliciousReportNumber);

                const radio = cmPage.locator('input[value="no_malicious_report"]');
                await expect(radio).toBeVisible();
                await radio.click();
                await expect(radio).toBeChecked();

                const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
                await voteButton.click();
            }

            // Filing CM should see an AccountWarningAck with the matching canned message.
            await setup.filerPage.goto("/");

            const ack = setup.filerPage.locator("div.AccountWarningAck");
            await expect(ack).toBeVisible({ timeout: 15000 });
            await expect(
                ack.locator("div.canned-message.no_malicious_report_evident"),
            ).toBeVisible();
            await expect(ack.locator("div.canned-message")).not.toBeEmpty();

            // Source reporter (the accused) should NOT see any warning, since
            // the vote was "no malicious report".
            await setup.sourceReporterPage.goto("/");
            await setup.sourceReporterPage.waitForTimeout(2000);
            await expect(setup.sourceReporterPage.locator("div.AccountWarning")).not.toBeVisible();
            await expect(
                setup.sourceReporterPage.locator("div.AccountWarningInfo"),
            ).not.toBeVisible();

            // Dismiss the ack on the filer side
            const okButton = ack.locator("button.primary");
            await expect(okButton).toBeVisible();
            await expect(okButton).toBeEnabled();
            await okButton.click();
            await expect(ack).not.toBeVisible();

            for (const ctx of cmContexts) {
                await ctx.close();
            }
            await setup.filerContext.close();
        },
        TIMEOUT_MS,
    );
};
