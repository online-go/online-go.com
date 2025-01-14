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

/*
 * This file contains the incident report tracking and management system
 * which is used by our IncidentReportIndicator widget and our ReportsCenter view.
 */

import * as React from "react";

import moment from "moment";
import { post } from "@/lib/requests";

import { Link } from "react-router-dom";

import { _ } from "@/lib/translate";

import { Player } from "@/components/Player";

import { errorAlerter } from "@/lib/misc";
import { AutoTranslate } from "@/components/AutoTranslate";
import { Report } from "@/lib/report_util";
import { useUser } from "@/lib/hooks";
import { report_categories } from "@/components/Report";
import { openReportedConversationModal } from "@/components/ReportedConversationModal";

function getReportType(report: Report): string {
    if (report.report_type === "appeal") {
        return "Ban Appeal";
    }

    const report_category = report_categories.filter((r) => r.type === report.report_type)[0];
    const report_type_title = report_category?.title || "Other";
    return report_type_title;
}

interface IncidentReportCardProps {
    report: Report;
}

export function IncidentReportCard({ report }: IncidentReportCardProps): React.ReactElement {
    const user = useUser();
    const [reporterNote, setReporterNote] = React.useState(report.reporter_note || "");
    const [isEditing, setIsEditing] = React.useState(false);

    const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setReporterNote(event.target.value);
    };

    const handleNoteSubmit = async () => {
        try {
            post(`moderation/incident/${report.id}`, {
                id: report.id,
                action: "update_note",
                reporter_note: reporterNote,
            })
                .then(() => {
                    setIsEditing(false);
                })
                .catch(errorAlerter);
        } catch (error) {
            errorAlerter(error);
        }
    };

    return (
        <div className="incident" key={report.id}>
            <div className="report-header">
                <div className="report-id">
                    <button className="small inactive">
                        {"R" + report.id.toString().slice(-3)}
                    </button>
                </div>
                {getReportType(report)}
                {!report.moderator && user.is_moderator && (
                    <button className="primary xs" onClick={report.claim}>
                        {_("Claim")}
                    </button>
                )}
                {user.is_moderator && report.moderator && <Player user={report.moderator} icon />}
            </div>
            {isEditing ? (
                <div className="edit-notes">
                    <textarea
                        value={reporterNote}
                        onChange={handleNoteChange}
                        placeholder={_("Provide details here")}
                    />
                    <div className="edit-buttons">
                        <button className="primary" onClick={handleNoteSubmit}>
                            {_("Update")}
                        </button>
                        <button onClick={() => setIsEditing(false)}>{_("Cancel")}</button>
                    </div>
                </div>
            ) : (
                <div className="note-container">
                    <h4 className="notes">
                        {report.reporter_note_translation?.target_text ? (
                            <>
                                {report.reporter_note_translation.source_text}
                                {report.reporter_note_translation.target_language !==
                                    report.reporter_note_translation.source_language && (
                                    <>
                                        <div className="source-to-target-languages">
                                            {report.reporter_note_translation.source_language} =&gt;
                                            {report.reporter_note_translation.target_language}
                                        </div>
                                        <div className="translated">
                                            {report.reporter_note_translation.target_text}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <AutoTranslate
                                source={report.reporter_note}
                                placeholder="Provide details here"
                            />
                        )}
                    </h4>
                    <i className="fa fa-pencil-square-o" onClick={() => setIsEditing(true)}></i>
                </div>
            )}

            {report.system_note && <h4 className="notes">{report.system_note}</h4>}

            <div className="notes">
                <i>{user.is_moderator ? report.moderator_note || "" : ""}</i>
            </div>

            <div className="spread">
                {report.url && (
                    <a href={report.url} target="_blank">
                        {report.url}
                    </a>
                )}

                {report.reported_user && (
                    <div className="reported-user">
                        <span className="reported-user-label">{_("Reported user")}: </span>
                        <Player user={report.reported_user} icon />
                    </div>
                )}
                {report.reported_game && (
                    <span>
                        {_("Game")}:{" "}
                        <Link to={`/game/${report.reported_game}`}>#{report.reported_game}</Link>
                    </span>
                )}
                {report.reported_review && (
                    <span>
                        {_("Review")}:{" "}
                        <Link to={`/review/${report.reported_review}`}>
                            ##{report.reported_review}
                        </Link>
                    </span>
                )}
            </div>

            {report.report_type === "appeal" && (
                <h3>
                    <Link to={`/appeal/${report.reported_user?.id}`}>View Appeal</Link>
                </h3>
            )}

            {report.reported_conversation && (
                <div
                    className="spread"
                    onClick={() => {
                        openReportedConversationModal(
                            report.reported_user?.id,
                            report.reported_conversation,
                        );
                    }}
                >
                    <span id="conversation">{_("View Reported Conversation")}</span>
                </div>
            )}

            <div className="spread">
                {report.moderator && user.is_moderator && user.id !== report.moderator.id && (
                    <button className="danger xs" onClick={report.steal}>
                        {_("Steal")}
                    </button>
                )}
                {!report.moderator &&
                    report.reporting_user &&
                    user.id === report.reporting_user.id && (
                        <button className="reject xs" onClick={report.cancel}>
                            {_("Cancel")}
                        </button>
                    )}
                {report.moderator && user.is_moderator && user.id === report.moderator.id && (
                    <>
                        <button className="success xs" onClick={report.good_report}>
                            {_("Good report")}
                        </button>
                        <button className="info xs" onClick={report.set_note}>
                            {_("Note")}
                        </button>
                        <button className="danger xs" onClick={report.unclaim}>
                            {_("Unclaim")}
                        </button>
                        <button className="reject xs" onClick={report.bad_report}>
                            {_("Bad report")}
                        </button>
                    </>
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
    );
}
