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

export class BL1Seki1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl1-seki-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning is it seki", "Seki");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on is it seki", "Is this seki?");
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

                if (selectedValue === "seki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Both marked chains have two liberties. If White or Black plays at A or B, he puts his own chain in atari. So, both players will not play at A or B. This is called 'seki'. The position stays as it is on the board. When the game is finished, neither group is dead. The empty points in between will stay empty. These points do not count as territory for either of the players.",
                        )}
                    </p>
                    <p>
                        {_("If White is to play, who will win this capturing race, or is it seki?")}
                    </p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpcqcrcsdpepfqfrfs",
                white: "dqdrdseqfpgpgqgrgs",
            },
            marks: { triangle: "dqdrdseqfqfrfs", A: "er", B: "es" },
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

                if (selectedValue === "seki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>
                        {_(
                            "Here, both marked chains have one eye and they share a common liberty at A. If White or Black plays at A, he puts his own chain in atari. So, both players will not play at A. This is again seki.",
                        )}
                    </p>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alarblbrbsclcmcncocpcqdqeqfqgqgrgs",
                white: "amaoaqbmbnbobpbqcrdrdserfrfs",
            },
            marks: { triangle: "arbrbscrdrdserfrfs", A: "cs" },
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

                if (selectedValue === "seki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpepfpbqfqbrerbses",
                white: "cqdqeqgqcrfrhrcsfs",
            },
            marks: { triangle: "escsercreqdqcq" },
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

                if (selectedValue === "seki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codoeocpfpcqfqcrfrcsfs",
                white: "fogodpepgpdqgqdrgrdsgs",
            },
            marks: { triangle: "fsdsfrdrfqdqfpepdp" },
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

                if (selectedValue === "seki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codpaqbqcqdrerfrdsfs",
                white: "dqeqfqgqarbrcrgrbsgs",
            },
            marks: { triangle: "fsdsbsfrerdrcrbrar" },
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

                if (selectedValue === "seki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofogodpgpdqeqgqcrdrgrcsgs",
                white: "codocpepfpcqfqbrfrbsesfs",
            },
            marks: { triangle: "fsescsfrdrcrfqeqdqfpepdp" },
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqcqdqbrerbses",
                white: "eqfqgqdrgrdsgs",
            },
            marks: { triangle: "esdserdr" },
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeodpfpbqcqdqfqbrfrgrbsgs",
                white: "fogoepgpeqhqcrdrerhrcseshs",
            },
            marks: { triangle: "gsescsgrfrerdrcrfqeqfpep" },
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

                if (selectedValue === "Black") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpbqeqbrerbses",
                white: "epfpcqdqfqcrgrcsgs",
            },
            marks: { triangle: "escsercreqdqcq" },
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocpdpbqeqfqbrfrgrhrbsfs",
                white: "epfpcqdqgqhqiqcrerircsdshs",
            },
            marks: { triangle: "fsdscshrgrfrercrfqeqdqcq" },
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

                if (selectedValue === "seki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aqbqcqcrdrercses",
                white: "doapbpcpdqeqfqarfrbsfs",
            },
            marks: { triangle: "escsbserdrcrarcqbqaq" },
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

                if (selectedValue === "Black") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocodobpdpfpgpbqeqgqhqbrerhrbseshs",
                white: "bncndneneocpepcqdqfqcrfrcsfs",
            },
            marks: { triangle: "escsercreqdqcqcp" },
            phase: "finished",
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eqfqgqhqbrcrdrhrhs",
                white: "aqbqcqdqarerfrgras",
            },
            marks: { triangle: "grfrerdrcrbr" },
            phase: "finished",
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        function MultipleChoice(props: { onCorrectAnswer: () => void; onWrongAnswer: () => void }) {
            const [value, setValue] = React.useState<string>("");

            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const selectedValue = event.target.value;
                setValue(selectedValue);

                if (selectedValue === "seki") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("White to play. Who will win this capturing race, or is it seki?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        {_("Black")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="White"
                            checked={value === "White"}
                            onChange={handleChange}
                        />
                        {_("White")}
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="seki"
                            checked={value === "seki"}
                            onChange={handleChange}
                        />
                        {_("Seki")}
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpcqeqfqgqarbrcrergrbsfs",
                white: "bocodobpepfpgphpaqbqdqhqdrhrdsgshs",
            },
            marks: { triangle: "fsdsbsgrerdrcrbrargqfqeqdqcqdpcp" },
            phase: "finished",
        };
    }
}
