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
import * as moment from "moment";
import { useUser, useRefresh } from "hooks";
import { report_categories, ReportDescription } from "Report";
import { report_manager, Report } from "report_manager";
import Select from "react-select";
import { AutoTranslate } from "AutoTranslate";
import { _ } from "translate";
import { Player } from "Player";
import { ModTools } from "User";
import { Link, useParams } from "react-router-dom";
import { Appeal } from "Appeal";
import { MiniGoban } from "MiniGoban";
import { alert } from "swal_config";
import { post, get } from "requests";
import { errorAlerter, ignore } from "misc";
import {
    AIReview,
    GameTimings,
    ChatMode,
    GameChat,
    GobanContext,
    useCurrentMove,
    game_control,
    LogEntry,
    LogData,
} from "Game";
import { Goban } from "goban";
import { Resizable } from "Resizable";
import { socket } from "sockets";

const categories: ReportDescription[] = [
    {
        type: "all",
        title: "All",
        description: "",
    } as ReportDescription,
]
    .concat(report_categories)
    .concat([
        {
            type: "appeal",
            title: "Appeals",
            description: "",
        },
    ]);

const category_priorities: { [type: string]: number } = {};
for (let i = 0; i < report_categories.length; ++i) {
    category_priorities[report_categories[i].type] = i;
}

export function ReportsCenter(): JSX.Element {
    const user = useUser();
    const params = useParams();

    const refresh = useRefresh();
    const [selectedTab, setSelectedTab] = React.useState("all");
    const [report, setReport] = React.useState(null);

    React.useEffect(() => {
        report_manager.on("update", refresh);
        return () => {
            report_manager.off("update", refresh);
        };
    }, []);

    React.useEffect(() => {
        const setToFirstAvailableReport = () => {
            const reports = report_manager.getAvailableReports();

            if (reports.length) {
                for (let i = 0; i < reports.length; ++i) {
                    if (reports[i].report_type === selectedTab || selectedTab === "all") {
                        setReport(reports[i]);
                        return;
                    }
                }
            }

            setReport(null);
        };

        setToFirstAvailableReport();

        const syncToFirstAvailableReportIfNotSelected = () => {
            if (!report) {
                setToFirstAvailableReport();
            }
        };

        report_manager.on("update", syncToFirstAvailableReportIfNotSelected);
        return () => {
            report_manager.off("update", syncToFirstAvailableReportIfNotSelected);
        };
    }, [selectedTab]);

    React.useEffect(() => {
        if (report) {
            window.history.replaceState({}, document.title, "/reports-center/" + report.id);
        }
    }, [report]);

    if (params.reportId) {
        // TODO: We should figure out how to load historical reports if
        // this is set when we first come in
    }

    if (!user.is_moderator) {
        return null;
    }

    const reports = report_manager.getAvailableReports();
    const counts = {};
    for (const report of reports) {
        counts[report.report_type] = (counts[report.report_type] || 0) + 1;
        counts["all"] = (counts["all"] || 0) + 1;
    }

    return (
        <div className="ReportsCenter container">
            <h2 className="page-title">
                <i className="fa fa-exclamation-triangle"></i>
                {_("Reports Center")}
            </h2>

            <div id="ReportsCenterContainer">
                <div id="ReportsCenterCategoryList">
                    {categories.map((report_type) => {
                        const ct = counts[report_type.type] || 0;
                        return (
                            <div
                                key={report_type.type}
                                className={
                                    "Category " +
                                    (ct > 0 ? "active" : "") +
                                    (selectedTab === report_type.type ? " selected" : "")
                                }
                                title={report_type.title}
                                onClick={() => setSelectedTab(report_type.type)}
                            >
                                <span className="title">{report_type.title}</span>
                                <span className={"count " + (ct > 0 ? "active" : "")}>
                                    {ct > 0 ? `(${ct})` : ""}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <Select
                    id="ReportsCenterCategoryDropdown"
                    className="reports-center-category-option-select"
                    classNamePrefix="ogs-react-select"
                    value={categories.filter((opt) => opt.type === selectedTab)[0]}
                    getOptionValue={(data) => data.type}
                    onChange={(data: any) => setSelectedTab(data.type)}
                    options={categories}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                            <div
                                ref={innerRef}
                                {...innerProps}
                                className={
                                    "reports-center-category " +
                                    (isFocused ? "focused " : "") +
                                    (isSelected ? "selected" : "")
                                }
                            >
                                {data.title}{" "}
                                {counts[data.type] > 0 ? `(${counts[data.type] || 0})` : ""}
                            </div>
                        ),
                        SingleValue: ({ innerProps, data }) => (
                            <span {...innerProps} className="reports-center-category">
                                {data.title}{" "}
                                {counts[data.type] > 0 ? `(${counts[data.type] || 0})` : ""}
                            </span>
                        ),
                        ValueContainer: ({ children }) => (
                            <div className="reports-center-category-container">{children}</div>
                        ),
                    }}
                />

                <Report report={report} />
            </div>
        </div>
    );
}

let report_note_id = 0;
let report_note_text = "";
let report_note_update_timeout = null;

function Report({ report }: { report: Report }): JSX.Element {
    const user = useUser();
    const [moderatorNote, setModeratorNote] = React.useState("");

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

    if (!report) {
        return <div id="SelectedReport" />;
    }

    const category = report_categories.find((c) => c.type === report.report_type);

    return (
        <div id="SelectedReport">
            <div className="header">
                <span className="report-id">{"R" + `${report.id}`.slice(-3)}</span>

                <span className="moderator">
                    {report.moderator ? (
                        <>
                            Moderator: <Player user={report.moderator} />
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

            <hr />

            {(report.url || null) && (
                <a href={report.url} target="_blank">
                    {report.url}
                </a>
            )}

            {report.reported_game && <ReportedGame game_id={report.reported_game} />}

            {report.report_type === "appeal" && <ViewAppeal user_id={report.reported_user.id} />}

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

function UserHistory({ user }: { user: any }): JSX.Element {
    if (!user) {
        return null;
    }

    return (
        <>
            <h3>
                History for <Player user={user} />
            </h3>
            <ModTools user_id={user.id} show_mod_log={true} collapse_same_users={true} />
        </>
    );
}

function ReportedGame({ game_id }: { game_id: number }): JSX.Element {
    const [goban, setGoban] = React.useState<Goban>(null);
    const [selectedChatLog, setSelectedChatLog] = React.useState<ChatMode>("main");
    const refresh = useRefresh();
    const onGobanCreated = React.useCallback((goban: Goban) => {
        console.log("Goban: ", goban);
        setGoban(goban);
    }, []);
    const cur_move = useCurrentMove(goban);
    const [, /* game */ setGame] = React.useState<rest_api.GameDetails>(null);
    const [, /* aiReviewUuid */ setAiReviewUuid] = React.useState<string | null>(null);
    const [annulled, setAnnulled] = React.useState<boolean>(false);

    const decide = React.useCallback(
        (winner: string) => {
            if (!game_id) {
                void alert.fire(_("Game ID missing"));
                return;
            }

            let moderation_note: string | null = null;
            do {
                moderation_note = prompt(
                    "Deciding for " + winner.toUpperCase() + " - Moderator note:",
                );
                if (moderation_note == null) {
                    return;
                }
                moderation_note = moderation_note.trim();
            } while (moderation_note === "");

            post("games/%%/moderate", game_id, {
                decide: winner,
                moderation_note: moderation_note,
            }).catch(errorAlerter);
        },
        [game_id, goban],
    );

    const do_annul = React.useCallback(
        (tf: boolean): void => {
            if (!game_id) {
                void alert.fire(_("Game ID missing"));
                return;
            }

            const engine = goban.engine;
            let moderation_note: string | null = null;
            do {
                moderation_note = tf
                    ? prompt(_("ANNULMENT - Moderator note:"))
                    : prompt(_("Un-annulment - Moderator note:"));
                if (moderation_note == null) {
                    return;
                }
                moderation_note = moderation_note
                    .trim()
                    .replace(/(black)\b/g, `player ${engine.players.black.id}`)
                    .replace(/(white)\b/g, `player ${engine.players.white.id}`);
            } while (moderation_note === "");

            post("games/%%/annul", game_id, {
                annul: tf ? 1 : 0,
                moderation_note: moderation_note,
            })
                .then(() => {
                    setAnnulled(tf);
                    if (tf) {
                        void alert.fire({ text: _("Game has been annulled") });
                    } else {
                        void alert.fire({ text: _("Game ranking has been restored") });
                    }
                })
                .catch(errorAlerter);
        },
        [game_id, goban],
    );

    React.useEffect(() => {
        if (goban) {
            goban.on("update", refresh);
        }

        const gotoMove = (move_number: number) => {
            if (goban) {
                goban.showFirst(move_number > 0);
                for (let i = 0; i < move_number; ++i) {
                    goban.showNext(i !== move_number - 1);
                }
                goban.syncReviewMove();
            }
        };

        game_control.on("gotoMove", gotoMove);
        return () => {
            if (goban) {
                goban.off("update", refresh);
            }
            game_control.off("gotoMove", gotoMove);
        };
    }, [goban]);

    React.useEffect(() => {
        if (game_id) {
            get("games/%%", game_id)
                .then((game: rest_api.GameDetails) => {
                    setGame(game);
                    setAnnulled(game.annulled);
                })
                .catch(errorAlerter);
        }
    }, [game_id]);

    if (!game_id) {
        return null;
    }

    return (
        <div className="reported-game">
            <h3>
                Game: <Link to={`/game/${game_id}`}>#{game_id}</Link>
            </h3>
            <div className="reported-game-container">
                <div className="col">
                    <MiniGoban
                        id={game_id}
                        noLink={true}
                        onGobanCreated={onGobanCreated}
                        chat={true}
                    />
                </div>

                {goban && goban.engine && (
                    <GobanContext.Provider value={goban}>
                        <div className="col">
                            <div>Game Phase: {goban.engine.phase}</div>
                            {(goban.engine.phase === "finished" || null) && (
                                <div>
                                    Game Outcome: {goban.engine.outcome}{" "}
                                    {annulled ? " anulled" : ""}
                                </div>
                            )}

                            {goban.engine.phase === "finished" ? (
                                <div className="decide-buttons">
                                    {goban.engine.config.ranked && !annulled && (
                                        <button onClick={() => do_annul(true)}>{_("Annul")}</button>
                                    )}
                                    {goban.engine.config.ranked && annulled && (
                                        <button onClick={() => do_annul(false)}>
                                            {"Remove annulment"}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="decide-buttons">
                                    <button
                                        className="decide-button"
                                        onClick={() => decide("black")}
                                    >
                                        Black ({goban.engine.players?.black?.username}) Wins
                                    </button>
                                    <button
                                        className="decide-button"
                                        onClick={() => decide("white")}
                                    >
                                        White ({goban.engine.players?.white?.username}) Wins
                                    </button>
                                </div>
                            )}

                            {((goban.engine.phase === "finished" &&
                                goban.engine.game_id === game_id &&
                                ((goban.engine.width === 19 && goban.engine.height === 19) ||
                                    (goban.engine.width === 13 && goban.engine.height === 13) ||
                                    (goban.engine.width === 9 && goban.engine.height === 9))) ||
                                null) && (
                                <AIReview
                                    onAIReviewSelected={(r) => setAiReviewUuid(r?.uuid)}
                                    game_id={game_id}
                                    move={cur_move}
                                    hidden={false}
                                />
                            )}

                            <Resizable
                                id="move-tree-container"
                                className="vertically-resizable"
                                ref={(ref) => goban.setMoveTreeContainer(ref?.div)}
                            />
                        </div>

                        <div className="col">
                            <GameTimings
                                moves={goban.engine.config.moves}
                                start_time={goban.engine.config.start_time}
                                end_time={goban.engine.config.end_time}
                                free_handicap_placement={
                                    goban.engine.config.free_handicap_placement
                                }
                                handicap={goban.engine.config.handicap}
                                black_id={goban.engine.config.black_player_id}
                                white_id={goban.engine.config.white_player_id}
                            />

                            <GameLog goban={goban} />
                        </div>

                        <div className="col">
                            <GameChat
                                selected_chat_log={selectedChatLog}
                                onSelectedChatModeChange={setSelectedChatLog}
                                channel={`game-${game_id}`}
                                game_id={game_id}
                            />
                        </div>
                    </GobanContext.Provider>
                )}
            </div>
        </div>
    );
}

function ViewAppeal({ user_id }: { user_id: number }): JSX.Element {
    //const [appeal, setAppeal] = useState(null);
    if (!user_id) {
        return null;
    }

    return <Appeal player_id={user_id} />;
}

function GameLog({ goban }: { goban: Goban }): JSX.Element {
    const [log, setLog] = React.useState<LogEntry[]>([]);
    const game_id = goban.engine.game_id;

    React.useEffect(() => {
        socket.send(`game/log`, { game_id }, (log) => setLog(log));
    }, [game_id]);

    const markCoords = React.useCallback(
        (coords: string) => {
            console.log("Should be marking coords ", coords);
        },
        [goban],
    );

    return (
        <>
            <h3>Game Log</h3>
            {log.length > 0 ? (
                <table className="game-log">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Event</th>
                            <th>Parameters</th>
                        </tr>
                    </thead>
                    <tbody>
                        {log.map((entry, idx) => (
                            <tr key={entry.timestamp + ":" + idx} className="entry">
                                <td className="timestamp">
                                    {moment(entry.timestamp).format("L LTS")}
                                </td>
                                <td className="event">{entry.event}</td>
                                <td className="data">
                                    <LogData
                                        config={goban.engine.config}
                                        markCoords={markCoords}
                                        event={entry.event}
                                        data={entry.data}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div>No game log entries</div>
            )}
        </>
    );
}
