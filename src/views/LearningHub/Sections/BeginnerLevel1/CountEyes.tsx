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

export class BL1CountEyes extends LearningHubSection {
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
        return "bl1-count-eyes";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning count eyes", "4.19 Count Eyes");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on count eyes",
            "Count number of eyes",
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

                if (selectedValue === "2") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                        1
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
                        2
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcpepaqdqdr",
                white: "bqcqarcrbscs",
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

                if (selectedValue === "1") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                        1
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
                        2
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpepaqbqcqeqgqarfr",
                white: "dqbrcrerbsds",
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

                if (selectedValue === "2") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="1"
                            checked={value === "1"}
                            onChange={handleChange}
                        />
                        1
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
                        2
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
                        3
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "boepgpbqcqeqgqiqhr",
                white: "fqarbrcrdrergrcsesfsgs",
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

                if (selectedValue === "1") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                        1
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
                        2
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpepfphpcqgqbrhrfsgs",
                white: "dqeqcrerfrgrds",
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

                if (selectedValue === "2") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                        1
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
                        2
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcndnenbofobpfpgpcqgqcrgrdsfs",
                white: "codoeocpepdqfqdrerfr",
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

                if (selectedValue === "1") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                        1
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
                        2
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
                        3
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "encogoephpbqcqeqhqcrhrgshs",
                white: "fqgqarbrdrergrbscsesfs",
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

                if (selectedValue === "2") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                        1
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
                        2
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnengnbocofobpgpbqgqcrfrgrcsds",
                white: "doeocpepfpcqdqfqdrer",
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

                if (selectedValue === "1") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                        1
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
                        2
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndngnboeofobpgpcqgqbrcrhrdses",
                white: "codocpepfpdqfqdrerfr",
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

                if (selectedValue === "0") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                            value="2"
                            checked={value === "2"}
                            onChange={handleChange}
                        />
                        2
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
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elfldmgmcndnfnbocogohobqcqgqhqcrdrfrgrfs",
                white: "endofocpepgpdqfqer",
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

                if (selectedValue === "1") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                        1
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
                        2
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlemfmgmbncndnhnhobpbqcqeqfqgqcr",
                white: "enfncodofocpepfpdq",
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

                if (selectedValue === "1") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                        1
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
                        2
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncndnenfnbogogpbqfqbrcrgrds",
                white: "codoeocpepfpcqdqerfr",
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

                if (selectedValue === "1") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("How many real eyes does the white group have?")}</p>
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
                        1
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
                        2
                    </label>
                    <br />
                </div>
            );
        }
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnengnbocofohodphpbqcqhqcrdrerhres",
                white: "doeocpfpgpdqeqgqfrgr",
            },
            phase: "finished",
        };
    }
}
