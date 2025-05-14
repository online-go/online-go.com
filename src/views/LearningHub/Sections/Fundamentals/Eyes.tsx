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

import { GobanConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class Eyes extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04];
    }
    static section(): string {
        return "eyes";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning eyes", "Eyes");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on eyes", "One and two eyes");
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Point A is surrounded by white stones; it is called an 'eye'. Black can not play at A (self-capture). Point B is also an eye, but Black can play at B and capture. Capture the white stones.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "c1c2c3d3e3f3g3g2g1",
                white: "c7d8e7d6d1d2e2f2f1",
            },
            width: 9,
            height: 9,
            marks: { A: "d7", B: "e1" },
            move_tree: this.makePuzzleMoveTree(["e1"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White has a single bigger eye of two points, but the white group is not safe. Black to play. Capture the white stones by filling the eye point by point.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "a3b3c3d3d2d1",
                white: "a2b2c2c1",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["a1b1a1", "b1a1b1"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White has two groups of stones. One group has two eyes. The other group has a single big eye. The group with two eyes is safe and can never be captured. Black to play. Capture a white group.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "a3b3c3d3e3e2e1g9g8g7g6g5h5j5",
                white: "a2b2c2d2d1b1h9h8h7h6j6",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["j8j7j9"], ["j7j8", "j9j8"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "One white group has two 'real' eyes. The other group has a real eye at A and a 'false' eye at B. The false eye is not safe and can be attacked. Black to play. Capture the white group by attacking the false eye.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "a3b3c3d3e3e2e1g9g8g7g6h5j5",
                white: "a2b2c2d2d1b1h9h8h7j8j6",
            },
            width: 9,
            height: 9,
            marks: { A: "j9", B: "j7" },
            move_tree: this.makePuzzleMoveTree(["h6j7j9"], [], 9, 9),
        };
    }
}
