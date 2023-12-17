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

import * as DynamicHelp from "react-dynamic-help";

interface ModerationActionSelectorProps {
    available_actions: string[];
    enable: boolean;
    claim: () => void;
    submit: (action: string) => void;
}

const ACTION_PROMPTS = {
    annul_score_cheat: pgettext(
        "Label for a moderator to select this option",
        "Annul the game and warn the cheater.",
    ),
    warn_score_cheat: pgettext(
        "Label for a moderator to select this option",
        "The accused tried to cheat - warn the cheater.",
    ),
    no_score_cheat: pgettext(
        "Label for a moderator to select this option",
        "No cheating - inform the reporter.",
    ),
    annul_escaped: pgettext(
        "Label for a moderator to select this option",
        "Wrong result due to escape - annul and warn the escaper.",
    ),
    warn_escaper: pgettext(
        "Label for a moderator to select this option",
        "The accused escaped - warn them.",
    ),
    no_escaping: pgettext(
        "Label for a moderator to select this option",
        "No escaping evident - inform the reporter.",
    ),
    escalate: pgettext(
        "A label for a community moderator to select this option - send report to to full moderators",
        "Escalate: send direct to moderators.",
    ),
};

export function ModerationActionSelector({
    available_actions,
    enable,
    claim,
    submit,
}: ModerationActionSelectorProps): JSX.Element {
    const [selectedOption, setSelectedOption] = React.useState("");

    const updateSelectedAction = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedOption(e.target.value);
        claim();
    };

    const { registerTargetItem } = React.useContext(DynamicHelp.Api);
    const { ref: voting_pane } = registerTargetItem("voting-pane");
    const { ref: escalate_option } = registerTargetItem("escalate-option");

    const action_choices = available_actions ? available_actions : ["escalate"];

    return (
        <div className="voting-pane" ref={voting_pane}>
            <h4>
                {pgettext(
                    "The heading for community moderators 'action choices' section",
                    "Actions",
                )}
            </h4>
            {(!available_actions || null) && (
                <div className="no-report-actions-note">
                    {_("This report has no available actions yet.  You can escalate or ignore it.")}
                </div>
            )}
            {!enable && (
                <div className="disabled-actions-note">
                    {_("This report was handled after you decided to look at it!")}
                </div>
            )}
            {enable &&
                action_choices.map((a) => (
                    <div
                        key={a}
                        className="action-selector"
                        ref={a === "escalate" ? escalate_option : null}
                    >
                        <input
                            id={a}
                            name="availableActions"
                            type="radio"
                            checked={selectedOption === a}
                            value={a}
                            onChange={updateSelectedAction}
                        />
                        <label htmlFor={a}>{(ACTION_PROMPTS as any)[a]}</label>
                    </div>
                ))}
            {((action_choices && enable) || null) && (
                <button className="success" onClick={() => submit(selectedOption)}>
                    {pgettext("A label on a button for submitting a vote", "Vote")}
                </button>
            )}
        </div>
    );
}
