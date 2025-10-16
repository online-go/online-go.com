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
import { modWarnFirstTurnDisconnectorTest } from "./mod-auto-warn-first-turn-disconnector";
import { modDontAutoWarnBlitzTest } from "./mod-dont-auto-warn-first-turn-blitz";
import { modBlockEarlyEscapeReportTest } from "./mod-block-early-escape-report";
import { modBlockEarlyStallingReportTest } from "./mod-block-early-stall-report";
import { modRejectEscapeReportDuringGameTest } from "./mod-reject-escape-report-during-game";
import { autoSuspensionTest } from "./mod-auto-suspension";
import { suspendAppealRestoreTest } from "./mod-suspend-appeal-restore";
import { systemPMButtonTest } from "./mod-system-pm-button";

ogsTest.describe("@Mod Moderation Tests", () => {
    ogsTest("@Slow We should warn first turn disconnectors", modWarnFirstTurnDisconnectorTest);
    ogsTest("@Slow We should not auto-warn blitz games", modDontAutoWarnBlitzTest);
    ogsTest("@Slow We should warn first turn escapers", modWarnFirstTurnEscapersTest);
    ogsTest("We should block early escape reports", modBlockEarlyEscapeReportTest);
    ogsTest("We should block early stalling reports", modBlockEarlyStallingReportTest);
    ogsTest("We should reject escaping reports during game", modRejectEscapeReportDuringGameTest);
    ogsTest("We should suspend users when appropriate", autoSuspensionTest);
    ogsTest(
        "Complete suspend-appeal-restore flow with two-button functionality",
        suspendAppealRestoreTest,
    );
    ogsTest("System PM button appears for non-suspended users", systemPMButtonTest);
});
