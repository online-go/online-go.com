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

import { _, pgettext } from "translate";
import { put } from "requests";
import { errorAlerter, ignore } from "misc";

const sendRankChoice = (choice: string): void => {
    put(`me/starting_rank`, { choice: choice }).then(ignore).catch(errorAlerter);
};

interface NewUserRankChooserProps {
    show_skip?: boolean;
    show_welcome?: boolean;
}

export function NewUserRankChooser({
    show_skip = true,
    show_welcome = true,
}: NewUserRankChooserProps): JSX.Element {
    /* render */
    return (
        <div className="NewUserRankChooser">
            <div className="centered-content">
                {show_welcome && <div className="welcome">{_("Welcome!")}</div>}
                <div className="instructions">
                    {pgettext(
                        "Instructions for rank chooser buttons",
                        "To help us find you suitable opponents, please select the option below that best describes your skill at Go.",
                    )}
                </div>
                <div className="rank-chooser-buttons">
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say I'm a beginner",
                            "Beginner",
                        )}
                        choice={"beginner"}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say I'm an intermediate plater",
                            "Intermediate",
                        )}
                        choice={"intermediate"}
                        explainer={_("Your Go rank is roughly 16k-1k")}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say I'm an advanced plater",
                            "Advanced",
                        )}
                        choice={"advanced"}
                        explainer={_("You're a Dan level player")}
                    />
                </div>
                {show_skip && (
                    <div className="skip-button">
                        <button className="primary" onClick={() => sendRankChoice("skip")}>
                            {pgettext(
                                "Label for the button used to say 'skip choosing an initial rank'",
                                "Skip",
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

interface NewRankChooserButtonProps {
    label: string;
    choice: string;
    explainer?: string;
}

function NewRankChooserButton({
    label,
    choice,
    explainer,
}: NewRankChooserButtonProps): JSX.Element {
    const [explainer_open, setExplainerOpen] = React.useState(false);

    const toggleExplainer = () => {
        setExplainerOpen(!explainer_open);
    };

    return (
        <div className="rank-chooser-button">
            <div className="rank-chooser-heading">
                {label}
                {explainer && <i className="fa fa-question-circle-o" onClick={toggleExplainer} />}
            </div>

            <div
                className="explainer-text"
                style={{ visibility: explainer_open ? "visible" : "hidden" }}
            >
                {explainer || "(invisible filler)"}
            </div>
            <button className={"primary"} onClick={() => sendRankChoice(choice)}>
                {pgettext("label on a button to select a choice", "Select")}
            </button>
        </div>
    );
}
