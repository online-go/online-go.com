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

import { pgettext } from "@/lib/translate";
import { LearningHubSection } from "./LearningHubSection";
import { CaptureStone } from "./Sections/Fundamentals/CaptureStone";
import { CaptureBlack } from "./Sections/Fundamentals/CaptureBlack";
import { CaptureWhite } from "./Sections/Fundamentals/CaptureWhite";
import { Suicide } from "./Sections/Fundamentals/Suicide";
import { Escape } from "./Sections/Fundamentals/Escape";
import { FindEscape } from "./Sections/Fundamentals/FindEscape";
import { CreateOpening } from "./Sections/Fundamentals/CreateOpening";
import { Connect } from "./Sections/Fundamentals/Connect";
import { Cut } from "./Sections/Fundamentals/Cut";
import { Eyes } from "./Sections/Fundamentals/Eyes";
import { MakeAlive } from "./Sections/Fundamentals/MakeAlive";
import { Kill } from "./Sections/Fundamentals/Kill";
import { Ko } from "./Sections/Fundamentals/Ko";
import { SnapBack } from "./SnapBack";
import { Seki } from "./Seki";
//import {Territory} from './Territory';
import { Ladders } from "./Ladders";
import { EndingTheGame } from "./Sections/Fundamentals/EndingTheGame";
import { TheBoard } from "./Sections/Fundamentals/TheBoard";
import { Intro } from "./Sections/Fundamentals/Intro";

export class FalseEyes extends LearningHubSection {
    static section(): string {
        return "false-eyes";
    }
    static title(): string {
        return pgettext("Tutorial section on false eyes", "False Eyes");
    }
    static subtext(): string {
        return pgettext("Tutorial section on false eyes", "Some eyes aren't really eyes");
    }
}
export class CuttingStones extends LearningHubSection {
    static section(): string {
        return "cutting-stones";
    }
    static title(): string {
        return pgettext("Tutorial section on cutting stones", "Cutting Stones");
    }
    static subtext(): string {
        return pgettext("Tutorial section on cutting stones", "");
    }
}
export class JumpingStones extends LearningHubSection {
    static section(): string {
        return "jumping-stones";
    }
    static title(): string {
        return pgettext("Tutorial section on jumping stones", "Jumping Stones");
    }
    static subtext(): string {
        return pgettext("Tutorial section on jumping stones", "");
    }
}

export class Semeai extends LearningHubSection {
    static section(): string {
        return "semeai";
    }
    static title(): string {
        return pgettext("Tutorial section on semeai", "Semeai");
    }
    static subtext(): string {
        return pgettext("Tutorial section on semeai", "Attacking each other");
    }
}
export class CountingLiberties extends LearningHubSection {
    static section(): string {
        return "counting-liberties";
    }
    static title(): string {
        return pgettext("Tutorial section on counting liberties", "Counting Liberties");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section on counting liberties",
            "Known when you can win a battle",
        );
    }
}
export class WhatIsGo extends LearningHubSection {
    static section(): string {
        return "what-is-go";
    }
    static title(): string {
        return pgettext("Tutorial section on what is go", "What is Go?");
    }
    static subtext(): string {
        return pgettext("Tutorial section on what is go", "");
    }
}
export class SportOfGoAndGoAsArt extends LearningHubSection {
    static section(): string {
        return "sport-of-go-and-go-as-art";
    }
    static title(): string {
        return pgettext("Tutorial section on the sport of Go", "Sport of Go");
    }
    static subtext(): string {
        return pgettext("Tutorial section on the sport of Go", "Go as Art");
    }
}
export class BenefitsOfLearningGo extends LearningHubSection {
    static section(): string {
        return "benefits-of-learning-go";
    }
    static title(): string {
        return pgettext("Tutorial section on benefits to learning go", "Benefits of learning Go");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section on benefits to learning go",
            "It's more than just a game!",
        );
    }
}
export class BasicMannersOfGo extends LearningHubSection {
    static section(): string {
        return "basic-manners-of-go";
    }
    static title(): string {
        return pgettext("Tutorial section on the manners in the game", "Basic manners of Go");
    }
    static subtext(): string {
        return pgettext("Tutorial section on the manners in the game", "Be polite, it's Go!");
    }
}
export class Terminology extends LearningHubSection {
    static section(): string {
        return "terminology";
    }
    static title(): string {
        return pgettext("Tutorial section on terminology", "Terminology");
    }
    static subtext(): string {
        return pgettext("Tutorial section on terminology", "Say what now?");
    }
}

export const sections: [string, any[]][] = [
    [
        pgettext("Learning hub section title", "Fundamentals"),
        [
            Intro,
            CaptureStone,
            CaptureWhite,
            CaptureBlack,
            Suicide,
            Escape,
            FindEscape,
            CreateOpening,
            Connect,
            Cut,
            Eyes,
            MakeAlive,
            Kill,
            Ko,
            /*Territory, */ EndingTheGame,
            TheBoard,
        ],
    ],
    [pgettext("Learning hub section title", "Basic Skills"), [Ladders, SnapBack, Seki, Ko]],
    /*
    [pgettext("Learning hub section title", "Intermediate"),
        [TheBoard, Ladders, SnapBack, FalseEyes, CuttingStones, JumpingStones]],
    [pgettext("Learning hub section title", "Advanced"),
        [Semeai, CountingLiberties, Seki, Ko ]],
    */
    /*
    [pgettext("Learning hub section title", "About The Game"),
        [WhatIsGo, SportOfGoAndGoAsArt, BenefitsOfLearningGo, BasicMannersOfGo, Terminology]],
    */
];

export let all_sections: Array<typeof LearningHubSection> = [];
for (const S of sections) {
    all_sections = all_sections.concat(S[1]);
}
