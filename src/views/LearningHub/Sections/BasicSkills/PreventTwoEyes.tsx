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

export class PreventTwoEyes extends LearningHubSection {
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
        return "prevent_two_eyes";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning prevent two eyes", "Prevent two eyes");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on prevent two eyes",
            "Prevent two eyes",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes killing the black group.");
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
