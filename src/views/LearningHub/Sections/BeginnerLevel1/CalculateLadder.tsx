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
import React from "react";

export class BL1CalculateLadder extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08];
    }
    static section(): string {
        return "bl1-calculate-ladder";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning does the ladder work", "Ladder");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on does the ladder work",
            "Does the ladder work?",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If you want to capture in a ladder, you have to look out for a ladder-breaker. Black wants to capture the marked stone in a ladder, but this ladder will not work, because the other white stone is a ladder-breaker. Try to capture the marked stone in a ladder and see what happens.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "edfeff",
                white: "eecg",
            },
            marks: { triangle: "ee" },
            move_tree: this.makePuzzleMoveTree(["deefegdfcfdg"], ["efde"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Sometimes you can avoid the ladder-breaker, by starting at the correct side. Black can choose between playing at A or B. Capture the marked stones in a ladder by choosing the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "edfeffeg",
                white: "eeefcg",
            },
            marks: { triangle: "eeef", A: "de", B: "df" },
            move_tree: this.makePuzzleMoveTree(["df"], ["de"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Can you capture the marked stones in a ladder that works?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="yes"
                            checked={value === "yes"}
                            onChange={handleChange}
                        />
                        yes
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="no"
                            checked={value === "no"}
                            onChange={handleChange}
                        />
                        no
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_state: {
                black: "ddedfegeeffg",
                white: "ecfdgddeeecg",
            },
            marks: { triangle: "eede" },
            phase: "finished",
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Can you capture the marked stones in a ladder that works?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="yes"
                            checked={value === "yes"}
                            onChange={handleChange}
                        />
                        yes
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="no"
                            checked={value === "no"}
                            onChange={handleChange}
                        />
                        no
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_state: {
                black: "ddedfegeef",
                white: "fcfddeeedh",
            },
            marks: { triangle: "eede" },
            phase: "finished",
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Can you capture the marked stones in a ladder that works?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="yes"
                            checked={value === "yes"}
                            onChange={handleChange}
                        />
                        yes
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="no"
                            checked={value === "no"}
                            onChange={handleChange}
                        />
                        no
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_state: {
                black: "ddedfegeef",
                white: "fcfddeeeeh",
            },
            marks: { triangle: "eede" },
            phase: "finished",
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Can you capture the marked stones in a ladder that works?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="yes"
                            checked={value === "yes"}
                            onChange={handleChange}
                        />
                        yes
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="no"
                            checked={value === "no"}
                            onChange={handleChange}
                        />
                        no
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_state: {
                black: "cedeeefedgeg",
                white: "gchedfefhfgg",
            },
            marks: { triangle: "efdf" },
            phase: "finished",
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Can you capture the marked stones in a ladder that works?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="yes"
                            checked={value === "yes"}
                            onChange={handleChange}
                        />
                        yes
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="no"
                            checked={value === "no"}
                            onChange={handleChange}
                        />
                        no
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_state: {
                black: "ddcebfffegdh",
                white: "fddecfdfefdg",
            },
            marks: { triangle: "dgefdfcfde" },
            phase: "finished",
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Can you capture the marked stones in a ladder that works?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="yes"
                            checked={value === "yes"}
                            onChange={handleChange}
                        />
                        yes
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="no"
                            checked={value === "no"}
                            onChange={handleChange}
                        />
                        no
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_state: {
                black: "deeecfff",
                white: "dfeffhgh",
            },
            marks: { triangle: "efdf" },
            phase: "finished",
        };
    }
}
