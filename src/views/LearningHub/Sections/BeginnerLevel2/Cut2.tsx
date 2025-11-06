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

export class BL2Cut2 extends LearningHubSection {
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
        return "bl2-cut-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning can you cut", "Cut 2");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on can you cut", "Can you cut?");
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

                if (selectedValue === "not cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeocpep",
                white: "cncodpcqdq",
            },
            marks: { triangle: "do" },
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

                if (selectedValue === "not cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcncodpdqfqcrer",
                white: "bnbobqcqdrds",
            },
            marks: { triangle: "cr" },
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

                if (selectedValue === "cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndneoepdq",
                white: "enfndo",
            },
            marks: { triangle: "eo" },
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

                if (selectedValue === "cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eodqeqcreres",
                white: "cobqcqdrds",
            },
            marks: { triangle: "cr" },
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

                if (selectedValue === "not cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnco",
                white: "cndoeocpdq",
            },
            marks: { triangle: "dn" },
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

                if (selectedValue === "not cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpdqdrfrcs",
                white: "bocqcrds",
            },
            marks: { triangle: "dr" },
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

                if (selectedValue === "not cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eneodp",
                white: "codoepgpeq",
            },
            marks: { triangle: "dp" },
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

                if (selectedValue === "not cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocqfqcrfrhrdses",
                white: "dndpepdrerfs",
            },
            marks: { triangle: "fr" },
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

                if (selectedValue === "not cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codpepfp",
                white: "cmdndocpcqdqeq",
            },
            marks: { triangle: "co" },
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

                if (selectedValue === "not cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bobphpcqfqarcrfrhrbsdses",
                white: "cpdpepdrerfs",
            },
            marks: { triangle: "fr" },
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

                if (selectedValue === "cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cncocpdqeqcr",
                white: "dodpcq",
            },
            marks: { triangle: "cp" },
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

                if (selectedValue === "cut") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Black attempts to cut the white stones with the marked stone. Have the white stones really been cut, or is white able to connect them?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="cut"
                            checked={value === "cut"}
                            onChange={handleChange}
                        />
                        {_("cut")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not cut"
                            checked={value === "not cut"}
                            onChange={handleChange}
                        />
                        {_("not cut")}
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
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpaqcqcrfrgrcsdses",
                white: "cnbocpdpepdrerfs",
            },
            marks: { triangle: "fr" },
            phase: "finished",
        };
    }
}
