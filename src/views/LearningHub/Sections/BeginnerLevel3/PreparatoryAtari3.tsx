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

export class BL3PreparatoryAtari3 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [
            Page01,
            Page02,
            Page03,
            Page04,
            Page05,
            Page06,
            Page07,
            Page08,
            Page09,
            Page10,
            Page11,
            Page12,
            Page13,
        ];
    }
    static section(): string {
        return "bl3-preparatory-atari-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning net", "Preparatory Atari");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on net", "Capture in a net");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black can not capture the cutting stone in a net immediately. But the net will be possible after a preparatory atari at A. Black to play. Play a net after a preparatory atari.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bmcndndodpeqer",
                white: "bnbqbrcocpdqdrepgnhp",
            },
            marks: { A: "fp" },
            move_tree: this.makePuzzleMoveTree(["fpeofn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cpcocndodqeqerdl",
                white: "bsarbqcrcqbpdrdpepgqhohp",
            },
            move_tree: this.makePuzzleMoveTree(["fpeofn"], ["fpeoenfo", "eofp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bqbpcpcodqepeqergp",
                white: "brcrdrcqdodpbncmcliohm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dneofn"],
                ["dneoenfo", "dneofoen", "eodn"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cqbpbobndrercrardp",
                white: "dqeqcpcofrfpcl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epfqdn"],
                ["docndmcm", "docndncm", "docncmdn", "cndo"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cpdpepfqgqcqdncmhrclcoboanbn",
                white: "dreqbqenfmdmdlbpfpapdqaobrcr",
            },
            move_tree: this.makePuzzleMoveTree(["fogpho"], ["fogpipgo", "gpfo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcpdqeqergq",
                white: "aqbqcqdrcsbsardphogm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["doepfo"],
                ["doepfpeo", "doepeofp", "epdo", "eodo"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "drerfrfqepeofm",
                white: "fpeqdqcqcrbobncmhqiqhn",
            },
            move_tree: this.makePuzzleMoveTree(["gpfogn"], ["gpfogofn", "fogp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cpcqdqerfrdncmbobrclckfm",
                white: "dpepeqcocnbpbqaoanbmbldmdl",
            },
            move_tree: this.makePuzzleMoveTree(["dobnfo"], ["dobnfpen", "dobnfqen"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcpdqeqergr",
                white: "aqbqcqdrcsbrdpcncmgn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["doepfo"],
                ["doepfpeo", "doepeofp", "epdo"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cocncmbmdpdqeqerem",
                white: "crdrcqcpbobndodmdlgpgqhn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dneofo"],
                ["dneofnfo", "dneofpfo", "eodn"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cpcododqeqercmbn",
                white: "brcrdrcqbpbodpephpgm",
            },
            move_tree: this.makePuzzleMoveTree(["fpeofn"], ["fpeofoen", "eofp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "csbsbrbqbpcocnbl",
                white: "cpcqcrdodndmhqdsepirgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dreserfsgr"],
                ["dreserfsfrgs", "dresfrer", "erdr", "esdr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a net after a preparatory atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dqdpcocnemerfrfqcp",
                white: "eqepdoendrcqcrbpboaqbrgphpiqhn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fpeofn"],
                ["fpeofofn", "fpeodnfn", "fpeogndm", "dneo"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
