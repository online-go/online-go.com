/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {LearningPage, DummyPage} from './LearningPage';
import {_, pgettext, interpolate} from "translate";
import {LearningHubSection} from './LearningHubSection';

export class EndingTheGame extends LearningHubSection {
    static pages():Array<typeof LearningPage> {
        return [
            Page1,
            Page2
        ];
    }

    static section():string { return "ending-the-game"; }
    static title():string { return pgettext("Tutorial section name on learning how to end the game", "End the game!"); }
    static subtext():string { return pgettext("Tutorial section subtext on learning how to end the game", "Pass and pass"); }
}

class Page1 extends LearningPage {
    pass_pressed = false;

    constructor(props) {
        super(props);
    }

    text() {
        return _("When you don't think there are any more good moves to make, to end the game both players pass their turns. This game is finished. Click pass to end it.");
    }
    button() {
        return <div>
            <button className='primary' onClick={() => { this.pass_pressed = true; this.onUpdate(); }}>{_("Pass")}</button>
        </div>;
    }
    config() {
        return {
            mode: "puzzle",
            initial_state: {black: "fafbgbhbgdhdcedeheiebfdfefgfhfagcgegfggg", white: "eahaebibbcccecfcgchcicadcdddfdidaebeeefegeafff"},
            move_tree: this.makePuzzleMoveTree(
                [ "b6" /* dummy to trigger fail */ ], [ ]
            )
        };
    }

    complete() {
        return this.pass_pressed;
    }
}

class Page2 extends LearningPage {
    success = false;

    constructor(props) {
        super(props);
    }

    text() {
        return _("After both players have passed, you enter a \"Stone Removal Phase\", where you can remove obviously dead stones from play. You could capture these in game as well, but most players opt not to because it's quicker. Remove the dead black stones by clicking them. ");
    }
    config() {
        return {
            mode: "play",
            engine_phase: "stone removal",
            initial_state: {black: "fafbgbhbgdhdcedeheiebfdfefgfhfagcgegfggg", white: "eahaebibbcccecfcgchcicadcdddfdidaebeeefegeafff"},
            onSetStoneRemoval: () => {
                if (this.refs.igoban.goban.engine.getStoneRemovalString() === "fafbgbhb") {
                    this.success = true;
                    this.onUpdate();
                }
            }
        };
    }

    complete() {
        return this.success;
    }
}
