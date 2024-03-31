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
import { errorAlerter } from "misc";

interface NewUserRankChooserProps {
    show_skip?: boolean;
    onChosen?: () => void;
}

export function NewUserRankChooser({
    show_skip = true,
    onChosen = () => {},
}: NewUserRankChooserProps): JSX.Element {
    const sendRankChoice = (choice: string): void => {
        put(`me/starting_rank`, { choice: choice })
            .then(() => {
                onChosen?.();
            })
            .catch(errorAlerter);
    };

    // This has an optional explainer in case we decide we want them again.
    // As of this writing, it's not used.
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
        return (
            <div className="rank-chooser-button">
                <button className={"primary"} onClick={() => sendRankChoice(choice)}>
                    <span className="label-text">{label}</span>
                    <span className="explainer-text">{explainer}</span>
                </button>
            </div>
        );
    }
    /* render */
    return (
        <div className="NewUserRankChooser">
            <div className="centered-content">
                <div className="instructions">
                    {pgettext(
                        "Instructions for rank chooser buttons",
                        "What is your Go skill level?",
                    )}
                </div>
                <div className="rank-chooser-buttons">
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say they 'I haven't played before'",
                            "New to Go",
                        )}
                        choice={"new"}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I have basic skills'",
                            "Basic",
                        )}
                        choice={"basic"}
                        explainer={"(25k-12k)"}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I'm an intermediate player'",
                            "Intermediate",
                        )}
                        choice={"intermediate"}
                        explainer={"(16k-1k)"}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I'm an advanced player'",
                            "Advanced",
                        )}
                        choice={"advanced"}
                        explainer={"(4k-9d)"}
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
