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
import * as React from "react";

export class BL3Skills6 extends LearningHubSection {
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
        return "bl3-skills-6";
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

                if (selectedValue === "reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "apbpcpdqdrcsds",
                white: "bqcqarcrbs",
            },
            marks: { 1: "ap" },
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
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aobocoapcpdqdrds",
                white: "bpbqcqarcrbs",
            },
            marks: { 1: "ap" },
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

                if (selectedValue === "reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "ambmcmancnco",
                white: "bnaobocpepcq",
            },
            marks: { 1: "co" },
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

                if (selectedValue === "reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "eobpcpdpepdqgqcrdrbs",
                white: "dmbocodoapbqcqbr",
            },
            marks: { 1: "bs" },
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
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bmcmcnco",
                white: "bnbocpepcq",
            },
            marks: { 1: "co" },
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

                if (selectedValue === "reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "anbncncodoeofogogpgqgrfsgs",
                white: "aoboapcpdpepfpbqfqfres",
            },
            marks: { 3: "gs", 1: "fs", 2: "es" },
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

                if (selectedValue === "reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aobocodoapdpeqerdses",
                white: "bpcpaqdqbrdrcs",
            },
            marks: { 1: "dp" },
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
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "alblcldldmdneodpepeqerdses",
                white: "ambmcmcncodocpdqbrdrcs",
            },
            marks: { 3: "es", 1: "ds", 2: "cs" },
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
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aobocododpeqerdses",
                white: "apbpcpaqdqbrdrcs",
            },
            marks: { 1: "dp" },
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
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "alblcldlelamemenboeodpepcqcrer",
                white: "bmcmdmandncodoapbpcpbqbrbs",
            },
            marks: { 2: "an", 1: "am", 3: "al" },
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
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bmcndnenaoboeoap",
                white: "codobpepaqcqeqdr",
            },
            marks: { 2: "aq", 1: "ap", 3: "ao" },
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

                if (selectedValue === "reply") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "White to play. Do you have to reply to Black's last move or can you play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="reply"
                            checked={value === "reply"}
                            onChange={handleChange}
                        />
                        {_("reply")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "anbncndnenaoeoepfqgqgr",
                white: "bocodoapdpcqeqerfr",
            },
            marks: { 2: "ap", 1: "ao", 3: "an" },
            phase: "finished",
        };
    }
}
