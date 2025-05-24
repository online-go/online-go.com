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

export class BPSelfCapture extends LearningHubSection {
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
        return "bp-self-capture";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning suicide", "Self-capture");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on suicide", "Is this self-capture");
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
                            "Playing at a point where your stone does not have any liberty is not allowed. But if you can capture some of opponent's stones and create liberties for your played stone, playing there is allowed. White to play. Can White play at A?",
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
                black: "dgdhdiegfggghghhhi",
                white: "eheifhghgi",
            },
            marks: { A: "fi" },
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
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "fcedgdeegeefgffg",
                white: "fd",
            },
            marks: { A: "fe" },
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
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "fcedgdeegeefgffg",
                white: "fd",
            },
            marks: { A: "ff" },
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
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "fcedgdeegeefgffg",
                white: "fdff",
            },
            marks: { A: "fe" },
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
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "eddefeef",
                white: "ecddfdcegedfffeg",
            },
            marks: { A: "ee" },
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
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "ahbhchdhdi",
                white: "aiciagbgcgdgehei",
            },
            marks: { A: "bi" },
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

                if (selectedValue === "no") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "bdcededfbgcgahchbi",
                white: "afbfcfdgfgdhcidi",
            },
            marks: { A: "bh" },
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

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "dfefffgfbgcgahchbi",
                white: "afbfcfagdgdhcidi",
            },
            marks: { A: "bh" },
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
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "deeecfffcgegdh",
                white: "cdddedcedfdg",
            },
            marks: { A: "ef" },
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

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "dbfbgbdccedecfefcgfgdheh",
                white: "eccdfdbebfdfgfbgggbhgh",
            },
            marks: { A: "dg" },
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
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "cdcfcgdgfgggchehciei",
                white: "ebeceddfefegdhfhfi",
            },
            marks: { A: "di" },
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

                if (selectedValue === "yes") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Can White play at A?")}</p>
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
                black: "dbdcedceeedfffeg",
                white: "ecddfddefecfgf",
            },
            marks: { A: "ef" },
            phase: "finished",
        };
    }
}
