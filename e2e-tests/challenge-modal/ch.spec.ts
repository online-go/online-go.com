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

import { chPreferredSettingsRankTest } from "./ch-preferred-rank";
import { chBasicCreationTest } from "./ch-basic-creation";
import { chHandicapPrefsTest } from "./ch-handicap-prefs";
import { chPrivateInviteTest } from "./ch-private-invite";
import { chRengoTest } from "./ch-rengo";
import { chDemoBoardTest } from "./ch-demo-board";

// Note: these "Challenge Modal" tests are front-end tests only at present.
// POST payloads are inspected/tested but not sent to the server.

ogsTest.describe("@ChallengeModal Challenge Modal Tests", () => {
    ogsTest("Should be able to create a challenge with a correct call", chBasicCreationTest);
    ogsTest(
        "Should be able to have different preferred settings based on rank",
        chPreferredSettingsRankTest,
    );
    ogsTest("Should handle handicap preferences correctly", chHandicapPrefsTest);
    ogsTest("Should handle rengo options correctly", chRengoTest);
    ogsTest("Should handle private and invite checkboxes correctly", chPrivateInviteTest);
    ogsTest("Should handle demo board correctly", chDemoBoardTest);
});
