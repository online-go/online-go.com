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
import { _, llm_pgettext } from "@/lib/translate";

import * as DynamicHelp from "react-dynamic-help";

type Report = rest_api.moderation.ReportDetail;
type CommunityModerationAction = rest_api.moderation.CommunityModerationAction;

interface ModerationActionSelectorProps {
    available_actions: CommunityModerationAction[];
    vote_counts: { [action: string]: number };
    users_vote: CommunityModerationAction | null;
    enable: boolean;
    report: Report;
    submit: (
        action: CommunityModerationAction,
        note: string,
        dissenter_note: string,
        voter_note: string,
    ) => void;
}

// Translatable versions of the prompts for Community Moderators.
// The set of keys (choices) here is determined by the server's VotableActions class.
//
// Don't forget to update rest_api.warnings.WarningMessageId as needed: new actions usually mean new messages.

const ACTION_PROMPTS: Record<CommunityModerationAction, string> = {
    annul_escaped: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. 'escape' is jargon that means 'left the game without finishing it properly: \
take care to convey this where there is any reference to escape or escaping.\
When translating the word escaping, realise that this is jargon for stopped playing.\
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Wrong result due to escape - annul game, warn the escaper.",
    ),
    warn_escaper: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. 'escape' is jargon that means 'left the game without finishing it properly: \
take care to convey this where there is any reference to escape or escaping.\
When translating the word escaping, realise that this is jargon for stopped playing.\
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "The accused escaped - warn them.",
    ),
    call_escaped_game_for_black: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. 'escape' is jargon that means 'left the game without finishing it properly: \
take care to convey this where there is any reference to escape or escaping.\
When translating the word escaping, realise that this is jargon for stopped playing.\
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "White escaped - call the game for black, and warn white.",
    ),
    call_escaped_game_for_white: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. 'escape' is jargon that means 'left the game without finishing it properly: \
take care to convey this where there is any reference to escape or escaping.\
When translating the word escaping, realise that this is jargon for stopped playing.\
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Black escaped - call the game for white, and warn black.",
    ),
    no_escaping: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. 'escape' is jargon that means 'left the game without finishing it properly: \
take care to convey this where there is any reference to escape or escaping.\
When translating the word escaping, realise that this is jargon for stopped playing.\
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "No escaping evident - inform the reporter.",
    ),
    not_escaping_cancel: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. 'escape' is jargon that means 'left the game without finishing it properly: \
take care to convey this where there is any reference to escape or escaping.\
When translating the word escaping, realise that this is jargon for stopped playing.\
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Not escaping, they used 'cancel'.",
    ),
    annul_stalled: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.\
When translating stalling or stalled, realise that this means wasting time, not slowing down.",
        "Wrong result due to stalling - annul game, warn the staller.",
    ),
    warn_staller: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.\
When translating stalling or stalled, realise that this means wasting time, not slowing down.",
        "The accused stalled - warn them.",
    ),
    call_stalled_game_for_black: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.\
When translating stalling or stalled, realise that this means wasting time, not slowing down.",
        "White stalled - call the game for black, and warn white.",
    ),
    call_stalled_game_for_white: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.\
When translating stalling or stalled, realise that this means wasting time, not slowing down.",
        "Black stalled - call the game for white, and warn black.",
    ),
    no_stalling: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.\
When translating stalling or stalled, realise that this means wasting time, not slowing down.",
        "No stalling evident - inform the reporter.",
    ),
    annul_score_cheat: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.\
When translating cheating, realise that this means trying to win by breaking the rules.",
        "Annul the game and warn the cheater.",
    ),
    warn_score_cheat: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.\
When translating cheating, realise that this means trying to win by breaking the rules.",
        "The accused tried to cheat - warn the cheater.",
    ),
    no_score_cheat: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.\
When translating cheating, realise that this means trying to win by breaking the rules.",
        "No cheating - inform the reporter.",
    ),
    call_score_cheat_for_black: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.",
        "White is cheating - call the game for black, and warn white.",
    ),
    call_score_cheat_for_white: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.",
        "Black is cheating - call the game for white, and warn black.",
    ),
    annul_no_warning: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Annul the game, but issue no warnings.",
    ),
    final_warning_escaping: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. 'escape' is jargon that means 'left the game without finishing it properly: \
take care to convey this where there is any reference to escape or escaping.\
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Final warning: the accused escaped.",
    ),
    final_warning_stalling: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.",
        "Final warning: the accused stalled.",
    ),
    final_warning_score_cheating: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.",
        "Final warning: the accused tried to cheat.",
    ),
    final_warning_escaping_and_annul: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. 'escape' is jargon that means 'left the game without finishing it properly: \
take care to convey this where there is any reference to escape or escaping.\
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Final warning: the accused escaped - annul game.",
    ),
    final_warning_stalling_and_annul: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Final warning: the accused stalled - annul game.",
    ),
    final_warning_score_cheating_and_annul: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Final warning: the accused tried to cheat - annul game.",
    ),
    warn_duplicate_reporter: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.",
        "Duplicate report - ask the reporter not to do that.",
    ),
    suspend_user: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. Be completely unambiguous with regards to the meaning of \
the word annul: choose a translation that means that the result of the game is not valid.",
        "Suspend the user.",
    ),
    suspend_user_and_annul: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Suspend user and annul game.",
    ),
    escalate: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Escalate: report needs final warning or suspension, or other unusual action.",
    ),
    definitely_ai: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Definitely AI - escalate to moderators for warning or suspension and game annulment.",
    ),
    assess_ai_play: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game. \
'CM' stands for Community Moderator.",
        "Gameplay assessment needed - send to Dan CMs.",
    ),
    ai_like: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "AI like - this game has moves that are most likely coming from an AI.",
    ),
    human_like: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "Human like - the moves in this game could all be played by a human.",
    ),
    no_ai_use_evident: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "No AI use evident - inform the reporter.",
    ),
    no_ai_use_bad_report: llm_pgettext(
        "This phrase to be translated is the label of an option for a moderator of an \
online Go game server to select: an action to apply to a report about a game of Go. \
In the phrase you are asked to translate, 'no cheating' is a conclusion meaning the \
moderator concluded cheating did not occur, rather than an instruction meaning the \
reader should not cheat. \
Be completely unambiguous with regards to the meaning of the word annul: \
this means to declare the game invalid, and this is not the same as cancelling a game.",
        "No AI use, educate reporter about reporting AI use.",
    ),
};

export function ModerationActionSelector({
    available_actions,
    vote_counts,
    users_vote,
    enable,
    report,
    submit,
}: ModerationActionSelectorProps): React.ReactElement {
    const [voted, setVoted] = React.useState(false);
    const [selectedOption, setSelectedOption] = React.useState<CommunityModerationAction | "">(
        users_vote || "",
    );
    const [escalation_note, setEscalationNote] = React.useState("");
    const [voter_note, setVoterNote] = React.useState("");
    const [dissenter_note, setDissenterNote] = React.useState("");

    const updateSelectedAction = (
        e: React.ChangeEvent<HTMLInputElement & { value: CommunityModerationAction }>,
    ) => {
        setSelectedOption(e.target.value);
    };

    const { registerTargetItem } = React.useContext(DynamicHelp.Api);
    const { ref: voting_pane } = registerTargetItem("voting-pane");
    const { ref: escalate_option } = registerTargetItem("escalate-option");

    // If for some reason we didn't get any actions to offer, we'll just offer "escalate"
    const action_choices: CommunityModerationAction[] = available_actions
        ? available_actions
        : ["escalate"];

    // If we're in dissent, we'll ask for a "dissent" note
    // "dissent" is "the number of votes in our option is less than some other option"
    // Votes on "AI Use" are never in dissent because they do not require consensus

    const inDissent =
        selectedOption &&
        report.report_type !== "ai_use" &&
        !!Object.keys(vote_counts).find(
            (k: string) =>
                k !== selectedOption && (vote_counts[selectedOption] ?? 0) < vote_counts[k],
        );

    return (
        <div className="ModerationActionSelector" ref={voting_pane}>
            <h4>
                {llm_pgettext(
                    "The heading for community moderators 'action choices' section",
                    "Actions",
                )}
            </h4>
            {(!available_actions || null) && (
                <div className="no-report-actions-note">
                    {_("This report has no available actions yet.  You can escalate or ignore it.")}
                </div>
            )}
            {!enable && report.state === "claimed" && (
                <div className="disabled-actions-note">
                    {_("This report is being looked at by a moderator.")}
                </div>
            )}
            {!enable && report.state === "resolved" && (
                <div className="disabled-actions-note">
                    {_("This report was handled after you decided to look at it!")}
                </div>
            )}
            {!enable && report.state === "pending" && (
                <div className="disabled-actions-note">
                    {_("No actions available to you for this report.")}
                </div>
            )}
            {enable &&
                action_choices.map((a) => {
                    const voteCount = (!!a && !!vote_counts && vote_counts[a]) ?? 0;
                    const isUsersVote = users_vote === a;

                    return (
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
                                    ({voteCount}
                                    {isUsersVote ? "*" : ""})
                                </span>
                            </label>
                        </div>
                    );
                })}
            {selectedOption === "escalate" && (
                <textarea
                    id="escalation-note"
                    placeholder={llm_pgettext(
                        "A placeholder prompting community moderators for the reason why they are escalating a report",
                        "Reason for escalating?",
                    )}
                    rows={5}
                    value={escalation_note}
                    onChange={(ev) => setEscalationNote(ev.target.value)}
                />
            )}
            {report.report_type === "assess_ai_play" && (
                <textarea
                    id="assess-ai-play-note"
                    placeholder={llm_pgettext(
                        "A placeholder prompting community moderators for their assessment of the gameplay",
                        "Gameplay assessment",
                    )}
                    rows={5}
                    value={voter_note}
                    onChange={(ev) => setVoterNote(ev.target.value)}
                />
            )}

            {inDissent &&
                report.report_type !== "assess_ai_play" &&
                selectedOption !== "escalate" && (
                    <textarea
                        id="dissenter-note"
                        placeholder={llm_pgettext(
                            "A placeholder prompting community moderators for the reason why they are disagreeing with a vote",
                            "(Optional) What is it that the other votes do not seem to take into account?",
                        )}
                        rows={5}
                        value={dissenter_note}
                        onChange={(ev) => setDissenterNote(ev.target.value)}
                    />
                )}
            <span className="action-buttons">
                {((action_choices && enable) || null) && (
                    <button
                        className="success"
                        disabled={
                            voted ||
                            !selectedOption ||
                            (selectedOption === "escalate" && !escalation_note)
                        }
                        onClick={() => {
                            if (selectedOption) {
                                setVoted(true);
                                submit(selectedOption, escalation_note, dissenter_note, voter_note);
                            }
                        }}
                    >
                        {llm_pgettext("A label on a button for submitting a vote", "Vote")}
                    </button>
                )}
            </span>
        </div>
    );
}
