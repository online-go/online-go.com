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

export class Winner extends LearningHubSection {
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
        return "determine-winner";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning determine winner", "Winner");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on determine winner",
            "Determine winner",
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "dadbdccdedceeeefdgegdhdi",
                white: "eaebecfcfdfefffgehgheifi",
            },
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "caeacbebacbcccdcecffgfhfiffgfhhhfi",
                white: "fafbfcadbdcdddedfdfegeheieefegehei",
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

                if (selectedValue === "Black") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "caeacbebfbgbccgcicadcdgdhdbeceheiebfbgbhbi",
                white: "dbdcecfcddfddefegecfdfgfhfifcgegfgggchci",
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "eabbebbcecedfdgdhdidaebebfbgcgdgahdhdi",
                white: "cacbccadbdcdddceeefegeheiecfdfefagegehei",
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

                if (selectedValue === "Black") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "bacagaabcbgbibacbcgchcedhdidefffgfhfifcgdgeghgdhfhhheifi",
                white: "eafahadbfbccdcfcadbdcdgddeeefegeheiebfcfdfbgggbhghbicigi",
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

                if (selectedValue === "Black") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "cacbccdcecadbdcdedfdgdbedegeheiebfdfbgcgdgegehhhei",
                white: "baeagabbebfbhbacbcfcgchdideefeefffgfhfiffghgfhghgi",
            },
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "gahagbhbdchcadbdddedhdidbeceeeheiecfefcgdgdhehfhghgi",
                white: "baeacbdbebfbibacbcccecgccdfdgdfegeffhfifegfgggighhhi",
            },
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "baabbbebfbbcadcedeeefeafbfcfffhfifdgfghgbhchdhfhghhhbi",
                white: "cafacbgbccfchcbdcdddedfdgdhdidaebegeheiegfggcidi",
            },
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "caeadbebacbcccdcddcedecfdfefffcgfgchfhci",
                white: "fafbecgcedgdeefegeheiegfdgggdhghdieifigi",
            },
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

                if (selectedValue === "Black") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "bagabbgbibbchcicddedaebecedefecfdfefffgfhfifbgfhgh",
                white: "cafahacbfbccdcecfcgcadbdcdfdgdidgeheiebfhgighhhi",
            },
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "dafahabbcbdbebfbgbhbibacdcfcddfdaebecededfffhfdgegfghgahbh",
                white: "bacabcccecgchciccdedgdeefegeheafbfcfefgfcgggchdhehfhghaidi",
            },
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

                if (selectedValue === "White") {
                    props.onCorrectAnswer();
                } else if (selectedValue !== "") {
                    props.onWrongAnswer();
                }
            };

            return (
                <div>
                    <p>{_("The game is over. Who has won?")}</p>
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="Black"
                            checked={value === "Black"}
                            onChange={handleChange}
                        />
                        Black
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
                        White
                    </label>
                    <br />
                    <label>
                        <input
                            type="radio"
                            name="options"
                            value="same"
                            checked={value === "same"}
                            onChange={handleChange}
                        />
                        same
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
                black: "dagabbcbdbgbacbcgchcbdfdgdbegeheafbfgfhfifagigahchdhehfhihdifi",
                white: "baeaabebfbccdcecfccdedhdidceeefecfffbgcgdgegfggghgbhghhhbihi",
            },
            phase: "finished",
        };
    }
}
