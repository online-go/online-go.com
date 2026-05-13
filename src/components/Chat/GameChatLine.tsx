/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of the
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
import { LineText } from "@/components/misc-ui";
import { Player } from "@/components/Player";
import { useGobanControllerOrNull } from "@/components/GobanView";
import * as preferences from "@/lib/preferences";
import { pgettext, interpolate, moment, _ } from "@/lib/translate";
import { profanity_filter } from "@/lib/profanity_filter";
import { chat_markup } from "./chat_markup";
import { protocol } from "goban";
import type { MoveTree } from "goban";
import type { Goban } from "goban";
import "./GameChatLine.css";
import "./ChatLog.css";

interface GameChatLineProps {
    line: protocol.GameChatLine;
    lastLine?: protocol.GameChatLine;
    gameId?: number;
    reviewId?: number;
}

function parsePosition(position: string, goban: Goban | null): { i: number; j: number } {
    if (!goban || !position) {
        return {
            i: -1,
            j: -1,
        };
    }

    let i = "abcdefghjklmnopqrstuvwxyz".indexOf(position[0].toLowerCase());
    let j = goban.height - Number.parseInt(position.substring(1), 10);
    if (j < 0 || i < 0) {
        i = -1;
        j = -1;
    }
    if (i >= goban.width || j >= goban.height) {
        i = -1;
        j = -1;
    }
    return { i, j };
}

const positionTokenRegex = /(^|\s)([a-zA-Z][0-9]{1,2})([,.!?]*)(?=\s|$)/gm;

function renderChatBodyText(bodyText: string, goban: Goban | null): React.ReactNode[] {
    if (!goban) {
        return chat_markup(bodyText);
    }

    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    let tokenIndex = 0;

    positionTokenRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = positionTokenRegex.exec(bodyText)) !== null) {
        const start = match.index;
        const prefix = match[1] ?? "";
        const position = match[2];
        const punctuation = match[3] ?? "";

        if (start > cursor) {
            nodes.push(...chat_markup(bodyText.slice(cursor, start)));
        }

        const parsed = parsePosition(position, goban);
        nodes.push(
            <React.Fragment key={`position-${tokenIndex++}`}>
                {prefix}
                {parsed.i < 0 ? (
                    `${position}${punctuation}`
                ) : (
                    <>
                        <span
                            className={punctuation ? "position tight-right" : "position"}
                            data-position={position}
                            onMouseEnter={() => {
                                const point = parsePosition(position, goban);
                                if (point.i >= 0) {
                                    goban.getMarks(point.i, point.j).chat_triangle = true;
                                    goban.drawSquare(point.i, point.j);
                                }
                            }}
                            onMouseLeave={() => {
                                const point = parsePosition(position, goban);
                                if (point.i >= 0) {
                                    goban.getMarks(point.i, point.j).chat_triangle = false;
                                    goban.drawSquare(point.i, point.j);
                                }
                            }}
                        >
                            {position}
                        </span>
                        {punctuation ? (
                            <span className="position-trailing">{punctuation}</span>
                        ) : null}
                    </>
                )}
            </React.Fragment>,
        );

        cursor = start + match[0].length;
    }

    if (cursor < bodyText.length) {
        nodes.push(...chat_markup(bodyText.slice(cursor)));
    }

    return nodes;
}

function getChatIdPrefix(gameId?: number, reviewId?: number): string {
    if (reviewId != null) {
        return `r.${reviewId}`;
    }

    if (gameId != null) {
        return `g.${gameId}`;
    }

    return "g";
}

export function GameChatLine(props: GameChatLineProps): React.ReactElement {
    const line = props.line;
    const lastLine = props.lastLine;
    const goban_controller = useGobanControllerOrNull();
    const goban = goban_controller?.goban ?? null;
    const origMoveRef = React.useRef<MoveTree | null>(null);
    const stashedPenMarksRef = React.useRef<unknown[] | null>(null);
    const ts = line.date ? new Date(line.date * 1000) : null;
    const body = line.body;
    const isMe = typeof body === "string" && body.startsWith("/me ");
    const bodyText = isMe ? body.substring(4) : body;
    let show_date: React.ReactElement | null = null;
    let move_number: React.ReactElement | null = null;

    if (!lastLine || (line.date && lastLine.date)) {
        if (line.date) {
            if (
                !lastLine ||
                moment(new Date(line.date * 1000)).format("YYYY-MM-DD") !==
                    moment(new Date(lastLine.date * 1000)).format("YYYY-MM-DD")
            ) {
                show_date = (
                    <div className="date">{moment(new Date(line.date * 1000)).format("LL")}</div>
                );
            }
        }
    }

    if (
        !lastLine ||
        line.move_number !== lastLine.move_number ||
        line.from !== lastLine.from ||
        line.moves !== lastLine.moves
    ) {
        const jumpToMove = () => {
            if (!goban_controller) {
                return;
            }

            const goban = goban_controller.goban;
            goban_controller.stopEstimatingScore();

            if ((line.from ?? -1) >= 0 && "moves" in line) {
                goban.engine.followPath(line.from as number, line.moves as string);
                goban.syncReviewMove();
                goban.drawPenMarks(goban.engine.cur_move.pen_marks);
                goban.redraw();
            } else if ("move_number" in line) {
                if (!goban.isAnalysisDisabled()) {
                    goban.setMode("analyze");
                }

                goban.engine.followPath(line.move_number as number, "");
                goban.redraw();

                if (goban.isAnalysisDisabled()) {
                    goban.updatePlayerToMoveTitle();
                }

                goban.emit("update");
            }
        };

        move_number = (
            <LineText className="move-number" onClick={jumpToMove}>
                {pgettext("Label for a jump-to-move control in game chat", "Move")}{" "}
                {line.move_number}
            </LineText>
        );
    }

    const chatId = `${getChatIdPrefix(props.gameId, props.reviewId)}.${line.channel}.${line.chat_id}`;

    return (
        <div className="GameChatLine">
            <div className="chat-line-container" data-chat-id={chatId}>
                {move_number}
                {show_date}
                <div
                    className={`chat-line ${line.channel} ${isMe ? "third-person" : ""} chat-user-${line.player_id}`}
                >
                    {ts && (
                        <span className="timestamp">
                            [
                            {ts.getHours() +
                                ":" +
                                (ts.getMinutes() < 10 ? "0" : "") +
                                ts.getMinutes()}
                            ]{" "}
                        </span>
                    )}
                    {(line.player_id || null) && (
                        <Player user={line} flare disableCacheUpdate tabIndex={-1} />
                    )}
                    <span className="body">
                        {isMe ? " " : ": "}
                        {typeof bodyText === "string" ? (
                            <React.Fragment>{renderChatBodyText(bodyText, goban)}</React.Fragment>
                        ) : (
                            <TypedGameChatBody
                                body={bodyText}
                                goban_controller={goban_controller}
                                goban={goban}
                                origMoveRef={origMoveRef}
                                stashedPenMarksRef={stashedPenMarksRef}
                            />
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}

interface TypedGameChatBodyProps {
    body: Exclude<protocol.GameChatLine["body"], string>;
    goban_controller: ReturnType<typeof useGobanControllerOrNull>;
    goban: Goban | null;
    origMoveRef: React.MutableRefObject<MoveTree | null>;
    stashedPenMarksRef: React.MutableRefObject<unknown[] | null>;
}

function TypedGameChatBody({
    body,
    goban_controller,
    goban,
    origMoveRef,
    stashedPenMarksRef,
}: TypedGameChatBodyProps): React.ReactElement {
    switch (body.type) {
        case "analysis": {
            if (!goban_controller || !preferences.get("variations-in-chat-enabled")) {
                return (
                    <span>
                        {interpolate(
                            pgettext(
                                "Posted analysis variation, non-interactive label",
                                "Variation: {{name}}",
                            ),
                            {
                                name: body.name ? profanity_filter(body.name) : "<error>",
                            },
                        )}
                    </span>
                );
            }

            const variationNumber = Number.parseInt(
                body.name ? body.name.replace(/^[^0-9]*/, "") : "0",
                10,
            );
            if (variationNumber) {
                goban_controller.last_variation_number = Math.max(
                    variationNumber,
                    goban_controller.last_variation_number,
                );
            }

            const onLeave = () => {
                if (!goban_controller.in_pushed_analysis || !goban) {
                    return;
                }

                goban_controller.setInPushedAnalysis(false);
                delete goban_controller.onPushAnalysisLeft;
                goban.engine.cur_move.popStashedMarks();
                goban.engine.jumpTo(origMoveRef.current);
                if (origMoveRef.current) {
                    origMoveRef.current.popStashedMarks();
                }
                goban.pen_marks = stashedPenMarksRef.current ?? [];
                if (goban.pen_marks.length === 0) {
                    goban.disablePen();
                }
                goban.redraw();
            };

            const onEnter = () => {
                if (!goban) {
                    return;
                }

                goban_controller.setInPushedAnalysis(true);
                goban_controller.onPushAnalysisLeft = onLeave;

                const turn =
                    "branch_move" in body ? (body.branch_move ?? -1) - 1 : (body.from ?? -1);
                const moves = body.moves;

                origMoveRef.current = goban.engine.cur_move;
                if (origMoveRef.current) {
                    origMoveRef.current.stashMarks();
                }
                if (moves || moves === "") {
                    goban.engine.followPath(turn, moves);
                }

                if (body.marks) {
                    goban.engine.cur_move.stashMarks();
                    goban.setMarks(body.marks);
                }

                stashedPenMarksRef.current = goban.pen_marks;
                if (body.pen_marks) {
                    goban.pen_marks = [...body.pen_marks];
                } else {
                    goban.pen_marks = [];
                }

                goban.redraw();
            };

            const onClick = () => {
                if (!goban) {
                    return;
                }

                goban_controller.stopEstimatingScore();
                onLeave();
                goban.setMode("analyze");
                onEnter();
                goban_controller.setInPushedAnalysis(false);
                goban.updateTitleAndStonePlacement();
                goban.syncReviewMove();
                goban.redraw();
            };

            return (
                <span
                    className="variation"
                    onMouseEnter={onEnter}
                    onMouseLeave={onLeave}
                    onClick={onClick}
                >
                    {interpolate(
                        pgettext("Posted analysis variation label", "Variation: {{name}}"),
                        {
                            name: body.name ? profanity_filter(body.name) : "<error>",
                        },
                    )}
                </span>
            );
        }
        case "review":
            return (
                <Link to={`/review/${body.review_id}`}>
                    {interpolate(_("Review: ##{{id}}"), { id: body.review_id })}
                </Link>
            );
        default:
            return (
                <span>
                    {pgettext(
                        "Fallback for an unknown typed chat message body",
                        "[unknown chat message]",
                    )}
                </span>
            );
    }
}
