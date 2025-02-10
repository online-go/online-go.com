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
import { useRefresh } from "@/lib/hooks";
import { shortTimeControl } from "@/components/TimeControl";
import { _, pgettext } from "@/lib/translate";
import { Link } from "react-router-dom";
import { MiniGoban } from "@/components/MiniGoban";
import { alert } from "@/lib/swal_config";
import { post, get } from "@/lib/requests";
import { errorAlerter, showSecondsResolution } from "@/lib/misc";
import { doAnnul } from "@/lib/moderation";

import {
    AIReview,
    GameTimings,
    ChatMode,
    GameChat,
    GobanContext,
    useCurrentMove,
    game_control,
    GameLog,
    useGoban,
} from "@/views/Game";
import { GobanRenderer } from "goban";
import { Resizable } from "@/components/Resizable";

import { Player } from "@/components/Player";
import { useUser } from "@/lib/hooks";
export function ReportedGame({
    game_id,
    reported_at,
    reported_by,
    onGobanCreated,
}: {
    game_id: number;
    reported_at: number | undefined;
    reported_by: number;
    onGobanCreated?: (goban: GobanRenderer) => void;
}): React.ReactElement | null {
    const [goban, setGoban] = React.useState<GobanRenderer | null>(null);
    const [selectedChatLog, setSelectedChatLog] = React.useState<ChatMode>("main");
    const refresh = useRefresh();
    const handleGobanCreated = React.useCallback(
        (goban: GobanRenderer) => {
            setGoban(goban);
            onGobanCreated?.(goban);
        },
        [onGobanCreated],
    );
    const cur_move = useCurrentMove(goban);
    const [game, setGame] = React.useState<rest_api.GameDetails | null>(null);
    const [_aiReviewUuid, setAiReviewUuid] = React.useState<string | null>(null);
    const [annulled, setAnnulled] = React.useState<boolean>(false);
    const [finalActionTime, setFinalActionTime] = React.useState<moment.Duration | null>(null);
    const [timedOutPlayer, setTimedOutPlayer] = React.useState<number | null>(null);
    const [scoringAbandoned, setScoringAbandoned] = React.useState<boolean>(false);

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
                <div className="reported-game-element">
                    {/*  This element is providing the goban used by the goban provider wrapped around the rest of them */}
                    <MiniGoban
                        className="reported-game-mini-goban"
                        game_id={game_id}
                        noLink={true}
                        onGobanCreated={handleGobanCreated}
                        chat={true}
                    />
                    {goban && goban.engine && (
                        <GobanContext.Provider value={goban}>
                            <Resizable
                                id="move-tree-container"
                                className="vertically-resizable"
                                ref={(ref) => {
                                    if (ref?.div) {
                                        goban.setMoveTreeContainer(ref.div);
                                    }
                                }}
                            />

                            <div className="reported-game-timing">
                                {`Time control: ${shortTimeControl(goban.engine.time_control)}`}
                            </div>
                            <ModeratorReportedGameActions
                                game_id={game_id}
                                goban={goban}
                                annulled={annulled}
                            />
                        </GobanContext.Provider>
                    )}
                </div>
                {goban && goban.engine && (
                    <GobanContext.Provider value={goban}>
                        <div className="reported-game-element reported-game-info">
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
                                <GameOutcomeSummary
                                    winner={winner}
                                    finalActionTime={finalActionTime}
                                    timedOutPlayer={timedOutPlayer}
                                    reported_by={reported_by}
                                    annulled={annulled}
                                    scoringAbandoned={scoringAbandoned}
                                />
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
                        </div>

                        <div className="reported-game-element">
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

                            <GameLog
                                goban_config={goban.config}
                                onContainsTimeout={setTimedOutPlayer}
                                onContainsAbandonment={setScoringAbandoned}
                            />
                        </div>

                        <div className="reported-game-element reported-game-chat">
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

interface ModeratorReportedGameActionsProps {
    game_id: number;
    goban: GobanRenderer;
    annulled: boolean;
}

function ModeratorReportedGameActions({
    game_id,
    goban,
    annulled,
}: ModeratorReportedGameActionsProps): React.ReactElement {
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

    return (
        <div className="moderator-reported-game-actions">
            {user.is_moderator && (
                <>
                    {goban.engine.phase === "finished" ? (
                        <div className="decide-buttons">
                            {goban.engine.config.ranked && !annulled && (
                                <button onClick={() => do_annul(true)}>{_("Annul")}</button>
                            )}
                            {goban.engine.config.ranked && annulled && (
                                <button onClick={() => do_annul(false)}>
                                    {_("Remove annulment")}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="decide-buttons">
                            <button className="decide-button" onClick={() => decide("black")}>
                                Black ({goban.engine.players?.black?.username}) Wins
                            </button>
                            <button className="decide-button" onClick={() => decide("white")}>
                                White ({goban.engine.players?.white?.username}) Wins
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

interface GameOutcomeSummaryProps {
    winner: string;
    finalActionTime: moment.Duration | null;
    timedOutPlayer: number | null;
    reported_by: number;
    annulled: boolean;
    scoringAbandoned: boolean;
}

function GameOutcomeSummary({
    winner,
    finalActionTime,
    timedOutPlayer,
    reported_by,
    annulled,
    scoringAbandoned,
}: GameOutcomeSummaryProps): React.ReactElement {
    const goban = useGoban();
    return (
        <div className="GameSummary">
            <div>
                {_("Game Outcome:") + ` ${winner} (`}
                <Player user={goban!.engine.winner as number} />
                {` ) ${pgettext("use like: they won 'by' this much", "by")} `}
                {goban.engine.outcome}
                {annulled ? _(" annulled") : ""}
            </div>
            <div>{_("The last event took: ") + showSecondsResolution(finalActionTime)}</div>

            {timedOutPlayer && (
                <div>
                    {_("Player timed out:")}
                    <Player user={timedOutPlayer} />
                    {timedOutPlayer === reported_by && "!!"}
                    {/* we are surprised if the reporter timed out */}
                </div>
            )}
            {scoringAbandoned && <div>{_("Scoring abandoned by both players")}</div>}
        </div>
    );
}
