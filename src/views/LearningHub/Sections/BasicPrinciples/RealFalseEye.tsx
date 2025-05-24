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

export class RealFalseEye extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06];
    }
    static section(): string {
        return "real-false-eye";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning real or false eye", "Eye");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on real or false eye",
            "Real or false eye",
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

                if (selectedValue === "false") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "If an eye can be challenged, it is not a real, but a false eye. Is A a real or a false eye?",
                        )}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="real"
                            checked={value === "real"}
                            onChange={handleChange}
                        />
                        real
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="false"
                            checked={value === "false"}
                            onChange={handleChange}
                        />
                        false
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
                black: "gcgffgdhehghfi",
                white: "cgdgegchcidiei",
            },
            marks: { A: "fh" },
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

                if (selectedValue === "false") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Is A a real or a false eye?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="real"
                            checked={value === "real"}
                            onChange={handleChange}
                        />
                        real
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="false"
                            checked={value === "false"}
                            onChange={handleChange}
                        />
                        false
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
                black: "ccdcfdfegffgggdhehgheifi",
                white: "hehfcgdgeghgchhhcidigihi",
            },
            marks: { A: "fh" },
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

                if (selectedValue === "real") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Is A a real or a false eye?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="real"
                            checked={value === "real"}
                            onChange={handleChange}
                        />
                        real
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="false"
                            checked={value === "false"}
                            onChange={handleChange}
                        />
                        false
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
                black: "cceecgdgfgeh",
                white: "gffhghhhfihi",
            },
            marks: { A: "gi" },
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

                if (selectedValue === "false") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Is A a real or a false eye?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="real"
                            checked={value === "real"}
                            onChange={handleChange}
                        />
                        real
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="false"
                            checked={value === "false"}
                            onChange={handleChange}
                        />
                        false
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
                black: "eefgehfhei",
                white: "gfghhhfihi",
            },
            marks: { A: "gi" },
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

                if (selectedValue === "false") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Is A a real or a false eye?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="real"
                            checked={value === "real"}
                            onChange={handleChange}
                        />
                        real
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="false"
                            checked={value === "false"}
                            onChange={handleChange}
                        />
                        false
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
                black: "eecgfgehfh",
                white: "gfghhhfihi",
            },
            marks: { A: "gi" },
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

                if (selectedValue === "real") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("Is A a real or a false eye?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="real"
                            checked={value === "real"}
                            onChange={handleChange}
                        />
                        real
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="false"
                            checked={value === "false"}
                            onChange={handleChange}
                        />
                        false
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
                black: "hgfhghihfihi",
                white: "bgcgegfgeh",
            },
            marks: { A: "gi" },
            phase: "finished",
        };
    }
}
