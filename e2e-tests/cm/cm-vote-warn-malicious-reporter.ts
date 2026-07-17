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

// cspell:words MRWM MRWMRep MRWMVic

/*
 * Test 6 in the malicious-report design spec:
 * CMs vote `warn_malicious_reporter` on a malicious_report. The accused (source
 * reporter) receives an AccountWarning with the warn_malicious_reporter canned
 * message; the filing CM receives an AccountWarningAck with the
 * ack_warned_malicious_reporter canned message.
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
import { log } from "@helpers/logger";
import { withReportCountTracking } from "@helpers/report-utils";
import { setupMaliciousReport } from "@helpers/malicious-report-utils";

const CM_VOTERS = ["E2E_CM_MR_CM_V1", "E2E_CM_MR_CM_V2", "E2E_CM_MR_CM_V3"];

export const cmVoteWarnMaliciousReporterTest = async (
    {
        createContext,
    }: { createContext: (options?: CreateContextOptions) => Promise<BrowserContext> },
    testInfo: TestInfo,
) => {
    const TIMEOUT_MS = 300 * 1000;
    // setupMaliciousReport runs before withReportCountTracking; set early.
    testInfo.setTimeout(TIMEOUT_MS);

    const setup = await setupMaliciousReport(createContext, {
        sourceReporterRolePrefix: "MRWMRep", // cspell:disable-line
        victimRolePrefix: "MRWMVic", // cspell:disable-line
    });

    await withReportCountTracking(
        setup.sourceReporterPage,
        testInfo,
        async () => {
            log(
                `[MR/vote-warn] Phase 1: 3 CMs vote warn_malicious_reporter on ${setup.maliciousReportNumber}`,
            );
            // 3 CMs vote warn_malicious_reporter → consensus → warning to accused + ack to filer
            const cmContexts: BrowserContext[] = [];
            for (const cmUser of CM_VOTERS) {
                const { seededCMPage: cmPage, seededCMContext: cmContext } = await setupSeededCM(
                    createContext,
                    cmUser,
                );
                cmContexts.push(cmContext);

                await navigateToReport(cmPage, setup.maliciousReportNumber);

                const radio = cmPage.locator('input[value="warn_malicious_reporter"]');
                await expect(radio).toBeVisible();
                await radio.click();
                await expect(radio).toBeChecked();

                const voteButton = await expectOGSClickableByName(cmPage, /Vote$/);
                await voteButton.click();
                log(`[MR/vote-warn] ${cmUser} voted warn_malicious_reporter`);
            }

            log(`[MR/vote-warn] Phase 2: verify source reporter sees formal warning`);
            // Source reporter (the accused) should see a formal warning
            await setup.sourceReporterPage.goto("/");
            const warning = setup.sourceReporterPage.locator("div.AccountWarning");
            await expect(warning).toBeVisible({ timeout: 15000 });
            await expect(
                warning.locator("div.canned-message.warn_malicious_reporter"),
            ).toBeVisible();
            await expect(warning.locator("div.canned-message")).not.toBeEmpty();

            log(`[MR/vote-warn] Phase 3: verify filer receives ack_warned_malicious_reporter`);
            // Filing CM should see the matching ack
            await setup.filerPage.goto("/");
            const ack = setup.filerPage.locator("div.AccountWarningAck");
            await expect(ack).toBeVisible({ timeout: 15000 });
            await expect(
                ack.locator("div.canned-message.ack_warned_malicious_reporter"),
            ).toBeVisible();
            await expect(ack.locator("div.canned-message")).not.toBeEmpty();

            // Dismiss the filer's ack so it doesn't accumulate on the
            // seeded CM filer across runs.
            const ackOk = ack.locator("button.primary");
            await expect(ackOk).toBeEnabled();
            await ackOk.click();
            await expect(ack).not.toBeVisible();

            // The malicious_report resolved via voting → no pending state
            // remains for the seeded filer. The source score-cheating report
            // is owned by an ephemeral fresh user and never affects future
            // runs, so we don't cancel it.

            for (const ctx of cmContexts) {
                await ctx.close();
            }
            await setup.filerContext.close();
        },
        TIMEOUT_MS,
    );
};
