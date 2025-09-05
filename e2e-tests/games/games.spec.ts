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
import { basicScoringTest } from "./basic-scoring";
import { conditionalMovesArrowBugTest } from "./conditional-moves-arrow";
import { runPersistAnalysisTest } from "./persist-analysis";

const persistAnalysisTestCases = [
    {
        name: "Live Game",
        settings: {
            speed: "live",
            timeControl: "byoyomi",
            mainTime: "40",
            timePerPeriod: "40",
            periods: "1",
        },
    },
    {
        name: "Correspondence Game",
        settings: {
            speed: "correspondence",
            timeControl: "byoyomi",
            mainTime: "86400",
            timePerPeriod: "86400",
            periods: "1",
        },
    },
];

ogsTest.describe("@Games Tests", () => {
    ogsTest("Should be able to pass and score a game", basicScoringTest);
    ogsTest("Should be able to use arrow in conditional moves", conditionalMovesArrowBugTest);

    for (const tc of persistAnalysisTestCases) {
        ogsTest(`Analysis should survive socket disconnect in ${tc.name}`, async ({ browser }) => {
            await runPersistAnalysisTest({ browser, settings: tc.settings });
        });
    }
});
