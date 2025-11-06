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
import * as React from "react";

export class BL2Shape1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl2-shape-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning good shape", "Shape");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on good shape", "Good shape");
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

                if (selectedValue === "bad shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Shape is an important concept in Go. With shape we mean a formation of a group of stones on the board. This formation decides how well these stones can be used effectively in the game. There is good shape and bad shape. This shape is an empty triangle and is a bad shape. The three stones do not surround anything. One of the three stones is superfluous. Does the black group have good or bad shape?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "dndoeo",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "bad shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "This shape is a lump and is a bad shape. Far too many stones lay close to each other. You can take away a number of them, while the group stays as strong or useful. You have a number of superfluous stones on the board, so you have played a number of superfluous moves. Does the black group have good or bad shape?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "dodpeoepeqfp",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "good shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "This shape is a tiger-mouth and is a good shape. The tiger-mouth is a shape of three stones, which surround and protect a point on the board. The tiger-mouth is a good shape to cover a cutting point or to prepare an eye. Does the black group have good or bad shape?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "eofpgo",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "good shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "This shape is a ponnuki and is a good shape. The ponnuki is a shape of four stones, which emerges after a single stone is captured. The ponnuki gives possibilities for an eye, is difficult to capture and is strong in an attack. The proverb is: 'A ponnuki is worth 30 points'. Does the black group have good or bad shape?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "eofnfpgo",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "good shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "This shape is a turtle and is a good shape. The turtle is comparable to a ponnuki, but it is an even better shape. This shape emerges when two stones are captured. The proverb is: 'A turtle is worth 60 points'. Does the black group have good or bad shape?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "doenepfnfpgo",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "bad shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "cpdpdq",
                white: "codoeo",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "good shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "cpdpep",
                white: "codoeo",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "bad shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "dpcqdqeq",
                white: "codoeo",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "good shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "cpepcqdqeq",
                white: "dncodoeodp",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "bad shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "endoeofodpep",
                white: "dncocpfpcqdqeq",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "bad shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "docpdpcqdq",
                white: "cndncoeo",
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
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "good shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "encoeodpdq",
                white: "foepfpeq",
            },
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

                if (selectedValue === "good shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "cmdncocp",
                white: "dofodpdq",
            },
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

                if (selectedValue === "bad shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "cncodocp",
                white: "bpdpepfpcq",
            },
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

                if (selectedValue === "good shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "bncpcqdq",
                white: "dodpepeq",
            },
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

                if (selectedValue === "bad shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "doeodpdq",
                white: "dncocpcq",
            },
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

                if (selectedValue === "good shape") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Does the black group have good or bad shape?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good shape"
                            checked={value === "good shape"}
                            onChange={handleChange}
                        />
                        {_("good shape")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="bad shape"
                            checked={value === "bad shape"}
                            onChange={handleChange}
                        />
                        {_("bad shape")}
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
                black: "dqfqcrer",
                white: "dncpdpcq",
            },
            phase: "finished",
        };
    }
}
