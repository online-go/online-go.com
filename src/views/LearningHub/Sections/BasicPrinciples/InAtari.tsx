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

export class InAtari extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06];
    }
    static section(): string {
        return "in_atari";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning in atari?", "Atari");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on in atari?", "In atari");
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
                            "If a chain has only one liberty, it is in atari. Is the marked chain in atari?",
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
                black: "cfdeef",
                white: "dfeg",
            },
            marks: { triangle: "df", cross: "dg" },
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

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Is the marked chain in atari?")}</p>
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
                black: "dieiehfggghh",
                white: "chdgegfifh",
            },
            marks: { triangle: "dieieh" },
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

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Is the marked chain in atari?")}</p>
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
                black: "ciegeffifh",
                white: "dieiehfggg",
            },
            marks: { triangle: "dieieh" },
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

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Is the marked chain in atari?")}</p>
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
                black: "agbgcich",
                white: "ahbibh",
            },
            marks: { triangle: "ahbibh" },
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

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Is the marked chain in atari?")}</p>
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
                black: "dgdfcecd",
                white: "cfdeegef",
            },
            marks: { triangle: "dgdf" },
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
                    <p>{_("Is the marked chain in atari?")}</p>
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
                black: "dgdfcecddceeed",
                white: "bhcgcfdhdeef",
            },
            marks: { triangle: "dgdf" },
            phase: "finished",
        };
    }
}
