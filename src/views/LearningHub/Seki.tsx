/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import { PuzzleConfig } from "goban";
import { LearningPage } from "./LearningPage";
import { _, pgettext } from "translate";
import { LearningHubSection } from "./LearningHubSection";

export class Seki extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [
            Page1,
            Page2,
            Page3,
            Page4,
            Page5,
            //Page6,
            //Page7,
        ];
    }

    static section(): string {
        return "seki";
    }
    static title(): string {
        return pgettext("Tutorial section on seki", "Seki!");
    }
    static subtext(): string {
        return pgettext("Tutorial section on seki", "Mutual life");
    }
}

class Page1 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _(
            "Sometimes you cannot capture, but you can prevent from being captured. Save your black stones!",
        );
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_state: {
                black: "d1d2d3e3f4g4g3g2",
                white: "c1c2c3c5d4e4f3f2f1",
            },
            move_tree: this.makePuzzleMoveTree(["g1"], ["e2e1", "e1e2", "e5e1", "h1e1"]),
        };
    }
}

class Page2 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _(
            "Sometimes you cannot capture, but you can prevent from being captured. Save your black stones!",
        );
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_state: {
                black: "a1a2a3b3c3d3e3f3g3h3j3j2j1d1f1",
                white: "b1b2c2d2e2f2g2h2h1",
            },
            move_tree: this.makePuzzleMoveTree(["e1"], ["c1e1", "g1e1"]),
        };
    }
}

class Page3 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("Save your stones");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_state: {
                white: "j3h3h4h5g4f4e5e6d8f7g7h7j7",
                black: "j2h2g3f3e3e4f5f6g6h6j6",
            },
            move_tree: this.makePuzzleMoveTree(["j5"], ["j4j5", "g2j5", "g5j5"]),
        };
    }
}

class Page4 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("Save your stones by making seki");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_state: {
                white: "h1h2e1e2f3f4g4e5h5j5",
                black: "f1f2g2g3h3h4j4",
            },
            move_tree: this.makePuzzleMoveTree(
                ["j2"],
                ["g1j3", "j3g1", "j1j2g1j3", "j1j2j3g1", "g5g1", "e3g1"],
            ),
        };
    }
}

class Page5 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("Save your stones by making seki");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_state: {
                white: "j2h2g3f3e3e4f5f6g6h6h7j7j5",
                black: "j3h3h4g4f4e5e6e7f7g7h8j8",
            },
            move_tree: this.makePuzzleMoveTree(
                ["h5"],
                ["g5j4", "j4h5", "g2f2g1f1h1j1", "g2f2g1f1j1h1"],
            ),
        };
    }
}
