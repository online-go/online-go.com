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

import * as React from "react";

import { pgettext } from "translate";
import { put } from "requests";
import { errorAlerter, ignore } from "misc";

export function NewUserRankChooser(): JSX.Element {
    const sendRankChoice = (choice: string): void => {
        put(`me/starting_rank`, { choice: choice }).then(ignore).catch(errorAlerter);
    };
    const chooseBeginner = () => {
        sendRankChoice("beginner");
    };
    const chooseIntermediate = () => {
        sendRankChoice("intermediate");
    };
    const chooseAdvanced = () => {
        sendRankChoice("advanced");
    };
    const chooseToSkip = () => {
        sendRankChoice("skip");
    };

    /* render */
    return (
        <div className="NewUserRankChooser">
            <div className="centered-content">
                <div className="instructions">
                    {pgettext(
                        "Instructions for rank chooser buttons",
                        "Welcome! To help us find you the best games, please select the option below that best describes your skill at Go.",
                    )}
                </div>
                <div className="rank-chooser-buttons">
                    <button className="primary" onClick={chooseBeginner}>
                        {pgettext("Label for the button used to say I'm a beginner", "Beginner")}
                    </button>
                    <button className="primary" onClick={chooseIntermediate}>
                        {pgettext(
                            "Label for the button used to say I'm an intermediate player",
                            "Intermediate",
                        )}
                    </button>
                    <button className="primary" onClick={chooseAdvanced}>
                        {pgettext(
                            "Label for the button used to say I'm an advanced player",
                            "Advanced",
                        )}
                    </button>
                </div>
                <div className="skip-button">
                    <button className="primary" onClick={chooseToSkip}>
                        {pgettext(
                            "Label for the button used to say skip choosing an initial rank",
                            "Skip",
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
