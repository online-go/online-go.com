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
import { Report } from "report_manager";
import { _, pgettext } from "translate";

interface ModerationActionSelectorProps {
    report: Report;
    enable: boolean;
    submit: (action: string) => void;
}

const ACTION_PROMPTS = {
    annul_score_cheat: pgettext(
        "A label for a moderator to select this option",
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
};

export function ModerationActionSelector({
    report,
    enable,
    submit,
}: ModerationActionSelectorProps): JSX.Element {
    const [selectedOption, setSelectedOption] = React.useState("");

    const updateSelectedAction = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedOption(e.target.value);
    };

    return (
        <div className="voting">
            <h4>
                {pgettext("The heading for community moderation action choices section", "Actions")}
            </h4>
            {report.available_actions.map((a) => (
                <div key={a} className="action-selector">
                    <input
                        id={a}
                        name="availableActions"
                        type="radio"
                        checked={selectedOption === a}
                        value={a}
                        onChange={updateSelectedAction}
                        disabled={!enable}
                    />
                    <label htmlFor={a}>{ACTION_PROMPTS[a]}</label>
                </div>
            ))}
            {(report.available_actions || null) && (
                <button
                    className="success"
                    disabled={!enable}
                    onClick={() => submit(selectedOption)}
                >
                    {_("Submit")}
                </button>
            )}
        </div>
    );
}
