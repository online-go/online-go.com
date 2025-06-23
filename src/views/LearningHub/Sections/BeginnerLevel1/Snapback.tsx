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

export class BL1Snapback extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl1-snapback";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture with snapback", "4.7 Snapback");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture with snapback",
            "Capture with snapback",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cccecfffgfbgdgfgeh",
                white: "eefegedfhfggfhgh",
            },
            marks: { triangle: "fggfff" },
            move_tree: this.makePuzzleMoveTree(["eg"], ["efeg"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dbddcebfdfefffhfbggghg",
                white: "ecedfegecfgfcgdgegfg",
            },
            marks: { triangle: "ffefdf" },
            move_tree: this.makePuzzleMoveTree(["de"], ["eede"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ffegfghgchdhghihhi",
                white: "fegedfefhfdgehfh",
            },
            marks: { triangle: "fgegff" },
            move_tree: this.makePuzzleMoveTree(["gg"], ["gfgg"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ddeddefegedfgfbgcgggdheh",
                white: "bcdceccdfdgdcecfffdgeg",
            },
            marks: { triangle: "dfdeeddd" },
            move_tree: this.makePuzzleMoveTree(["ee"], ["efee"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gdhdideefeiehfgghgehfh",
                white: "geheffgfcgfgghhhihgi",
            },
            marks: { triangle: "hggghf" },
            move_tree: this.makePuzzleMoveTree(["if"], ["igif"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "acbcccdcadbebfag",
                white: "bdcdcecfbgcgah",
            },
            marks: { triangle: "agbfbe" },
            move_tree: this.makePuzzleMoveTree(["ae"], ["afae"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ffgfhfifighhgihi",
                white: "cgegfggghgghfi",
            },
            marks: { triangle: "higihh" },
            move_tree: this.makePuzzleMoveTree(["ih"], ["iiih"], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bcbdcedefeafbf",
                white: "adcfagbgcgfg",
            },
            marks: { triangle: "bfaf" },
            move_tree: this.makePuzzleMoveTree(["be"], ["aebe"], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fcgchcicidhehfhg",
                white: "gdhdgegfggighh",
            },
            marks: { triangle: "hghfhe" },
            move_tree: this.makePuzzleMoveTree(["ie"], ["ifie"], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dcddceeeefgfdgfggg",
                white: "edfecfffcgegdheh",
            },
            marks: { triangle: "dgefee" },
            move_tree: this.makePuzzleMoveTree(["de"], ["dfde"], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgdfehefffgghhhfi",
                white: "fdeeefhfegggehfh",
            },
            marks: { triangle: "fgfffe" },
            move_tree: this.makePuzzleMoveTree(["ge"], ["gfge"], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dedfcgegchehcidiei",
                white: "cfefbgfgbhfhbifi",
            },
            marks: { triangle: "eidiciehchegcg" },
            move_tree: this.makePuzzleMoveTree(["dg"], ["dhdg"], 9, 9),
        };
    }
}
