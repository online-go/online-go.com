/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { Link } from "react-router-dom";
import { _ } from "translate";
import { comm_socket } from "sockets";
import { post } from "requests";
import * as data from "data";
import * as preferences from "preferences";
import { Player } from "Player";
import { ignore, errorAlerter } from "misc";
import * as moment from "moment";
import { emitNotification } from "Notifications";
import { browserHistory } from "ogsHistory";
import { openReportedConversationModal } from "ReportedConversationModal";
import { ReportedConversation, report_categories } from "Report";
import { AutoTranslate } from "AutoTranslate";
import swal from "sweetalert2";

export interface Report {
    id: number;
    created: string;
    updated: string;
    state: string;
    source: string;
    report_type: string;
    reporting_user: any;
    reported_user: any;
    reported_game: number;
    reported_review: number;
    reported_conversation: ReportedConversation;
    url: string;
    moderator: Player;
    cleared_by_user: boolean;
    was_helpful: boolean;
    reporter_note: string;
    reporter_note_translation: {
        source_language: string;
        target_language: string;
        source_text: string;
        target_text: string;
    };
    moderator_note: string;
    system_note: string;

    unclaim: () => void;
    claim: () => void;
    bad_report: () => void;
    good_report: () => void;
    cancel: () => void;
    set_note: () => void;
}

export function IncidentReportTracker(): JSX.Element {
    const active_incident_reports_ref = React.useRef({});
    const [show_incident_list, setShowIncidentList] = React.useState(false);
    const [reports, setReports] = React.useState([]);
    const [normal_ct, setNormalCt] = React.useState(0);

    const active_incident_reports = active_incident_reports_ref.current;

    React.useEffect(() => {
        const connect_fn = () => {
            const user = data.get("user");
            active_incident_reports_ref.current = {};
            setReports([]);

            if (!user.anonymous) {
                comm_socket.send("incident/connect", {
                    player_id: user.id,
                    auth: data.get("config.incident_auth"),
                });
            }
        };

        comm_socket.on("connect", connect_fn);
        if (comm_socket.connected) {
            connect_fn();
        }

        comm_socket.on("incident-report", handleReport);

        return () => {
            comm_socket.off("incident-report", handleReport);
            comm_socket.off("connect", connect_fn);
        };

        function handleReport(report: Report) {
            console.log("incident report", report);

            if (report.state === "resolved") {
                delete active_incident_reports[report.id];
            } else {
                report.unclaim = () => {
                    post("moderation/incident/%%", report.id, { id: report.id, action: "unclaim" })
                        .then(ignore)
                        .catch(errorAlerter);
                };
                report.good_report = () => {
                    post("moderation/incident/%%", report.id, {
                        id: report.id,
                        action: "resolve",
                        was_helpful: true,
                    })
                        .then(ignore)
                        .catch(errorAlerter);
                };
                report.bad_report = () => {
                    post("moderation/incident/%%", report.id, {
                        id: report.id,
                        action: "resolve",
                        was_helpful: false,
                    })
                        .then(ignore)
                        .catch(errorAlerter);
                };
                report.claim = () => {
                    post("moderation/incident/%%", report.id, { id: report.id, action: "claim" })
                        .then((res) => {
                            if (res.vanished) {
                                swal("Report was removed").catch(swal.noop);
                            }
                        })
                        .catch(errorAlerter);
                };
                report.cancel = () => {
                    post("moderation/incident/%%", report.id, { id: report.id, action: "cancel" })
                        .then(ignore)
                        .catch(errorAlerter);
                };

                report.set_note = () => {
                    swal({
                        input: "text",
                        inputValue: report.moderator_note,
                        showCancelButton: true,
                    })
                        .then((txt) => {
                            post("moderation/incident/%%", report.id, {
                                id: report.id,
                                action: "note",
                                note: txt,
                            })
                                .then(ignore)
                                .catch(errorAlerter);
                        })
                        .catch(ignore);
                };

                if (!(report.id in active_incident_reports)) {
                    if (
                        data.get("user").is_moderator &&
                        preferences.get("notify-on-incident-report")
                    ) {
                        emitNotification(
                            "Incident Report",
                            report.reporting_user.username + ": " + report.reporter_note,
                            () => {
                                if (report.reported_game) {
                                    browserHistory.push(`/game/${report.reported_game}`);
                                } else if (report.reported_review) {
                                    browserHistory.push(`/review/${report.reported_review}`);
                                } else if (report.reported_user) {
                                    browserHistory.push(`/user/view/${report.reported_user.id}`);
                                }
                            },
                        );
                    }
                }
                active_incident_reports[report.id] = report;
            }

            const user = data.get("user");
            const reports = [];
            let normal_ct = 0;
            for (const id in active_incident_reports) {
                const report = active_incident_reports[id];
                reports.push(report);
                if (report.moderator === null || report.moderator.id === user.id) {
                    normal_ct++;
                }
            }

            reports.sort((a, b) => {
                if (a.moderator && a.moderator.id === user.id && !b.moderator) {
                    return -1;
                }
                if (b.moderator && b.moderator.id === user.id && !a.moderator) {
                    return 1;
                }

                if (a.moderator && a.moderator.id !== user.id && !b.moderator) {
                    return 1;
                }
                if (b.moderator && b.moderator.id !== user.id && !a.moderator) {
                    return -1;
                }

                return parseInt(b.id) - parseInt(a.id);
            });

            setReports(reports);
            setNormalCt(normal_ct);
        }
    }, []);

    function toggleList() {
        setShowIncidentList(!show_incident_list);
    }

    const user = data.get("user");

    if (reports.length === 0) {
        return null;
    }

    function getReportType(report: Report): string {
        if (report.report_type === "appeal") {
            return "Ban Appeal";
        }

        const report_category = report_categories.filter((r) => r.type === report.report_type)[0];
        const report_type_title = report_category?.title || "Other";
        return report_type_title;
    }

    return (
        <div className="IncidentReportTracker">
            <div className="incident-icon-container" onClick={toggleList}>
                <i
                    className={`fa fa-exclamation-triangle ${normal_ct > 0 ? "active" : "sandbag"}`}
                />
                <span className="count">{normal_ct}</span>
            </div>
            {show_incident_list && (
                <div>
                    <div className="IncidentReportList-backdrop" onClick={toggleList}></div>
                    <div className="IncidentReportList-results">
                        {reports.map((report) => (
                            <div className="incident" key={report.id}>
                                <div className="report-header">
                                    <div className="report-id">
                                        {"R" + report.id.substr(-3.3) + ": "}
                                        {getReportType(report)}
                                    </div>
                                    {((!report.moderator && user.is_moderator) || null) && (
                                        <button className="primary xs" onClick={report.claim}>
                                            {_("Claim")}
                                        </button>
                                    )}
                                    {user.is_moderator && report.moderator && (
                                        <Player user={report.moderator} icon />
                                    )}
                                </div>
                                {(report.reporter_note || null) && (
                                    <h4 className="notes">
                                        {report.reporter_note_translation ? (
                                            <>
                                                {report.reporter_note_translation.source_text}
                                                {(report.reporter_note_translation
                                                    .target_language !==
                                                    report.reporter_note_translation
                                                        .source_language ||
                                                    null) && (
                                                    <>
                                                        <div className="source-to-target-languages">
                                                            {
                                                                report.reporter_note_translation
                                                                    .source_language
                                                            }{" "}
                                                            =&gt;{" "}
                                                            {
                                                                report.reporter_note_translation
                                                                    .target_language
                                                            }
                                                        </div>
                                                        <div className="translated">
                                                            {
                                                                report.reporter_note_translation
                                                                    .target_text
                                                            }
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <AutoTranslate source={report.reporter_note} />
                                        )}
                                    </h4>
                                )}

                                {(report.system_note || null) && (
                                    <h4 className="notes">{report.system_note}</h4>
                                )}

                                <div className="notes">
                                    <i>{user.is_moderator ? report.moderator_note || "" : ""}</i>
                                </div>

                                <div className="spread">
                                    {(report.url || null) && (
                                        <a href={report.url} target="_blank">
                                            {report.url}
                                        </a>
                                    )}

                                    {(report.reported_user || null) && (
                                        <span>
                                            {_("Reported user")}:{" "}
                                            <Player user={report.reported_user} icon />
                                        </span>
                                    )}
                                    {(report.reported_game || null) && (
                                        <span>
                                            {_("Game")}:{" "}
                                            <Link to={`/game/view/${report.reported_game}`}>
                                                #{report.reported_game}
                                            </Link>
                                        </span>
                                    )}
                                    {(report.reported_review || null) && (
                                        <span>
                                            {_("Review")}:{" "}
                                            <Link to={`/review/${report.reported_review}`}>
                                                ##{report.reported_review}
                                            </Link>
                                        </span>
                                    )}
                                </div>

                                {(report.report_type === "appeal" || null) && (
                                    <h3>
                                        <Link to={`/appeal/${report.reported_user.id}`}>
                                            View Appeal
                                        </Link>
                                    </h3>
                                )}

                                {(report.reported_conversation || null) && (
                                    <div
                                        className="spread"
                                        onClick={() => {
                                            console.log(report);
                                            openReportedConversationModal(
                                                report.reported_user?.id,
                                                report.reported_conversation,
                                            );
                                        }}
                                    >
                                        <span id="conversation">
                                            {_("View Reported Conversation")}
                                        </span>
                                    </div>
                                )}

                                <div className="spread">
                                    {((report.moderator &&
                                        user.is_moderator &&
                                        user.id !== report.moderator.id) ||
                                        null) && (
                                        <button className="danger xs" onClick={report.claim}>
                                            {_("Steal")}
                                        </button>
                                    )}
                                    {((!report.moderator &&
                                        report.reporting_user &&
                                        user.id === report.reporting_user.id) ||
                                        null) && (
                                        <button className="reject xs" onClick={report.cancel}>
                                            {_("Cancel")}
                                        </button>
                                    )}

                                    {((report.moderator &&
                                        user.is_moderator &&
                                        user.id === report.moderator.id) ||
                                        null) && (
                                        <button className="success xs" onClick={report.good_report}>
                                            {_("Good report")}
                                        </button>
                                    )}
                                    {((report.moderator &&
                                        user.is_moderator &&
                                        user.id === report.moderator.id) ||
                                        null) && (
                                        <button className="info xs" onClick={report.set_note}>
                                            {_("Note")}
                                        </button>
                                    )}
                                    {((report.moderator &&
                                        user.is_moderator &&
                                        user.id === report.moderator.id) ||
                                        null) && (
                                        <button className="danger xs" onClick={report.unclaim}>
                                            {_("Unclaim")}
                                        </button>
                                    )}
                                    {((report.moderator &&
                                        user.is_moderator &&
                                        user.id === report.moderator.id) ||
                                        null) && (
                                        <button className="reject xs" onClick={report.bad_report}>
                                            {_("Bad report")}
                                        </button>
                                    )}
                                </div>
                                <div className="spread">
                                    {report.reporting_user ? (
                                        <Player user={report.reporting_user} icon />
                                    ) : (
                                        <span>{_("System")}</span>
                                    )}
                                    <i>{moment(report.created).fromNow()}</i>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
