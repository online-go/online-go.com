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

export class CountChains extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06];
    }
    static section(): string {
        return "count_chains";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning count chains", "Chains");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on count chains", "Count chains");
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
                            "Only stones that are directly connected form a chain. Count the number of white chains.",
                        )}
                    </p>
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
                white: "egehgcgdgehhdf",
            },
            marks: { 1: "df", 2: "egeh", 3: "gcgdge", 4: "hh" },
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

                if (selectedValue === "5") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Count the number of white chains.")}</p>
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
                white: "egfghbgcgdhgigai",
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

                if (selectedValue === "5") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Count the number of white chains.")}</p>
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
                white: "cccddddbechbgbgcgdhgighhhighih",
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

                if (selectedValue === "6") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Count the number of white chains.")}</p>
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
                black: "echbgdgehhhigfcecfcgdh",
                white: "dcedcdfbgbgchgigghih",
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

                if (selectedValue === "4") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Count the number of white chains.")}</p>
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_state: {
                black: "dcechfhehchbcgchdfee",
                white: "bbcbdbccgdgegffghg",
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

                if (selectedValue === "3") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Count the number of white chains.")}</p>
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_state: {
                black: "cgdedgeaeceeehfbfefhgbghhb",
                white: "bbbgbhcbchcidbdcdhedfdgd",
            },
            phase: "finished",
        };
    }
}
