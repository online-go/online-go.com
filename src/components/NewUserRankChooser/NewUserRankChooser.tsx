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

import * as data from "@/lib/data";
import { pgettext } from "@/lib/translate";
import { put } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { useUser } from "@/lib/hooks";
import "./NewUserRankChooser.css";

interface NewUserRankChooserProps {
    show_skip?: boolean;
    onChosen?: () => void;
}

export function NewUserRankChooser({
    show_skip = true,
    onChosen = () => {},
}: NewUserRankChooserProps): React.ReactElement {
    const user = useUser();

    const variants = [NewUserRankChooserA, NewUserRankChooserB, NewUserRankChooserC];

    const ChosenChooser = variants[user.id % variants.length];

    return <ChosenChooser show_skip={show_skip} onChosen={onChosen} />;
}

// Persist the rank choice. On success, locally apply the new
// starting_rank_hint to config.user so Home dismisses the chooser
// without waiting for the realtime user/update push from the server.
// The realtime push depends on the termination-server's Redis
// SUBSCRIBE for this player being live by the time Player.save()
// publishes the update; for a freshly-authenticated socket that race
// can be lost, leaving the chooser visibly stuck after a successful
// click.
function sendRankChoice(choice: rest_api.StartingRankHint, onChosen?: () => void): void {
    put(`me/starting_rank`, { choice: choice })
        .then(() => {
            const current = data.get("config.user");
            if (current && !current.anonymous) {
                data.set("config.user", { ...current, starting_rank_hint: choice });
            }
            onChosen?.();
        })
        .catch(errorAlerter);
}

interface NewRankChooserButtonProps {
    label: string;
    choice: rest_api.StartingRankHint;
    explainer?: string;
    onSend: (choice: rest_api.StartingRankHint) => void;
}

// Defined at module scope so its function identity is stable across
// parent re-renders. An inner definition would create a new component
// type on every parent render, causing React to unmount and remount
// the entire <button> subtree and opening a window where a click can
// intersect the DOM swap and be lost.
function NewRankChooserButton({
    label,
    choice,
    explainer,
    onSend,
}: NewRankChooserButtonProps): React.ReactElement {
    return (
        <div className="rank-chooser-button">
            <button className="primary" onClick={() => onSend(choice)}>
                <span className="label-text">{label}</span>
                <span className="explainer-text">{explainer}</span>
            </button>
        </div>
    );
}

// No "explainers" at all (the UI designer's design)

function NewUserRankChooserA({
    show_skip = true,
    onChosen = () => {},
}: NewUserRankChooserProps): React.ReactElement {
    const onSend = React.useCallback(
        (choice: rest_api.StartingRankHint) => sendRankChoice(choice, onChosen),
        [onChosen],
    );

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
                        onSend={onSend}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I have basic skills'",
                            "Basic",
                        )}
                        choice={"basic"}
                        onSend={onSend}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I'm an intermediate player'",
                            "Intermediate",
                        )}
                        choice={"intermediate"}
                        onSend={onSend}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I'm an advanced player'",
                            "Advanced",
                        )}
                        choice={"advanced"}
                        onSend={onSend}
                    />
                </div>
                {show_skip && (
                    <div className="skip-button">
                        <button className="primary" onClick={() => onSend("skip")}>
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

// Explainers with discrete ranges (the forum's choice)

function NewUserRankChooserB({
    show_skip = true,
    onChosen = () => {},
}: NewUserRankChooserProps): React.ReactElement {
    const onSend = React.useCallback(
        (choice: rest_api.StartingRankHint) => sendRankChoice(choice, onChosen),
        [onChosen],
    );

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
                        onSend={onSend}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I have basic skills'",
                            "Basic",
                        )}
                        choice={"basic"}
                        explainer={"25k-18k"}
                        onSend={onSend}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I'm an intermediate player'",
                            "Intermediate",
                        )}
                        choice={"intermediate"}
                        explainer={"17k-6k"}
                        onSend={onSend}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I'm an advanced player'",
                            "Advanced",
                        )}
                        choice={"advanced"}
                        explainer={"5k+"}
                        onSend={onSend}
                    />
                </div>
                {show_skip && (
                    <div className="skip-button">
                        <button className="primary" onClick={() => onSend("skip")}>
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

// Explainers with overlapping ranges (the slack channel's choice)

function NewUserRankChooserC({
    show_skip = true,
    onChosen = () => {},
}: NewUserRankChooserProps): React.ReactElement {
    const onSend = React.useCallback(
        (choice: rest_api.StartingRankHint) => sendRankChoice(choice, onChosen),
        [onChosen],
    );

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
                        onSend={onSend}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I have basic skills'",
                            "Basic",
                        )}
                        choice={"basic"}
                        explainer={"25k-12k"}
                        onSend={onSend}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I'm an intermediate player'",
                            "Intermediate",
                        )}
                        choice={"intermediate"}
                        explainer={"18k-1k"}
                        onSend={onSend}
                    />
                    <NewRankChooserButton
                        label={pgettext(
                            "Label for the button used to say 'I'm an advanced player'",
                            "Advanced",
                        )}
                        choice={"advanced"}
                        explainer={"5k-9d"}
                        onSend={onSend}
                    />
                </div>
                {show_skip && (
                    <div className="skip-button">
                        <button className="primary" onClick={() => onSend("skip")}>
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
