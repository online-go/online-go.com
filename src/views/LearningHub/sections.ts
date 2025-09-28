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
import { CountLiberties } from "./Sections/BasicPrinciples/CountLiberties";
import { CountChains } from "./Sections/BasicPrinciples/CountChains";
import { InAtari } from "./Sections/BasicPrinciples/InAtari";
import { CountAtari } from "./Sections/BasicPrinciples/CountAtari";
import { CaptureStone } from "./Sections/BasicPrinciples/CaptureStone";
import { CaptureChain } from "./Sections/BasicPrinciples/CaptureChain";
import { BothAtari } from "./Sections/BasicPrinciples/BothAtari";
import { SelfCapture } from "./Sections/Fundamentals/SelfCapture";
import { Escape } from "./Sections/BasicPrinciples/Escape";
import { FindEscape } from "./Sections/BasicPrinciples/FindEscape";
import { CreateOpening } from "./Sections/BasicPrinciples/CreateOpening";
import { Connect } from "./Sections/BasicPrinciples/Connect";
import { Cut } from "./Sections/BasicPrinciples/Cut";
import { BPSelfCapture } from "./Sections/BasicPrinciples/BPSelfCapture";
import { RealFalseEye } from "./Sections/BasicPrinciples/RealFalseEye";
import { BPKo } from "./Sections/BasicPrinciples/BPKo";
import { GroupAlive } from "./Sections/BasicPrinciples/GroupAlive";
import { Eyes } from "./Sections/Fundamentals/Eyes";
import { TwoEyes } from "./Sections/BasicPrinciples/TwoEyes";
import { CaptureGroup } from "./Sections/BasicPrinciples/CaptureGroup";
import { Ko } from "./Sections/Fundamentals/Ko";
import { EndingTheGame } from "./Sections/Fundamentals/EndingTheGame";
import { TheBoard } from "./Sections/Fundamentals/TheBoard";

import { AtariToSide } from "./Sections/BasicSkills/AtariToSide";
import { AtariToStones } from "./Sections/BasicSkills/AtariToStones";
import { AtariWithCut } from "./Sections/BasicSkills/AtariWithCut";
import { AtariCorrectSide } from "./Sections/BasicSkills/AtariCorrectSide";
import { EscapePossible } from "./Sections/BasicSkills/EscapePossible";
import { MakeKo } from "./Sections/BasicSkills/MakeKo";
import { PlayDoubleAtari } from "./Sections/BasicSkills/PlayDoubleAtari";
import { PreventDoubleAtari } from "./Sections/BasicSkills/PreventDoubleAtari";
import { ConnectedShape } from "./Sections/BasicSkills/ConnectedShape";
import { BasicSkillsCut } from "./Sections/BasicSkills/BasicSkillsCut";
import { HangingConnection } from "./Sections/BasicSkills/HangingConnection";
import { Ladder } from "./Sections/BasicSkills/Ladder";
import { ShortageLiberties } from "./Sections/BasicSkills/ShortageLiberties";
import { FalseEye } from "./Sections/BasicSkills/FalseEye";
import { LargeEye } from "./Sections/BasicSkills/LargeEye";
import { BSGroupAlive } from "./Sections/BasicSkills/BSGroupAlive";
import { Snapback } from "./Sections/BasicSkills/Snapback";
import { Net } from "./Sections/BasicSkills/Net";
import { CountTerritory } from "./Sections/BasicSkills/CountTerritory";
import { Winner } from "./Sections/BasicSkills/Winner";
import { CloseTerritory } from "./Sections/BasicSkills/CloseTerritory";
import { CompareLiberties } from "./Sections/BasicSkills/CompareLiberties";
import { CapturingRace } from "./Sections/BasicSkills/CapturingRace";
import { CorrectSide } from "./Sections/BasicSkills/CorrectSide";
import { Capture } from "./Sections/BasicSkills/Capture";
import { BSEscape } from "./Sections/BasicSkills/BSEscape";
import { Enclose } from "./Sections/BasicSkills/Enclose";
import { FirstLine } from "./Sections/BasicSkills/FirstLine";
import { BSLiberties } from "./Sections/BasicSkills/Liberties";
import { Territory } from "./Sections/Fundamentals/Territory";

import { BL1Atari } from "./Sections/BeginnerLevel1/Atari";
import { EscapeFromNet } from "./Sections/BeginnerLevel1/EscapeFromNet";
import { BL1CalculateEscape } from "./Sections/BeginnerLevel1/CalculateEscape";
import { BL1Ladder } from "./Sections/BeginnerLevel1/Ladder";
import { BL1CalculateLadder } from "./Sections/BeginnerLevel1/CalculateLadder";
import { BL1DoubleAtari } from "./Sections/BeginnerLevel1/DoubleAtari";
import { BL1Snapback } from "./Sections/BeginnerLevel1/Snapback";
import { BL1Net } from "./Sections/BeginnerLevel1/Net";
import { BL1ChaseDown } from "./Sections/BeginnerLevel1/ChaseDown";
import { BL1Capture1 } from "./Sections/BeginnerLevel1/Capture1";
import { BL1Capture2 } from "./Sections/BeginnerLevel1/Capture2";
import { BL1Capture3 } from "./Sections/BeginnerLevel1/Capture3";
import { BL1Capture4 } from "./Sections/BeginnerLevel1/Capture4";
import { BL1Connect } from "./Sections/BeginnerLevel1/Connect";
import { BL1Cut } from "./Sections/BeginnerLevel1/Cut";
import { BL1CancelCut } from "./Sections/BeginnerLevel1/CancelCut";
import { BL1Eye } from "./Sections/BeginnerLevel1/Eye";
import { BL1FalseEye } from "./Sections/BeginnerLevel1/FalseEye";
import { BL1CountEyes } from "./Sections/BeginnerLevel1/CountEyes";
import { BL1CloseTerritory } from "./Sections/BeginnerLevel1/CloseTerritory";
import { BL1ReduceTerritory } from "./Sections/BeginnerLevel1/ReduceTerritory";
import { BL1CapturingRace1 } from "./Sections/BeginnerLevel1/CapturingRace1";
import { BL1CapturingRace2 } from "./Sections/BeginnerLevel1/CapturingRace2";
import { BL1Seki1 } from "./Sections/BeginnerLevel1/Seki1";
import { BL1Seki2 } from "./Sections/BeginnerLevel1/Seki2";
import { BL1LifeDeath1 } from "./Sections/BeginnerLevel1/LifeDeath1";
import { BL1LifeDeath2 } from "./Sections/BeginnerLevel1/LifeDeath2";
import { BL1LifeDeath3 } from "./Sections/BeginnerLevel1/LifeDeath3";
import { BL1LifeDeath4 } from "./Sections/BeginnerLevel1/LifeDeath4";
import { BL1LifeDeath5 } from "./Sections/BeginnerLevel1/LifeDeath5";
import { BL1LifeDeath6 } from "./Sections/BeginnerLevel1/LifeDeath6";
import { BL1LifeDeath7 } from "./Sections/BeginnerLevel1/LifeDeath7";
import { BL1SerialAtari } from "./Sections/BeginnerLevel1/SerialAtari";
import { BL1Ko } from "./Sections/BeginnerLevel1/Ko";
import { BL1GoodPlay } from "./Sections/BeginnerLevel1/GoodPlay";
import { BL1Block } from "./Sections/BeginnerLevel1/Block";
import { BL1Stretch } from "./Sections/BeginnerLevel1/Stretch";
import { BL2Seki } from "./Sections/BeginnerLevel2/Seki";
import { BL2Atari } from "./Sections/BeginnerLevel2/Atari";
import { BL2ChaseDown } from "./Sections/BeginnerLevel2/ChaseDown";
import { BL2Snapback } from "./Sections/BeginnerLevel2/Snapback";
import { BL2Net } from "./Sections/BeginnerLevel2/Net";
import { BL2Capture1 } from "./Sections/BeginnerLevel2/Capture1";
import { BL2Capture2 } from "./Sections/BeginnerLevel2/Capture2";
import { BL2ThrowIn1 } from "./Sections/BeginnerLevel2/ThrowIn1";
import { BL2ThrowIn2 } from "./Sections/BeginnerLevel2/ThrowIn2";
import { BL2Capture3 } from "./Sections/BeginnerLevel2/Capture3";
import { BL2Connect } from "./Sections/BeginnerLevel2/Connect";
import { BL2Cut1 } from "./Sections/BeginnerLevel2/Cut1";
import { BL2Cut2 } from "./Sections/BeginnerLevel2/Cut2";
import { BL2Opening } from "./Sections/BeginnerLevel2/Opening";
import { BL2Corner1 } from "./Sections/BeginnerLevel2/Corner1";
import { BL2Corner2 } from "./Sections/BeginnerLevel2/Corner2";
import { BL2Defense1 } from "./Sections/BeginnerLevel2/Defense1";
import { BL2Defense2 } from "./Sections/BeginnerLevel2/Defense2";
import { BL2Defense3 } from "./Sections/BeginnerLevel2/Defense3";
import { BL2Miai } from "./Sections/BeginnerLevel2/Miai";
import { BL2Eye1 } from "./Sections/BeginnerLevel2/Eye1";
import { BL2Eye2 } from "./Sections/BeginnerLevel2/Eye2";
import { BL2Eye3 } from "./Sections/BeginnerLevel2/Eye3";
import { BL2Endgame1 } from "./Sections/BeginnerLevel2/Endgame1";
import { BL2Endgame2 } from "./Sections/BeginnerLevel2/Endgame2";
import { BL2Endgame3 } from "./Sections/BeginnerLevel2/Endgame3";
import { BL2Endgame4 } from "./Sections/BeginnerLevel2/Endgame4";
import { BL2Endgame5 } from "./Sections/BeginnerLevel2/Endgame5";
import { BL2LifeDeath1 } from "./Sections/BeginnerLevel2/LifeDeath1";
import { BL2LifeDeath2 } from "./Sections/BeginnerLevel2/LifeDeath2";
import { BL2LifeDeath3 } from "./Sections/BeginnerLevel2/LifeDeath3";
import { BL2LifeDeath4 } from "./Sections/BeginnerLevel2/LifeDeath4";
import { BL2LifeDeath5 } from "./Sections/BeginnerLevel2/LifeDeath5";
import { BL2LifeDeath6 } from "./Sections/BeginnerLevel2/LifeDeath6";
import { BL2Ko1 } from "./Sections/BeginnerLevel2/Ko1";
import { BL2Ko2 } from "./Sections/BeginnerLevel2/Ko2";
import { BL2Ko3 } from "./Sections/BeginnerLevel2/Ko3";
import { BL2Haengma1 } from "./Sections/BeginnerLevel2/Haengma1";
import { BL2Haengma2 } from "./Sections/BeginnerLevel2/Haengma2";
import { BL2Haengma3 } from "./Sections/BeginnerLevel2/Haengma3";
import { BL2Haengma4 } from "./Sections/BeginnerLevel2/Haengma4";
import { BL2Haengma5 } from "./Sections/BeginnerLevel2/Haengma5";
import { BL2Shape1 } from "./Sections/BeginnerLevel2/Shape1";
import { BL2Shape2 } from "./Sections/BeginnerLevel2/Shape2";
import { BL2CapturingRace1 } from "./Sections/BeginnerLevel2/CapturingRace1";
import { BL2CapturingRace2 } from "./Sections/BeginnerLevel2/CapturingRace2";
import { BL2CapturingRace3 } from "./Sections/BeginnerLevel2/CapturingRace3";
import { BL2CapturingRace4 } from "./Sections/BeginnerLevel2/CapturingRace4";
import { BL2CapturingRace5 } from "./Sections/BeginnerLevel2/CapturingRace5";

// export class FalseEyes extends LearningHubSection {
//     static section(): string {
//         return "false-eyes";
//     }
//     static title(): string {
//         return pgettext("Tutorial section on false eyes", "False Eyes");
//     }
//     static subtext(): string {
//         return pgettext("Tutorial section on false eyes", "Some eyes aren't really eyes");
//     }
// }
// export class CuttingStones extends LearningHubSection {
//     static section(): string {
//         return "cutting-stones";
//     }
//     static title(): string {
//         return pgettext("Tutorial section on cutting stones", "Cutting Stones");
//     }
//     static subtext(): string {
//         return pgettext("Tutorial section on cutting stones", "");
//     }
// }
// export class JumpingStones extends LearningHubSection {
//     static section(): string {
//         return "jumping-stones";
//     }
//     static title(): string {
//         return pgettext("Tutorial section on jumping stones", "Jumping Stones");
//     }
//     static subtext(): string {
//         return pgettext("Tutorial section on jumping stones", "");
//     }
// }

// export class Semeai extends LearningHubSection {
//     static section(): string {
//         return "semeai";
//     }
//     static title(): string {
//         return pgettext("Tutorial section on semeai", "Semeai");
//     }
//     static subtext(): string {
//         return pgettext("Tutorial section on semeai", "Attacking each other");
//     }
// }
// export class CountingLiberties extends LearningHubSection {
//     static section(): string {
//         return "counting-liberties";
//     }
//     static title(): string {
//         return pgettext("Tutorial section on counting liberties", "Counting Liberties");
//     }
//     static subtext(): string {
//         return pgettext(
//             "Tutorial section on counting liberties",
//             "Known when you can win a battle",
//         );
//     }
// }
// export class WhatIsGo extends LearningHubSection {
//     static section(): string {
//         return "what-is-go";
//     }
//     static title(): string {
//         return pgettext("Tutorial section on what is go", "What is Go?");
//     }
//     static subtext(): string {
//         return pgettext("Tutorial section on what is go", "");
//     }
// }
// export class SportOfGoAndGoAsArt extends LearningHubSection {
//     static section(): string {
//         return "sport-of-go-and-go-as-art";
//     }
//     static title(): string {
//         return pgettext("Tutorial section on the sport of Go", "Sport of Go");
//     }
//     static subtext(): string {
//         return pgettext("Tutorial section on the sport of Go", "Go as Art");
//     }
// }
// export class BenefitsOfLearningGo extends LearningHubSection {
//     static section(): string {
//         return "benefits-of-learning-go";
//     }
//     static title(): string {
//         return pgettext("Tutorial section on benefits to learning go", "Benefits of learning Go");
//     }
//     static subtext(): string {
//         return pgettext(
//             "Tutorial section on benefits to learning go",
//             "It's more than just a game!",
//         );
//     }
// }
// export class BasicMannersOfGo extends LearningHubSection {
//     static section(): string {
//         return "basic-manners-of-go";
//     }
//     static title(): string {
//         return pgettext("Tutorial section on the manners in the game", "Basic manners of Go");
//     }
//     static subtext(): string {
//         return pgettext("Tutorial section on the manners in the game", "Be polite, it's Go!");
//     }
// }
// export class Terminology extends LearningHubSection {
//     static section(): string {
//         return "terminology";
//     }
//     static title(): string {
//         return pgettext("Tutorial section on terminology", "Terminology");
//     }
//     static subtext(): string {
//         return pgettext("Tutorial section on terminology", "Say what now?");
//     }
// }

export const sections: [string, any[]][] = [
    [
        pgettext("Learning hub section title", "Fundamentals"),
        [Intro, SelfCapture, Eyes, Ko, Territory, EndingTheGame, TheBoard],
    ],
    [
        pgettext("Learning hub section title", "Basic Principles"),
        [
            CountLiberties,
            CountChains,
            InAtari,
            CountAtari,
            CaptureStone,
            CaptureChain,
            BothAtari,
            Escape,
            FindEscape,
            CreateOpening,
            Connect,
            Cut,
            BPSelfCapture,
            RealFalseEye,
            BPKo,
            GroupAlive,
            TwoEyes,
            CaptureGroup,
        ],
    ],
    [
        pgettext("Learning hub section title", "Basic Skills"),
        [
            AtariToSide,
            AtariToStones,
            AtariWithCut,
            AtariCorrectSide,
            EscapePossible,
            MakeKo,
            PlayDoubleAtari,
            PreventDoubleAtari,
            ConnectedShape,
            BasicSkillsCut,
            HangingConnection,
            Ladder,
            ShortageLiberties,
            FalseEye,
            LargeEye,
            BSGroupAlive,
            Snapback,
            Net,
            CountTerritory,
            Winner,
            CloseTerritory,
            CompareLiberties,
            CapturingRace,
            CorrectSide,
            Capture,
            BSEscape,
            BSLiberties,
            Enclose,
            FirstLine,
        ],
    ],
    [
        pgettext("Learning hub section title", "Beginner Level 1"),
        [
            BL1Atari,
            EscapeFromNet,
            BL1CalculateEscape,
            BL1CalculateLadder,
            BL1Ladder,
            BL1DoubleAtari,
            BL1Snapback,
            BL1Net,
            BL1ChaseDown,
            BL1Capture1,
            BL1Capture2,
            BL1Capture3,
            BL1Capture4,
            BL1Connect,
            BL1Cut,
            BL1CancelCut,
            BL1Eye,
            BL1FalseEye,
            BL1CountEyes,
            BL1CloseTerritory,
            BL1ReduceTerritory,
            BL1CapturingRace1,
            BL1CapturingRace2,
            BL1Seki1,
            BL1Seki2,
            BL1LifeDeath1,
            BL1LifeDeath2,
            BL1LifeDeath3,
            BL1LifeDeath4,
            BL1LifeDeath5,
            BL1LifeDeath6,
            BL1LifeDeath7,
            BL1SerialAtari,
            BL1Ko,
            BL1GoodPlay,
            BL1Block,
            BL1Stretch,
        ],
    ],
    [
        pgettext("Learning hub section title", "Beginner Level 2"),
        [
            BL2Seki,
            BL2Atari,
            BL2ChaseDown,
            BL2Snapback,
            BL2Net,
            BL2Capture1,
            BL2Capture2,
            BL2ThrowIn1,
            BL2ThrowIn2,
            BL2Capture3,
            BL2Connect,
            BL2Cut1,
            BL2Cut2,
            BL2Opening,
            BL2Corner1,
            BL2Corner2,
            BL2Defense1,
            BL2Defense2,
            BL2Defense3,
            BL2Miai,
            BL2Eye1,
            BL2Eye2,
            BL2Eye3,
            BL2Endgame1,
            BL2Endgame2,
            BL2Endgame3,
            BL2Endgame4,
            BL2Endgame5,
            BL2LifeDeath1,
            BL2LifeDeath2,
            BL2LifeDeath3,
            BL2LifeDeath4,
            BL2LifeDeath5,
            BL2LifeDeath6,
            BL2Ko1,
            BL2Ko2,
            BL2Ko3,
            BL2Haengma1,
            BL2Haengma2,
            BL2Haengma3,
            BL2Haengma4,
            BL2Haengma5,
            BL2Shape1,
            BL2Shape2,
            BL2CapturingRace1,
            BL2CapturingRace2,
            BL2CapturingRace3,
            BL2CapturingRace4,
            BL2CapturingRace5,
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

// Initialize section and lesson indices for all sections
function initializeSectionIndices() {
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
        const [, lessons] = sections[sectionIndex];
        for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
            const LessonClass = lessons[lessonIndex];
            LessonClass.sectionIndex = sectionIndex;
            LessonClass.lessonIndex = lessonIndex;
        }
    }
}

// Initialize indices after sections and all_sections are defined
initializeSectionIndices();
