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

import * as React from "react";
import { GobanConfig, GobanEngineConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class EndingTheGame extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03];
    }

    static section(): string {
        return "ending-the-game";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning how to end the game", "End of the Game");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning how to end the game",
            "Both players pass",
        );
    }
}

class Page01 extends LearningPage {
    pass_pressed = false;

    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "You are not obliged to place a stone on the board when it is your turn. You can instead pass. When they don't think there are any more good moves to make, to end the game both players pass their turns. This game is finished. Click pass to end it.",
        );
    }
    button() {
        return (
            <div>
                <button
                    className="primary"
                    onClick={() => {
                        this.pass_pressed = true;
                        this.onUpdate();
                    }}
                >
                    {_("Pass")}
                </button>
            </div>
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_state: {
                /* cspell:disable-next-line */
                black: "fafbgbhbgdhdcedeheiebfdfefgfhfagcgegfggg",
                /* cspell:disable-next-line */
                white: "eahaebibbcccecfcgchcicadcdddfdidaebeeefegeafff",
            },
            move_tree: this.makePuzzleMoveTree(["b6" /* dummy to trigger fail */], []),
        };
    }

    complete() {
        return this.pass_pressed;
    }
}

class Page02 extends LearningPage {
    success = false;

    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            'After both players have passed, you enter a "Stone Removal Phase", where you can remove obviously dead stones from play. Remove the dead black stones by clicking them.',
        );
    }
    config(): GobanConfig | GobanEngineConfig {
        return {
            mode: "play",
            phase: "stone removal",
            initial_state: {
                /* cspell:disable-next-line */
                black: "fafbgbhbgdhdcedeheiebfdfefgfhfagcgegfggg",
                /* cspell:disable-next-line */
                white: "eahaebibbcccecfcgchcicadcdddfdidaebeeefegeafff",
            },
        };
    }

    onStoneRemoval(stone_removal_string: string): void {
        /* cspell:disable-next-line */
        if (stone_removal_string === "fafbgbhb") {
            this.success = true;
            this.onUpdate();
        }
    }

    complete() {
        return this.success;
    }
}

class Page03 extends LearningPage {
    pass_pressed = false;

    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "After removing the dead stones, the sizes of the black and white territories are counted. The size of the black territory is 24 points. White has 18 territory points. The captured 4 dead stones are added to this resulting in 22 points for White. So, Black has won the game. Click Finish to end the game.",
        );
    }
    button() {
        return (
            <div>
                <button
                    className="primary"
                    onClick={() => {
                        this.pass_pressed = true;
                        this.onUpdate();
                    }}
                >
                    {_("Finish")}
                </button>
            </div>
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_state: {
                /* cspell:disable-next-line */
                black: "gdhdcedeheiebfdfefgfhfagcgegfggg",
                /* cspell:disable-next-line */
                white: "eahaebibbcccecfcgchcicadcdddfdidaebeeefegeafff",
            },
            move_tree: this.makePuzzleMoveTree(["b6" /* dummy to trigger fail */], []),
        };
    }

    complete() {
        return this.pass_pressed;
    }
}
