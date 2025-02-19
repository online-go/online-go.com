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
import moment from "moment";
import * as ReactSelect from "react-select";
import Select from "react-select";
import { useUser } from "@/lib/hooks";
import { report_categories, ReportType } from "@/components/Report";
import { report_manager } from "@/lib/report_manager";
import { Report } from "@/lib/report_util";
import { AutoTranslate } from "@/components/AutoTranslate";
import { interpolate, _, pgettext, llm_pgettext } from "@/lib/translate";
import { Player } from "@/components/Player";
import { Link } from "react-router-dom";
import { post } from "@/lib/requests";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { errorAlerter, ignore } from "@/lib/misc";
import { UserHistory } from "./UserHistory";
import { ReportedGame } from "./ReportedGame";
import { AppealView } from "./AppealView";
import { get } from "@/lib/requests";
import { MessageTemplate, WARNING_TEMPLATES, REPORTER_RESPONSE_TEMPLATES } from "./MessageTemplate";
import { ModerationActionSelector } from "./ModerationActionSelector";
import { openAnnulQueueModal, AnnulQueueModal } from "@/components/AnnulQueueModal";
import { ReportTypeSelector } from "./ReportTypeSelector";
import { alert } from "@/lib/swal_config";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import * as DynamicHelp from "react-dynamic-help";
import { MODERATOR_POWERS } from "@/lib/moderation";
import { KBShortcut } from "@/components/KBShortcut";
import { GobanRenderer } from "goban";
import { ReportContext } from "@/contexts/ReportContext";

interface ViewReportProps {
    reports: Report[];
    onChange: (report_id: number) => void;
    report_id: number;
}

let cached_moderators: PlayerCacheEntry[] = [];

// Used for saving updates to the report
let report_note_id = 0;
let report_note_text = "";
let report_note_update_timeout: ReturnType<typeof setTimeout> | null = null;

export function ViewReport({ report_id, reports, onChange }: ViewReportProps): React.ReactElement {
    const user = useUser();
    const [moderatorNote, setModeratorNote] = React.useState("");
    const [moderators, setModerators] = React.useState(cached_moderators);
    const [report, setReport] = React.useState<Report | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [moderator_id, setModeratorId] = React.useState<number | undefined | null>(
        report?.moderator?.id,
    );
    const [reportState, setReportState] = React.useState<any>(report?.state);
    const [isAnnulQueueModalOpen, setIsAnnulQueueModalOpen] = React.useState(false);
    const [annulQueue, setAnnulQueue] = React.useState<null | undefined | any[]>(
        report?.detected_ai_games,
    );
    const [availableActions, setAvailableActions] = React.useState<string[] | null>(null);
    const [voteCounts, setVoteCounts] = React.useState<{ [action: string]: number }>({});
    const [usersVote, setUsersVote] = React.useState<string | null>(null);
    const [currentGoban, setCurrentGoban] = React.useState<GobanRenderer | null>(null);

    const related = report_manager.getRelatedReports(report_id);

    const { registerTargetItem } = React.useContext(DynamicHelp.Api);
    const { ref: ignore_button } = registerTargetItem("ignore-button");

    const captureReport = (report: Report) => {
        setReport(report);
        setModeratorId(report?.moderator?.id);
        setReportState(report?.state);
        setAnnulQueue(report?.detected_ai_games);
        if (report?.available_actions !== null) {
            setAvailableActions(report.available_actions);
        }
        setVoteCounts(report?.vote_counts);
        setUsersVote(report?.voters?.find((v) => v.voter_id === user.id)?.action ?? null);
    };

    React.useEffect(() => {
        if (report_id) {
            // For some reason we have to capture the state of the report at the time that report_id goes valid
            // It's not clear why, but there are subsequent renders where the report state goes away, so ...
            // capture what you want to use here! ...
            report_manager
                .getReport(report_id)
                .then((report) => {
                    setError(null);
                    captureReport(report);
                })
                .catch((err) => {
                    console.error(err);
                    setError(err + "");
                });
        } else {
            setReport(null);
            setError(null);
            setModeratorId(null);
            setReportState(null);
        }
    }, [report_id]);

    React.useEffect(() => {
        const onUpdate = (r: Report) => {
            if (r.id === report?.id) {
                captureReport(r);
            }
        };
        report_manager.on("incident-report", onUpdate);
        return () => {
            report_manager.off("incident-report", onUpdate);
        };
    }, [report]);

    React.useEffect(() => {
        if (cached_moderators.length === 0 || moderators.length === 0) {
            get("players/?is_moderator=true&page_size=100")
                .then((res) => {
                    cached_moderators = res.results.sort(
                        (a: PlayerCacheEntry, b: PlayerCacheEntry) => {
                            if (a.id === user.id) {
                                return -1;
                            }
                            if (b.id === user.id) {
                                return 1;
                            }
                            return a.username!.localeCompare(b.username as string);
                        },
                    );
                    setModerators(cached_moderators);
                })
                .catch(errorAlerter);
        }
    }, []);

    React.useEffect(() => {
        setModeratorId(report?.moderator?.id);
    }, [report?.moderator?.id]);

    React.useEffect(() => {
        if (document.activeElement?.nodeName !== "TEXTAREA") {
            setModeratorNote(report?.moderator_note || "");
        }
    }, [report?.moderator_note]);

    React.useEffect(() => {
        setReportState(report?.state);
    }, [report?.state]);

    const setAndSaveModeratorNote = React.useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (!report) {
                return;
            }
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
                        post(`moderation/incident/${report.id}`, {
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
            if (!report) {
                return;
            }
            setModeratorId(id);
            post(`moderation/incident/${report.id}`, {
                id: report.id,
                action: "assign",
                moderator_id: id,
            })
                .then(ignore)
                .catch(errorAlerter);
        },
        [report],
    );

    const claimReport = () => {
        if (!report) {
            return;
        }
        if (report.moderator?.id !== user.id && user.is_moderator) {
            setReportState("claimed");
            void report_manager.claim(report.id);
        }
    };

    const nav_prev = React.useCallback(() => {
        if (!currentGoban) {
            return;
        }
        currentGoban.showPrevious();
        currentGoban.syncReviewMove();
    }, [currentGoban]);

    const nav_next = React.useCallback(() => {
        if (!currentGoban) {
            return;
        }
        currentGoban.showNext();
        currentGoban.syncReviewMove();
    }, [currentGoban]);

    if (!report || report_id === 0) {
        return (
            <div id="ViewReport">
                <div className="no-report-selected">All done!</div>
            </div>
        );
    }

    if (error) {
        return (
            <div id="ViewReport">
                <div className="error">{error}</div>
            </div>
        );
    }

    const category = report_categories.find((c) => c.type === report.report_type);
    const claimed_by_me = report.moderator?.id === user.id;
    const report_in_reports = reports.find((r) => r.id === report.id);
    let next_report: Report | null = null;
    let prev_report: Report | null = null;
    for (let i = 0; i < reports.length; i++) {
        if (reports[i].id === report.id) {
            if (i + 1 < reports.length) {
                next_report = reports[i + 1];
            }
            if (i - 1 >= 0) {
                prev_report = reports[i - 1];
            }
            break;
        }
    }

    const next = () => {
        if (next_report) {
            onChange(next_report.id);
        } else {
            onChange(0);
        }
    };

    const prev = () => {
        if (prev_report) {
            onChange(prev_report.id);
        }
    };

    const handleCloseAnnulQueueModal = () => {
        setIsAnnulQueueModalOpen(false);
    };

    const changeReportType = (new_type: ReportType) => {
        alert
            .fire({
                text: interpolate(
                    pgettext(
                        "Confirmation dialog",
                        "Just checking: change the report type from {{report_type}} to {{new_type}}?",
                    ),
                    { report_type: report.report_type, new_type },
                ),
                confirmButtonText: _("Yes"),
                cancelButtonText: _("No"),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: yes }) => {
                if (yes) {
                    setReport({ ...report, retyped: true }); // this disables the selector on this page for this report, while action happens...
                    post(`moderation/incident/${report.id}`, {
                        id: report.id,
                        action: "retype",
                        new_type: new_type,
                    })
                        .then((_res) => {
                            // We need to move on to the next report, because this one is getting updated in the
                            // back end, and we'll get it back via that route, not by directly manipulating it here.
                            next();
                        })
                        .catch(errorAlerter);
                }
            })
            .catch(errorAlerter);
    };

    return (
        <div>
            <KBShortcut shortcut="left" action={nav_prev} />
            <KBShortcut shortcut="right" action={nav_next} />

            <ReportContext.Provider
                value={{
                    reporter: report.reporting_user,
                    reported: report.reported_user,
                    moderator_powers: user.moderator_powers,
                }}
            >
                <div id="ViewReport" className="show-players-in-report">
                    {isAnnulQueueModalOpen && (
                        <AnnulQueueModal
                            annulQueue={annulQueue ?? []}
                            setAnnulQueue={setAnnulQueue}
                            onClose={handleCloseAnnulQueueModal}
                            forDetectedAI={true}
                            player={report.reported_user}
                        />
                    )}
                    <div className="view-report-header">
                        {report_in_reports ? (
                            <Select
                                id="ReportsCenterSelectReport"
                                className="reports-center-category-option-select"
                                classNamePrefix="ogs-react-select"
                                value={reports.filter((r) => r.id === report.id)[0]}
                                getOptionValue={(r) => r.id.toString()}
                                onChange={(r: ReactSelect.SingleValue<Report>) =>
                                    r && onChange(r.id)
                                }
                                options={reports}
                                isClearable={false}
                                isSearchable={false}
                                blurInputOnSelect={true}
                                components={{
                                    Option: ({
                                        innerRef,
                                        innerProps,
                                        isFocused,
                                        isSelected,
                                        data,
                                    }) => (
                                        <div
                                            ref={innerRef}
                                            {...innerProps}
                                            className={
                                                "reports-center-selected-report" +
                                                (isFocused ? "focused " : "") +
                                                (isSelected ? "selected" : "")
                                            }
                                        >
                                            {R(data.id)}
                                        </div>
                                    ),
                                    SingleValue: ({ innerProps, data }) => (
                                        <span
                                            {...innerProps}
                                            className="reports-center-selected-report"
                                        >
                                            {R(data.id)}
                                        </span>
                                    ),
                                    ValueContainer: ({ children }) => (
                                        <div className="reports-center-selected-report-container">
                                            {children}
                                        </div>
                                    ),
                                }}
                            />
                        ) : (
                            <span className="historical-report-number">{R(report.id)}</span>
                        )}
                        {(user.is_moderator || null) && (
                            <span className="moderator">
                                <Select
                                    id="ReportsCenterSelectModerator"
                                    className="reports-center-category-option-select"
                                    classNamePrefix="ogs-react-select"
                                    value={moderators.filter((m: any) => m.id === moderator_id)[0]}
                                    getOptionValue={(data) => data.type}
                                    onChange={(m: any) => assignToModerator(m.id)}
                                    options={moderators}
                                    isClearable={false}
                                    isSearchable={false}
                                    blurInputOnSelect={true}
                                    placeholder={"Moderator.."}
                                    components={{
                                        Option: ({
                                            innerRef,
                                            innerProps,
                                            isFocused,
                                            isSelected,
                                            data,
                                        }) => (
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
                                            <span
                                                {...innerProps}
                                                className="reports-center-assigned-moderator"
                                            >
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
                            </span>
                        )}
                        <span>
                            <button
                                className={"default" + (prev_report ? "" : " hide")}
                                onClick={prev}
                            >
                                &lt; Prev
                            </button>

                            <button
                                className={"default" + (next_report ? "" : " hide")}
                                onClick={next}
                            >
                                Next &gt;
                            </button>

                            {(user.is_moderator || null) &&
                                (report.moderator ? (
                                    <>
                                        {(report.moderator.id === user.id || null) && (
                                            <button
                                                className="danger xs"
                                                onClick={() => {
                                                    setReportState(
                                                        report?.moderator ? "claimed" : "pending",
                                                    );
                                                    void report_manager.unclaim(report.id);
                                                }}
                                            >
                                                {_("Unclaim")}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button className="primary" onClick={claimReport}>
                                        {_("Claim")}
                                    </button>
                                ))}
                            {!claimed_by_me && (
                                <button
                                    className="default"
                                    ref={ignore_button}
                                    onClick={() => {
                                        report_manager.ignore(report.id);
                                        next();
                                    }}
                                >
                                    Ignore
                                </button>
                            )}
                        </span>
                    </div>
                    <div className="reported-user">
                        <h3 className="users-header">
                            <div className="reported-user">
                                <ReportTypeSelector
                                    current_type={category?.type}
                                    lock={report.retyped}
                                    onUpdate={changeReportType}
                                />
                                <span>
                                    {pgettext(
                                        "This is a header saying who is reported - 'offence by <Player>'",
                                        "by",
                                    )}
                                    <Player user={report.reported_user} />
                                </span>
                            </div>
                            <div>
                                <span className="reporting-user">
                                    {pgettext(
                                        "A label for the user name that reported an incident (followed by colon and the username)",
                                        "Reported by",
                                    )}
                                    :
                                    {report.reporting_user ? (
                                        <Player user={report.reporting_user} />
                                    ) : (
                                        "System"
                                    )}
                                    <span className="when">{moment(report.created).fromNow()}</span>
                                </span>
                            </div>
                        </h3>
                    </div>
                    <div className="notes-container">
                        <div className="notes">
                            <h4>Reporter Notes</h4>
                            <div className="Card">
                                {(report.reporter_note || null) &&
                                    (report.reporter_note_translation ? (
                                        <>
                                            {report.reporter_note_translation.source_text}
                                            {(report.reporter_note_translation.target_language !==
                                                report.reporter_note_translation.source_language ||
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
                                    ))}
                            </div>
                        </div>

                        {(report.system_note || null) && (
                            <div className="notes">
                                <h4>System Notes</h4>
                                <div className="Card">{report.system_note}</div>
                            </div>
                        )}

                        {(user.is_moderator || null) && (
                            <div className="notes">
                                <h4>Moderator Notes</h4>
                                <textarea
                                    value={moderatorNote}
                                    onChange={setAndSaveModeratorNote}
                                />
                            </div>
                        )}

                        {report.escalated &&
                            (user.is_moderator ||
                                user.moderator_powers & MODERATOR_POWERS.SUSPEND) && (
                                <div className="notes">
                                    <h4>Escalator's note:</h4>
                                    <div className="Card">
                                        {report.escalation_note || "(none provided)"}
                                    </div>
                                </div>
                            )}

                        {!user.is_moderator && user.moderator_powers && (
                            <div className="voting">
                                <ModerationActionSelector
                                    available_actions={availableActions ?? []}
                                    vote_counts={voteCounts}
                                    users_vote={usersVote}
                                    submit={(action, note, dissenter_note) => {
                                        void report_manager
                                            .vote(report.id, action, note, dissenter_note)
                                            .then(() => next());
                                    }}
                                    enable={
                                        report.state === "pending" &&
                                        (!report.escalated ||
                                            !!(user.moderator_powers & MODERATOR_POWERS.SUSPEND))
                                    }
                                    key={report.id}
                                    report={report}
                                />
                                {report.dissenter_note && (
                                    <div className="notes">
                                        <h4>
                                            {llm_pgettext(
                                                "Heading for a paragraph",
                                                "Dissenting voter notes:",
                                            )}
                                        </h4>
                                        <div className="Card">{report.dissenter_note}</div>
                                    </div>
                                )}
                            </div>
                        )}
                        {report.dissenter_note && user.is_moderator && (
                            <div className="notes">
                                <h4>
                                    {llm_pgettext(
                                        "Heading for a paragraph",
                                        "Dissenting voter notes:",
                                    )}
                                </h4>
                                <div className="Card">{report.dissenter_note}</div>
                            </div>
                        )}
                    </div>

                    <div className="actions">
                        <div className="related-reports">
                            {related.length > 0 && (
                                <>
                                    <h4>{_("Related Reports")}</h4>
                                    <ul>
                                        {related.map((r) => (
                                            <li key={r.report.id}>
                                                <Link to={`/reports-center/all/${r.report.id}`}>
                                                    {R(r.report.id)}: {r.relationship}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                            {user.is_moderator && (
                                <>
                                    {report.voters?.length > 0 && (
                                        <div className="voters">
                                            <h4>{_("Voters:")}</h4>
                                            <ul>
                                                {report.voters?.map((vote) => (
                                                    <li key={vote.voter_id}>
                                                        <Player user={vote.voter_id} />:{" "}
                                                        {vote.action}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {user.is_moderator && (
                            <div className="actions-right">
                                {reportState !== "resolved" &&
                                report.detected_ai_games?.length > 0 ? (
                                    <button
                                        onClick={() =>
                                            openAnnulQueueModal(setIsAnnulQueueModalOpen)
                                        }
                                    >
                                        Inspect & Annul Games
                                    </button>
                                ) : null}
                                {reportState !== "resolved" && claimed_by_me && (
                                    <button
                                        className="success"
                                        onClick={() => {
                                            void report_manager.good_report(report.id);
                                            next();
                                        }}
                                    >
                                        Close as good report
                                    </button>
                                )}

                                {reportState !== "resolved" && claimed_by_me && (
                                    <button
                                        className="reject"
                                        onClick={() => {
                                            void report_manager.bad_report(report.id);
                                            next();
                                        }}
                                    >
                                        Close as bad report
                                    </button>
                                )}

                                {reportState === "resolved" && (
                                    <button
                                        className="default"
                                        onClick={() => void report_manager.reopen(report.id)}
                                    >
                                        Re-open
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    {user.is_moderator && (
                        <>
                            <hr />
                            <div className="message-templates">
                                <MessageTemplate
                                    title="Accused"
                                    player={report.reported_user}
                                    reported={report.reported_user}
                                    templates={WARNING_TEMPLATES}
                                    game_id={report.reported_game}
                                    gpt={report.automod_to_reported ?? null}
                                    logByDefault={true}
                                    onSelect={claimReport}
                                    onMessage={claimReport}
                                />

                                {report.reporting_user && (
                                    <MessageTemplate
                                        title="Reporter"
                                        player={report.reporting_user}
                                        reported={report.reported_user}
                                        templates={REPORTER_RESPONSE_TEMPLATES}
                                        game_id={report.reported_game}
                                        gpt={report.automod_to_reporter ?? null}
                                        logByDefault={!user.is_moderator} // log community moderator actions
                                        onSelect={claimReport}
                                        onMessage={claimReport}
                                    />
                                )}
                            </div>
                            <hr />
                        </>
                    )}
                    <UserHistory target_user={report.reported_user} />
                    <ErrorBoundary>
                        <hr />
                        {(report.url || null) && (
                            <a href={report.url} target="_blank">
                                {report.url}
                            </a>
                        )}
                        {report.reported_game && (
                            <ReportedGame
                                game_id={report.reported_game}
                                reported_at={report.reported_game_move}
                                reported_by={report.reporting_user.id}
                                onGobanCreated={setCurrentGoban}
                            />
                        )}
                        {report.report_type === "appeal" && (
                            <AppealView user_id={report.reported_user.id} />
                        )}
                        {report.reported_review && (
                            <span>
                                {_("Review")}:{" "}
                                <Link to={`/review/${report.reported_review}`}>
                                    ##{report.reported_review}
                                </Link>
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
                    </ErrorBoundary>
                </div>
            </ReportContext.Provider>
        </div>
    );
}

function R(id: number): string {
    return "R" + `${id}`.slice(-3);
}
