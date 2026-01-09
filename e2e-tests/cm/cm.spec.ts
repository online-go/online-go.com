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
});
