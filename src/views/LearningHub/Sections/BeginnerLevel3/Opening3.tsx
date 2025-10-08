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

export class BL3Opening3 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07];
    }
    static section(): string {
        return "bl3-opening-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning pincer", "Opening");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on pincer", "Pincer");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "When Black attacks the white stone in the corner with a kakari at 1, White can attack the attacking black stone from the other side with a pincer. With this pincer, Black is attacked from two sides. White can play a pincer by playing at one of the marked points. White prevents black from making a base. White to play. Play a pincer.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 11 },
            /* cSpell:disable */
            initial_state: {
                black: "fq",
                white: "dp",
            },
            marks: { X: "hphqipiqjpjq" },
            move_tree: this.makePuzzleMoveTree(["hp", "hq", "ip", "jp", "iq", "jq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best pincer.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 6, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "dp",
                white: "fq",
            },
            move_tree: this.makePuzzleMoveTree(["hq", "hp", "ip", "iq", "jp", "jq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best pincer.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 6, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "cp",
                white: "eq",
            },
            move_tree: this.makePuzzleMoveTree(["gp", "gq", "hp", "hq", "ip", "iq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best pincer.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 6, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "cp",
                white: "ep",
            },
            move_tree: this.makePuzzleMoveTree(["gp", "gq", "hp", "hq", "ip", "iq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best pincer.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 6, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "docp",
                white: "eq",
            },
            move_tree: this.makePuzzleMoveTree(["gp", "gq", "hp", "hq", "ip", "iq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best pincer.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 6, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "dndpeq",
                white: "fpfq",
            },
            move_tree: this.makePuzzleMoveTree(["hp", "hq", "ip", "iq", "jp", "jq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best pincer.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 6, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "dncpdpcq",
                white: "epdqeq",
            },
            move_tree: this.makePuzzleMoveTree(["gp", "gq", "hp", "hq", "ip", "iq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
