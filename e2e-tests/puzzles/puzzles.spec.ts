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
import { puzzleTurnIndicatorTest } from "./puzzle-turn-indicator";
import { emptyCollectionRedirectTest } from "./empty-collection-redirect";
import { puzzleEditMobileTest } from "./puzzle-edit-mobile";

ogsTest.describe("@Puzzle Puzzle Tests", () => {
    ogsTest("Puzzle should show turn indicator", puzzleTurnIndicatorTest);
    ogsTest("Empty puzzle collection should show its collection page", emptyCollectionRedirectTest);
    ogsTest("Editing a puzzle on mobile should keep the board visible", puzzleEditMobileTest);
});
