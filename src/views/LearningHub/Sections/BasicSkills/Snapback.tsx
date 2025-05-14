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

export class Snapback extends LearningHubSection {
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
            Page20,
            Page21,
            Page22,
            Page23,
            Page24,
            Page25,
        ];
    }
    static section(): string {
        return "snapback";
    }
    static title(): string {
        return pgettext(
            "Tutorial section name on learning capture white with snapback",
            "Snapback",
        );
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture white with snapback",
            "Capture with snapback",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black can capture the two marked white stones. Black should not give atari at A, because white would defend by playing at B. Black should first put himself in atari by playing at B. White can take this stone, by playing at A. But then the three white stones are in atari. Capturing the white stones this way is called a 'snapback'. Capture the marked white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfdgeeehfegegf",
                white: "efffhfggfhhh",
            },
            marks: { triangle: "efff", A: "eg", B: "fg" },
            move_tree: this.makePuzzleMoveTree(["fgegfg"], ["egfg"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fegeefhfhgghhh",
                white: "cfgfcgegggdhfh",
            },
            marks: { triangle: "gggf" },
            move_tree: this.makePuzzleMoveTree(["fg"], ["fffg"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "geffegehhhfigihi",
                white: "gchdhegfhgfhghih",
            },
            marks: { triangle: "ghfh" },
            move_tree: this.makePuzzleMoveTree(["gg"], ["fggg"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gcgeffgghgiggh",
                white: "dgfgfhhhihfigi",
            },
            marks: { triangle: "ihhh" },
            move_tree: this.makePuzzleMoveTree(["hi"], ["iihi"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fegeegfgggehhhhi",
                white: "cedfdgdhfhghdiei",
            },
            marks: { triangle: "ghfh" },
            move_tree: this.makePuzzleMoveTree(["fi"], ["gifi"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fdgfgghheihi",
                white: "cgfgchehghgi",
            },
            marks: { triangle: "gigh" },
            move_tree: this.makePuzzleMoveTree(["fh"], ["fifh"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "eeegfgeheihi",
                white: "gegfggfhhhfi",
            },
            marks: { triangle: "fifh" },
            move_tree: this.makePuzzleMoveTree(["gh"], ["gigh"], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fegeefhfegfh",
                white: "eeffgfhgghih",
            },
            marks: { triangle: "gfff" },
            move_tree: this.makePuzzleMoveTree(["gg"], ["fggg"], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fegeheffifighh",
                white: "eeefgfhfdgfggh",
            },
            marks: { triangle: "hfgf" },
            move_tree: this.makePuzzleMoveTree(["gg"], ["hggg"], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "decfefbgcgegchci",
                white: "bdcdceafbfagbhbi",
            },
            marks: { triangle: "bibh" },
            move_tree: this.makePuzzleMoveTree(["ah"], ["aiah"], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gcdefegecgdgegbhehbi",
                white: "cccebfbgahchdhfheifi",
            },
            marks: { triangle: "dhch" },
            move_tree: this.makePuzzleMoveTree(["di"], ["cidi"], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cededfagdgbhch",
                white: "bccdedbeafcfcg",
            },
            marks: { triangle: "cgcf" },
            move_tree: this.makePuzzleMoveTree(["bf"], ["bgbf"], 9, 9),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gcbdcdcecfgfagcgggbhbi",
                white: "acbcccdcadbebfbgegchdh",
            },
            marks: { triangle: "bgbfbe" },
            move_tree: this.makePuzzleMoveTree(["ae"], ["afae"], 9, 9),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dfefffbgcgggdhgh",
                white: "deeefecfgffgeh",
            },
            marks: { triangle: "ffefdf" },
            move_tree: this.makePuzzleMoveTree(["dg"], ["egdg"], 9, 9),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cfcgchehfhghcidi",
                white: "dgegfgggdhhhgi",
            },
            marks: { triangle: "ghfheh" },
            move_tree: this.makePuzzleMoveTree(["ei"], ["fiei"], 9, 9),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ffgfhfcgegigehhhhi",
                white: "fegeheieefiffggh",
            },
            marks: { triangle: "hfgfff" },
            move_tree: this.makePuzzleMoveTree(["hg"], ["gghg"], 9, 9),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "efffdgggdhghdieigi",
                white: "gcgegffghgehhhhi",
            },
            marks: { triangle: "gighgg" },
            move_tree: this.makePuzzleMoveTree(["fi"], ["fhfi"], 9, 9),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cfcgchehfhghcidigi",
                white: "gddgegfgggdhhhhi",
            },
            marks: { triangle: "gighfheh" },
            move_tree: this.makePuzzleMoveTree(["ei"], ["fiei"], 9, 9),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cfcgchehfhcidigi",
                white: "dgegfgdhghhhhi",
            },
            marks: { triangle: "gifheh" },
            move_tree: this.makePuzzleMoveTree(["ei"], ["fiei"], 9, 9),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dcfcgcedfedfef",
                white: "ddceeecfdgeg",
            },
            marks: { triangle: "efdf" },
            move_tree: this.makePuzzleMoveTree(["ff"], ["deff"], 9, 9),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgffgbhchdhfheifi",
                white: "cdbgcgdgegahehbi",
            },
            marks: { triangle: "dhchbh" },
            move_tree: this.makePuzzleMoveTree(["di"], ["cidi"], 9, 9),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccdcgcedgdeedfdgegfg",
                white: "defecfgfcgggdhehfh",
            },
            marks: { triangle: "fgegdgdf" },
            move_tree: this.makePuzzleMoveTree(["ef"], ["ffef"], 9, 9),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cecfcgegfgchdhfhfi",
                white: "dfefffdgggghdigi",
            },
            marks: { triangle: "fifhfgeg" },
            move_tree: this.makePuzzleMoveTree(["eh"], ["eieh"], 9, 9),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccaebeceafbgbhaibi",
                white: "eebfcfefgfcgchci",
            },
            marks: { triangle: "biaibhbg" },
            move_tree: this.makePuzzleMoveTree(["ag"], ["ahag"], 9, 9),
        };
    }
}

class Page25 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ecfccdfdcegebfdfefffbg",
                white: "eddecfgfhfcgdgegfgbh",
            },
            marks: { triangle: "ffefdf" },
            move_tree: this.makePuzzleMoveTree(["fe"], ["eefe"], 9, 9),
        };
    }
}
