/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { ViewMode } from "./util";
import { _, interpolate, pgettext } from "translate";
import * as data from "data";
import {
    Goban,
    JGOFNumericPlayerColor,
    GoConditionalMove,
    GobanModes,
    GoEnginePhase,
    AnalysisTool,
    MoveTree,
    PlayerColor,
} from "goban";
import { game_control } from "./game_control";
import { isLiveGame } from "TimeControl";
import * as preferences from "preferences";
import device from "device";
import swal from "sweetalert2";
import { challengeRematch } from "ChallengeModal";
import { Clock } from "Clock";
import { getOutcomeTranslation } from "misc";
import { PlayerCacheEntry } from "player_cache";
import { Link } from "react-router-dom";
import { Resizable } from "Resizable";
import { ChatMode } from "./GameChat";
import { PersistentElement } from "PersistentElement";
import { toast } from "toast";
import { errorAlerter } from "misc";
import { close_all_popovers } from "popover";
import { setExtraActionCallback, Player } from "Player";

interface PlayControlsProps {
    goban: Goban;
    player_to_move: number;

    // Cancel buttons are in props because the Cancel Button is placed below
    // chat on mobile.
    show_cancel: boolean;
    onCancel: () => void;
    resign_text: string;

    view_mode: ViewMode;
    user_is_player: boolean;

    review_list: Array<{ owner: PlayerCacheEntry; id: number }>;

    stashed_conditional_moves: GoConditionalMove;

    mode: GobanModes;
    phase: GoEnginePhase;

    title: string;
    show_title: boolean;

    renderEstimateScore: () => JSX.Element;
    renderAnalyzeButtonBar: () => JSX.Element;
    setMoveTreeContainer: (r: Resizable) => void;

    // TODO: turn this into one render prop so that we don't have to pass these
    // props to both PlayControls and ReviewControls (at this time ReviewControls
    // doesn't exist, but we will extract frag_review_controls for this purpose)
    onShareAnalysis: () => void;
    variation_name: string;
    updateVariationName: React.ChangeEventHandler<HTMLInputElement>;
    variationKeyPress: React.KeyboardEventHandler<HTMLInputElement>;

    annulled: boolean;

    zen_mode: boolean;

    selected_chat_log: ChatMode;

    stopEstimatingScore: () => void;
}

export function PlayControls({
    show_cancel,
    goban,
    review_list,
    stashed_conditional_moves,
    mode,
    phase,
    resign_text,
    onCancel,
    view_mode,
    title,
    show_title,
    renderEstimateScore,
    annulled,
    user_is_player,
    renderAnalyzeButtonBar,
    setMoveTreeContainer,
    zen_mode,
    selected_chat_log,
    onShareAnalysis,
    player_to_move,
    variation_name,
    updateVariationName,
    variationKeyPress,
    stopEstimatingScore,
}: PlayControlsProps): JSX.Element {
    const user = data.get("user");

    if (!goban) {
        return null;
    }

    const engine = goban.engine;

    const user_is_active_player = [engine.players.black.id, engine.players.white.id].includes(
        user.id,
    );

    const return_url = React.useRef<string>(); // url to return to after a game is over
    React.useEffect(() => {
        try {
            return_url.current =
                new URLSearchParams(window.location.search).get("return") || undefined;
        } catch (e) {
            console.error(e);
        }
    }, [goban]);

    const stone_removal_accept_timeout = React.useRef<NodeJS.Timeout>();
    const [black_accepted, set_black_accepted] = React.useState(
        stoneRemovalAccepted(goban, "black"),
    );
    const [white_accepted, set_white_accepted] = React.useState(
        stoneRemovalAccepted(goban, "white"),
    );
    React.useEffect(() => {
        const syncStoneRemovalAcceptance = () => {
            if (goban.engine.phase === "stone removal") {
                if (stone_removal_accept_timeout.current) {
                    clearTimeout(stone_removal_accept_timeout.current);
                }

                // TODO: Convert this way old jquery crap to React
                const gsra = $("#game-stone-removal-accept");
                gsra.prop("disabled", true);
                stone_removal_accept_timeout.current = setTimeout(
                    () => {
                        gsra.prop("disabled", false);
                        stone_removal_accept_timeout.current = null;
                    },
                    device.is_mobile ? 3000 : 1500,
                );

                set_black_accepted(stoneRemovalAccepted(goban, "black"));
                set_white_accepted(stoneRemovalAccepted(goban, "white"));
            }
        };
        syncStoneRemovalAcceptance();

        goban.on("load", syncStoneRemovalAcceptance);
        goban.on("phase", syncStoneRemovalAcceptance);
        goban.on("mode", syncStoneRemovalAcceptance);
        goban.on("outcome", syncStoneRemovalAcceptance);
        goban.on("stone-removal.accepted", syncStoneRemovalAcceptance);
        goban.on("stone-removal.updated", syncStoneRemovalAcceptance);
    }, [goban]);

    const [strict_seki_mode, set_strict_seki_mode] = React.useState(goban.engine.strict_seki_mode);
    React.useEffect(() => {
        goban.on("load", () => set_strict_seki_mode(goban.engine.strict_seki_mode));
        goban.on("strict_seki_mode", set_strict_seki_mode);
    }, [goban]);

    const [paused, setPaused] = React.useState(goban.pause_control && !!goban.pause_control.paused);
    React.useEffect(() => {
        goban.on("load", () => setPaused(goban.pause_control && !!goban.pause_control.paused));
        goban.on("paused", setPaused);
    }, [goban]);

    const [cur_move_number, setCurMoveNumber] = React.useState(
        goban.engine.cur_move?.move_number || -1,
    );
    React.useEffect(() => {
        goban.on("load", () => setCurMoveNumber(goban.engine.cur_move?.move_number || -1));
        goban.on("cur_move", (move) => setCurMoveNumber(move.move_number));
    }, [goban]);

    const [show_undo_requested, setShowUndoRequested] = React.useState(
        goban.engine.undo_requested === goban.engine.last_official_move.move_number,
    );
    React.useEffect(() => {
        const syncShowUndoRequested = () => {
            if (game_control.in_pushed_analysis) {
                return;
            }

            setShowUndoRequested(
                goban.engine.undo_requested === goban.engine.last_official_move.move_number,
            );
        };
        syncShowUndoRequested();

        goban.on("load", syncShowUndoRequested);
        goban.on("undo_requested", syncShowUndoRequested);
        goban.on("last_official_move", syncShowUndoRequested);
    });

    const [winner, set_winner] = React.useState(goban.engine.winner);
    React.useEffect(() => {
        console.log("new goban");
        goban.on("load", () => set_winner(goban.engine.winner));
        goban.on("winner", set_winner);
    }, [goban]);

    const [official_move_number, set_official_move_number] = React.useState(
        goban.engine.last_official_move?.move_number || -1,
    );
    React.useEffect(() => {
        goban.on("load", () =>
            set_official_move_number(goban.engine.last_official_move?.move_number || -1),
        );
        goban.on("last_official_move", (move) => set_official_move_number(move.move_number));
    }, [goban]);

    const [rules, set_rules] = React.useState(goban.engine.rules);
    React.useEffect(() => {
        goban.on("load", () => set_rules(goban.engine.rules));
        goban.on("rules", set_rules);
    }, [goban]);

    const conditional_move_tree = React.useRef<Element>();
    // Since the values of conditional_move_list and selected_conditional_move are
    // never accessed outside of createConditionalMoveTreeDisplay
    const conditional_move_list = React.useRef<any[]>([]);
    const selected_conditional_move = React.useRef<any>();
    React.useEffect(() => {
        conditional_move_tree.current = $("<div class='conditional-move-tree-container'/>")[0];

        const sync_conditional_tree = () => {
            if (goban.mode === "conditional") {
                const tree = $(conditional_move_tree.current);
                tree.empty();
                selected_conditional_move.current = null;
                conditional_move_list.current = [];
                const elts = createConditionalMoveTreeDisplay(
                    goban,
                    selected_conditional_move,
                    conditional_move_list,
                    goban.conditional_tree,
                    "",
                    goban.conditional_starting_color === "black",
                );
                for (let i = 0; i < elts.length; ++i) {
                    tree.append(elts[i]);
                }
            }
        };

        goban.on("load", () => sync_conditional_tree());
        goban.on("mode", sync_conditional_tree);
        goban.on("conditional-moves.updated", sync_conditional_tree);
    }, [goban]);

    const goban_setMode_play = () => {
        goban.setMode("play");
        if (stashed_conditional_moves) {
            goban.setConditionalTree(stashed_conditional_moves);
            stashed_conditional_moves = null;
        }
    };
    const goban_resumeGame = () => {
        goban.resumeGame();
    };
    const goban_jumpToLastOfficialMove = () => {
        goban.jumpToLastOfficialMove();
    };
    const acceptConditionalMoves = () => {
        stashed_conditional_moves = null;
        goban.saveConditionalMoves();
        goban.setMode("play");
    };

    const rematch = () => {
        try {
            $(document.activeElement).blur();
        } catch (e) {
            console.error(e);
        }

        challengeRematch(
            goban,
            data.get("user").id === goban.engine.players.black.id
                ? goban.engine.players.white
                : goban.engine.players.black,
            goban.engine.config,
        );
    };
    const onStoneRemovalCancel = () => {
        swal({ text: _("Are you sure you want to resume the game?"), showCancelButton: true })
            .then(() => goban.rejectRemovedStones())
            .catch(() => 0);
        return false;
    };
    const onStoneRemovalAccept = () => {
        goban.acceptRemovedStones();
        return false;
    };
    const onStoneRemovalAutoScore = () => {
        goban.autoScore();
        return false;
    };

    return (
        <div className="play-controls">
            <div className="game-action-buttons">
                {((mode === "play" && phase === "play") || null) && (
                    <PlayButtons
                        resign_text={resign_text}
                        show_undo_requested={show_undo_requested}
                        cur_move_number={cur_move_number}
                        player_to_move={player_to_move}
                        onCancel={onCancel}
                        goban={goban}
                        show_cancel={show_cancel}
                        view_mode={view_mode}
                        user_is_player={user_is_player}
                    />
                )}
            </div>
            <div className="game-state">
                {((mode === "play" && phase === "play") || null) && (
                    <span>
                        {show_undo_requested ? (
                            <span>{_("Undo Requested")}</span>
                        ) : (
                            <span>
                                {((show_title && !goban?.engine?.rengo) || null) && (
                                    <span>{title}</span>
                                )}
                            </span>
                        )}
                    </span>
                )}
                {((mode === "play" && phase === "stone removal") || null) && (
                    <span>{_("Stone Removal Phase")}</span>
                )}

                {(mode === "analyze" || null) && (
                    <span>
                        {show_undo_requested ? (
                            <span>{_("Undo Requested")}</span>
                        ) : (
                            <span>{_("Analyze Mode")}</span>
                        )}
                    </span>
                )}

                {(mode === "conditional" || null) && <span>{_("Conditional Move Planner")}</span>}

                {(mode === "score estimation" || null) && renderEstimateScore()}

                {((mode === "play" && phase === "finished") || null) && (
                    <span style={{ textDecoration: annulled ? "line-through" : "none" }}>
                        {winner
                            ? interpolate(
                                  pgettext("Game winner", "{{color}} wins by {{outcome}}"),
                                  {
                                      // When is winner an id?
                                      color:
                                          (winner as any) === engine.players.black.id ||
                                          winner === "black"
                                              ? _("Black")
                                              : _("White"),
                                      outcome: getOutcomeTranslation(engine.outcome),
                                  },
                              )
                            : interpolate(pgettext("Game winner", "Tie by {{outcome}}"), {
                                  outcome: pgettext("Game outcome", engine.outcome),
                              })}
                    </span>
                )}
            </div>
            <div className="annulled-indicator">
                {annulled &&
                    pgettext("Displayed to the user when the game is annulled", "Game Annulled")}
            </div>
            {((phase === "play" &&
                mode === "play" &&
                paused &&
                goban.pause_control &&
                goban.pause_control.paused) ||
                null) && (
                <div className="pause-controls">
                    <h3>{_("Game Paused")}</h3>
                    {(user_is_player || user.is_moderator || null) && (
                        <button className="info" onClick={goban_resumeGame}>
                            {_("Resume")}
                        </button>
                    )}
                    <div>
                        {engine.players.black.id === goban.pause_control.paused.pausing_player_id ||
                        (engine.rengo &&
                            engine.rengo_teams.black
                                .map((p) => p.id)
                                .includes(goban.pause_control.paused.pausing_player_id))
                            ? interpolate(_("{{pauses_left}} pauses left for Black"), {
                                  pauses_left: goban.pause_control.paused.pauses_left,
                              })
                            : interpolate(_("{{pauses_left}} pauses left for White"), {
                                  pauses_left: goban.pause_control.paused.pauses_left,
                              })}
                    </div>
                </div>
            )}

            {((goban.pause_control && goban.pause_control.moderator_paused && user.is_moderator) ||
                null) && (
                <div className="pause-controls">
                    <h3>{_("Paused by Moderator")}</h3>
                    <button className="info" onClick={goban_resumeGame}>
                        {_("Resume")}
                    </button>
                </div>
            )}
            {(phase === "finished" || null) && (
                <div className="analyze-mode-buttons">
                    {" "}
                    {/* not really analyze mode, but equivalent button position and look*/}
                    {((user_is_player && mode !== "score estimation" && !engine.rengo) || null) && (
                        <button onClick={rematch} className="primary">
                            {_("Rematch")}
                        </button>
                    )}
                    {(review_list.length > 0 || null) && (
                        <div className="review-list">
                            <h3>{_("Reviews")}</h3>
                            {review_list.map((review, idx) => (
                                <div key={idx}>
                                    <Player user={review.owner} icon></Player> -{" "}
                                    <Link to={`/review/${review.id}`}>{_("view")}</Link>
                                </div>
                            ))}
                        </div>
                    )}
                    {(return_url.current || null) && (
                        <div className="return-url">
                            <a href={return_url.current} rel="noopener">
                                {interpolate(
                                    pgettext(
                                        "Link to where the user came from",
                                        "Return to {{url}}",
                                    ),
                                    {
                                        url: return_url.current,
                                    },
                                )}
                            </a>
                        </div>
                    )}
                </div>
            )}
            {(phase === "stone removal" || null) && (
                <div className="stone-removal-controls">
                    <div>
                        {(user_is_active_player || user.is_moderator || null) && ( // moderators see the button, with its timer, but can't press it
                            <button
                                id="game-stone-removal-accept"
                                className={
                                    user.is_moderator && !user_is_active_player ? "" : "primary"
                                }
                                disabled={user.is_moderator && !user_is_active_player}
                                onClick={onStoneRemovalAccept}
                            >
                                {_("Accept removed stones")}
                                <Clock goban={goban} color="stone-removal" />
                            </button>
                        )}
                    </div>
                    <br />
                    <div style={{ textAlign: "center" }}>
                        <div style={{ textAlign: "left", display: "inline-block" }}>
                            <div>
                                {(black_accepted || null) && (
                                    <i
                                        className="fa fa-check"
                                        style={{ color: "green", width: "1.5em" }}
                                    ></i>
                                )}
                                {(!black_accepted || null) && (
                                    <i
                                        className="fa fa-times"
                                        style={{ color: "red", width: "1.5em" }}
                                    ></i>
                                )}
                                {engine.players.black.username}
                            </div>
                            <div>
                                {(white_accepted || null) && (
                                    <i
                                        className="fa fa-check"
                                        style={{ color: "green", width: "1.5em" }}
                                    ></i>
                                )}
                                {(!white_accepted || null) && (
                                    <i
                                        className="fa fa-times"
                                        style={{ color: "red", width: "1.5em" }}
                                    ></i>
                                )}
                                {engine.players.white.username}
                            </div>
                        </div>
                    </div>
                    <br />

                    <div style={{ textAlign: "center" }}>
                        {(user_is_player || null) && (
                            <button
                                id="game-stone-removal-auto-score"
                                onClick={onStoneRemovalAutoScore}
                            >
                                {_("Auto-score")}
                            </button>
                        )}
                    </div>
                    <div style={{ textAlign: "center" }}>
                        {(user_is_player || null) && (
                            <button id="game-stone-removal-cancel" onClick={onStoneRemovalCancel}>
                                {_("Cancel and resume game")}
                            </button>
                        )}
                    </div>

                    <div className="explanation">
                        {_(
                            "In this phase, both players select and agree upon which groups should be considered captured and should be removed for the purposes of scoring.",
                        )}
                    </div>

                    {null /* just going to disable this for now, no one cares I don't think */ &&
                        (rules === "japanese" || rules === "korean" || null) && (
                            <div
                                style={{
                                    paddingTop: "2rem",
                                    paddingBottom: "2rem",
                                    textAlign: "center",
                                }}
                            >
                                <label
                                    style={{ display: "inline-block" }}
                                    htmlFor="strict-seki-mode"
                                >
                                    {pgettext(
                                        "Enable Japanese territory in seki rule",
                                        "Strict Scoring",
                                    )}
                                </label>
                                <input
                                    style={{ marginTop: "-0.2em" }}
                                    name="strict-seki-mode"
                                    type="checkbox"
                                    checked={strict_seki_mode}
                                    disabled={!user_is_player}
                                    onChange={(ev) => goban.setStrictSekiMode(ev.target.checked)}
                                ></input>
                            </div>
                        )}
                </div>
            )}
            {(mode === "conditional" || null) && (
                <div className="conditional-move-planner">
                    <div className="buttons">
                        <button className="primary" onClick={acceptConditionalMoves}>
                            {_("Accept Conditional moves")}
                        </button>
                        <button onClick={goban_setMode_play}>{_("Cancel")}</button>
                    </div>
                    <div className="ctrl-conditional-tree">
                        <hr />
                        <span className="move-current" onClick={goban_jumpToLastOfficialMove}>
                            {_("Current Move")}
                        </span>
                        <PersistentElement elt={conditional_move_tree.current as HTMLElement} />
                    </div>
                </div>
            )}
            {(mode === "analyze" || null) && (
                <div>
                    {renderAnalyzeButtonBar()}

                    <Resizable
                        id="move-tree-container"
                        className="vertically-resizable"
                        ref={setMoveTreeContainer}
                    />

                    {(!zen_mode || null) && (
                        <div style={{ padding: "0.5em" }}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className={`form-control ${selected_chat_log}`}
                                    placeholder={_("Variation name...")}
                                    value={variation_name}
                                    onChange={updateVariationName}
                                    onKeyDown={variationKeyPress}
                                    disabled={user.anonymous}
                                />
                                <ShareAnalysisButton
                                    selected_chat_log={selected_chat_log}
                                    isUserAnonymous={user.anonymous}
                                    shareAnalysis={onShareAnalysis}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
            {((mode === "play" &&
                phase === "play" &&
                goban.isAnalysisDisabled() &&
                cur_move_number < official_move_number) ||
                null) && (
                <div className="analyze-mode-buttons">
                    <span>
                        <button
                            className="sm primary bold"
                            onClick={() => goban.setModeDeferred("play")}
                        >
                            {_("Back to Game")}
                        </button>
                    </span>
                </div>
            )}
            {(mode === "score estimation" || null) && (
                <div className="analyze-mode-buttons">
                    <span>
                        <button className="sm primary bold" onClick={stopEstimatingScore}>
                            {_("Back to Board")}
                        </button>
                    </span>
                </div>
            )}
        </div>
    );
}

interface PlayButtonsProps {
    cur_move_number: number;
    goban: Goban;
    player_to_move: number;
    // Is this variable any different from show_accept_undo? -BPJ
    show_undo_requested: boolean;

    // Cancel buttons are in props because the Cancel Button is placed below
    // chat on mobile.
    show_cancel: boolean;
    onCancel: () => void;

    view_mode: ViewMode;
    resign_text: string;
    user_is_player: boolean;
}

function PlayButtons({
    cur_move_number,
    goban,
    player_to_move,
    show_undo_requested,
    show_cancel,
    onCancel,
    view_mode,
    resign_text,
    user_is_player,
}: PlayButtonsProps) {
    const engine = goban.engine;
    const phase = engine.phase;

    const real_player_to_move =
        engine.last_official_move?.player === JGOFNumericPlayerColor.BLACK
            ? engine.players.white.id
            : engine.players.black.id;
    const is_my_move = real_player_to_move === data.get("user").id;

    const [show_submit, setShowSubmit] = React.useState(false);
    React.useEffect(() => {
        const syncShowSubmit = () => {
            setShowSubmit(
                !!goban.submit_move &&
                    goban.engine.cur_move &&
                    goban.engine.cur_move.parent &&
                    goban.engine.last_official_move &&
                    goban.engine.cur_move.parent.id === goban.engine.last_official_move.id,
            );
        };
        syncShowSubmit();

        goban.on("submit_move", syncShowSubmit);
        goban.on("last_official_move", syncShowSubmit);
        goban.on("cur_move", syncShowSubmit);
    }, [goban]);

    const [show_accept_undo, setShowAcceptUndo] = React.useState<boolean>(false);
    React.useEffect(() => {
        const syncShowAcceptUndo = () => {
            if (game_control.in_pushed_analysis) {
                return;
            }

            setShowAcceptUndo(
                goban.engine.playerToMove() === data.get("user").id ||
                    (goban.submit_move != null &&
                        goban.engine.playerNotToMove() === data.get("user").id) ||
                    null,
            );
        };
        syncShowAcceptUndo();

        goban.on("cur_move", syncShowAcceptUndo);
        goban.on("submit_move", syncShowAcceptUndo);
    }, [goban]);

    const onUndo = () => {
        if (
            data.get("user").id === goban.engine.playerNotToMove() &&
            goban.engine.undo_requested !== goban.engine.getMoveNumber()
        ) {
            goban.requestUndo();
        }
    };

    const pass = () => {
        if (!isLiveGame(goban.engine.time_control) || !preferences.get("one-click-submit-live")) {
            swal({ text: _("Are you sure you want to pass?"), showCancelButton: true })
                .then(() => goban.pass())
                .catch(() => 0);
        } else {
            goban.pass();
        }
    };

    const [submitting_move, setSubmittingMove] = React.useState(false);
    React.useEffect(() => {
        goban.on("submitting-move", setSubmittingMove);
    }, [goban]);

    return (
        <span className="play-buttons">
            <span>
                {((cur_move_number >= 1 &&
                    !engine.rengo &&
                    player_to_move !== data.get("user").id &&
                    !(engine.undo_requested >= engine.getMoveNumber()) &&
                    goban.submit_move == null) ||
                    null) && (
                    <button className="bold undo-button xs" onClick={onUndo}>
                        {_("Undo")}
                    </button>
                )}
                {show_undo_requested && (
                    <span>
                        {show_accept_undo && (
                            <button
                                className="sm primary bold accept-undo-button"
                                onClick={() => goban.acceptUndo()}
                            >
                                {_("Accept Undo")}
                            </button>
                        )}
                    </span>
                )}
            </span>
            <span>
                {((!show_submit && is_my_move && engine.handicapMovesLeft() === 0) || null) && (
                    <button className="sm primary bold pass-button" onClick={pass}>
                        {_("Pass")}
                    </button>
                )}
                {((show_submit && engine.undo_requested !== engine.getMoveNumber()) || null) && (
                    <button
                        className="sm primary bold submit-button"
                        id="game-submit-move"
                        disabled={submitting_move}
                        onClick={() => goban.submit_move()}
                    >
                        {_("Submit Move")}
                    </button>
                )}
            </span>
            <span>
                {((show_cancel && user_is_player && phase !== "finished") || null) && (
                    <CancelButton view_mode={view_mode} onClick={onCancel}>
                        {resign_text}
                    </CancelButton>
                )}
            </span>
        </span>
    );
}

interface CancelButtonProps {
    view_mode: ViewMode;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    children: string;
}
export function CancelButton({ view_mode, onClick, children }: CancelButtonProps) {
    if (view_mode === "portrait") {
        return (
            <button className="bold cancel-button reject" onClick={onClick}>
                {children}
            </button>
        );
    } else {
        return (
            <button className="xs bold cancel-button" onClick={onClick}>
                {children}
            </button>
        );
    }
}

function createConditionalMoveTreeDisplay(
    goban: Goban,
    selected_conditional_move: React.MutableRefObject<any | undefined>,
    conditional_move_list: React.MutableRefObject<any[]>,
    root: any,
    cpath: string,
    blacks_move: boolean,
) {
    const mkcb = (path: string) => {
        return () => {
            goban.jumpToLastOfficialMove();
            goban.followConditionalPath(path);
            goban.redraw();
        };
    };
    const mkdelcb = (path: string) => {
        return () => {
            goban.jumpToLastOfficialMove();
            goban.deleteConditionalPath(path);
            goban.redraw();
        };
    };

    const color1 = blacks_move ? "black" : "white";
    const color2 = blacks_move ? "white" : "black";

    let ret = null;
    const ul = $("<ul>").addClass("tree");
    if (root.move) {
        if (cpath + root.move === goban.getCurrentConditionalPath()) {
            selected_conditional_move.current = cpath + root.move;
        }
        conditional_move_list.current.push(cpath + root.move);

        const mv = goban.engine.decodeMoves(root.move)[0];

        const delete_icon = $("<i>")
            .addClass("fa fa-times")
            .addClass("delete-move")
            .click(mkdelcb(cpath + root.move));

        ret = [
            $("<span>")
                .addClass("entry")
                .append($("<span>").addClass("stone " + color2))
                .append($("<span>").html(goban.engine.prettyCoords(mv.x, mv.y)))
                .addClass(cpath + root.move === goban.getCurrentConditionalPath() ? "selected" : "")
                .click(mkcb(cpath + root.move)),
        ];

        if (cpath + root.move === goban.getCurrentConditionalPath()) {
            // selected move
            ret.push(delete_icon);
        }
        ret.push(ul);

        cpath += root.move;
    } else {
        ret = [ul];
    }

    for (const ch in root.children) {
        if (cpath + ch === goban.getCurrentConditionalPath()) {
            selected_conditional_move.current = cpath + ch;
        }
        conditional_move_list.current.push(cpath + ch);

        const li = $("<li>").addClass("move-row");
        const mv = goban.engine.decodeMoves(ch)[0];
        const span = $("<span>")
            .addClass("entry")
            .append($("<span>").addClass("stone " + color1))
            .append($("<span>").html(goban.engine.prettyCoords(mv.x, mv.y)))
            .addClass(cpath + ch === goban.getCurrentConditionalPath() ? "selected" : "")
            .click(mkcb(cpath + ch));
        li.append(span);

        const elts = createConditionalMoveTreeDisplay(
            goban,
            selected_conditional_move,
            conditional_move_list,
            root.children[ch],
            cpath + ch,
            blacks_move,
        );
        for (let i = 0; i < elts.length; ++i) {
            li.append(elts[i]);
        }

        ul.append(li);
    }
    return ret;
}

interface EstimateScoreProps {
    score_estimate_winner: string;
    score_estimate_amount?: number;
}
export function EstimateScore({
    score_estimate_winner,
    score_estimate_amount,
}: EstimateScoreProps) {
    return (
        <span>
            {(score_estimate_winner || null) && (
                <span>
                    {interpolate(_("{{winner}} by {{score}}"), {
                        winner: score_estimate_winner,
                        score: score_estimate_amount?.toFixed(1),
                    })}
                </span>
            )}
            {(!score_estimate_winner || null) && <span>{_("Estimating...")}</span>}
        </span>
    );
}

interface AnalyzeButtonBarProps {
    goban: Goban;
    setAnalyzeTool: (tool: AnalysisTool, subtool: string) => boolean;
    setAnalyzePencilColor: (color: string) => void;
    analyze_pencil_color: string;
    is_review: boolean;
    mode: GobanModes;
    copied_node: React.MutableRefObject<MoveTree>;

    // called when user passes in analysis
    // Is this still needed? I think an event could be emitted to similar effect... -BPJ
    forceUpdate: (nonce: number) => void;
}
export function AnalyzeButtonBar({
    goban,
    setAnalyzeTool,
    setAnalyzePencilColor,
    analyze_pencil_color,
    forceUpdate,
    is_review,
    mode,
    copied_node,
}: AnalyzeButtonBarProps) {
    const [analyze_tool, set_analyze_tool] = React.useState<AnalysisTool>();
    const [analyze_subtool, set_analyze_subtool] = React.useState<string>();
    React.useEffect(() => {
        goban.on("load", () => {
            set_analyze_tool(goban.analyze_tool);
            set_analyze_subtool(goban.analyze_subtool);
        });
        goban.on("analyze_tool", set_analyze_tool);
        goban.on("analyze_subtool", set_analyze_subtool);
    });

    const setPencilColor = (ev) => {
        const color = (ev.target as HTMLInputElement).value;
        if (goban.analyze_tool === "draw") {
            goban.analyze_subtool = color;
        }
        setAnalyzePencilColor(color);
    };
    const analysis_pass = () => {
        goban.pass();
        // Do we really need to forceUpdate here?
        forceUpdate(Math.random());
    };

    const goban_setModeDeferredPlay = () => {
        goban.setModeDeferred("play");
    };

    const clearAnalysisDrawing = () => {
        goban.syncReviewMove({ clearpen: true });
        goban.clearAnalysisDrawing();
    };

    return (
        <div className="game-analyze-button-bar">
            <div className="btn-group">
                <button
                    onClick={() => setAnalyzeTool("stone", "alternate")}
                    title={_("Place alternating stones")}
                    className={
                        "stone-button " +
                        (analyze_tool === "stone" &&
                        analyze_subtool !== "black" &&
                        analyze_subtool !== "white"
                            ? "active"
                            : "")
                    }
                >
                    <img
                        alt="alternate"
                        src={data.get("config.cdn_release") + "/img/black-white.png"}
                    />
                </button>

                <button
                    onClick={() => setAnalyzeTool("stone", "black")}
                    title={_("Place black stones")}
                    className={
                        "stone-button " +
                        (analyze_tool === "stone" && analyze_subtool === "black" ? "active" : "")
                    }
                >
                    <img alt="alternate" src={data.get("config.cdn_release") + "/img/black.png"} />
                </button>

                <button
                    onClick={() => setAnalyzeTool("stone", "white")}
                    title={_("Place white stones")}
                    className={
                        "stone-button " +
                        (analyze_tool === "stone" && analyze_subtool === "white" ? "active" : "")
                    }
                >
                    <img alt="alternate" src={data.get("config.cdn_release") + "/img/white.png"} />
                </button>
            </div>

            <div className="btn-group">
                <button
                    onClick={() => setAnalyzeTool("draw", analyze_pencil_color)}
                    title={_("Draw on the board with a pen")}
                    className={analyze_tool === "draw" ? "active" : ""}
                >
                    <i className="fa fa-pencil"></i>
                </button>
                <button onClick={clearAnalysisDrawing} title={_("Clear pen marks")}>
                    <i className="fa fa-eraser"></i>
                </button>
            </div>
            <input
                type="color"
                value={analyze_pencil_color}
                title={_("Select pen color")}
                onChange={setPencilColor}
            />

            <div className="btn-group">
                <button
                    onClick={() => copyBranch(goban, copied_node, mode)}
                    title={_("Copy this branch")}
                >
                    <i className="fa fa-clone"></i>
                </button>
                <button
                    disabled={copied_node.current === null}
                    onClick={() => pasteBranch(goban, copied_node, mode)}
                    title={_("Paste branch")}
                >
                    <i className="fa fa-clipboard"></i>
                </button>
                <button onClick={() => deleteBranch(goban, mode)} title={_("Delete branch")}>
                    <i className="fa fa-trash"></i>
                </button>
            </div>

            <div className="btn-group">
                <button
                    onClick={() => setAnalyzeTool("label", "letters")}
                    title={_("Place alphabetical labels")}
                    className={
                        analyze_tool === "label" && analyze_subtool === "letters" ? "active" : ""
                    }
                >
                    <i className="fa fa-font"></i>
                </button>
                <button
                    onClick={() => setAnalyzeTool("label", "numbers")}
                    title={_("Place numeric labels")}
                    className={
                        analyze_tool === "label" && analyze_subtool === "numbers" ? "active" : ""
                    }
                >
                    <i className="ogs-label-number"></i>
                </button>
                <button
                    onClick={() => setAnalyzeTool("label", "triangle")}
                    title={_("Place triangle marks")}
                    className={
                        analyze_tool === "label" && analyze_subtool === "triangle" ? "active" : ""
                    }
                >
                    <i className="ogs-label-triangle"></i>
                </button>
                <button
                    onClick={() => setAnalyzeTool("label", "square")}
                    title={_("Place square marks")}
                    className={
                        analyze_tool === "label" && analyze_subtool === "square" ? "active" : ""
                    }
                >
                    <i className="ogs-label-square"></i>
                </button>
                <button
                    onClick={() => setAnalyzeTool("label", "circle")}
                    title={_("Place circle marks")}
                    className={
                        analyze_tool === "label" && analyze_subtool === "circle" ? "active" : ""
                    }
                >
                    <i className="ogs-label-circle"></i>
                </button>
                <button
                    onClick={() => setAnalyzeTool("label", "cross")}
                    title={_("Place X marks")}
                    className={
                        analyze_tool === "label" && analyze_subtool === "cross" ? "active" : ""
                    }
                >
                    <i className="ogs-label-x"></i>
                </button>
            </div>
            <div className="analyze-mode-buttons">
                {(mode === "analyze" || null) && (
                    <span>
                        {(!is_review || null) && (
                            <button className="sm primary bold" onClick={goban_setModeDeferredPlay}>
                                {_("Back to Game")}
                            </button>
                        )}
                        <button className="sm primary bold pass-button" onClick={analysis_pass}>
                            {_("Pass")}
                        </button>
                    </span>
                )}
            </div>
        </div>
    );
}

export function copyBranch(
    goban: Goban,
    copied_node: React.MutableRefObject<MoveTree>,
    mode: GobanModes,
) {
    if (mode !== "analyze") {
        return;
    }

    try {
        /* Don't try to copy branches when the user is selecting stuff somewhere on the page */
        if (!window.getSelection().isCollapsed) {
            return;
        }
    } catch (e) {
        // ignore error
    }

    copied_node.current = goban.engine.cur_move;
    toast(<div>{_("Branch copied")}</div>, 1000);
}
export function pasteBranch(
    goban: Goban,
    copied_node: React.MutableRefObject<MoveTree>,
    mode: GobanModes,
) {
    if (mode !== "analyze") {
        return;
    }

    try {
        /* Don't try to paste branches when the user is selecting stuff somewhere on the page */
        if (!window.getSelection().isCollapsed) {
            return;
        }
    } catch (e) {
        // ignore error
    }

    if (copied_node.current) {
        const paste = (base: MoveTree, source: MoveTree) => {
            goban.engine.jumpTo(base);
            if (source.edited) {
                goban.engine.editPlace(source.x, source.y, source.player, false);
            } else {
                goban.engine.place(source.x, source.y, false, false, true, false, false);
            }
            const cur = goban.engine.cur_move;

            if (source.trunk_next) {
                paste(cur, source.trunk_next);
            }
            for (const branch of source.branches) {
                paste(cur, branch);
            }
        };

        try {
            paste(goban.engine.cur_move, copied_node.current);
        } catch (e) {
            errorAlerter(_("A move conflict has been detected"));
        }
        goban.syncReviewMove();
    } else {
        console.log("Nothing copied or cut to paste");
    }
}

export function deleteBranch(goban: Goban, mode: GobanModes) {
    if (mode !== "analyze") {
        return;
    }

    try {
        /* Don't try to delete branches when the user is selecting stuff somewhere on the page */
        if (!window.getSelection().isCollapsed) {
            return;
        }
    } catch (e) {
        // ignore error
    }

    if (goban.engine.cur_move.trunk) {
        swal({
            text: _(
                "The current position is not an explored branch, so there is nothing to delete",
            ),
        }).catch(swal.noop);
    } else {
        swal({
            text: _("Are you sure you wish to remove this move branch?"),
            showCancelButton: true,
        })
            .then(() => {
                goban.deleteBranch();
                goban.syncReviewMove();
            })
            .catch(() => 0);
    }
}

interface ReviewControlsProps {
    mode: GobanModes;
    goban: Goban;
    review_id: number;
    renderEstimateScore: () => JSX.Element;
    renderAnalyzeButtonBar: () => JSX.Element;
    setMoveTreeContainer: (r: Resizable) => void;

    // TODO: turn this into one render prop so that we don't have to pass these
    // props to both PlayControls and ReviewControls
    onShareAnalysis: () => void;
    variation_name: string;
    updateVariationName: React.ChangeEventHandler<HTMLInputElement>;
    variationKeyPress: React.KeyboardEventHandler<HTMLInputElement>;

    stopEstimatingScore: () => void;

    selected_chat_log: ChatMode;
}

export function ReviewControls({
    goban,
    mode,
    review_id,
    renderAnalyzeButtonBar,
    renderEstimateScore,
    setMoveTreeContainer,
    onShareAnalysis,
    variation_name,
    updateVariationName,
    variationKeyPress,
    stopEstimatingScore,
    selected_chat_log,
}: ReviewControlsProps) {
    const user = data.get("user");

    if (!goban) {
        return null;
    }

    const [review_owner_id, set_review_owner_id] = React.useState<number>();
    const [review_controller_id, set_review_controller_id] = React.useState<number>();
    const [review_out_of_sync, set_review_out_of_sync] = React.useState<boolean>();
    React.useEffect(() => {
        const renderExtraPlayerActions = (player_id: number) => {
            const user = data.get("user");
            if (
                review_id &&
                goban &&
                (goban.review_controller_id === user.id || goban.review_owner_id === user.id)
            ) {
                let is_owner = null;
                let is_controller = null;
                if (goban.review_owner_id === player_id) {
                    is_owner = (
                        <div style={{ fontStyle: "italic" }}>
                            {_("Owner") /* translators: Review owner */}
                        </div>
                    );
                }
                if (goban.review_controller_id === player_id) {
                    is_controller = (
                        <div style={{ fontStyle: "italic" }}>
                            {_("Controller") /* translators: Review controller */}
                        </div>
                    );
                }

                const give_control = (
                    <button
                        className="xs"
                        onClick={() => {
                            goban.giveReviewControl(player_id);
                            close_all_popovers();
                        }}
                    >
                        {
                            _(
                                "Give Control",
                            ) /* translators: Give control in review or on a demo board */
                        }
                    </button>
                );

                if (player_id === goban.review_owner_id) {
                    return (
                        <div>
                            {is_owner}
                            {is_controller}
                            <div className="actions">{give_control}</div>
                        </div>
                    );
                }

                return (
                    <div>
                        {is_owner}
                        {is_controller}
                        <div className="actions">{give_control}</div>
                    </div>
                );
            }
            return null;
        };
        setExtraActionCallback(renderExtraPlayerActions);
        const sync_review_out_of_sync = () => {
            const engine = goban.engine;
            set_review_out_of_sync(
                engine.cur_move &&
                    engine.cur_review_move &&
                    engine.cur_move.id !== engine.cur_review_move.id,
            );
        };

        goban.on("load", () => {
            set_review_owner_id(goban.review_owner_id);
            set_review_controller_id(goban.review_controller_id);
            sync_review_out_of_sync();
        });
        goban.on("review_owner_id", set_review_owner_id);
        goban.on("review_controller_id", set_review_controller_id);
        goban.on("cur_move", sync_review_out_of_sync);
    }, [goban]);

    const [move_text, set_move_text] = React.useState<string>();
    const updateMoveText = (ev) => {
        set_move_text(ev.target.value);
        goban.syncReviewMove(null, ev.target.value);
    };
    React.useEffect(() => {
        const sync_move_text = () => set_move_text(goban.engine.cur_move?.text || "");
        goban.on("load", sync_move_text);
        goban.on("cur_move", sync_move_text);
    }, [goban]);

    const syncToCurrentReviewMove = () => {
        if (goban.engine.cur_review_move) {
            goban.engine.jumpTo(goban.engine.cur_review_move);
        } else {
            setTimeout(syncToCurrentReviewMove, 50);
        }
    };
    React.useEffect(() => {
        goban.on("review.sync-to-current-move", syncToCurrentReviewMove);
    }, [goban]);

    return (
        <div className="play-controls">
            <div className="game-state">
                {(mode === "analyze" || null) && (
                    <div>
                        {_("Review by")}: <Player user={review_owner_id} />
                        {((review_controller_id && review_controller_id !== review_owner_id) ||
                            null) && (
                            <div>
                                {_("Review controller")}: <Player user={review_controller_id} />
                            </div>
                        )}
                    </div>
                )}

                {(mode === "score estimation" || null) && <div>{renderEstimateScore()}</div>}
            </div>
            {(mode === "analyze" || null) && (
                <div>
                    {renderAnalyzeButtonBar()}

                    <div className="space-around">
                        {review_controller_id &&
                            review_controller_id !== user.id &&
                            review_out_of_sync && (
                                <button className="sm" onClick={syncToCurrentReviewMove}>
                                    {pgettext("Synchronize to current review position", "Sync")}{" "}
                                    <i className="fa fa-refresh" />
                                </button>
                            )}
                    </div>

                    <Resizable
                        id="move-tree-container"
                        className="vertically-resizable"
                        ref={setMoveTreeContainer}
                    />

                    <div style={{ paddingLeft: "0.5em", paddingRight: "0.5em" }}>
                        <textarea
                            id="game-move-node-text"
                            placeholder={_("Move comments...")}
                            rows={5}
                            className="form-control"
                            value={move_text}
                            disabled={review_controller_id !== data.get("user").id}
                            onChange={updateMoveText}
                        ></textarea>
                    </div>

                    <div style={{ padding: "0.5em" }}>
                        <div className="input-group">
                            <input
                                type="text"
                                className={`form-control ${selected_chat_log}`}
                                placeholder={_("Variation name...")}
                                value={variation_name}
                                onChange={updateVariationName}
                                onKeyDown={variationKeyPress}
                                disabled={user.anonymous}
                            />
                            <button
                                className="sm"
                                type="button"
                                disabled={user.anonymous}
                                onClick={onShareAnalysis}
                            >
                                {_("Share")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {(mode === "score estimation" || null) && (
                <div className="analyze-mode-buttons">
                    <span>
                        <button className="sm primary bold" onClick={stopEstimatingScore}>
                            {_("Back to Review")}
                        </button>
                    </span>
                </div>
            )}
        </div>
    );
}

interface ShareAnalysisButtonProperties {
    selected_chat_log: ChatMode;
    shareAnalysis: () => void;
    isUserAnonymous: boolean;
}

function ShareAnalysisButton(props: ShareAnalysisButtonProperties): JSX.Element {
    const { selected_chat_log, isUserAnonymous, shareAnalysis } = props;
    switch (selected_chat_log) {
        case "malkovich":
        case "personal":
            return (
                <button
                    className="sm {selected_chat_log}"
                    type="button"
                    disabled={isUserAnonymous}
                    onClick={shareAnalysis}
                >
                    {_("Record")}
                </button>
            );
        default:
            return (
                <button
                    className="sm"
                    type="button"
                    disabled={isUserAnonymous}
                    onClick={shareAnalysis}
                >
                    {_("Share")}
                </button>
            );
    }
}

function stoneRemovalAccepted(goban: Goban, color: PlayerColor) {
    const engine = goban.engine;

    if (engine.phase !== "stone removal") {
        return undefined;
    }
    return engine.players[color].accepted_stones === engine.getStoneRemovalString();
}
