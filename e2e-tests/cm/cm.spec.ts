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

import { cmDontNotifyEscalatedAiTest } from "./cm-dont-notify-escalated-ai";
import { cmVoteOnOwnReportTest } from "./cm-vote-on-own-report";
import { cmShowOnlyPostEscalationVotesTest } from "./cm-show-only-post-escalation-votes";
import { cmVoteWarnNotAITest } from "./cm-vote-warn-not-ai";
import { cmAckWarningTest } from "./cm-ack-warning";
import { cmAckAcknowledgementTest } from "./cm-ack-ack";
import { cmAiAssessDismissTest } from "./cm-ai-assess-dismiss";

ogsTest.describe("@CM Community Moderation Tests", () => {
    ogsTest("CM should be able to vote on their own report", cmVoteOnOwnReportTest);
    ogsTest("We should not notify escalated AI reports", cmDontNotifyEscalatedAiTest);
    ogsTest("We should show only post-escalation votes", cmShowOnlyPostEscalationVotesTest);
    ogsTest("We should warn when an AI report is unfounded", cmVoteWarnNotAITest);
    ogsTest("We should be able to acknowledge warnings", cmAckWarningTest);
    ogsTest("We should be able to acknowledge acknowledgements", cmAckAcknowledgementTest);
    ogsTest("AI Assessors should be able to dismiss AI reports", cmAiAssessDismissTest);
});
