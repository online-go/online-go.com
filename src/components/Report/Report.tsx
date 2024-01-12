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
import * as ReactDOM from "react-dom/client";
import * as player_cache from "player_cache";
import { Card } from "material";
import { _, pgettext } from "translate";
import { PlayerIcon } from "PlayerIcon";
import { post } from "requests";
import { alert } from "swal_config";
import { setIgnore } from "BlockPlayer";
import { useUser } from "hooks";

export type ReportType =
    | "all" // not a type, just useful for the enumeration
    // These need to match those defined in the IncidentReport model on the back end
    | "stalling"
    | "inappropriate_content"
    | "score_cheating"
    | "harassment"
    | "ai_use"
    | "sandbagging"
    | "escaping"
    | "appeal"
    | "other"
    | "warning" // for moderators only
    | "troll"; // system generated, for moderators only

export const CommunityModeratorReportTypes: ReadonlyArray<ReportType> = [
    "escaping",
    "score_cheating",
];

export interface ReportDescription {
    type: ReportType;
    title: string;
    description: string;
    game_id_required?: boolean;
    min_description_length?: number;
    moderator_only?: boolean;
}

export interface ReportedConversation {
    username: string;
    content: Array<string>;
}

interface ReportProperties {
    report_id?: number;
    reported_user_id?: number;
    reported_game_id?: number;
    reported_review_id?: number;
    report_type?: ReportType;
    reported_conversation?: ReportedConversation;
    onClose?: () => void;
}

export const report_categories: ReportDescription[] = [
    {
        type: "stalling",
        title: pgettext("Report user for stalling in a game", "Game Stalling"),
        description: pgettext(
            "Report user for stalling in a game",
            "User is stalling at the end of a game to annoy their opponent.",
        ),
        game_id_required: true,
    },
    {
        type: "escaping",
        title: pgettext("Report user for escaping", "Escaping"),
        description: pgettext(
            "Report user for escaping",
            "User purposefully left the game without concluding it.",
        ),
        game_id_required: true,
    },
    {
        type: "score_cheating",
        title: pgettext("Report user for score cheating", "Score Cheating"),
        description: pgettext(
            "Report user for score cheating",
            "User is attempting to cheat in the stone removal phase or the game has been mis-scored.",
        ),
        game_id_required: true,
    },
    {
        type: "inappropriate_content",
        title: pgettext("Report user for inappropriate content", "Inappropriate Content"),
        description: pgettext(
            "Report user for inappropriate content",
            "User is posting inappropriate content.",
        ),
        min_description_length: 20,
    },
    {
        type: "harassment",
        title: pgettext("Report user for harassment", "Harassment"),
        description: pgettext("Report user for harassment", "User is harassing other users."),
        min_description_length: 20,
    },
    {
        type: "sandbagging",
        title: pgettext("Report user for sandbagging", "Sandbagging"),
        description: pgettext(
            "Report user for sandbagging",
            "User is resigning or timing out won games to purposefully lower their rank.",
        ),
        game_id_required: true,
    },
    {
        type: "ai_use",
        title: pgettext("Report user for AI use", "AI Use"),
        description: pgettext(
            "Report user for AI use",
            "User is suspected of using an AI assistance in this game.",
        ),
        game_id_required: true,
    },
    {
        type: "other",
        title: pgettext("User is reporting something else", "Other"),
        description: pgettext(
            "User is reporting something else",
            "Please describe in detail the issue in the text box below.",
        ),
        min_description_length: 20,
    },
    {
        type: "warning",
        title: pgettext("An option for moderators only, to warn players", "Warn"),
        description: pgettext(
            "An option for moderators only, to warn players",
            "Type the warning text below",
        ),
        moderator_only: true,
    },
    {
        type: "troll",
        title: pgettext(
            "An option for moderators only, alert moderators to troll accounts",
            "Troll",
        ),
        description: pgettext(
            "Moderators can record information about suspect accounts",
            "Put any information below",
        ),
        moderator_only: true,
    },
];

export function Report(props: ReportProperties): JSX.Element {
    const {
        reported_user_id,
        onClose,
        reported_conversation,
        reported_game_id,
        reported_review_id,
    } = props;

    const [username, set_username] = React.useState<string>(
        player_cache.lookup(reported_user_id)?.username || "",
    );
    const [report_type, set_report_type] = React.useState(props.report_type || "");
    const [game_id, _set_game_id] = React.useState(reported_game_id);
    const [review_id, _set_review_id] = React.useState(reported_review_id);
    const [note, set_note] = React.useState("");
    const [submitting, set_submitting] = React.useState(false);

    const user = useUser();

    const category = report_categories.find((x) => x.type === report_type);

    React.useEffect(() => {
        const fetching_user_id = reported_user_id;

        player_cache
            .fetch(fetching_user_id, ["username"])
            .then((player) => {
                if (fetching_user_id === reported_user_id && player.username) {
                    set_username(player.username);
                }
            })
            .catch(() => 0);
    }, [reported_user_id]);

    function close() {
        if (onClose) {
            onClose();
        }
    }

    function canSubmit() {
        if (!category) {
            return false;
        }

        if (category.game_id_required && !game_id) {
            return false;
        }

        if (category.min_description_length && note.length < category.min_description_length) {
            return false;
        }

        if (!reported_user_id) {
            return false;
        }

        if (submitting) {
            return false;
        }

        return true;
    }

    function createReport() {
        if (!canSubmit()) {
            return;
        }

        set_submitting(true);

        if (
            (report_type === "inappropriate_content" || report_type === "harassment") &&
            reported_user_id
        ) {
            setIgnore(reported_user_id, true);
        }

        post("moderation/incident", {
            note,
            report_type,
            reported_conversation,
            reported_user_id: reported_user_id,
            reported_game_id: game_id,
            reported_review_id: review_id,
        })
            .then(() => {
                set_submitting(false);
                onClose && onClose();
                void alert.fire({ text: _("Thanks for the report!") });
            })
            .catch(() => {
                set_submitting(false);
                onClose && onClose();
                void alert.fire({ text: _("There was an error submitting your report") });
            });
    }

    function canWarn() {
        if (note.length < 20) {
            return false;
        }
        return true;
    }

    function sendWarning() {
        if (!canWarn()) {
            return;
        }

        set_submitting(true);

        post("moderation/warn", { user_id: reported_user_id, text: note })
            .then(() => {
                set_submitting(false);
                onClose && onClose();
                void alert.fire("Warning sent");
            })
            .catch(() => {
                set_submitting(false);
                onClose && onClose();
                void alert.fire({ text: _("There was an error submitting the warning!") });
            });
    }

    const show_game_id_required_text = category && category.game_id_required && !game_id;

    const available_categories = user.is_moderator
        ? report_categories
        : report_categories.filter((x) => !x.moderator_only);

    return (
        <Card className="Report">
            <h2>{_("Request Moderator Assistance")}</h2>
            <div className="reported-details">
                <h3>
                    {(reported_user_id || null) && (
                        <>
                            <PlayerIcon id={reported_user_id} size={64} />
                            {_("Player")}: {username}
                        </>
                    )}
                    {(game_id || null) && (
                        <div>
                            {_("Game")}: {game_id}
                        </div>
                    )}
                    {(review_id || null) && (
                        <div>
                            {_("Review")}: {review_id}
                        </div>
                    )}
                </h3>
            </div>
            <div></div>
            <div className="type-picker">
                <select
                    value={report_type}
                    onChange={(ev) => set_report_type(ev.target.value)}
                    className={report_type === "" ? "required" : ""}
                >
                    <option value="">
                        {pgettext(
                            "User is reporting a problematic player or game",
                            "What are you reporting?",
                        )}
                    </option>
                    {available_categories.map((r) => (
                        <option key={r.type} value={r.type}>
                            {r.title}
                        </option>
                    ))}
                </select>
                <div>{category?.description}</div>
            </div>
            <div className="details">
                {((category && !show_game_id_required_text) || null) && (
                    <textarea
                        className={
                            "notes " +
                            (category &&
                            category.min_description_length &&
                            note.length < category.min_description_length
                                ? "required"
                                : "")
                        }
                        value={note}
                        onChange={(ev) => set_note(ev.target.value)}
                        placeholder={_(
                            "Please provide any relevant details pertaining to what you are reporting the user for.",
                        )}
                    />
                )}
                {show_game_id_required_text && (
                    <div className="required-text">
                        {_("Please report the user on the game page so we know where to look.")}
                    </div>
                )}
            </div>
            {(reported_conversation || null) && (
                <div className="reported-conversation">
                    {reported_conversation?.content.map((line, idx) => <div key={idx}>{line}</div>)}
                </div>
            )}
            <div className="buttons">
                <button className="default" onClick={close}>
                    {_("Close")}
                </button>
                {category && category.type === "warning" ? (
                    <button className="primary" onClick={sendWarning} disabled={!canWarn()}>
                        {_("Warn User")}
                    </button>
                ) : (
                    <button className="primary" onClick={createReport} disabled={!canSubmit()}>
                        {_("Report User")}
                    </button>
                )}
            </div>
        </Card>
    );
}

export function openReport(report: ReportProperties): void {
    const container = document.createElement("DIV");
    const game_id = parseInt(
        document.location.pathname.match(/game\/(view\/)?([0-9]+)/)?.[2] || "0",
    );
    const review_id = parseInt(
        document.location.pathname.match(/(review|demo\/view)\/([0-9]+)/)?.[2] || "0",
    );
    container.className = "Report-container-container";
    document.body.append(container);
    const root = ReactDOM.createRoot(container);

    if (game_id && !("reported_game_id" in report)) {
        report["reported_game_id"] = game_id;
    }
    if (review_id && !("reported_review_id" in report)) {
        report["reported_review_id"] = review_id;
    }

    function onClose() {
        //ReactDOM.unmountComponentAtNode(container);
        root.unmount();
        document.body.removeChild(container);
        if (report.onClose) {
            report.onClose();
        }
    }

    console.log("Preparing report: ", report);

    root.render(
        <React.StrictMode>
            <div
                className="Report-container"
                onClick={(ev) => {
                    if ((ev.target as HTMLElement).className === "Report-container") {
                        onClose();
                    }
                }}
            >
                <Report {...report} onClose={onClose} />
            </div>
        </React.StrictMode>,
    );
}
