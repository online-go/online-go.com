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

export class LargeEye extends LearningHubSection {
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
            Page26,
            Page27,
            Page28,
            Page29,
        ];
    }
    static section(): string {
        return "large-eye";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning make two eyes", "Large Eye");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on make two eyes",
            "Make two eyes in a large eye",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black has a large eye of 3 points. For a safe group, Black needs two eyes. Black to play. Make two eyes, by playing at the 'vital point'.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "agbgbhchci",
                white: "afbfcfcgdgdhdi",
            },
            marks: { cross: "ai" },
            move_tree: this.makePuzzleMoveTree(["ai"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Again, Black has a 3-points eye shape. Black to play. Make two eyes, by playing at the vital point.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "afbfbgbhbi",
                white: "aebececfcgchci",
            },
            marks: { cross: "ah" },
            move_tree: this.makePuzzleMoveTree(["ah"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black has a 4-points eye shape. Black to play. Make two eyes, by playing at the vital point.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cichdhdgegfgfhghgi",
                white: "bibhbgcgcfdfefffgfgghghhhi",
            },
            marks: { cross: "ei" },
            move_tree: this.makePuzzleMoveTree(["ei"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black has a 5-points eye shape. Black to play. Make two (or more) eyes, by playing at the vital point.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cdcecfdcdddfdgecegfcfdfffggdgegf",
                white: "bcbdbebfbgcbcccgchdbdhebehfbfhgbgcggghhchdhehfhg",
            },
            marks: { cross: "ee" },
            move_tree: this.makePuzzleMoveTree(["ee"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black has a 5-points eye shape. Black to play. Make two eyes, by playing at the vital point.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cdcecfdcdddfeceffcffgdgegf",
                white: "bcbdbebfbgcbcccgdbdgebegfbfggbgcgghchdhehfhg",
            },
            marks: { cross: "ee" },
            move_tree: this.makePuzzleMoveTree(["ee"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gbhcfdgdfefffgghhh",
                white: "hdgeiegfcggghgig",
            },
            move_tree: this.makePuzzleMoveTree(["hf"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hcgehegfifegggfh",
                white: "cchfhgigghihgi",
            },
            move_tree: this.makePuzzleMoveTree(["hi"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gehffgggdhfh",
                white: "hgigghfihi",
            },
            move_tree: this.makePuzzleMoveTree(["ih"], [], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fdheffhffgfhfigi",
                white: "ccifgghgigghhi",
            },
            move_tree: this.makePuzzleMoveTree(["ih"], [], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eefegeheefhfdgigdhihdi",
                white: "ccffgffghgehhheifihi",
            },
            move_tree: this.makePuzzleMoveTree(["gh"], [], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "geheieefgffgfhfi",
                white: "hfifgghgghgihi",
            },
            move_tree: this.makePuzzleMoveTree(["ih"], [], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ebfbgbbcccdchcadcdhdcehehfbgcgdghgehfhgh",
                white: "ecfcgcbdddedgdbedegeafbfcfdfefgfegfggg",
            },
            move_tree: this.makePuzzleMoveTree(["fe"], [], 9, 9),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fbgbhbibfcicedeefffggghgig",
                white: "ccgchcfdgdidcefegfhfifcg",
            },
            move_tree: this.makePuzzleMoveTree(["he"], [], 9, 9),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gbhbibgcfdfefffgggghhh",
                white: "cchcicgdcegegfifcghg",
            },
            move_tree: this.makePuzzleMoveTree(["he"], ["hdieheih"], 9, 9),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "geheiegffgfh",
                white: "hfifggghhi",
            },
            move_tree: this.makePuzzleMoveTree(["ih"], ["hhig"], 9, 9),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gbhbgcfdfeffggghhhih",
                white: "cchcicgdhdgegfhgig",
            },
            move_tree: this.makePuzzleMoveTree(["ie"], ["heif"], 9, 9),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes so the white group lives.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fdcedeeecfffgfbgcghgbhhh",
                white: "dfefdgfgggchghcidifigi",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], [], 9, 9),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fdgdeegeefgfegggehfhgheifigi",
                white: "ecfcgcedhddehedfhfdghgdhhh",
            },
            move_tree: this.makePuzzleMoveTree(["ff"], [], 9, 9),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cchdcegeiegfcggghgig",
                white: "gbhcfdgdfefffgghhh",
            },
            move_tree: this.makePuzzleMoveTree(["hf"], [], 9, 9),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eccdifhgiggheifihi",
                white: "hdgehffgggdhfhdi",
            },
            move_tree: this.makePuzzleMoveTree(["ih"], [], 9, 9),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cchcichdhehfcghgighh",
                white: "gbhbgcgdgegfggghhi",
            },
            move_tree: this.makePuzzleMoveTree(["ie"], [], 9, 9),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cchcicddgdhdgedfhfcghgig",
                white: "gbhbibgcfdfegfggfhhhih",
            },
            move_tree: this.makePuzzleMoveTree(["ie"], [], 9, 9),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ebbcbdedfdgdhdiddeheiedfefgffg",
                white: "dcecfcgchccdcecfhfdghgehfhgh",
            },
            move_tree: this.makePuzzleMoveTree(["fe"], [], 9, 9),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hfifcgggigghgi",
                white: "gcgehegffgfh",
            },
            move_tree: this.makePuzzleMoveTree(["hh"], [], 9, 9),
        };
    }
}

class Page25 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hcicfdgdidcefegfifgghg",
                white: "hbfcgcedeefffgfhghhh",
            },
            move_tree: this.makePuzzleMoveTree(["he"], [], 9, 9),
        };
    }
}

class Page26 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hcichdgegfhfhgigih",
                white: "hbgcgdfeffggfhhh",
            },
            move_tree: this.makePuzzleMoveTree(["ie"], [], 9, 9),
        };
    }
}

class Page27 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccecgghgfhghihfi",
                white: "fegfhfifegfgeh",
            },
            move_tree: this.makePuzzleMoveTree(["hi"], [], 9, 9),
        };
    }
}

class Page28 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hdidgeiegfgghgigih",
                white: "gchcgdfefffgghhh",
            },
            move_tree: this.makePuzzleMoveTree(["hf"], [], 9, 9),
        };
    }
}

class Page29 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes, capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fggghgdhehhhaibicidihi",
                white: "ffgfhfcgdgegigbhchih",
            },
            move_tree: this.makePuzzleMoveTree(["fi"], [], 9, 9),
        };
    }
}
