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

import { cmVoteOnOwnReportTest } from "./cm-vote-on-own-report";
import { cmShowOnlyPostEscalationVotesTest } from "./cm-show-only-post-escalation-votes";
import { cmVoteWarnNotAITest } from "./cm-vote-warn-not-ai";
import { cmAckWarningTest } from "./cm-ack-warning";
import { cmAckAcknowledgementTest } from "./cm-ack-ack";
import { cmAiAssessDismissTest } from "./cm-ai-assess-dismiss";
import { cmVoteSuspendUserTest } from "./cm-vote-suspend-user";
import { cmVoteNoSandbaggingTest } from "./cm-vote-no-sandbagging";
import { cmVoteWarnAnnulSandbaggingTest } from "./cm-vote-warn-annul-sandbagging";
import { cmVoteEscalateSandbaggingTest } from "./cm-vote-escalate-sandbagging";
import { cmSandbaggingAssessmentConversionTest } from "./cm-sandbagging-assessment-conversion";
import { cmLastWarningInfoTest } from "./cm-last-warning-info";
import { cmEscapeRateDisplayTest } from "./cm-escape-rate-display";
import { cmEscapeRateGameAnchorTest } from "./cm-escape-rate-game-anchor";
import { cmEscapeRatePredictiveBorderlineTest } from "./cm-escape-rate-predictive-borderline";
import { cmInformalWarnEscaperTest } from "./cm-informal-warn-escaper";
import { cmInformalWarnEscaperAndAnnulTest } from "./cm-informal-warn-escaper-and-annul";
import { cmEscalatedEscapingAllOptionsTest } from "./cm-escalated-escaping-all-options";
import { cmSandbaggingInProgressGameTest } from "./cm-sandbagging-in-progress-game";
import { cmEscapingOneAtATimeTest } from "./cm-escaping-one-at-a-time";
import { cmFileMaliciousReportTest } from "./cm-file-malicious-report";
import { cmVoteNoMaliciousReportTest } from "./cm-vote-no-malicious-report";
import { cmVoteWarnMaliciousReporterTest } from "./cm-vote-warn-malicious-reporter";
import { cmVoteInformalWarnMaliciousReporterTest } from "./cm-vote-informal-warn-malicious-reporter";
import { cmMaliciousReportQueueVisibilityTest } from "./cm-malicious-report-queue-visibility";
import { cmMaliciousReportEscalationTest } from "./cm-malicious-report-escalation";
import { cmCallStalledGameWarnsStallerTest } from "./cm-call-stalled-game-warns-staller";

ogsTest.describe("@CM Community Moderation Tests", () => {
    ogsTest("CM Vote on own report", cmVoteOnOwnReportTest);
    ogsTest("Show only post-escalation votes", cmShowOnlyPostEscalationVotesTest);
    ogsTest("Warn when AI report is unfounded", cmVoteWarnNotAITest);
    ogsTest("Acknowledge warnings", cmAckWarningTest);
    ogsTest("Acknowledge acknowledgements", cmAckAcknowledgementTest);
    ogsTest("Dismiss AI reports as AI Assessor", cmAiAssessDismissTest);
    ogsTest("Vote to suspend users with human-readable ban reasons", cmVoteSuspendUserTest);
    ogsTest("Vote no sandbagging evident", cmVoteNoSandbaggingTest);
    ogsTest("Vote warn and annul sandbagged game", cmVoteWarnAnnulSandbaggingTest);
    ogsTest("Vote escalate sandbagging to moderators", cmVoteEscalateSandbaggingTest);
    ogsTest(
        "Sandbagging report converts to assessment when accused won",
        cmSandbaggingAssessmentConversionTest,
    );
    ogsTest("@Slow Last warning info shown on repeat offender reports", cmLastWarningInfoTest);
    ogsTest("@Slow Escape rate display on escaping reports", cmEscapeRateDisplayTest);
    ogsTest(
        "@Slow Escape rate window is anchored to the reported game",
        cmEscapeRateGameAnchorTest,
    );
    ogsTest(
        "CM sees formal options at the predictive escape-rate boundary",
        cmEscapeRatePredictiveBorderlineTest,
    );
    ogsTest("Informal warning vote on escaping reports", cmInformalWarnEscaperTest);
    ogsTest(
        "Informal warning and annul vote on escaping reports",
        cmInformalWarnEscaperAndAnnulTest,
    );
    ogsTest(
        "Escalated escaping report shows all voting options",
        cmEscalatedEscapingAllOptionsTest,
    );
    ogsTest(
        "Sandbagging report on in-progress game becomes assessment not thrown",
        cmSandbaggingInProgressGameTest,
    );
    ogsTest("CMs see escaping reports one at a time per user", cmEscapingOneAtATimeTest);
    ogsTest("File a malicious report from the report view", cmFileMaliciousReportTest);
    ogsTest("Vote no malicious report", cmVoteNoMaliciousReportTest);
    ogsTest("Vote warn malicious reporter", cmVoteWarnMaliciousReporterTest);
    ogsTest("Vote informal warn malicious reporter", cmVoteInformalWarnMaliciousReporterTest);
    ogsTest(
        "Malicious report queue visibility and type-selector filter",
        cmMaliciousReportQueueVisibilityTest,
    );
    ogsTest("Malicious report escalation flow", cmMaliciousReportEscalationTest);
    ogsTest(
        "CM call-stalled-game warns the staller, not the escaper",
        cmCallStalledGameWarnsStallerTest,
    );
});
