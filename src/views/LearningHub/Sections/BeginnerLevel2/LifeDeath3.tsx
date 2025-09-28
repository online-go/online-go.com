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
/* cSpell:disable */

import { GobanConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class BL2LifeDeath3 extends LearningHubSection {
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
            Page14,
            Page15,
            Page16,
            Page17,
            Page18,
            Page19,
        ];
    }
    static section(): string {
        return "bl2-life-death-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning make 3 points eye space", "Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on make 3 points eye space",
            "3-points eye space",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "if your group has an eye-space of only 3 points, you should make two eyes right away. Otherwise your opponent plays at the centre of the 3-points eye-space and your group is dead. In this example White can force Black to create a 3-points eye space by playing at A. After Black has captured the 3 stones, White can capture the black group. White to play. Capture the black group by forcing a 3-points eye space.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcpcqcrbrbs",
                white: "arbobqcodndpdqdr",
            },
            marks: { A: "aq" },
            move_tree: this.makePuzzleMoveTree(["aqasaq"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by forcing a 3-points eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqcqdqarbrdrds",
                white: "bpcpdpfpeqcrercs",
            },
            move_tree: this.makePuzzleMoveTree(["bsascs"], ["esbs"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by forcing a 3-points eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "arbrcrdrerfs",
                white: "bqcqdqeqfqfrgrcsds",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["esbs", "gsbsesfs"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by forcing a 3-points eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpepcqfqcrdrfrdsfs",
                white: "codoeogobpfpbqdqgqbrergr",
            },
            move_tree: this.makePuzzleMoveTree(["eqeseq"], ["gseq", "eseq"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by forcing a 3-points eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codobpdpbqdqbrdrbsds",
                white: "embncndnboeoapcpepaqfqarcrfr",
            },
            move_tree: this.makePuzzleMoveTree(["cqcscq"], ["cscq"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by forcing a 3-points eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cqdqeqfqbrcrgrbsesfsgs",
                white: "bohocpdpepfpaqbqgqhqarhrdshs",
            },
            move_tree: this.makePuzzleMoveTree(["erfrdrcsdr"], ["drer", "frer", "csdr"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by forcing a 3-points eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqcqdqarbrdr",
                white: "apbpcpdpfpaqeqcreres",
            },
            move_tree: this.makePuzzleMoveTree(["csdsbsascs"], ["bscs", "dscs", "ascs"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by forcing a 3-points eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cqeqfqgqcrgrcsesfs",
                white: "bpcpdpepfpgpipbqhqbrfrhrbs",
            },
            move_tree: this.makePuzzleMoveTree(["drdqerdser"], ["erdr", "dqdr"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by forcing a 3-points eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeocpfpcqdqfqdrfrdsfs",
                white: "gmbndnencofogobpgpbqeqgqbrcrgr",
            },
            move_tree: this.makePuzzleMoveTree(["epdpereseq"], ["erep", "eser", "dpep"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by forcing a 3-points eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofocpfpcqeqfqcrdrer",
                white: "cndnenfnhnbogobpepgpbqdqgqbrgr",
            },
            move_tree: this.makePuzzleMoveTree(["dpdodp"], ["dodp"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a 3-points eye space and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocoapdpepaqeqcreres",
                white: "bpbqdqarbrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cscpcq"],
                ["cqcsdsbs", "cpcs", "dscscqbs", "bscq"],
                19,
                19,
            ),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a 3-points eye space and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fpaqbqcqdqeqfrgrhrcsds",
                white: "arbrcrdrerfs",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["esbs", "gsbs"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a 3-points eye space and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocoapcpfpaqcqdqerfr",
                white: "bpbqarcrdrds",
            },
            move_tree: this.makePuzzleMoveTree(["bsbrbq"], ["brbs", "esbr"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a 3-points eye space and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bneobpcpdpeqcrergrcs",
                white: "bqcqdqarbrdr",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["dsbs", "esbs", "apbs"], 19, 19),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a 3-points eye space and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aqbqcqdqeqfqgqgrirbsdsfs",
                white: "arbrcrdrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["escs"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a 3-points eye space and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eohofpbqcqdqfqgqhqbrhr",
                white: "crdrfrgrcsgs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["eres", "eqes"], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a 3-points eye space and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fodpepbqcqfqgqiqbrhrcs",
                white: "dqeqcrdrfrgrgs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["dses"], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a 3-points eye space and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncoapcpepbqdqeres",
                white: "bpcqarcrdrds",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["brbs", "aqbsaobr", "aqbsbrao"], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a 3-points eye space and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndnengnfobpgpbqgqbrgr",
                white: "doeofpcqeqfqdrer",
            },
            move_tree: this.makePuzzleMoveTree(["dp"], ["cpdp", "codp"], 19, 19),
        };
    }
}
