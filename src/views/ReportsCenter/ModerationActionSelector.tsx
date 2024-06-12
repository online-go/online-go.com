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
import { useUser } from "hooks";
import { Report } from "report_util";

interface ModerationActionSelectorProps {
    available_actions: string[];
    vote_counts: { [action: string]: number };
    enable: boolean;
    report: Report;
    claim: () => void;
    submit: (action: string, note: string) => void;
}

// Translatable versions of the prompts for Community Moderators.
// The set of keys (choices) here is determined by the server's VotableActions class.
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
    call_score_cheat_for_black: pgettext(
        "Label for a moderator to select this option",
        "White is cheating - call the game for black, and warn white.",
    ),
    call_score_cheat_for_white: pgettext(
        "Label for a moderator to select this option",
        "Black is cheating - call the game for white, and warn black.",
    ),
    annul_escaped: pgettext(
        "Label for a moderator to select this option",
        "Wrong result due to escape - annul game, warn the escaper.",
    ),
    warn_escaper: pgettext(
        "Label for a moderator to select this option",
        "The accused escaped - warn them.",
    ),
    call_escaped_game_for_black: pgettext(
        "Label for a moderator to select this option",
        "White escaped - call the game for black, and warn white.",
    ),
    call_escaped_game_for_white: pgettext(
        "Label for a moderator to select this option",
        "Black escaped - call the game for white, and warn black.",
    ),
    no_escaping: pgettext(
        "Label for a moderator to select this option",
        "No escaping evident - inform the reporter.",
    ),
    not_escaping_cancel: pgettext(
        "Label for a moderator to select this option",
        "Not escaping, they used 'cancel'.",
    ),
    annul_stalled: pgettext(
        "Label for a moderator to select this option",
        "Wrong result due to stalling - annul game, warn the staller.",
    ),
    warn_staller: pgettext(
        "Label for a moderator to select this option",
        "The accused stalled - warn them.",
    ),
    call_stalled_game_for_black: pgettext(
        "Label for a moderator to select this option",
        "White stalled - call the game for black, and warn white.",
    ),
    call_stalled_game_for_white: pgettext(
        "Label for a moderator to select this option",
        "Black stalled - call the game for white, and warn black.",
    ),
    no_stalling: pgettext(
        "Label for a moderator to select this option",
        "No stalling evident - inform the reporter.",
    ),
    // Note: keep this last, so it's positioned above the "note to moderator" input field
    escalate: pgettext(
        "A label for a community moderator to select this option - send report to to full moderators",
        "Escalate: send direct to moderators.",
    ),
};

export function ModerationActionSelector({
    available_actions,
    vote_counts,
    enable,
    report,
    claim,
    submit,
}: ModerationActionSelectorProps): JSX.Element {
    const user = useUser();
    const reportedBySelf = user.id === report.reporting_user.id;

    const [selectedOption, setSelectedOption] = React.useState("");
    const [mod_note, setModNote] = React.useState("");
    const [voted, setVoted] = React.useState(false);

    const updateSelectedAction = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedOption(e.target.value);
        claim();
    };

    const { registerTargetItem } = React.useContext(DynamicHelp.Api);
    const { ref: voting_pane } = registerTargetItem("voting-pane");
    const { ref: escalate_option } = registerTargetItem("escalate-option");

    // If for some reason we didn't get any actions to offer, we'll just offer "escalate"
    const action_choices = available_actions ? available_actions : ["escalate"];

    return (
        <div className="ModerationActionSelector" ref={voting_pane}>
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
                        <label htmlFor={a}>
                            {(ACTION_PROMPTS as any)[a]}
                            <span className="vote-count">
                                ({(!!a && !!vote_counts && vote_counts[a]) ?? 0})
                            </span>
                        </label>
                    </div>
                ))}
            {selectedOption === "escalate" && (
                <textarea
                    id="mod-note-text"
                    placeholder={_("Message for moderators...")}
                    rows={5}
                    value={mod_note}
                    onChange={(ev) => setModNote(ev.target.value)}
                />
            )}
            <span>
                {((action_choices && enable) || null) && (
                    <button
                        className="success"
                        disabled={voted || !selectedOption}
                        onClick={() => {
                            setVoted(true);
                            submit(selectedOption, mod_note);
                        }}
                    >
                        {pgettext("A label on a button for submitting a vote", "Vote")}
                    </button>
                )}
                {((reportedBySelf && enable) || null) && (
                    <button className="close" onClick={report.cancel}>
                        {pgettext(
                            "A button for closing a report created by yourself",
                            "Close Report",
                        )}
                    </button>
                )}
            </span>
        </div>
    );
}
