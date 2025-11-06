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

export class BL3Skills7 extends LearningHubSection {
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
        return "bl3-skills-7";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning strengthen", "Skills");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on strengthen", "Strengthen");
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

                if (selectedValue === "strengthen") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bmcmcnbocpdpeqdrer",
                white: "bncodoeogoepdqfqfr",
            },
            marks: { A: "bp" },
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
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bmcmcnbocpdpcqeqdrer",
                white: "bncodoeogoepfqfr",
            },
            marks: { A: "bp" },
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

                if (selectedValue === "strengthen") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cocpdqeq",
                white: "cndndodpcq",
            },
            marks: { A: "bq" },
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
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cmbocododpcqdqcr",
                white: "eneobpcpepbqeqer",
            },
            marks: { A: "br" },
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

                if (selectedValue === "strengthen") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cmcncodpdqer",
                white: "bnbocpcqcrdr",
            },
            marks: { A: "fq" },
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
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cndnbodobpdpdq",
                white: "bmcmdmbncocp",
            },
            marks: { A: "cq" },
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

                if (selectedValue === "strengthen") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bncnaodocpdq",
                white: "ambmcmdman",
            },
            marks: { A: "bo" },
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
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bocododpbqcqcrcs",
                white: "apbpcpepdqfqdrds",
            },
            marks: { A: "ao" },
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
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cmcobpdpcqcr",
                white: "bqdqeqgq",
            },
            marks: { A: "br" },
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

                if (selectedValue === "strengthen") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "blcmcnbobpbq",
                white: "bmbncocpaqcqbr",
            },
            marks: { A: "am" },
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

                if (selectedValue === "strengthen") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bpdpeqer",
                white: "bmcncq",
            },
            marks: { A: "cp" },
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
                            "Black to play. Does playing at A strengthen the black group or is it better to play tenuki?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="strengthen"
                            checked={value === "strengthen"}
                            onChange={handleChange}
                        />
                        {_("strengthen")}
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
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bocodoeodqdr",
                white: "focpfp",
            },
            marks: { A: "dp" },
            phase: "finished",
        };
    }
}
