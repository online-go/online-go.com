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
import Select from "react-select";
import { useUser } from "hooks";
import { report_categories } from "Report";
import { Report } from "report_manager";
import { AutoTranslate } from "AutoTranslate";
import { _ } from "translate";
import { Player } from "Player";
import { Link } from "react-router-dom";
import { post } from "requests";
import { errorAlerter, ignore } from "misc";
import { UserHistory } from "./UserHistory";
import { ReportedGame } from "./ReportedGame";
import { AppealView } from "./AppealView";
import { get } from "requests";

// Used for saving updates to the report
let report_note_id = 0;
let report_note_text = "";
let report_note_update_timeout = null;

interface SelectedReportProps {
    reports: Report[];
    onChange: (report: Report) => void;
    report: Report;
}

export function SelectedReport({ report, reports, onChange }: SelectedReportProps): JSX.Element {
    const user = useUser();
    const [moderatorNote, setModeratorNote] = React.useState("");
    const [moderators, setModerators] = React.useState([]);
    const [moderator_id, setModeratorId] = React.useState(report?.moderator?.id);

    React.useEffect(() => {
        get("players/?is_moderator=true&page_size=100")
            .then((res) => {
                console.log("mods: ", res.results);
                setModerators(res.results);
            })
            .catch(errorAlerter);
    }, []);

    React.useEffect(() => {
        setModeratorId(report?.moderator?.id);
    }, [report, report?.moderator?.id]);

    React.useEffect(() => {
        if (document.activeElement.nodeName !== "TEXTAREA") {
            setModeratorNote(report?.moderator_note || "");
        }
    }, [report]);

    const setAndSaveModeratorNote = React.useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setModeratorNote(event.target.value);

            if (report_note_id !== 0 && report_note_id !== report.id) {
                window.alert(
                    "Hold your horses, already saving an update, though you should never see this contact anoek",
                );
            } else {
                report_note_id = report.id;
                report_note_text = event.target.value;

                if (!report_note_update_timeout) {
                    report_note_update_timeout = setTimeout(() => {
                        post("moderation/incident/%%", report.id, {
                            id: report.id,
                            action: "note",
                            note: report_note_text,
                        })
                            .then(ignore)
                            .catch(errorAlerter);
                        report_note_id = 0;
                        report_note_text = "";
                        report_note_update_timeout = null;
                    }, 250);
                }
            }
        },
        [report],
    );

    const assignToModerator = React.useCallback(
        (id: number) => {
            setModeratorId(id);
            post("moderation/incident/%%", report.id, {
                id: report.id,
                action: "assign",
                moderator_id: id,
            })
                .then(ignore)
                .catch(errorAlerter);
        },
        [report],
    );

    if (!report) {
        return <div id="SelectedReport" />;
    }

    const category = report_categories.find((c) => c.type === report.report_type);

    return (
        <div id="SelectedReport">
            <div className="header">
                <Select
                    id="ReportsCenterSelectReport"
                    className="reports-center-category-option-select"
                    classNamePrefix="ogs-react-select"
                    value={reports.filter((r) => r.id === report.id)[0]}
                    getOptionValue={(r) => r.id.toString()}
                    onChange={(r: Report) => onChange(r)}
                    options={reports}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                            <div
                                ref={innerRef}
                                {...innerProps}
                                className={
                                    "reports-center-selected-report" +
                                    (isFocused ? "focused " : "") +
                                    (isSelected ? "selected" : "")
                                }
                            >
                                {"R" + `${data.id}`.slice(-3)}
                            </div>
                        ),
                        SingleValue: ({ innerProps, data }) => (
                            <span {...innerProps} className="reports-center-selected-report">
                                {"R" + `${data.id}`.slice(-3)}
                            </span>
                        ),
                        ValueContainer: ({ children }) => (
                            <div className="reports-center-selected-report-container">
                                {children}
                            </div>
                        ),
                    }}
                />

                <span className="moderator">
                    <Select
                        id="ReportsCenterSelectModerator"
                        className="reports-center-category-option-select"
                        classNamePrefix="ogs-react-select"
                        value={moderators.filter((m) => m.id === moderator_id)[0]}
                        getOptionValue={(data) => data.type}
                        onChange={(m: any) => assignToModerator(m.id)}
                        options={moderators}
                        isClearable={false}
                        isSearchable={false}
                        blurInputOnSelect={true}
                        placeholder={"Moderator.."}
                        components={{
                            Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                                <div
                                    ref={innerRef}
                                    {...innerProps}
                                    className={
                                        "reports-center-assigned-moderator" +
                                        (isFocused ? "focused " : "") +
                                        (isSelected ? "selected" : "")
                                    }
                                >
                                    {data.username}
                                </div>
                            ),
                            SingleValue: ({ innerProps, data }) => (
                                <span {...innerProps} className="reports-center-assigned-moderator">
                                    {data.username}
                                </span>
                            ),
                            ValueContainer: ({ children }) => (
                                <div className="reports-center-assigned-moderator-container">
                                    {children}
                                </div>
                            ),
                        }}
                    />

                    {report.moderator ? (
                        <>
                            {(report.moderator.id === user.id || null) && (
                                <button className="danger xs" onClick={report.unclaim}>
                                    {_("Unclaim")}
                                </button>
                            )}
                        </>
                    ) : (
                        <button className="primary xs" onClick={report.claim}>
                            {_("Claim")}
                        </button>
                    )}
                </span>
            </div>

            <div className="reported-user">
                <h3 className="users">
                    <span className="reported-user">
                        {_("Reported User")}: <Player user={report.reported_user} />
                    </span>
                    <span className="reporting-user">
                        {_("Reporting User")}: <Player user={report.reporting_user} />
                    </span>
                </h3>
            </div>

            <h3>Incident Type: {category?.title}</h3>

            <div className="notes-container">
                {(report.reporter_note || null) && (
                    <div className="notes">
                        <h3>Reporter Notes</h3>
                        <div className="Card">
                            {report.reporter_note_translation ? (
                                <>
                                    {report.reporter_note_translation.source_text}
                                    {(report.reporter_note_translation.target_language !==
                                        report.reporter_note_translation.source_language ||
                                        null) && (
                                        <>
                                            <div className="source-to-target-languages">
                                                {report.reporter_note_translation.source_language}{" "}
                                                =&gt;{" "}
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
                        </div>
                    </div>
                )}

                {(report.system_note || null) && (
                    <div className="notes">
                        <h3>System Notes</h3>
                        <div className="Card">{report.system_note}</div>
                    </div>
                )}

                {(user.is_moderator || null) && (
                    <div className="notes">
                        <h3>Moderator Notes</h3>
                        <textarea value={moderatorNote} onChange={setAndSaveModeratorNote} />
                    </div>
                )}
            </div>

            <div className="actions">
                <button className="success" onClick={report.good_report}>
                    Close as good report
                </button>

                <button className="reject" onClick={report.bad_report}>
                    Close as bad report
                </button>
            </div>

            <hr />

            {(report.url || null) && (
                <a href={report.url} target="_blank">
                    {report.url}
                </a>
            )}

            {report.reported_game && <ReportedGame game_id={report.reported_game} />}

            {report.report_type === "appeal" && <AppealView user_id={report.reported_user.id} />}

            {report.reported_review && (
                <span>
                    {_("Review")}:{" "}
                    <Link to={`/review/${report.reported_review}`}>##{report.reported_review}</Link>
                </span>
            )}

            {report.reported_conversation && (
                <div className="reported-conversation">
                    {report.reported_conversation.content.map((line, index) => (
                        <div className="chatline" key={index}>
                            {line}
                        </div>
                    ))}
                </div>
            )}

            <hr />

            <UserHistory user={report.reported_user} />
        </div>
    );
}
