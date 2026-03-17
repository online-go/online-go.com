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
import { createAndVerifyDemoBoard } from "@helpers/demo-board-utils";

ogsTest.describe("Demo Board Tests", () => {
    const testCases = [
        {
            name: "Default 19x19 board",
            settings: {},
            expected: {
                boardSize: "19x19",
                rules: "Japanese",
                blackName: "Demo Black Player",
                blackRank: "[9d]",
                whiteName: "Demo White Player",
                whiteRank: "[4d]",
            },
        },
        {
            name: "Custom 9x9 board",
            settings: {
                boardSize: "9x9",
                black_name: "Demo Dark Player",
                black_ranking: 37, // 8 Dan
                white_name: "Demo Light Player",
                white_ranking: 1037, // 1 Pro
                rules: "chinese",
            },
            expected: {
                boardSize: "9x9",
                rules: "Chinese",
                blackName: "Demo Dark Player",
                blackRank: "[8d]",
                whiteName: "Demo Light Player",
                whiteRank: "[1p]",
            },
        },
    ];

    for (const tc of testCases) {
        ogsTest(`should successfully create a ${tc.name}`, async ({ createContext }) => {
            await createAndVerifyDemoBoard(createContext, tc.settings, tc.expected);
        });
    }
});
