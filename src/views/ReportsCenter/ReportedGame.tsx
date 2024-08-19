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
import { useRefresh } from "hooks";
import { _, pgettext } from "translate";
import { Link } from "react-router-dom";
import { MiniGoban } from "MiniGoban";
import { alert } from "swal_config";
import { post, get } from "requests";
import { errorAlerter, showSecondsResolution } from "misc";
import { doAnnul } from "moderation";

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
import { GobanRenderer } from "goban";
import { Resizable } from "Resizable";
import { socket } from "sockets";
import { Player } from "Player";
import { useUser } from "hooks";
import { shortTimeControl } from "TimeControl";

const TRUNCATED_GAME_LOG_LENGTH = 25;

export function ReportedGame({
    game_id,
    reported_at,
}: {
    game_id: number;
    reported_at: number | undefined;
}): JSX.Element | null {
    const [goban, setGoban] = React.useState<GobanRenderer | null>(null);
    const [selectedChatLog, setSelectedChatLog] = React.useState<ChatMode>("main");
    const refresh = useRefresh();
    const onGobanCreated = React.useCallback((goban: GobanRenderer) => {
        setGoban(goban);
    }, []);
    const cur_move = useCurrentMove(goban);
    const [game, setGame] = React.useState<rest_api.GameDetails | null>(null);
    const [, /* aiReviewUuid */ setAiReviewUuid] = React.useState<string | null>(null);
    const [annulled, setAnnulled] = React.useState<boolean>(false);
    const [finalActionTime, setFinalActionTime] = React.useState<moment.Duration | null>(null);

    const user = useUser();

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

            post(`games/${game_id}/moderate`, {
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

            const engine = goban!.engine;
            doAnnul(engine.config, tf);
        },
        [game_id, goban],
    );

    React.useEffect(() => {
        if (goban) {
            goban.on("update", refresh);
        }

        const gotoMove = (move_number?: number) => {
            if (typeof move_number !== "number") {
                return;
            }

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
            get(`games/${game_id}`)
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

    const winner =
        goban?.engine?.winner === goban?.engine?.config.black_player_id ? "Black" : "White";

    return (
        <div className="reported-game">
            <div className="reported-game-container">
                <div className="col reported-game-mini-goban">
                    <MiniGoban
                        game_id={game_id}
                        noLink={true}
                        onGobanCreated={onGobanCreated}
                        chat={true}
                    />
                </div>
                {goban && goban.engine && (
                    <GobanContext.Provider value={goban}>
                        <div className="col reported-game-info">
                            <h3>
                                Game: <Link to={`/game/${game_id}`}>#{game_id}</Link>
                                <span className="created-note">
                                    (created by:
                                    {game && <Player user={game.creator} />})
                                </span>
                            </h3>
                            <div className="reported-turn">
                                {_("Reported on turn:") + ` ${reported_at ?? _("not available")}`}
                            </div>
                            <div>Black: {game && <Player user={game.black} />}</div>
                            <div>White: {game && <Player user={game.white} />}</div>
                            <div>Game Phase: {goban.engine.phase}</div>
                            {(goban.engine.phase === "finished" || null) && (
                                <>
                                    <div>
                                        {_("Game Outcome:") + ` ${winner} (`}
                                        <Player user={goban!.engine.winner as number} />
                                        {` ) ${pgettext(
                                            "use like: they won 'by' this much",
                                            "by",
                                        )} `}
                                        {goban.engine.outcome}
                                        {annulled ? _(" annulled") : ""}
                                    </div>
                                    <div>
                                        {_("The last event took: ") +
                                            showSecondsResolution(finalActionTime)}
                                    </div>
                                </>
                            )}

                            {user.is_moderator && (
                                <>
                                    {goban.engine.phase === "finished" ? (
                                        <div className="decide-buttons">
                                            {goban.engine.config.ranked && !annulled && (
                                                <button onClick={() => do_annul(true)}>
                                                    {_("Annul")}
                                                </button>
                                            )}
                                            {goban.engine.config.ranked && annulled && (
                                                <button onClick={() => do_annul(false)}>
                                                    {_("Remove annulment")}
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
                                </>
                            )}
                            {cur_move &&
                                ((goban.engine.phase === "finished" &&
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
                                ref={(ref) => ref?.div && goban.setMoveTreeContainer(ref.div)}
                            />
                            {!!goban?.engine && (
                                <div className="reported-game-timing">
                                    {`Time control: ${shortTimeControl(goban.engine.time_control)}`}
                                </div>
                            )}
                        </div>

                        <div className="col">
                            <GameTimings
                                moves={goban.engine.config.moves as any}
                                start_time={goban.engine.config.start_time as any}
                                end_time={goban.engine.config.end_time as any}
                                free_handicap_placement={
                                    goban.engine.config.free_handicap_placement as any
                                }
                                handicap={goban.engine.config.handicap as any}
                                black_id={goban.engine.config.black_player_id as any}
                                white_id={goban.engine.config.white_player_id as any}
                                onFinalActionCalculated={setFinalActionTime}
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

function GameLog({ goban }: { goban: GobanRenderer }): JSX.Element {
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

    const [shouldDisplayFullLog, setShouldDisplayFullLog] = React.useState(false);

    return (
        <>
            <h3>{_("Game Log")}</h3>
            {log.length > 0 ? (
                <>
                    <table className="game-log">
                        <thead>
                            <tr>
                                <th>
                                    {pgettext(
                                        "A heading: the time when something happened",
                                        "Time",
                                    )}
                                </th>
                                <th>{pgettext("A heading: something that happened", "Event")}</th>
                                <th>
                                    {pgettext(
                                        "A heading: a column with game parameters in it",
                                        "Parameters",
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {log
                                .filter(
                                    (_, idx) =>
                                        shouldDisplayFullLog || idx < TRUNCATED_GAME_LOG_LENGTH,
                                )
                                .map((entry, idx) => (
                                    <tr key={entry.timestamp + ":" + idx} className="entry">
                                        <td className="timestamp">
                                            {moment(entry.timestamp).format("L LTS")}
                                        </td>
                                        <td className="event">{entry.event.replace(/_/g, " ")}</td>
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
                    {!shouldDisplayFullLog && log.length > TRUNCATED_GAME_LOG_LENGTH && (
                        <button onClick={() => setShouldDisplayFullLog(true)}>
                            {`${_("Show all")} (${log.length})`}
                        </button>
                    )}
                </>
            ) : (
                <div>{_("No game log entries")}</div>
            )}
        </>
    );
}
