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
import * as ReactDOM from "react-dom/client";
import * as player_cache from "@/lib/player_cache";
import { Card } from "@/components/material";
import { _, pgettext } from "@/lib/translate";
import { checklistSatisfied, type ChecklistItemId } from "@/lib/report_checklist";
import { getChecklist } from "@/lib/report_checklist_items";
import { useReportChecklist } from "@/lib/useReportChecklist";
import { ReportChecklist } from "./ReportChecklist";
import { ReportChecklistBlocker } from "./ReportChecklistBlocker";
import { StallingKindSelector } from "./StallingKindSelector";
import { composeStallingNote, type StallingKind } from "@/lib/stalling_kinds";
import { PlayerIcon } from "@/components/PlayerIcon";
import { post } from "@/lib/requests";
import { alert } from "@/lib/swal_config";
import { setIgnore } from "@/components/BlockPlayer";
import { useUser } from "@/lib/hooks";
import { get } from "@/lib/requests";
import { toast } from "@/lib/toast";
import { getPrintableError } from "@/lib/misc";
import "./Report.css";

export type ReportType =
    | "all" // not a type, just useful for the enumeration
    // These need to match those defined in the IncidentReport model on the back end
    | "stalling"
    | "inappropriate_content"
    | "score_cheating"
    | "harassment"
    | "ai_use"
    | "assess_ai_play"
    | "sandbagging"
    | "sandbagging_assessment" // escalated sandbagging reports, for moderators only
    | "thrown_game"
    | "escaping"
    | "appeal"
    | "other"
    | "warning" // for moderators only
    | "troll" // system generated, for moderators only
    | "malicious_report";

export interface ReportDescription {
    type: ReportType;
    title: string;
    description: string;
    moderator_only?: boolean;
    cm_only?: boolean; // visible only to CMs (any non-zero moderator_powers)
    not_reportable?: boolean;
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
        type: "escaping",
        title: pgettext("Report user for escaping from the game", "Stopped Playing"),
        description: pgettext(
            "Report user for not finishing the game properly",
            "User left the game or stopped playing without concluding it properly.",
        ),
    },
    {
        type: "score_cheating",
        title: pgettext("Report user for score cheating", "Score Cheating"),
        description: pgettext(
            "Report user for score cheating",
            "User is attempting to cheat in the stone removal phase, or the game has been mis-scored.",
        ),
    },
    {
        type: "stalling",
        title: pgettext("Report user for stalling in a game", "Playing Stalling Moves"),
        description: pgettext(
            "Report user for stalling in a game",
            "User is playing time wasting moves, or passing and resuming needlessly, delaying completion of the game.",
        ),
    },
    {
        type: "thrown_game",
        title: pgettext("Report user for throwing a game", "Thrown Game"),
        description: pgettext(
            "Report user for throwing a game",
            "User intentionally lost the game.",
        ),
        not_reportable: true, // Reports of this type result from sandbagging reports where the accused lost
    },
    {
        type: "malicious_report",
        title: pgettext(
            "A report type CMs file against users whose own reports look malicious",
            "Malicious Report",
        ),
        description: pgettext(
            "Description of the malicious-report type",
            "The accused player filed a report deemed to be malicious. File this from the source report's detail view.",
        ),
        cm_only: true,
    },
    {
        type: "sandbagging",
        title: pgettext("Report user for sandbagging", "Sandbagging"),
        description: pgettext(
            "Report user for sandbagging",
            "User is resigning or timing out won games to purposefully lower their rank.",
        ),
    },
    {
        type: "sandbagging_assessment",
        title: pgettext("Sandbagging assessment by moderators", "Sandbagging Assessment"),
        description: pgettext(
            "Sandbagging assessment by moderators",
            "Escalated sandbagging reports for moderator review.",
        ),
        moderator_only: true,
        not_reportable: true, // Reports of this type result from CM escalation, not from a player
    },
    {
        type: "inappropriate_content",
        title: pgettext("Report user for inappropriate content", "Inappropriate Content"),
        description: pgettext(
            "Report user for inappropriate content",
            "User is posting inappropriate content.",
        ),
    },
    {
        type: "harassment",
        title: pgettext("Report user for harassment", "Harassment"),
        description: pgettext("Report user for harassment", "User is harassing other users."),
    },
    {
        type: "ai_use",
        title: pgettext("Report user for AI use", "AI Use"),
        description: pgettext(
            "Report user for AI use",
            "Use this if you are quite certain that AI is being used.  Please don't report unless you have convincing evidence.  Please make sure you provide the evidence in the report.",
        ),
    },
    {
        type: "assess_ai_play",
        title: pgettext("Assess AI play", "Assess AI play"),
        description: pgettext("Assess AI play", "Assess AI play"),
        not_reportable: true, // Reports of this type result from the AI detector process, not from a player
    },
    {
        type: "other",
        title: pgettext("User is reporting something else", "Other"),
        description: pgettext(
            "User is reporting something else",
            "Please describe in detail the issue in the text box below.",
        ),
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

export function Report(props: ReportProperties): React.ReactElement {
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
    const [stalling_kind, set_stalling_kind] = React.useState<StallingKind | "">("");
    const [submitting, set_submitting] = React.useState(false);
    const [source_report_type, set_source_report_type] = React.useState<string | null>(null);
    // Source-report URL snapshot for malicious_report's back-link, set in the
    // mount effect below from the report-detail path at dialog-open time so SPA
    // navigation between opening the dialog and submitting can't change which
    // report the malicious_report is filed against.
    const source_report_url_ref = React.useRef<string | null>(null);

    const user = useUser();

    const category = report_categories.find((x) => x.type === report_type);

    const [attestations, set_attestations] = React.useState<Record<ChecklistItemId, boolean>>({});

    // Memoised because useReportChecklist restarts its async evaluation whenever the
    // items array identity changes. A fresh array each render would loop forever.
    const checklist_items = React.useMemo(() => getChecklist(report_type), [report_type]);

    const checklist = useReportChecklist({
        items: checklist_items,
        game_id,
        review_id,
        reported_user_id,
        note,
        stalling_kind: stalling_kind || undefined,
        attestations,
    });

    const blocker = checklist.find((r) => r.state === "blocked");

    // Attestations and the stall-kind selection belong to the report type, so a
    // type change clears them.
    React.useEffect(() => {
        set_attestations({});
        set_stalling_kind("");
    }, [report_type]);

    function toggleAttestation(id: ChecklistItemId) {
        set_attestations((prev) => ({ ...prev, [id]: !prev[id] }));
    }

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

    // When the Report dialog is opened on a report-detail page, fetch that
    // source report's type once. It gates whether the malicious_report option
    // is offered (score-cheating only) and provides the malicious_report
    // back-link URL.
    React.useEffect(() => {
        const match = window.location.pathname.match(/^\/reports-center\/all\/(\d+)/);
        if (!match) {
            set_source_report_type(null);
            source_report_url_ref.current = null;
            return;
        }
        const source_id = match[1];
        source_report_url_ref.current = `/reports-center/all/${source_id}`;
        get(`moderation/incident/${source_id}`)
            .then((report: { report_type?: string }) =>
                set_source_report_type(report?.report_type ?? null),
            )
            .catch(() => set_source_report_type(null));
    }, []);

    function close() {
        if (onClose) {
            onClose();
        }
    }

    function canSubmit() {
        // The category guard must come first: checklistSatisfied is vacuously true for
        // the empty list, so without it an unselected report type would enable the button.
        if (!category) {
            return false;
        }

        if (submitting) {
            return false;
        }

        if (!reported_user_id) {
            return false;
        }

        return checklistSatisfied(checklist);
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

        const payload: { [k: string]: unknown } = {
            note:
                report_type === "stalling" && stalling_kind
                    ? composeStallingNote(stalling_kind, note)
                    : note,
            report_type,
            reported_conversation,
            reported_user_id: reported_user_id,
            reported_game_id: game_id,
            reported_review_id: review_id,
        };
        if (report_type === "malicious_report" && source_report_url_ref.current) {
            payload.url = source_report_url_ref.current;
        }
        post("moderation/incident", payload)
            .then(() => {
                set_submitting(false);
                onClose?.();
                void alert.fire({ text: _("Thanks for the report!") });
            })
            .catch((err) => {
                set_submitting(false);
                onClose?.();
                const server_error = getPrintableError(err);
                const message = server_error
                    ? `${_("There was an error submitting your report")}: ${server_error}`
                    : _("There was an error submitting your report");
                void alert.fire({ text: message });
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
                onClose?.();
                void alert.fire("Warning sent");
            })
            .catch((err) => {
                set_submitting(false);
                onClose?.();
                const server_error = getPrintableError(err);
                const message = server_error
                    ? `${_("There was an error submitting the warning!")}: ${server_error}`
                    : _("There was an error submitting the warning!");
                void alert.fire({ text: message });
            });
    }

    const has_moderator_powers = (user.moderator_powers ?? 0) > 0;
    const available_categories = report_categories
        .filter((x) => !x.not_reportable)
        .filter((x) => user.is_moderator || !x.moderator_only)
        .filter((x) => has_moderator_powers || !x.cm_only)
        // malicious_report is offered only while viewing a score-cheating report
        .filter((x) => x.type !== "malicious_report" || source_report_type === "score_cheating");

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
                <div className="report-category-description">{category?.description}</div>
            </div>
            {blocker ? (
                <ReportChecklistBlocker result={blocker} />
            ) : category ? (
                <div className="details">
                    {category.type === "stalling" && (
                        <StallingKindSelector value={stalling_kind} onChange={set_stalling_kind} />
                    )}
                    <textarea
                        className="notes"
                        value={note}
                        onChange={(ev) => set_note(ev.target.value)}
                        placeholder={
                            category.type !== "stalling"
                                ? _(
                                      "Please provide any relevant details about the problem you are reporting.",
                                  )
                                : stalling_kind === "other"
                                  ? pgettext(
                                        "Placeholder of the explanation field when 'something else' is selected in the stalling report form",
                                        "Please explain how the other player stalled.",
                                    )
                                  : pgettext(
                                        "Placeholder of the optional free-text field in the stalling report form",
                                        "Is there any other information you would like us to know? (optional)",
                                    )
                        }
                    />
                    <ReportChecklist results={checklist} onToggle={toggleAttestation} />
                </div>
            ) : null}
            {(reported_conversation || null) && (
                <div className="reported-conversation">
                    {reported_conversation?.content.map((line, idx) => (
                        <div key={idx}>{line}</div>
                    ))}
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
    const user = data.get("user");
    const container = document.createElement("DIV");
    const game_id = parseInt(
        document.location.pathname.match(/game\/(view\/)?([0-9]+)/)?.[2] || "0",
    );
    const review_id = parseInt(
        document.location.pathname.match(/(review|demo\/view)\/([0-9]+)/)?.[2] || "0",
    );

    if (game_id && !("reported_game_id" in report)) {
        report["reported_game_id"] = game_id;
    }
    if (review_id && !("reported_review_id" in report)) {
        report["reported_review_id"] = review_id;
    }

    // Don't open the report creation dialog if they have already reported this game.
    // Instead, open the incident report list to show them their current report, which they can edit.
    // (arguably we might let them report the "other" player as well as the already reported one,
    //  but that's a bit more complicated and not worth the effort for now.)
    const already_reported = data.get("reported-games", []) as number[];

    if (report.reported_game_id && already_reported.includes(report.reported_game_id)) {
        if (!user.is_moderator && !user.moderator_powers) {
            toast(<div>{_("You have already reported this game.")}</div>);
            data.set("ui-state.show_incident_list", true);
            return;
        } else {
            toast(<div>{_("Note: You have already reported this game!")}</div>);
        }
    }

    function onClose() {
        //ReactDOM.unmountComponentAtNode(container);
        root.unmount();
        document.body.removeChild(container);
        if (report.onClose) {
            report.onClose();
        }
    }

    container.className = "Report-container-container";
    document.body.append(container);
    const root = ReactDOM.createRoot(container);

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
