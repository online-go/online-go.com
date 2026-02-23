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

import { ogsTest } from "@helpers";

import { modWarnFirstTurnEscapersTest } from "./mod-auto-warn-first-turn-escaper";
import { modWarnFirstTurnEscaperBlackTest } from "./mod-auto-warn-first-turn-escaper-black";
import { modWarnFirstTurnDisconnectorTest } from "./mod-auto-warn-first-turn-disconnector";
import { modDontAutoWarnBlitzTest } from "./mod-dont-auto-warn-first-turn-blitz";
import { modBlockEarlyEscapeReportTest } from "./mod-block-early-escape-report";
import { modBlockEarlyStallingReportTest } from "./mod-block-early-stall-report";
import { modRejectEscapeReportDuringGameTest } from "./mod-reject-escape-report-during-game";
import { autoSuspensionTest } from "./mod-auto-suspension";
import { suspendAppealRestoreTest } from "./mod-suspend-appeal-restore";
import { suspendedUserCanLoginToAppealTest } from "./mod-suspended-user-can-login-to-appeal";
import { systemPMButtonTest } from "./mod-system-pm-button";
import { aiDetectionPlayerFilterTest } from "./ai-detection-player-filter";
// import { aiDetectionFastSMRReportTest } from "./ai-detection-fast-smr-report";
import { playerCheckAIButtonTest } from "./player-check-ai-button";
import { aiDetectorVoteSuspendAndAnnulTest } from "./ai-detector-vote-suspend-annul";
import { aiDetectorVoteWarnAndAnnulTest } from "./ai-detector-vote-warn-annul";
import { aiDetectorVoteFirstWarnAndAnnulTest } from "./ai-detector-vote-first-warn-annul";
import { aiDetectorVoteCancelTicketTest } from "./ai-detector-vote-cancel-ticket";
import { aiDetectorSeesSuspensionModlogTest } from "./ai-detector-sees-suspension-modlog";

ogsTest.describe("@Mod Moderation Tests", () => {
    ogsTest("@Slow Auto-warn first turn disconnectors", modWarnFirstTurnDisconnectorTest);
    ogsTest("@Slow Skip auto-warn for blitz games", modDontAutoWarnBlitzTest);
    ogsTest("@Slow Auto-warn first turn escapers", modWarnFirstTurnEscapersTest);
    ogsTest("@Slow Auto-warn first turn escapers (black)", modWarnFirstTurnEscaperBlackTest);
    ogsTest("Block early escape reports", modBlockEarlyEscapeReportTest);
    ogsTest("Block early stalling reports", modBlockEarlyStallingReportTest);
    ogsTest("Reject escape reports during active game", modRejectEscapeReportDuringGameTest);
    ogsTest(
        "Complete suspend-appeal-restore flow with two-button functionality",
        suspendAppealRestoreTest,
    );
    ogsTest("Suspended user can login to reach appeal page", suspendedUserCanLoginToAppealTest);
    ogsTest("Auto-suspend users with previously suspended accounts", autoSuspensionTest);
    ogsTest("System PM button appears for non-suspended users", systemPMButtonTest);
    ogsTest("AI Detection player filter button works correctly", aiDetectionPlayerFilterTest);
    // TODO: aiDetectionFastSMRReportTest needs assertion rework - temporarily disabled
    // ogsTest("AI Detection FastSMR report button works correctly", aiDetectionFastSMRReportTest);
    ogsTest("Player dropdown Check AI button navigates to AI Detection", playerCheckAIButtonTest);
    ogsTest("AI Detector can vote to suspend and annul AI user", aiDetectorVoteSuspendAndAnnulTest);
    ogsTest("AI Detector can vote to warn and annul AI user", aiDetectorVoteWarnAndAnnulTest);
    ogsTest(
        "AI Detector can vote to first warn and annul reported game only",
        aiDetectorVoteFirstWarnAndAnnulTest,
    );
    ogsTest("AI Detector can cancel ticket and notify reporter", aiDetectorVoteCancelTicketTest);
    ogsTest(
        "@Slow AI Detector can see SUSPENSION ModLog entries in ViewReport",
        aiDetectorSeesSuspensionModlogTest,
    );
});
