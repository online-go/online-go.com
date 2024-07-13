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
 * which is used by our IncidentReportTracker widget and our ReportsCenter view.
 */

import * as React from "react";

import * as moment from "moment";

import { Link } from "react-router-dom";

import { _ } from "translate";

import { Player } from "Player";

import { AutoTranslate } from "AutoTranslate";
import { Report } from "report_util";
import { useUser } from "hooks";
import { report_categories } from "Report";
import { openReportedConversationModal } from "ReportedConversationModal";

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
    index: number;
    first_report_button: React.RefObject<HTMLDivElement>;
    reportButtonClicked: (id: number) => void;
}

export function IncidentReportCard({
    report,
    index,
    first_report_button,
    reportButtonClicked,
}: IncidentReportCardProps): JSX.Element {
    const user = useUser();
    return (
        <div className="incident" key={report.id}>
            <div className="report-header">
                <div className="report-id" ref={index === 0 ? first_report_button : null}>
                    <button onClick={() => reportButtonClicked(report.id)} className="small">
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
            {report.reporter_note && (
                <h4 className="notes">
                    {report.reporter_note_translation ? (
                        <>
                            {report.reporter_note_translation.source_text}
                            {report.reporter_note_translation.target_language !==
                                report.reporter_note_translation.source_language && (
                                <>
                                    <div className="source-to-target-languages">
                                        {report.reporter_note_translation.source_language} =&gt;{" "}
                                        {report.reporter_note_translation.target_language}
                                    </div>
                                    <div className="translated">
                                        {report.reporter_note_translation.target_text}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <AutoTranslate source={report.reporter_note} />
                    )}
                </h4>
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
                    <span>
                        {_("Reported user")}: <Player user={report.reported_user} icon />
                    </span>
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
