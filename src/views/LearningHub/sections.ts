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
import { Intro } from "./Sections/Fundamentals/Intro";
import { CaptureStone } from "./Sections/BasicPrinciples/CaptureStone";
import { CaptureBlack } from "./Sections/BasicPrinciples/CaptureBlack";
import { CaptureWhite } from "./Sections/BasicPrinciples/CaptureWhite";
import { BothAtari } from "./Sections/BasicPrinciples/BothAtari";
import { SelfCapture } from "./Sections/Fundamentals/SelfCapture";
import { Escape } from "./Sections/BasicPrinciples/Escape";
import { FindEscape } from "./Sections/BasicPrinciples/FindEscape";
import { CreateOpening } from "./Sections/BasicPrinciples/CreateOpening";
import { Connect } from "./Sections/BasicPrinciples/Connect";
import { Cut } from "./Sections/BasicPrinciples/Cut";
import { Eyes } from "./Sections/Fundamentals/Eyes";
import { MakeAlive } from "./Sections/BasicPrinciples/MakeAlive";
import { CaptureGroup } from "./Sections/BasicPrinciples/CaptureGroup";
import { Ko } from "./Sections/Fundamentals/Ko";
import { EndingTheGame } from "./Sections/Fundamentals/EndingTheGame";
import { TheBoard } from "./Sections/Fundamentals/TheBoard";

import { AtariToSide1 } from "./Sections/BasicSkills/AtariToSide1";
import { AtariToSide2 } from "./Sections/BasicSkills/AtariToSide2";
import { AtariToStones } from "./Sections/BasicSkills/AtariToStones";
import { AtariWithCut1 } from "./Sections/BasicSkills/AtariWithCut1";
import { AtariWithCut2 } from "./Sections/BasicSkills/AtariWithCut2";
import { AtariCorrectSide } from "./Sections/BasicSkills/AtariCorrectSide";
import { MakeKo } from "./Sections/BasicSkills/MakeKo";

// import { SnapBack } from "./SnapBack";
// import { Seki } from "./Seki";
//import {Territory} from './Territory';
// import { Ladders } from "./Ladders";

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
        [Intro, SelfCapture, Eyes, Ko, /*Territory, */ EndingTheGame, TheBoard],
    ],
    [
        pgettext("Learning hub section title", "Basic Principles"),
        [
            CaptureStone,
            CaptureWhite,
            CaptureBlack,
            BothAtari,
            Escape,
            FindEscape,
            CreateOpening,
            Connect,
            Cut,
            MakeAlive,
            CaptureGroup,
        ],
    ],
    [
        pgettext("Learning hub section title", "Basic Skills"),
        [
            AtariToSide1,
            AtariToSide2,
            AtariToStones,
            AtariWithCut1,
            AtariWithCut2,
            AtariCorrectSide,
            MakeKo,
            // Ladders,
            // SnapBack,
            // Seki,
        ],
    ],

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
