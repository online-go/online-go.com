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

export class Territory extends LearningHubSection {
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
        return "territory";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning count territory", "Territory");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on count territory",
            "Count territory",
        );
    }
}

class Page01 extends LearningPage {
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

                if (selectedValue === "4") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "If you have surrounded a part of the board by your stones, that part is called your 'territory'. Each empty point in your territory counts as a point for you. Points can be scored by territory and by capturing stones. Whoever has the most points at the end of the game wins. How many points is the territory in the corner?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        3
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="4"
                            checked={value === "4"}
                            onChange={handleChange}
                        />
                        4
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="5"
                            checked={value === "5"}
                            onChange={handleChange}
                        />
                        5
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
                black: "fifhgigghhhgig",
                white: "eiehegfggfhfif",
            },
            phase: "finished",
        };
    }
}

class Page02 extends LearningPage {
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

                if (selectedValue === "6") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many points is the territory in the corner?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="6"
                            checked={value === "6"}
                            onChange={handleChange}
                        />
                        6
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="7"
                            checked={value === "7"}
                            onChange={handleChange}
                        />
                        7
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="8"
                            checked={value === "8"}
                            onChange={handleChange}
                        />
                        8
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
                black: "didhdgegffgfhfif",
                white: "eiehfhfggghihgig",
            },
            phase: "finished",
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

                if (selectedValue === "6") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many points is the territory in the corner?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="5"
                            checked={value === "5"}
                            onChange={handleChange}
                        />
                        5
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="6"
                            checked={value === "6"}
                            onChange={handleChange}
                        />
                        6
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="7"
                            checked={value === "7"}
                            onChange={handleChange}
                        />
                        7
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
                black: "didhdgdfeieffegfgehfif",
                white: "ehegfifgffgghihgig",
            },
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

                if (selectedValue === "8") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many points is the territory in the corner?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="7"
                            checked={value === "7"}
                            onChange={handleChange}
                        />
                        7
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="8"
                            checked={value === "8"}
                            onChange={handleChange}
                        />
                        8
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="9"
                            checked={value === "9"}
                            onChange={handleChange}
                        />
                        9
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
                black: "fifhfggfhhhfif",
                white: "eiehegeeffgeheie",
            },
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

                if (selectedValue === "7") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many points is the territory in the corner?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="7"
                            checked={value === "7"}
                            onChange={handleChange}
                        />
                        7
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="8"
                            checked={value === "8"}
                            onChange={handleChange}
                        />
                        8
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="9"
                            checked={value === "9"}
                            onChange={handleChange}
                        />
                        9
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
                black: "eiehfgeeffgeheie",
                white: "fifhgggfhhhfif",
            },
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

                if (selectedValue === "7") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many points is the territory in the corner?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="6"
                            checked={value === "6"}
                            onChange={handleChange}
                        />
                        6
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="7"
                            checked={value === "7"}
                            onChange={handleChange}
                        />
                        7
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="8"
                            checked={value === "8"}
                            onChange={handleChange}
                        />
                        8
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
                black: "eiehegfggghihgig",
                white: "didhdgdfefffgfhfif",
            },
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

                if (selectedValue === "9") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many points is the territory in the corner?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="8"
                            checked={value === "8"}
                            onChange={handleChange}
                        />
                        8
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="9"
                            checked={value === "9"}
                            onChange={handleChange}
                        />
                        9
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="10"
                            checked={value === "10"}
                            onChange={handleChange}
                        />
                        10
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
                black: "eiehegfggghhhfif",
                white: "didhdgdfefffgfheie",
            },
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

                if (selectedValue === "8") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many points is the territory in the corner?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="7"
                            checked={value === "7"}
                            onChange={handleChange}
                        />
                        7
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="8"
                            checked={value === "8"}
                            onChange={handleChange}
                        />
                        8
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="9"
                            checked={value === "9"}
                            onChange={handleChange}
                        />
                        9
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
                black: "bibhbgcgdgegffgfhfigif",
                white: "cichdhehfggghihgih",
            },
            phase: "finished",
        };
    }
}

class Page09 extends LearningPage {
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

                if (selectedValue === "14") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many points is the territory in the corner?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="12"
                            checked={value === "12"}
                            onChange={handleChange}
                        />
                        12
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="14"
                            checked={value === "14"}
                            onChange={handleChange}
                        />
                        14
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="15"
                            checked={value === "15"}
                            onChange={handleChange}
                        />
                        15
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
                black: "cichcgcfcedeeefegeheie",
                white: "didhdgdfefffghgfhfif",
            },
            phase: "finished",
        };
    }
}

class Page10 extends LearningPage {
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

                if (selectedValue === "10") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many points is the territory in the corner?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="8"
                            checked={value === "8"}
                            onChange={handleChange}
                        />
                        8
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="10"
                            checked={value === "10"}
                            onChange={handleChange}
                        />
                        10
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="12"
                            checked={value === "12"}
                            onChange={handleChange}
                        />
                        12
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
                black: "didhdgegfggghgig",
                white: "cichcgcfdfefffgfhfif",
            },
            phase: "finished",
        };
    }
}

class Page11 extends LearningPage {
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

                if (selectedValue === "8") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Opponent's stones in your territory are lost if they do not have two eyes. These lost stones are called 'dead'. At the end of the game, dead stones are taken from the board as prisoners, leaving behind an empty territory point. So, a dead stone counts as two points: prisoner and territory. How many points is the territory in the corner?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="6"
                            checked={value === "6"}
                            onChange={handleChange}
                        />
                        6
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="7"
                            checked={value === "7"}
                            onChange={handleChange}
                        />
                        7
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="8"
                            checked={value === "8"}
                            onChange={handleChange}
                        />
                        8
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
                black: "fifhfggggfhhhfif",
                white: "eiehegeeffgehgheie",
            },
            phase: "finished",
        };
    }
}

class Page12 extends LearningPage {
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

                if (selectedValue === "11") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many points is the territory in the corner?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="7"
                            checked={value === "7"}
                            onChange={handleChange}
                        />
                        7
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="9"
                            checked={value === "9"}
                            onChange={handleChange}
                        />
                        9
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="11"
                            checked={value === "11"}
                            onChange={handleChange}
                        />
                        11
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
                black: "cichcgcfdfeheffhffgfhfif",
                white: "didhdgegfgghgghgig",
            },
            phase: "finished",
        };
    }
}
