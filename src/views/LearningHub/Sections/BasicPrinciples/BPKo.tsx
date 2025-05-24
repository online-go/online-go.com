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

export class BPKo extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06];
    }
    static section(): string {
        return "bp-ko";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning is this ko?", "Ko");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on is this ko?", "Is this ko");
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

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black captures the marked white stone with 1. If the recapture results in the same board position as just before Black's move 1, this recapture is not allowed. Is White allowed to recapture immediately?",
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
            initial_player: "white",
            initial_state: {
                black: "ecfebfdfcgce",
                white: "cdgdbedecfcf",
            },
            marks: { 1: "ce", triangle: "cf" },
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
                            "Black captures the marked white chain with 1. Is White allowed to recapture immediately?",
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
            initial_player: "white",
            initial_state: {
                black: "dacbebccecgcbddd",
                white: "dbdccdeddegfcgdbdc",
            },
            marks: { 1: "dd", triangle: "dbdc" },
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
                    <p>
                        {_(
                            "Black captures the marked white stone with 1. Is white allowed to recapture immediately?",
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
            initial_player: "white",
            initial_state: {
                black: "fbfcddgdfegegged",
                white: "ccdceccdfddeeefd",
            },
            marks: { 1: "ed", triangle: "fd" },
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

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black captures the marked white stone with 1. Is White allowed to recapture immediately?",
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
            initial_player: "white",
            initial_state: {
                black: "hbhcicheggia",
                white: "gahafbibfcib",
            },
            marks: { 1: "ia", triangle: "ib" },
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
                    <p>
                        {_(
                            "Black captures the marked white stone with 1. Is White allowed to recapture immediately?",
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
            initial_player: "white",
            initial_state: {
                black: "abacaebbbfcbbd",
                white: "adbcbecccdedad",
            },
            marks: { 1: "bd", triangle: "ad" },
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
                    <p>
                        {_(
                            "Black captures the marked white stone with 1. Is White allowed to recapture immediately?",
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
            initial_player: "white",
            initial_state: {
                black: "fcgagbhaicib",
                white: "hbhchdiaidia",
            },
            marks: { 1: "ib", triangle: "ia" },
            phase: "finished",
        };
    }
}
