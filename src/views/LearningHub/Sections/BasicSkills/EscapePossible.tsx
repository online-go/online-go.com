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

export class EscapePossible extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "escape-possible";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning can you escape", "Escape Possible");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on can you escape", "Can you escape");
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
                            "If your stones are under attack, you would like to escape. Before you try to escape, make sure you can save your stones. If not, you should not add stones to a lost group. White to play. Can White escape with the marked chain?",
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
                black: "egdhei",
                white: "ggeh",
            },
            marks: { triangle: "eh" },
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
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "ccdgfgeh",
                white: "gfeggg",
            },
            marks: { triangle: "eg" },
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

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "ccdgegdhfh",
                white: "fgggehhh",
            },
            marks: { triangle: "eh" },
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
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "ccdgegchfhdi",
                white: "fgggdhehhh",
            },
            marks: { triangle: "ehdh" },
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

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "eigi",
                white: "fi",
            },
            marks: { triangle: "fi" },
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
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "ccehfhei",
                white: "ggghfi",
            },
            marks: { triangle: "fi" },
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

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "ccceehfhdi",
                white: "gggheifi",
            },
            marks: { triangle: "fiei" },
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

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "ccehfhdi",
                white: "ggeifi",
            },
            marks: { triangle: "fiei" },
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

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "ccefdgfgdhfh",
                white: "gfegggehgh",
            },
            marks: { triangle: "eheg" },
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

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "ecgceeffdgfgeh",
                white: "gegfegggfhgh",
            },
            marks: { triangle: "eg" },
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

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "egehgheigi",
                white: "gdgffhfi",
            },
            marks: { triangle: "fifh" },
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

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "egggehgheigi",
                white: "gcgdgffhfi",
            },
            marks: { triangle: "fifh" },
            phase: "finished",
        };
    }
}

class Page13 extends LearningPage {
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
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "efdgfgdhfh",
                white: "gcgeegeh",
            },
            marks: { triangle: "eheg" },
            phase: "finished",
        };
    }
}

class Page14 extends LearningPage {
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
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "eeefgfegggfh",
                white: "hdgeffhffg",
            },
            marks: { triangle: "fgff" },
            phase: "finished",
        };
    }
}

class Page15 extends LearningPage {
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
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "ccefffdgggehgh",
                white: "gegfegfghghh",
            },
            marks: { triangle: "fgeg" },
            phase: "finished",
        };
    }
}

class Page16 extends LearningPage {
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
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "ccffdgggehfhgh",
                white: "eegegfegfghghh",
            },
            marks: { triangle: "fgeg" },
            phase: "finished",
        };
    }
}

class Page17 extends LearningPage {
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
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "dfefcgfgggeh",
                white: "ffgfhfeghg",
            },
            marks: { triangle: "eg" },
            phase: "finished",
        };
    }
}

class Page18 extends LearningPage {
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
                    <p>{_("White to play. Can White escape with the marked chain?")}</p>
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
                black: "dgfgdhfhei",
                white: "ecgcegeh",
            },
            marks: { triangle: "eheg" },
            phase: "finished",
        };
    }
}
