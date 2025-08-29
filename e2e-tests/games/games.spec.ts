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
import { persistAnalysisTest } from "./persist-analysis";

ogsTest.describe("@Games Tests", () => {
    ogsTest("Should be able to pass and score a game", basicScoringTest);
    ogsTest("Should be able to use arrow in conditional moves", conditionalMovesArrowBugTest);
    ogsTest("Should be able retain analysis during socket disconnect", persistAnalysisTest);
});
