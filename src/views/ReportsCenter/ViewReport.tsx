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
import Select from "react-select";

import { useUser } from "@/lib/hooks";
import { report_categories, ReportType } from "@/components/Report";
import { report_manager } from "@/lib/report_manager";
import { ReportNotification } from "@/lib/report_util";
import { AutoTranslate } from "@/components/AutoTranslate";
import { interpolate, _, pgettext, llm_pgettext } from "@/lib/translate";
import { Player } from "@/components/Player";
import { Link } from "react-router-dom";
import { post, get } from "@/lib/requests";
import { errorAlerter, ignore } from "@/lib/misc";
import { UserHistory } from "./UserHistory";
import { ReportedGame } from "./ReportedGame";
import { AppealView } from "./AppealView";
import { MessageTemplate, WARNING_TEMPLATES, REPORTER_RESPONSE_TEMPLATES } from "./MessageTemplate";
import { ModerationActionSelector } from "./ModerationActionSelector";
import { openAnnulQueueModal, AnnulQueueModal } from "@/components/AnnulQueueModal";
import { ReportTypeSelector } from "./ReportTypeSelector";
import { alert } from "@/lib/swal_config";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { MODERATOR_POWERS } from "@/lib/moderation";
import { KBShortcut } from "@/components/KBShortcut";
import { GobanRenderer } from "goban";
import { ReportContext } from "@/contexts/ReportContext";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { useEffect } from "react";

type ReportDetail = rest_api.moderation.ReportDetail;
type CommunityModerationAction = rest_api.moderation.CommunityModerationAction;

export type ReportState = "resolved" | "pending" | "claimed"; // SeverToClient.ts

interface ViewReportProps {
    report_id: number;
    advanceToNextReport: () => void;
    onReportState: (report_state: ReportState) => void;
}

export function ViewReport({
    report_id,
    advanceToNextReport,
    onReportState,
}: ViewReportProps): React.ReactElement {
    const user = useUser();
    const [report, setReport] = React.useState<ReportDetail | null>(null);
    const [usersVote, setUsersVote] = React.useState<CommunityModerationAction | null>(null);
    const [isAnnulQueueModalOpen, setIsAnnulQueueModalOpen] = React.useState(false);
    const [annulQueue, setAnnulQueue] = React.useState<null | undefined | any[]>(
        report?.detected_ai_games,
    );
    const [currentGoban, setCurrentGoban] = React.useState<GobanRenderer | null>(null);
    const [moderators, setModerators] = React.useState<PlayerCacheEntry[]>([]);

    // Although moderator_id is a field on the report, we control the value we're using
    // to display separately so we can update it without having to wait for the report to update
    // when the user changes it.
    const [moderator_id, setModeratorId] = React.useState<number | undefined | null>(null);

    const related = report_manager.getRelatedReports(report_id);

    const [modNoteNeedsSave, setHasUnsavedChanges] = React.useState(false);

    const [newModeratorNote, setNewModeratorNote] = React.useState("");

    const saveModeratorNote = () => {
        if (!report) {
            return;
        }
        post(`moderation/incident/${report.id}`, {
            id: report.id,
            action: "note",
            note: newModeratorNote.trim(),
        })
            .then(() => {
                setHasUnsavedChanges(false);
                setNewModeratorNote("");
            })
            .catch(errorAlerter);
    };

    const updateReportState = (report: ReportDetail) => {
        setReport(report);
        setUsersVote(report?.voters?.find((v) => v.voter_id === user.id)?.action ?? null);
        setModeratorId(report?.moderator?.id ?? null);
        onReportState(report.state as ReportState);
    };

    const fetchAndUpdateReport = async (reportId: number) => {
        try {
            const report = await report_manager.getReportDetails(reportId);
            updateReportState(report);
        } catch (error) {
            errorAlerter(error);
        }
    };

    useEffect(() => {
        if (report_id === 0) {
            return;
        }

        void fetchAndUpdateReport(report_id);

        const onUpdate = async (r: ReportNotification) => {
            if (r.id === report_id) {
                await fetchAndUpdateReport(report_id);
            }
        };

        report_manager.on("incident-report", onUpdate);

        return () => {
            report_manager.off("incident-report", onUpdate);
        };
    }, [report_id]);

    React.useEffect(() => {
        if (moderators.length === 0) {
            get("players/?is_moderator=true&page_size=100")
                .then((res) => {
                    setModerators(
                        res.results.sort((a: PlayerCacheEntry, b: PlayerCacheEntry) =>
                            a.username!.localeCompare(b.username as string),
                        ),
                    );
                })
                .catch(errorAlerter);
        }
    }, []);

    const claimReport = () => {
        if (!report) {
            return;
        }
        if (report.moderator?.id !== user.id && user.is_moderator) {
            report.state = "claimed";
            report_manager
                .claim(report.id)
                .then(() => {
                    setModeratorId(user.id ?? null);
                })
                .catch(errorAlerter);
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

    const category = report_categories.find((c) => c.type === report.report_type);
    const claimed_by_me = report.moderator?.id === user.id;

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
                            advanceToNextReport();
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
                    white_player: report.reported_game_white,
                    black_player: report.reported_game_black,
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
                    <div className="users-header">
                        <div className="users-header-left">
                            <h3 className="reported-user">
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
                                    {report.reported_is_banned && (
                                        <span className="reported-user-banned">
                                            {_("suspended account")}
                                        </span>
                                    )}
                                </span>
                            </h3>
                        </div>
                        <div className="users-header-right">
                            {(user.is_moderator || null) && (
                                <div className="moderator-selector">
                                    <span>Moderator:</span>
                                    <Select
                                        id="ViewReportSelectModerator"
                                        className="reports-center-category-option-select"
                                        classNamePrefix="ogs-react-select"
                                        value={
                                            moderator_id
                                                ? moderators.find((m) => m.id === moderator_id)
                                                : null
                                        }
                                        getOptionValue={(data) => data.id.toString()}
                                        onChange={(m: any) => {
                                            setModeratorId(m.id);
                                            post(`moderation/incident/${report.id}`, {
                                                id: report.id,
                                                action: "assign",
                                                moderator_id: m.id,
                                            })
                                                .then(ignore)
                                                .catch(errorAlerter);
                                        }}
                                        options={moderators}
                                        isClearable={false}
                                        isSearchable={false}
                                        blurInputOnSelect={true}
                                        placeholder={"Moderator..."}
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
                                </div>
                            )}

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
                                <h4>
                                    Moderator Notes{" "}
                                    {modNoteNeedsSave && (
                                        <button
                                            className="success mod-note-save"
                                            onClick={saveModeratorNote}
                                        >
                                            {_("Save")}
                                        </button>
                                    )}
                                </h4>
                                <div className="Card">{report.moderator_note}</div>

                                <textarea
                                    className="new-mod-note"
                                    value={newModeratorNote}
                                    onChange={(e) => {
                                        setNewModeratorNote(e.target.value);
                                        setHasUnsavedChanges(e.target.value !== "");
                                    }}
                                />
                            </div>
                        )}

                        {report.escalated &&
                            (user.is_moderator ||
                                (user.moderator_powers & MODERATOR_POWERS.SUSPEND) !== 0) && (
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
                                    available_actions={report.available_actions ?? []}
                                    vote_counts={report.vote_counts ?? []}
                                    users_vote={usersVote}
                                    submit={(action, note, dissenter_note, voter_note) => {
                                        void report_manager
                                            .vote(
                                                report.id,
                                                action,
                                                note,
                                                dissenter_note,
                                                voter_note,
                                            )
                                            .then(() => advanceToNextReport());
                                    }}
                                    enable={
                                        report.state === "pending" &&
                                        ((!report.escalated &&
                                            (report.report_type !== "ai_use" ||
                                                (user.moderator_powers &
                                                    MODERATOR_POWERS.AI_DETECTOR) !==
                                                    0)) ||
                                            (!!(user.moderator_powers & MODERATOR_POWERS.SUSPEND) &&
                                                report.report_type !== "ai_use"))
                                    }
                                    key={report.id}
                                    report={report}
                                />
                                {report.dissenter_note && (
                                    <div className="notes">
                                        <h4>
                                            {llm_pgettext(
                                                "Heading for a paragraph",
                                                "Dissenting voter notes",
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
                                        "Heading the section containing notes from dissenting voters",
                                        "Dissenting voter notes",
                                    )}
                                </h4>
                                <div className="Card">{report.dissenter_note}</div>
                            </div>
                        )}
                        {report.voter_notes.length > 0 &&
                            (user.is_moderator || user.moderator_powers) && (
                                <div className="notes">
                                    <h4>
                                        {llm_pgettext(
                                            "Heading for the section containing notes from Dan CMs",
                                            // Note that technically anything could be in voter notes,
                                            // but at the moment we're only using it for Dan CM notes
                                            "Dan CM assessment",
                                        )}
                                    </h4>
                                    <div className="Card">
                                        {report.voter_notes.map((voter_note, index) => (
                                            <div key={voter_note.voter_id}>
                                                {user.is_moderator && (
                                                    <span>
                                                        <Player user={voter_note.voter_id} />
                                                    </span>
                                                )}
                                                {voter_note.voter_note}
                                                {index < report.voter_notes.length - 1 && <hr />}
                                            </div>
                                        ))}
                                    </div>
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
                                {report.state !== "resolved" &&
                                report.detected_ai_games?.length > 0 ? (
                                    <button
                                        onClick={() =>
                                            openAnnulQueueModal(setIsAnnulQueueModalOpen)
                                        }
                                    >
                                        Inspect & Annul Games
                                    </button>
                                ) : null}
                                {report.state !== "resolved" && claimed_by_me && (
                                    <button
                                        className="success"
                                        onClick={() => {
                                            void report_manager.good_report(report.id);
                                            advanceToNextReport();
                                        }}
                                    >
                                        Close as good report
                                    </button>
                                )}

                                {report.state !== "resolved" && claimed_by_me && (
                                    <button
                                        className="reject"
                                        onClick={() => {
                                            void report_manager.bad_report(report.id);
                                            advanceToNextReport();
                                        }}
                                    >
                                        Close as bad report
                                    </button>
                                )}

                                {report.state === "resolved" && (
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
                                {report.reported_conversation.content.map(
                                    (line: string, index: number) => (
                                        <div className="chatline" key={index}>
                                            {line}
                                        </div>
                                    ),
                                )}
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
