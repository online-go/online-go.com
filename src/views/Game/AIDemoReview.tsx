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
import { pgettext, interpolate } from "@/lib/translate";
import { ai_socket } from "@/lib/sockets";
import { Toggle } from "@/components/Toggle";
import { uuid } from "@/lib/misc";
import * as preferences from "@/lib/preferences";
import { usePreference } from "@/lib/preferences";
import { JGOFNumericPlayerColor, ColoredCircle, MoveTree, GobanRenderer, JGOFMove } from "goban";
import { useUser } from "@/lib/hooks";

const cached_data: { [review_id: number]: { [board_string: string]: any } } = {};

interface Prediction {
    score?: number;
    win_rate?: number;
}

export function AIDemoReview({
    goban,
    controller,
}: {
    goban: GobanRenderer;
    controller: number;
}): React.ReactElement | null {
    const user = useUser();
    const is_controller = user?.id === controller;
    const [engine, setEngine] = React.useState(goban?.engine);
    const [prediction, setPrediction] = React.useState<Prediction | null>(null);
    const [useScore, setUseScore] = usePreference("ai-review-use-score");
    const [aiReviewEnabled] = usePreference("ai-review-enabled");

    React.useEffect(() => {
        if (goban) {
            setEngine(goban.engine);
            goban.on("engine.updated", setEngine);
        }

        return () => {
            if (goban) {
                goban.off("engine.updated", setEngine);
            }
        };
    }, [goban, goban?.engine]);

    React.useEffect(() => {
        if (!engine) {
            console.warn("No engine", goban, goban.engine);
            return;
        }

        function onConnect() {
            requestAnimationFrame(() => {
                // wait for other post connect stuff to finish if necessary
                ai_socket.send("ai-analyze-subscribe", {
                    channel_id: `ai-position-analysis-stream-review-${goban.review_id}`,
                });
                ai_socket.on(
                    `ai-position-analysis-stream-review-${goban.review_id}` as any,
                    (data: any) => {
                        if (!data) {
                            return;
                        }

                        const board_string = stringifyBoardState(goban.engine.cur_move);

                        if (!(goban.review_id in cached_data)) {
                            cached_data[goban.review_id] = {};
                        }

                        cached_data[goban.review_id][data.board_string] = data;

                        if (data?.board_string !== board_string) {
                            return;
                        }

                        setPrediction(computePrediction(data));
                        renderAnalysis(goban, data);
                    },
                );
            });
        }

        ai_socket?.on("connect", onConnect);
        if (ai_socket?.connected) {
            onConnect();
        }

        return () => {
            if (ai_socket?.connected) {
                ai_socket.send("ai-analyze-unsubscribe", {
                    channel_id: `ai-position-analysis-stream-review-${goban.review_id}`,
                });
            }
            ai_socket.off(`ai-position-analysis-stream-review-${goban.review_id}` as any);
            ai_socket.off(`connect`, onConnect);
        };
    }, [goban.review_id]);

    React.useEffect(() => {
        let last_call_board_string = "";

        if (!engine) {
            console.warn("No engine", goban, goban.engine);
            return;
        }

        engine.on("cur_move", onMove);
        engine.on("cur_review_move", onMove);
        //onMove(engine.cur_move);
        let pending_request: ReturnType<typeof setTimeout> | null = null;

        function onMove() {
            const move = goban.engine.cur_move;
            const board_string = stringifyBoardState(move);
            const last_data = cached_data[goban?.review_id || 0]?.[board_string];

            if (board_string === last_call_board_string) {
                /* We need both cur_move and cur_review_move events to catch
                 * all cases, but sometimes we are called back to back and we
                 * don't need that, so debounce */
                if (!last_data) {
                    setPrediction(null);
                    clearAnalysis(goban);
                }
                return;
            }
            last_call_board_string = board_string;

            /* This request animation frame exists because other part of the
             * code clears the board and redraws any stored marks and drawings
             * on the board, which can happen after this code runs (which
             * blanks out what we want to draw). So, we do this code next frame
             * so we always run after that other code. */
            requestAnimationFrame(() => {
                // we can't use the data from the outside call because there's times
                // where the cur_move/cur_review_move get updated in such a way that would cause
                // this logic to run when we don't want it to
                const move = goban.engine.cur_move;
                const board_string = stringifyBoardState(move);
                const last_data = cached_data[goban?.review_id || 0]?.[board_string];

                if (last_data) {
                    setPrediction(computePrediction(last_data));
                    renderAnalysis(goban, last_data);
                    return;
                } else {
                    setPrediction(null);
                    clearAnalysis(goban);
                }
            });

            if (!is_controller) {
                return;
            }

            if (!user.supporter_level) {
                return;
            }

            if (pending_request) {
                clearTimeout(pending_request);
            }

            /* We debounce here because if we hover over a variation link
             * shared by a player we'd trigger an analysis for every move in
             * the variation, which could be problematic. With the debounce, we
             * only analyze the final move. */
            pending_request = setTimeout(() => {
                pending_request = null;
                let move = goban.engine.cur_move;
                // store our board string for the final position
                const board_string = stringifyBoardState(move);

                const moves: JGOFMove[] = [];

                /* We go back up to 2 moves to get a starting board state, and then send that board
                 * state along with the moves to get to our current move. This ensures we can
                 * handle really long variations like some folks like to do, and it also ensures
                 * the AI doesn't suggest obvious board repetitions. */
                if (move.move_number > 2) {
                    for (let i = 0; i < 2; i++) {
                        if (move.parent) {
                            moves.unshift(move.toJGOFMove());
                            move = move.parent;
                        } else {
                            break;
                        }
                    }
                }

                const last_data = cached_data[goban?.review_id || 0]?.[board_string];
                /* If we already have a final position, broadcast this to anyone
                 * who may be listening instead of re-analyzing */
                if (last_data && last_data.final) {
                    ai_socket
                        .sendPromise("ai-relay-analyzed-position", {
                            channel_id: `ai-position-analysis-stream-review-${goban.review_id}`,
                            data: last_data,
                        })
                        .catch((error) => {
                            console.error("Relay error", error);
                        });
                    return;
                }

                /* If we don't have any data, request an analysis */
                if (!last_data) {
                    ai_socket
                        .sendPromise("ai-analyze-position", {
                            uuid: uuid(),
                            channel_id: `ai-position-analysis-stream-review-${goban.review_id}`,
                            rules: engine.rules,
                            black_prisoners: move.state.black_prisoners || 0,
                            white_prisoners: move.state.white_prisoners || 0,
                            komi: goban.engine?.komi || 0,
                            board: move.state.board,
                            board_string,
                            player: move.state.player,
                            moves,
                        })
                        .then((_response) => {
                            //console.log("ai-analyze-position response", response);
                        })
                        .catch((error) => {
                            console.error("ai-analyze-position error", error);
                        });
                } else {
                    /* If we're here, we have some data but not the final data, so
                     * it's still coming in and any other viewers will also be
                     * receiving the updates so no need to do anything. */
                }
            }, 50);
        }

        return () => {
            engine.off("cur_move", onMove);
            engine.off("cur_review_move", onMove);
        };
    }, [goban, engine, is_controller]);

    React.useEffect(() => {
        if (!aiReviewEnabled) {
            clearAnalysis(goban);
            return;
        }

        const move = goban.engine.cur_move;
        const board_string = stringifyBoardState(move);
        const last_data = cached_data[goban?.review_id || 0]?.[board_string];

        if (last_data) {
            setPrediction(computePrediction(last_data));
            renderAnalysis(goban, last_data);
            return;
        } else {
            setPrediction(null);
            clearAnalysis(goban);
        }
    }, [aiReviewEnabled]);

    if (!aiReviewEnabled) {
        return null;
    }

    if (!prediction) {
        return <div className="AIDemoReview" />;
    }

    const score = prediction.score || 0;
    const win_rate_p = (prediction.win_rate || 0) * 100.0;

    return (
        <>
            <div className="AIDemoReview">
                {useScore ? (
                    <div className="progress">
                        {score > 0 ? (
                            <div
                                className="progress-bar black-background"
                                style={{ width: "100%" }}
                            >
                                {interpolate(
                                    pgettext("AI Review: Black ahead by {score}", "B+{{score}}"),
                                    { score: score.toFixed(1) },
                                )}
                            </div>
                        ) : (
                            <div
                                className="progress-bar white-background"
                                style={{ width: "100%" }}
                            >
                                {interpolate(
                                    pgettext("AI Review: White ahead by {score}", "W+{{score}}"),
                                    { score: (-score).toFixed(1) },
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="progress">
                        <div
                            className="progress-bar black-background"
                            style={{ width: win_rate_p + "%" }}
                        >
                            {win_rate_p.toFixed(1)}%
                        </div>
                        <div
                            className="progress-bar white-background"
                            style={{ width: 100.0 - win_rate_p + "%" }}
                        >
                            {(100 - win_rate_p).toFixed(1)}%
                        </div>
                    </div>
                )}

                <Toggle
                    checked={useScore}
                    onChange={(b) => {
                        setUseScore(b);
                    }}
                />
            </div>
        </>
    );
}

function stringifyBoardState(move: MoveTree): string {
    return move.state.board.reduce((a, b) => a + b.reduce((a, b) => a + b, ""), "");
}

function clearAnalysis(goban: GobanRenderer) {
    goban.setMarks({}, true); /* draw the remaining AI sequence as ghost marks, if any */
    goban.setHeatmap(undefined, true);
    goban.setColoredCircles([], false);
}

function computePrediction(data: any): any {
    return { score: data.analysis.score, win_rate: data.analysis.win_rate };
}

function renderAnalysis(goban: GobanRenderer, data: any) {
    if (!preferences.get("ai-review-enabled")) {
        return;
    }
    const use_score = preferences.get("ai-review-use-score");

    const analysis = data.analysis;
    const branches = analysis.branches;

    const total_visits = branches.reduce((a: number, b: any) => a + b.visits, 0);

    let marks: { [mark: string]: string } = {};
    const colored_circles: ColoredCircle[] = [];
    let heatmap: Array<Array<number>> | null = null;
    heatmap = [];
    for (let y = 0; y < goban.engine.height; y++) {
        const r: number[] = [];
        for (let x = 0; x < goban.engine.width; x++) {
            r.push(0);
        }
        heatmap.push(r);
    }
    for (let i = 0; i < branches.length; ++i) {
        const branch = branches[i];
        const mv = branch.moves[0];

        if (mv === undefined || mv.x === -1) {
            continue;
        }

        if (goban.engine.board[mv.y][mv.x]) {
            const location_pretty_coord = goban.engine.prettyCoordinates(mv.x, mv.y);
            console.error(
                `ERROR: AI is suggesting moves on intersection ${location_pretty_coord} that have already been played, this is likely a move indexing error or an illegal board state.`,
            );
        }

        heatmap[mv.y][mv.x] = branch.visits / total_visits;

        const cur_move = goban.engine.cur_move;

        const next_player: JGOFNumericPlayerColor =
            cur_move.player === JGOFNumericPlayerColor.BLACK
                ? JGOFNumericPlayerColor.WHITE
                : JGOFNumericPlayerColor.BLACK;

        const delta: number = use_score
            ? next_player === JGOFNumericPlayerColor.WHITE
                ? analysis.score - branch.score
                : branch.score - analysis.score
            : 100 *
              (next_player === JGOFNumericPlayerColor.WHITE
                  ? analysis.win_rate - branch.win_rate
                  : branch.win_rate - analysis.win_rate);

        let key = delta.toFixed(1);
        if (key === "0.0" || key === "-0.0") {
            key = "0";
        }
        // only show numbers for well explored moves
        // show number for AI choice and played moves[0] as well
        if (
            mv &&
            (i === 0 ||
                //true || // debugging
                branch.visits >= Math.min(50, 0.1 * total_visits))
        ) {
            if (parseFloat(key).toPrecision(2).length < key.length) {
                key = parseFloat(key).toPrecision(2);
            }
            goban.setSubscriptMark(mv.x, mv.y, key, true);
        }

        const circle: ColoredCircle = {
            move: branch.moves[0],
            color: "rgba(0,0,0,0)",
        };

        // blue move, not what player made
        if (i === 0) {
            goban.setMark(mv.x, mv.y, "blue_move", true);
            circle.border_width = 0.2;
            circle.border_color = "rgb(0, 130, 255)";
            circle.color = "rgba(0, 130, 255, 0.7)";
            colored_circles.push(circle);
        }
    }

    // Reduce moves shown to the variation-move-count from settings
    marks = trimMaxMoves(marks);

    try {
        goban.setMarks(marks, true); /* draw the remaining AI sequence as ghost marks, if any */
        goban.setHeatmap(heatmap, true);
        goban.setColoredCircles(colored_circles, false);
    } catch (e) {
        console.error(e);
    }
}

function trimMaxMoves(marks: { [mark: string]: string }): { [mark: string]: string } {
    // Reduces the number of moves ahead shown in a the variation if the user has set it to non-zero
    const maxMoves = preferences.get("variation-move-count");
    // Move object has more than just one move in it and the user has set the non-zero value
    if (maxMoves < 10 && Object.keys(marks).length > 2) {
        // Get all the moves into an array but leave the black and white keys since we'll append them later
        let marksArray = Object.entries(marks).reduce(
            (result, entry) => {
                if (entry[0] !== "black" && entry[0] !== "white") {
                    result.push({ key: entry[0], value: entry[1] });
                }
                return result;
            },
            [] as { key: string; value: any }[],
        );

        // use the max moves set by teh user or the number of moves in the variation, whichever is lower
        const actualMoves = marksArray.length > maxMoves ? maxMoves : marksArray.length;

        // Chop off anything after the number of moves we want
        marksArray = marksArray.slice(0, actualMoves);

        // Work out whose move the first move is
        let blackFirstMove: boolean;
        if (marks.black.substring(0, 2) === marksArray[0].value) {
            blackFirstMove = true;
        } else {
            blackFirstMove = false;
        }

        // See if we have an odd number of moves
        const oddMoves = actualMoves % 2 > 0;

        // Black and white have half the moves each...
        let blackMoves = Math.floor(actualMoves / 2);
        let whiteMoves = blackMoves;

        // ... plus one for whoever moves first (if an odd number of moves)
        if (oddMoves) {
            if (blackFirstMove) {
                blackMoves++;
            } else {
                whiteMoves++;
            }
        }

        // Work out how many characters (2 per move) we should restrict the transparency string to for each
        const blackMoveString = marks.black.substring(0, 2 * blackMoves);
        const whiteMoveString = marks.white.substring(0, 2 * whiteMoves);

        // Add back the black and white keys with the transparency strings if each is non-blank.
        // Seems ok to put a blank value but it may have unintended consequences.
        if (blackMoveString) {
            marksArray.push({
                key: "black",
                value: blackMoveString,
            });
        }

        if (whiteMoveString) {
            marksArray.push({
                key: "white",
                value: whiteMoveString,
            });
        }

        // Convert teh array back into an object
        marks = marksArray.reduce(
            (target, item) => (((target as any)[item.key] = item.value), target),
            {},
        );
    }

    //Return the result
    return marks;
}
