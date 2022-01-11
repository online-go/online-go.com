/*
 * Copyright (C) 2012-2020  Online-Go.com
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

import * as React from "react";

export const RulesMatrix = (props) => (
    <div id="RulesMatrix">
        <div id="docs-go-rules-comparison-matrix">
            <table className="rules">
                <tr>
                    <th></th>
                    <th>AGA</th>
                    <th>Japanese</th>
                    <th>Chinese</th>
                    <th>Korean</th>
                    <th>Ing's SST Rules</th>
                    <th>New Zealand</th>
                </tr>

                <tr>
                    <th>Komi</th>
                    <td>7.5</td>
                    <td>6.5</td>
                    <td>7.5 (Scored as 3.75 is removed from Black and given to White)</td>
                    <td>6.5</td>
                    <td>8</td>
                    <td>7</td>
                </tr>

                <tr>
                    <th>Handicap Positioning</th>
                    <td>Fixed Points</td>
                    <td>Fixed Points</td>
                    <td>Free Placement</td>
                    <td>Fixed Points</td>
                    <td>Free Placement</td>
                    <td>Free Placement</td>
                </tr>

                <tr>
                    <th>Handicap Score Adjustment</th>
                    <td>
                        When Area scoring is in effect, White receives an additional point of compensation for each
                        black Handicap stone after the first.
                    </td>
                    <td>None</td>
                    <td>White receives an additional point of compensation for each black Handicap stone.</td>
                    <td>None</td>
                    <td>White receives an additional point of compensation for each black Handicap stone.</td>
                    <td>None</td>
                </tr>
                <tr>
                    <th>Special rules when Passing</th>
                    <td>Opponent receives one Prisoner on Pass</td>
                    <td>None</td>
                    <td>None</td>
                    <td>None</td>
                    <td>None</td>
                    <td>None</td>
                </tr>
                <tr>
                    <th>Self Capture</th>
                    <td>No</td>
                    <td>No</td>
                    <td>No</td>
                    <td>No</td>
                    <td>Yes</td>
                    <td>Yes</td>
                </tr>
                <tr>
                    <th>Super-Ko</th>
                    <td>Repetitions are forbidden</td>
                    <td>
                        Board repetition is allowed, if neither side is willing to break the loop the game is annulled
                    </td>
                    <td>Repetitions are forbidden</td>
                    <td>
                        Board repetition is allowed, if neither side is willing to break the loop the game is annulled
                    </td>
                    <td>Forces avoidance of repetition through special SST Ko Rule</td>
                    <td>Repetitions are forbidden</td>
                </tr>
                <tr>
                    <th>Ending the Game</th>
                    <td>Either two or three consecutive passes, with White being the last to pass.</td>
                    <td>Two passes</td>
                    <td>Two passes</td>
                    <td>Two passes</td>
                    <td>Two passes</td>
                    <td>Two passes</td>
                </tr>
                <tr>
                    <th>Stone removal phase</th>
                    <td>Dead stones mutually agreed upon.</td>
                    <td>Subject to special Japanese stone removal rules</td>
                    <td>Dead stones mutually agreed upon.</td>
                    <td>Subject to special Korean stone removal rules</td>
                    <td>Dead stones mutually agreed upon.</td>
                    <td>Dead stones mutually agreed upon.</td>
                </tr>
                <tr>
                    <th>Dame filling during stone removal</th>
                    <td>No</td>
                    <td>Yes, placements must be agreed upon</td>
                    <td>No</td>
                    <td>Yes, placements must be agreed upon</td>
                    <td>Yes, alternating placements.</td>
                    <td>No</td>
                </tr>
                <tr>
                    <th>Dame negates territory of adjacent strings</th>
                    <td>No</td>
                    <td>Yes</td>
                    <td>No</td>
                    <td>Yes</td>
                    <td>No</td>
                    <td>No</td>
                </tr>
                <tr>
                    <th>Player to play after resuming from the Stone Removal Phase</th>
                    <td>Opponent of the last to pass</td>
                    <td>Opponent of the player to resume the game</td>
                    <td>Opponent of the last to pass</td>
                    <td>Opponent of the player to resume the game</td>
                    <td>Opponent of the last to pass</td>
                    <td>Opponent of the last to pass</td>
                </tr>
                <tr>
                    <th>Scoring</th>
                    <td>
                        Area <strong>or</strong> Territory minus prisoners (Resulting winner is always the same in
                        either case)
                    </td>
                    <td>Territory minus prisoners</td>
                    <td>Area</td>
                    <td>Territory minus prisoners</td>
                    <td>Area</td>
                    <td>Area</td>
                </tr>
            </table>
        </div>
    </div>
);
