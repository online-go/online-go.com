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

export class BL2Endgame3 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl2-endgame3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning count 2", "Endgame 3");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on count 2", "Value of a move");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "2") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="1"
                            checked={value === "1"}
                            onChange={handleChange}
                        />
                        {_("1")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dndocpdpfpdqerfrfs",
                white: "cmcncobpcqbrcrdrbses",
            },
            marks: { A: "ds" },
            phase: "finished",
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="6"
                            checked={value === "6"}
                            onChange={handleChange}
                        />
                        {_("6")}
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
                        {_("8")}
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
                        {_("9")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elemanenaoboeoepdqeqarbrcr",
                white: "dlambmdmcndncocpbqcq",
            },
            marks: { A: "aq" },
            phase: "finished",
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "3") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="1"
                            checked={value === "1"}
                            onChange={handleChange}
                        />
                        {_("1")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "endoeogofpcqdqeqfqcrfrfs",
                white: "dmdncocpdpepbqbrbscs",
            },
            marks: { A: "ds" },
            phase: "finished",
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="7"
                            checked={value === "7"}
                            onChange={handleChange}
                        />
                        {_("7")}
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
                        {_("8")}
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
                        {_("9")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "flfmfnfofpfqbrfrbsesfs",
                white: "dldmdndoepaqbqcqdqeqer",
            },
            marks: { A: "ds" },
            phase: "finished",
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "3") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="1"
                            checked={value === "1"}
                            onChange={handleChange}
                        />
                        {_("1")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeofofphpcqeqgqcrdrfrds",
                white: "dmbndncocpbqdqbrbscs",
            },
            marks: { A: "dp" },
            phase: "finished",
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "3") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="1"
                            checked={value === "1"}
                            onChange={handleChange}
                        />
                        {_("1")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "glgmgndofogofpaqbqcqdqeqer",
                white: "hmhnhogphpfqbrcrdrfrhrcsdses",
            },
            marks: { A: "ar" },
            phase: "finished",
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
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
                        {_("4")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "enfofpeqerfrgrcsdsgs",
                white: "cmdoeocpepbqdqarcrdrbs",
            },
            marks: { A: "es" },
            phase: "finished",
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "5") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="4"
                            checked={value === "4"}
                            onChange={handleChange}
                        />
                        {_("4")}
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
                        {_("5")}
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
                        {_("6")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "glgmanbncngncoeofogohocpdpfpbqcq",
                white: "apgphpdqeqfqarbrcrhr",
            },
            marks: { A: "aq" },
            phase: "finished",
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
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
                        {_("4")}
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
                        {_("5")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dofobpcpdpcqeqcrerds",
                white: "dlcmdnaobocoapbqbrcs",
            },
            marks: { A: "bs" },
            phase: "finished",
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="4"
                            checked={value === "4"}
                            onChange={handleChange}
                        />
                        {_("4")}
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
                        {_("7")}
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
                        {_("8")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "glgmanbncngncofogohocpdpepfpbqcq",
                white: "aoboapgphpdqeqfqarbrcrhr",
            },
            marks: { A: "aq" },
            phase: "finished",
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
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
                        {_("4")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eohodpepgpfqdrfresfs",
                white: "dmcnendocpcqdqeqbrerbsds",
            },
            marks: { A: "cs" },
            phase: "finished",
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="7"
                            checked={value === "7"}
                            onChange={handleChange}
                        />
                        {_("7")}
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
                        {_("8")}
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
                        {_("9")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "glgmgndofogofpaqbqcqdqeqer",
                white: "hmhnhogphpfqbrfrhresfs",
            },
            marks: { A: "ds" },
            phase: "finished",
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "5") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="0"
                            checked={value === "0"}
                            onChange={handleChange}
                        />
                        0
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
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
                        {_("5")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dkalblclamdmbndnbododpdqdrds",
                white: "bmcmcncoapbpcpcqarcrcs",
            },
            marks: { A: "an" },
            phase: "finished",
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "2") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="0"
                            checked={value === "0"}
                            onChange={handleChange}
                        />
                        0
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="1"
                            checked={value === "1"}
                            onChange={handleChange}
                        />
                        {_("1")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdocpdpaqbqcqcr",
                white: "epfpdqeqhqbrdrbscs",
            },
            marks: { A: "ar" },
            phase: "finished",
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="0"
                            checked={value === "0"}
                            onChange={handleChange}
                        />
                        0
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
                        {_("5")}
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
                        {_("7")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdmdncodoapbpcpcqarcrcs",
                white: "alblcldlflamembncnenboeodpepdqdrds",
            },
            marks: { A: "an" },
            phase: "finished",
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "3") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="1"
                            checked={value === "1"}
                            onChange={handleChange}
                        />
                        {_("1")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmeoepaqbqcqdqeqcreras",
                white: "fnfoiofpfqiqbrfrbscsdses",
            },
            marks: { A: "ar" },
            phase: "finished",
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
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
                        {_("4")}
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
                        {_("5")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmcncoapbpcpcqarcrcs",
                white: "dkalblclamdmdnbododpdqdrds",
            },
            marks: { A: "an" },
            phase: "finished",
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
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
                        {_("5")}
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
                        {_("6")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fobpfpbqfqbrdrerhrbscsds",
                white: "emenaobocoeocpaqcqdqeqarcr",
            },
            marks: { A: "ap" },
            phase: "finished",
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "3") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="1"
                            checked={value === "1"}
                            onChange={handleChange}
                        />
                        {_("1")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "enfogoiodpephpaqbqcqdqhqdrhrhs",
                white: "fpgpeqgqbrcrerfrgrdsesgs",
            },
            marks: { A: "ar" },
            phase: "finished",
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "2") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="1"
                            checked={value === "1"}
                            onChange={handleChange}
                        />
                        {_("1")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "foephpeqbrcrerbsdses",
                white: "dlcmdodpaqbqcqdqdr",
            },
            marks: { A: "ar" },
            phase: "finished",
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "5") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
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
                        {_("5")}
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
                        {_("6")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gnaobocodoeofocpgpgqergresgs",
                white: "apbpdpepfpcqdqfqbrdrfrds",
            },
            marks: { A: "fs" },
            phase: "finished",
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="1"
                            checked={value === "1"}
                            onChange={handleChange}
                        />
                        {_("1")}
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
                        {_("4")}
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
                        {_("6")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dodpcqeqarcrcs",
                white: "cmdncobpcpaqbqasbs",
            },
            marks: { A: "br" },
            phase: "finished",
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "3") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        {_("2")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="3"
                            checked={value === "3"}
                            onChange={handleChange}
                        />
                        {_("3")}
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
                        {_("4")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "coeoepaqbqcqdqdr",
                white: "fpeqgqbrcrercsds",
            },
            marks: { A: "ar" },
            phase: "finished",
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
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
                    <p>{_("What is the value of playing at A?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="6"
                            checked={value === "6"}
                            onChange={handleChange}
                        />
                        {_("6")}
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
                        {_("7")}
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
                        {_("8")}
                    </label>
                    <br />
                </div>
            );
        }
        return (
            <MultipleChoice
                onCorrectAnswer={this.onCorrectAnswer}
                onWrongAnswer={this.onWrongAnswer}
            />
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepbqcqcrercs",
                white: "cndoapbpcparbrbs",
            },
            marks: { A: "aq" },
            phase: "finished",
        };
    }
}
