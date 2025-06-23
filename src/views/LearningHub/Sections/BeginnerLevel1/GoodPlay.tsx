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

export class BL1GoodPlay extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09];
    }
    static section(): string {
        return "bl1-good-play";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning good play", "3.35 Good Play");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on good play",
            "Is this a good move?",
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

                if (selectedValue === "not good") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Is playing at A a good move?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good"
                            checked={value === "good"}
                            onChange={handleChange}
                        />
                        good
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not good"
                            checked={value === "not good"}
                            onChange={handleChange}
                        />
                        not good
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
                black: "bpdpcqcr",
                white: "cpfpdq",
            },
            marks: { A: "do" },
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

                if (selectedValue === "good") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Is playing at A a good move?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good"
                            checked={value === "good"}
                            onChange={handleChange}
                        />
                        good
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not good"
                            checked={value === "not good"}
                            onChange={handleChange}
                        />
                        not good
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
                black: "ephpdqfqdr",
                white: "cmdodpcqeqcr",
            },
            marks: { A: "er" },
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

                if (selectedValue === "not good") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Is playing at A a good move?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good"
                            checked={value === "good"}
                            onChange={handleChange}
                        />
                        good
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not good"
                            checked={value === "not good"}
                            onChange={handleChange}
                        />
                        not good
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
                black: "fphqdrerfs",
                white: "cobqdses",
            },
            marks: { A: "cs" },
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

                if (selectedValue === "good") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Is playing at A a good move?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good"
                            checked={value === "good"}
                            onChange={handleChange}
                        />
                        good
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not good"
                            checked={value === "not good"}
                            onChange={handleChange}
                        />
                        not good
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
                black: "dpgpeqfq",
                white: "epfp",
            },
            marks: { A: "en" },
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

                if (selectedValue === "not good") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Is playing at A a good move?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good"
                            checked={value === "good"}
                            onChange={handleChange}
                        />
                        good
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not good"
                            checked={value === "not good"}
                            onChange={handleChange}
                        />
                        not good
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
                black: "dncpdqeqfqgqcrgrds",
                white: "hphqdrerfrhresgs",
            },
            marks: { A: "fs" },
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

                if (selectedValue === "not good") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Is playing at A a good move?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good"
                            checked={value === "good"}
                            onChange={handleChange}
                        />
                        good
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not good"
                            checked={value === "not good"}
                            onChange={handleChange}
                        />
                        not good
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
                black: "clendodpeqfq",
                white: "epfpipiq",
            },
            marks: { A: "eo" },
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

                if (selectedValue === "not good") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Is playing at A a good move?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good"
                            checked={value === "good"}
                            onChange={handleChange}
                        />
                        good
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not good"
                            checked={value === "not good"}
                            onChange={handleChange}
                        />
                        not good
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
                black: "codqeqcrfrgr",
                white: "hofqgqdrerhr",
            },
            marks: { A: "cs" },
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

                if (selectedValue === "not good") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Is playing at A a good move?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good"
                            checked={value === "good"}
                            onChange={handleChange}
                        />
                        good
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not good"
                            checked={value === "not good"}
                            onChange={handleChange}
                        />
                        not good
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
                black: "dnepdqfqdr",
                white: "hoeqgqgr",
            },
            marks: { A: "er" },
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

                if (selectedValue === "good") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Is playing at A a good move?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="good"
                            checked={value === "good"}
                            onChange={handleChange}
                        />
                        good
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="not good"
                            checked={value === "not good"}
                            onChange={handleChange}
                        />
                        not good
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
                black: "fpdrerfs",
                white: "cocqbrdses",
            },
            marks: { A: "cs" },
            phase: "finished",
        };
    }
}
