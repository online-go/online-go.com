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

import { GobanConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";
import React from "react";

export class BL3Skills3 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-skills-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning tenuki", "Skills");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on tenuki", "Tenuki");
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

                if (selectedValue === "good reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Sometimes your opponent plays a move, that makes you wonder if it does any harm and if you should react to it. If it does not do any harm, you can play a good move completely somewhere else. This playing somewhere else we call tenuki. So with tenuki you do not respond to the move of your opponent with a defensive move, but you play somewhere else. Here, White jumps with move 1 far into the black territory. White threatens to connect this stone with the other white stones by playing at A. If Black wants to prevent this, he should react to white 1 by playing at A. Is playing at A a good reply to white 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "clcocqdmdq",
                white: "crfqhpip",
            },
            marks: { 1: "cr", A: "dr" },
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

                if (selectedValue === "tenuki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Here, White can not connect his stone 1 with the other stones. Black can calmly play somewhere else, tenuki. Is playing at A by Black a good reply to white 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "clcocqdmdqfq",
                white: "crhphrip",
            },
            marks: { 1: "cr", A: "dr" },
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

                if (selectedValue === "good reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "fpcqfqfr",
                white: "cobpdpdq",
            },
            marks: { 1: "cq", A: "dr" },
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

                if (selectedValue === "good reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpdpbqdqdr",
                white: "bncncobpcqcrcs",
            },
            marks: { 1: "bq", A: "br" },
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

                if (selectedValue === "tenuki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "br",
                white: "cncocpcqeqgq",
            },
            marks: { 1: "br", A: "cr" },
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

                if (selectedValue === "tenuki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "ambmbncocpcqbrcr",
                white: "blcmcnbobpbq",
            },
            marks: { 1: "am", A: "al" },
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

                if (selectedValue === "good reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "foeqfqdr",
                white: "clcndpdq",
            },
            marks: { 1: "dr", A: "cr" },
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

                if (selectedValue === "good reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "fnbpdpfpaqcqbrcr",
                white: "dlcmbocoeocpdqeq",
            },
            marks: { 1: "fp", A: "ep" },
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

                if (selectedValue === "tenuki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "enfnbpdpaqcqbrcr",
                white: "dlcmbocoeocpdqeq",
            },
            marks: { 1: "en", A: "do" },
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

                if (selectedValue === "tenuki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bocododpcqcrbs",
                white: "bpcpbqdqeqbr",
            },
            marks: { 1: "bs", A: "dr" },
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

                if (selectedValue === "good reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bocododpcqcr",
                white: "bpcpbqdqeq",
            },
            marks: { 1: "cr", A: "br" },
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

                if (selectedValue === "good reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cmemencodocp",
                white: "fngneodpcqdr",
            },
            marks: { 1: "do", A: "ep" },
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

                if (selectedValue === "tenuki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dlcmcodocp",
                white: "engneodpgpcqfqdr",
            },
            marks: { 1: "do", A: "ep" },
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

                if (selectedValue === "tenuki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Is playing at A a good reply to black 1 or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good reply"
                            checked={value === "good reply"}
                            onChange={handleChange}
                        />
                        {_("good reply")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="tenuki"
                            checked={value === "tenuki"}
                            onChange={handleChange}
                        />
                        {_("tenuki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bpepdqfqdr",
                white: "dnbododpbqcqcr",
            },
            marks: { 1: "bp", A: "cp" },
            phase: "finished",
        };
    }
}
