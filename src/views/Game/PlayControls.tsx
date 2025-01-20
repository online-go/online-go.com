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
import { useSearchParams } from "react-router-dom";
import { _, interpolate, pgettext } from "@/lib/translate";
import * as DynamicHelp from "react-dynamic-help";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import {
    ConditionalMoveResponseTree,
    GobanRenderer,
    Goban,
    ConditionalMoveTree,
    GobanModes,
    GobanEnginePhase,
    AnalysisTool,
    MoveTree,
    PlayerColor,
    JGOFSealingIntersection,
    GobanEngine,
    color_blend,
} from "goban";
import { game_control } from "./game_control";
import { alert } from "@/lib/swal_config";
import { challengeRematch } from "@/components/ChallengeModal";
import { Clock } from "@/components/Clock";
import { getOutcomeTranslation } from "@/lib/misc";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { Link } from "react-router-dom";
import { Resizable } from "@/components/Resizable";
import { ChatMode } from "./GameChat";
import { toast } from "@/lib/toast";
import { errorAlerter } from "@/lib/misc";
import { close_all_popovers } from "@/lib/popover";
import { setExtraActionCallback, Player } from "@/components/Player";
import { PlayButtons } from "./PlayButtons";
import {
    generateGobanHook,
    subscribeAllEvents,
    useCurrentMoveNumber,
    useShowUndoRequested,
    useUserIsParticipant,
    usePlayerToMove,
} from "./GameHooks";
import { useGoban } from "./goban_context";
import { is_valid_url } from "@/lib/url_validation";
import { enableTouchAction } from "./touch_actions";
import { ConditionalMoveTreeDisplay } from "./ConditionalMoveTreeDisplay";
import { useUser } from "@/lib/hooks";
import { AntiGrief } from "./AntiGrief";

import moment from "moment";

const MAX_SEALING_LOCATIONS_TO_LIST = 5;

interface PlayControlsProps {
    // Cancel buttons are in props because the Cancel Button is placed below
    // chat on mobile.
    show_cancel: boolean;

    readonly review_list: Array<{ owner: PlayerCacheEntry; id: number }>;

    stashed_conditional_moves?: ConditionalMoveTree;

    mode: GobanModes;
    phase: GobanEnginePhase;

    title: string;
    show_title: boolean;

    renderEstimateScore: () => React.ReactElement;
    renderAnalyzeButtonBar: () => React.ReactElement;
    setMoveTreeContainer: (r: Resizable) => void;

    // TODO: turn this into one render prop so that we don't have to pass these
    // props to both PlayControls and ReviewControls (at this time ReviewControls
    // doesn't exist, but we will extract frag_review_controls for this purpose)
    onShareAnalysis: () => void;
    variation_name: string;
    updateVariationName: React.ChangeEventHandler<HTMLInputElement>;
    variationKeyPress: React.KeyboardEventHandler<HTMLInputElement>;

    annulled: boolean;
    annulment_reason: null | rest_api.AnnulmentReason;

    zen_mode: boolean;

    selected_chat_log: ChatMode;

    stopEstimatingScore: () => void;
}

const useConditionalMoveTree = generateGobanHook(
    (goban) => goban?.conditional_tree,
    ["mode", "conditional-moves.updated"],
);

export function PlayControls({
    show_cancel,
    review_list,
    stashed_conditional_moves,
    mode,
    phase,
    title,
    show_title,
    renderEstimateScore,
    annulled,
    annulment_reason,
    renderAnalyzeButtonBar,
    setMoveTreeContainer,
    zen_mode,
    selected_chat_log,
    onShareAnalysis,
    variation_name,
    updateVariationName,
    variationKeyPress,
    stopEstimatingScore,
}: PlayControlsProps): React.ReactElement {
    const user = useUser();
    const goban = useGoban();
    const engine = goban.engine;
    const { registerTargetItem, triggerFlow, signalUsed } = React.useContext(DynamicHelp.Api);
    const { ref: game_state_pane, active: gameStatePaneActive } =
        registerTargetItem("undo-requested-message");
    const [searchParams] = useSearchParams();
    const return_param = searchParams.get("return");
    const return_url = return_param && is_valid_url(return_param) ? return_param : null;
    const [stone_removal_accept_disabled, setStoneRemovalAcceptDisabled] = React.useState(false);
    const [needs_sealing, setNeedsSealing] = React.useState<JGOFSealingIntersection[] | undefined>(
        engine?.needs_sealing,
    );
    const need_to_seal = needs_sealing && needs_sealing.length > 0;
    const [autoscoring_in_progress, setAutoScoringInProgress] = React.useState(false);
    const [autoscoring_taking_too_long, setAutoscoringTakingTooLong] = React.useState(false);

    const user_is_active_player = [engine.players.black.id, engine.players.white.id].includes(
        user.id,
    );

    const [black_accepted, set_black_accepted] = React.useState(
        stoneRemovalAccepted(goban, "black"),
    );
    const [white_accepted, set_white_accepted] = React.useState(
        stoneRemovalAccepted(goban, "white"),
    );

    // Setup: when there's a new goban in play, we need to make sure we have the current
    // state of acceptance captured
    React.useEffect(() => {
        const syncStoneRemovalAcceptance = () => {
            if (goban.engine.phase === "stone removal") {
                set_black_accepted(stoneRemovalAccepted(goban, "black"));
                set_white_accepted(stoneRemovalAccepted(goban, "white"));
            }
        };
        syncStoneRemovalAcceptance();

        return subscribeAllEvents(
            goban,
            ["phase", "mode", "outcome", "stone-removal.accepted", "stone-removal.updated"],
            syncStoneRemovalAcceptance,
        );
    }, [goban]);

    React.useEffect(() => {
        const syncNeedsSealing = (locs?: JGOFSealingIntersection[]) => {
            setNeedsSealing(locs);
        };
        const engineUpdated = (engine: GobanEngine) => {
            syncNeedsSealing(engine.needs_sealing);
        };

        let autoscoring_timeout: any;
        const onAutoScoringStarted = () => {
            console.log("Auto-scoring started");
            setAutoScoringInProgress(true);
            if (autoscoring_timeout) {
                clearTimeout(autoscoring_timeout);
            }
            autoscoring_timeout = setTimeout(() => {
                setAutoscoringTakingTooLong(true);
                autoscoring_timeout = null;
            }, 2000);
        };
        const onAutoScoringComplete = () => {
            console.log("Auto-scoring complete");
            setAutoScoringInProgress(false);
            if (autoscoring_timeout) {
                clearTimeout(autoscoring_timeout);
                autoscoring_timeout = null;
            }
        };

        if (goban?.engine) {
            engineUpdated(goban.engine);
        } else {
            console.error("No engine in PlayControls");
        }
        goban.on("stone-removal.needs-sealing", syncNeedsSealing);
        goban.on("engine.updated", engineUpdated);
        goban.on("stone-removal.auto-scoring-started", onAutoScoringStarted);
        goban.on("stone-removal.auto-scoring-complete", onAutoScoringComplete);

        return () => {
            goban.off("engine.updated", engineUpdated);
            goban.off("stone-removal.needs-sealing", syncNeedsSealing);
            goban.off("stone-removal.auto-scoring-started", onAutoScoringStarted);
            goban.off("stone-removal.auto-scoring-complete", onAutoScoringComplete);
        };
    }, [goban]);

    /*
    React.useEffect(() => {
        setStoneRemovalAcceptDisabled(true);
        const timeout = setTimeout(() => {
            console.log("setting false");
            setStoneRemovalAcceptDisabled(false);
        }, 1500);

        return () => clearTimeout(timeout);
    }, [stone_removal_string]);
    */

    React.useEffect(() => {
        const player_accepted =
            goban.engine?.playerColor(user.id) === "black" ? black_accepted : white_accepted;

        setStoneRemovalAcceptDisabled(player_accepted ?? false);
    }, [black_accepted, white_accepted]);

    const paused = usePaused(goban);
    const show_undo_requested = useShowUndoRequested(goban);
    const winner = useWinner(goban);
    const official_move_number = useOfficialMoveNumber(goban);
    const conditional_moves = useConditionalMoveTree(goban);
    const user_is_player = useUserIsParticipant(goban);
    const cur_move_number = useCurrentMoveNumber(goban);
    const this_users_turn = usePlayerToMove(goban) === user.id;

    React.useEffect(() => {
        if (show_undo_requested && moment(user.registration_date).isBefore(moment("2023-06-14"))) {
            // This condition protects against established users seeing this message introduced 2023-6-14
            // Could be removed once all the "regulars" have done this
            signalUsed("undo-requested-message"); // stops the following "triggerFlow" from doing anything.
            signalUsed("accept-undo-button");
        }

        if (show_undo_requested && gameStatePaneActive()) {
            if (this_users_turn) {
                triggerFlow("undo-request-received-intro");
            } else {
                triggerFlow("undo-requested-intro");
            }
        }
    }, [show_undo_requested, game_state_pane, user_is_player]);

    const goban_setMode_play = () => {
        goban.setMode("play");
        if (stashed_conditional_moves) {
            goban.setConditionalTree(stashed_conditional_moves);
            stashed_conditional_moves = undefined;
        }
    };
    const goban_resumeGame = () => {
        goban.resumeGame();
    };
    const goban_jumpToLastOfficialMove = () => {
        goban.jumpToLastOfficialMove();
    };
    const acceptConditionalMoves = () => {
        stashed_conditional_moves = undefined;
        goban.saveConditionalMoves();
        goban.setMode("play");
    };

    const rematch = () => {
        try {
            (document.activeElement as HTMLElement)?.blur();
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
        void alert
            .fire({
                text: _("Are you sure you want to resume the game?"),
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    goban.rejectRemovedStones();
                }
            });
        return false;
    };
    const onStoneRemovalAccept = (): void => {
        goban.acceptRemovedStones();
    };
    const onStoneRemovalAutoScore = (): void => {
        goban.performStoneRemovalAutoScoring();
    };

    const sse = engine.stalling_score_estimate;

    return (
        <div className="PlayControls">
            <div className="game-action-buttons">
                {mode === "play" && phase === "play" && user_is_player && (
                    <PlayButtons show_cancel={show_cancel} />
                )}
            </div>
            <div className="game-state" ref={game_state_pane}>
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
                    <>
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
                        {engine.stalling_score_estimate && sse && (
                            <div className="stalling-score-estimate">
                                <span>
                                    {interpolate(
                                        _(
                                            "The AI has concluded {{color}} will win with {{certainty}}% certainty. This result has been accepted by one or more players",
                                        ),
                                        {
                                            color:
                                                sse.predicted_winner === "black"
                                                    ? _("Black")
                                                    : _("White"),
                                            certainty: (
                                                (sse.predicted_winner === "black"
                                                    ? sse.win_rate
                                                    : 1.0 - sse.win_rate) * 100.0
                                            ).toFixed(2),
                                        },
                                    )}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="annulled-indicator">
                {annulled &&
                    pgettext("Displayed to the user when the game is annulled", "Game Annulled")}
                {annulled && <i className="fa fa-question-circle" />}

                {annulled && (
                    <AnnulmentReason
                        reason={
                            annulment_reason ||
                            (engine.outcome === "Cancellation" ? { cancellation: true } : null) ||
                            (engine.outcome === "Timeout" &&
                            engine.last_official_move.move_number < 20
                                ? { premature_timeout: true }
                                : null)
                        }
                    />
                )}
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
                        {engine.players.black.id ===
                            goban.pause_control!.paused?.pausing_player_id ||
                        (engine.rengo &&
                            engine.rengo_teams &&
                            engine.rengo_teams.black
                                .map((p) => p.id)
                                .includes(goban.pause_control?.paused?.pausing_player_id ?? 0))
                            ? interpolate(_("{{pauses_left}} pauses left for Black"), {
                                  pauses_left: goban.pause_control?.paused?.pauses_left,
                              })
                            : interpolate(_("{{pauses_left}} pauses left for White"), {
                                  pauses_left: goban.pause_control?.paused?.pauses_left,
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
                    {(return_url || null) && (
                        <div className="return-url">
                            <a href={return_url as string} rel="noopener">
                                {interpolate(
                                    pgettext(
                                        "Link to where the user came from",
                                        "Return to {{url}}",
                                    ),
                                    {
                                        url: return_url,
                                    },
                                )}
                            </a>
                        </div>
                    )}
                </div>
            )}
            {(phase === "stone removal" || null) && (
                <div className="stone-removal-controls">
                    {need_to_seal && (
                        <div className="needs-sealing">
                            {_(
                                "The highlighted locations may need to be sealed before the game can be scored correctly",
                            )}
                            <div className="needs-sealing-coordinates">
                                <span className="needs-sealing-box" />
                                {needs_sealing
                                    .slice(0, MAX_SEALING_LOCATIONS_TO_LIST)
                                    .map((loc) => goban.engine.prettyCoordinates(loc.x, loc.y))
                                    .join(", ")}
                                {needs_sealing.length > MAX_SEALING_LOCATIONS_TO_LIST && (
                                    <span>...</span>
                                )}
                            </div>

                            <div style={{ textAlign: "center" }}>
                                {(user_is_player || null) && (
                                    <button
                                        id="game-stone-removal-cancel"
                                        onClick={onStoneRemovalCancel}
                                        className={need_to_seal ? "primary" : ""}
                                    >
                                        {_("Cancel and resume game")}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <div>
                        {(user_is_active_player || user.is_moderator || null) && ( // moderators see the button, with its timer, but can't press it
                            <button
                                className={
                                    (user.is_moderator && !user_is_active_player) ||
                                    need_to_seal ||
                                    autoscoring_in_progress
                                        ? ""
                                        : "primary"
                                }
                                disabled={
                                    (user.is_moderator && !user_is_active_player) ||
                                    stone_removal_accept_disabled ||
                                    (autoscoring_in_progress && !autoscoring_taking_too_long)
                                }
                                onClick={onStoneRemovalAccept}
                            >
                                {_("Accept removed stones")}
                                <Clock goban={goban} color="stone-removal" />
                            </button>
                        )}

                        {autoscoring_in_progress && (
                            <div className="autoscoring-in-progress">
                                <i className="fa fa-circle-o-notch rotating" /> {_("Scoring game")}
                            </div>
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
                    {!need_to_seal && (
                        <div style={{ textAlign: "center" }}>
                            {(user_is_player || null) && (
                                <button
                                    id="game-stone-removal-cancel"
                                    onClick={onStoneRemovalCancel}
                                    className={need_to_seal ? "primary" : ""}
                                >
                                    {_("Cancel and resume game")}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="explanation">
                        {_(
                            "In this phase, both players select and agree upon which groups should be considered captured and should be removed for the purposes of scoring.",
                        )}
                    </div>
                </div>
            )}
            <AntiGrief />
            {(mode === "conditional" || null) && (
                <div className="conditional-move-planner">
                    <div className="buttons">
                        <button className="primary" onClick={acceptConditionalMoves}>
                            {_("Accept Conditional Moves")}
                        </button>
                        <button onClick={() => goban.pass()}>{_("Pass")}</button>
                        <button onClick={goban_setMode_play}>{_("Cancel")}</button>
                    </div>
                    <div className="ctrl-conditional-tree">
                        <hr />
                        <span className="move-current" onClick={goban_jumpToLastOfficialMove}>
                            {_("Current Move")}
                        </span>
                        {(conditional_moves || null) && (
                            <ConditionalMoveTreeDisplay
                                tree={conditional_moves as ConditionalMoveTree}
                                conditional_path=""
                            />
                        )}
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
                            onClick={() => {
                                enableTouchAction();
                                goban.setModeDeferred("play");
                            }}
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

interface EstimateScoreProps {
    score_estimate_winner?: string;
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
    setAnalyzeTool: (tool: AnalysisTool, subtool: string) => boolean;
    setAnalyzePencilColor: (color: string) => void;
    analyze_pencil_color: string;
    is_review: boolean;
    mode: GobanModes;
    copied_node: React.MutableRefObject<MoveTree | undefined>;
}
export function AnalyzeButtonBar({
    setAnalyzeTool,
    setAnalyzePencilColor,
    analyze_pencil_color,
    is_review,
    mode,
    copied_node,
}: AnalyzeButtonBarProps) {
    const [analyze_tool, set_analyze_tool] = React.useState<AnalysisTool>();
    const [analyze_subtool, set_analyze_subtool] = React.useState<string>();
    const [analyze_score_color, setAnalyzeScoreColor] =
        preferences.usePreference("analysis.score-color");

    const goban = useGoban();

    React.useEffect(() => {
        goban.on("load", () => {
            set_analyze_tool(goban.analyze_tool);
            set_analyze_subtool(goban.analyze_subtool);
        });
        goban.on("analyze_tool", set_analyze_tool);
        goban.on("analyze_subtool", set_analyze_subtool);
    });

    const setPencilColor = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const color = ev.target.value;
        if (goban.analyze_tool === "draw") {
            goban.analyze_subtool = color;
        }
        setAnalyzePencilColor(color);
    };
    const analysis_pass = () => {
        goban.pass();
    };

    const goban_setModeDeferredPlay = () => {
        enableTouchAction();
        goban.setModeDeferred("play");
    };

    const clearAnalysisDrawing = () => {
        goban.syncReviewMove({ clearpen: true });
        goban.clearAnalysisDrawing();
    };

    const doAnalysisScore = () => {
        goban.markAnalysisScores();
    };

    const clearAnalysisScoring = () => {
        goban.clearAnalysisScores();
    };
    const setScoreColor = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const color = ev.target.value;
        if (goban.analyze_tool === "score") {
            goban.analyze_subtool = color;
        }
        setAnalyzeScoreColor(color);
    };

    const user_id = data.get("user").id;
    const is_player =
        goban.engine.players.black.id === user_id || goban.engine.players.white.id === user_id;

    return (
        <div className="game-analyze-button-bar">
            {/* Stone placement */}
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

                <button
                    onClick={() => setAnalyzeTool("removal", "")}
                    title={_("Mark stones for removal")}
                    className={
                        "stone-removal-button " + (analyze_tool === "removal" ? "active" : "")
                    }
                >
                    <i className="ogs-label-x removal"></i>
                </button>

                <button className="pass-button" onClick={analysis_pass}>
                    {_("Pass")}
                </button>
            </div>

            {/* Drawing */}
            <div className="btn-group">
                <button
                    onClick={() => setAnalyzeTool("draw", analyze_pencil_color)}
                    title={_("Draw on the board with a pen")}
                    className={analyze_tool === "draw" ? "active" : ""}
                >
                    <i className="fa fa-pencil"></i>
                </button>
                <input
                    type="color"
                    value={analyze_pencil_color}
                    title={_("Select pen color")}
                    onChange={setPencilColor}
                />
                <button onClick={clearAnalysisDrawing} title={_("Clear pen marks")}>
                    <i className="fa fa-eraser"></i>
                </button>
            </div>

            {/* Copy/paste */}
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

            {/* Marks */}
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

            {/* Scoring */}
            <div className="btn-group">
                <button
                    onClick={() => setAnalyzeTool("score", "black")}
                    title={_("Set scoring locations")}
                    className={
                        "score-button " +
                        (analyze_tool === "score" && analyze_subtool === "black" ? "active" : "")
                    }
                >
                    <span className="score-square black"></span>
                </button>

                <button
                    onClick={() => setAnalyzeTool("score", "white")}
                    title={_("Set scoring locations")}
                    className={
                        "score-button " +
                        (analyze_tool === "score" && analyze_subtool === "white" ? "active" : "")
                    }
                >
                    <span className="score-square white"></span>
                </button>

                <button
                    onClick={() => setAnalyzeTool("score", analyze_score_color)}
                    title={_("Set scoring locations")}
                    className={
                        "score-button " +
                        (analyze_tool === "score" &&
                        analyze_subtool !== "white" &&
                        analyze_subtool !== "black"
                            ? "active"
                            : "")
                    }
                >
                    <span
                        className="score-square custom"
                        style={{
                            backgroundColor: analyze_score_color,
                            borderColor: color_blend("#888888", analyze_score_color),
                        }}
                    ></span>
                </button>

                <input
                    type="color"
                    value={analyze_score_color}
                    title={_("Select score")}
                    onChange={setScoreColor}
                />

                <button
                    onClick={() => {
                        doAnalysisScore();
                    }}
                    title={_("Score")}
                    className={"score-button "}
                >
                    <i className="fa fa-calculator"></i>
                </button>

                <button onClick={clearAnalysisScoring} title={_("Clear scores")}>
                    <i className="fa fa-eraser"></i>
                </button>
            </div>

            {/* Copy to conditional move planner */}
            {((!is_review &&
                !goban.engine.rengo &&
                is_player &&
                goban.engine.phase !== "finished") ||
                null) && (
                <div className="btn-group">
                    <button
                        onClick={() => automateBranch(goban)}
                        title={_("Copy branch to conditional move planner")}
                        disabled={user_id === goban.engine.playerToMoveOnOfficialBranch()}
                    >
                        <i className="fa fa-exchange"></i>
                    </button>
                </div>
            )}

            {/* Back to game button */}
            <div className="analyze-mode-buttons">
                {(mode === "analyze" || null) && (
                    <span>
                        {(!is_review || null) && (
                            <button className="sm primary bold" onClick={goban_setModeDeferredPlay}>
                                {_("Back to Game")}
                            </button>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}

export function copyBranch(
    goban: GobanRenderer,
    copied_node: React.MutableRefObject<MoveTree | undefined>,
    mode: GobanModes,
) {
    if (mode !== "analyze") {
        return;
    }

    try {
        /* Don't try to copy branches when the user is selecting stuff somewhere on the page */
        if (!window.getSelection()?.isCollapsed) {
            return;
        }
    } catch {
        // ignore error
    }

    copied_node.current = goban.engine.cur_move;
    toast(<div>{_("Branch copied")}</div>, 1000);
}
export function pasteBranch(
    goban: GobanRenderer,
    copied_node: React.MutableRefObject<MoveTree | undefined>,
    mode: GobanModes,
) {
    if (mode !== "analyze") {
        return;
    }

    try {
        /* Don't try to paste branches when the user is selecting stuff somewhere on the page */
        if (!window.getSelection()?.isCollapsed) {
            return;
        }
    } catch {
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
        } catch {
            errorAlerter(_("A move conflict has been detected"));
        }
        goban.syncReviewMove();
    } else {
        console.log("Nothing copied or cut to paste");
    }
}

export function deleteBranch(goban: GobanRenderer, mode: GobanModes) {
    if (mode !== "analyze") {
        return;
    }

    try {
        /* Don't try to delete branches when the user is selecting stuff somewhere on the page */
        if (!window.getSelection()?.isCollapsed) {
            return;
        }
    } catch {
        // ignore error
    }

    if (goban.engine.cur_move.trunk) {
        void alert.fire({
            text: _(
                "The current position is not an explored branch, so there is nothing to delete",
            ),
        });
    } else {
        void alert
            .fire({
                text: _("Are you sure you wish to remove this move branch?"),
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    goban.deleteBranch();
                    goban.syncReviewMove();
                }
            });
    }
}

interface ReviewControlsProps {
    mode: GobanModes;
    review_id: number;
    renderEstimateScore: () => React.ReactElement;
    renderAnalyzeButtonBar: () => React.ReactElement;
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

const useReviewOwnerId = generateGobanHook(
    (goban: Goban) => goban.review_owner_id,
    ["review_owner_id"],
);
const useReviewControllerId = generateGobanHook(
    (goban: Goban) => goban.review_controller_id,
    ["review_controller_id"],
);

let review_out_of_sync = false;

const useReviewOutOfSync = generateGobanHook(
    (goban: Goban) => {
        if (game_control.in_pushed_analysis) {
            return review_out_of_sync;
        }
        const engine = goban.engine;
        review_out_of_sync = !!(
            engine.cur_move &&
            engine.cur_review_move &&
            engine.cur_move.id !== engine.cur_review_move.id
        );

        return review_out_of_sync;
    },
    ["cur_move", "review.updated"],
);

export function ReviewControls({
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
    const goban = useGoban();

    const review_owner_id = useReviewOwnerId(goban);
    const review_controller_id = useReviewControllerId(goban);
    const review_out_of_sync = useReviewOutOfSync(goban);
    React.useEffect(() => {
        const renderExtraPlayerActions = (player_id: number): React.ReactElement | null => {
            const user = data.get("user");
            if (
                review_id &&
                goban &&
                (goban.review_controller_id === user.id || goban.review_owner_id === user.id)
            ) {
                let is_owner: any = null;
                let is_controller: any = null;
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
    }, [goban]);

    const [move_text, set_move_text] = React.useState<string>();
    const updateMoveText = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        set_move_text(ev.target.value);
        goban.syncReviewMove(undefined, ev.target.value);
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
        <div className="PlayControls">
            <div className="game-state">
                {(mode === "analyze" || null) && (
                    <div>
                        {_("Review by")}: <Player user={review_owner_id as number} />
                        {((review_controller_id && review_controller_id !== review_owner_id) ||
                            null) && (
                            <div>
                                {_("Review controller")}:{" "}
                                <Player user={review_controller_id as number} />
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

function ShareAnalysisButton(props: ShareAnalysisButtonProperties): React.ReactElement {
    const { selected_chat_log, isUserAnonymous, shareAnalysis } = props;
    switch (selected_chat_log) {
        case "malkovich":
        case "personal":
            return (
                <button
                    className={`sm ${selected_chat_log}`}
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

const useOfficialMoveNumber = generateGobanHook(
    (goban) => goban!.engine.last_official_move?.move_number || -1,
    ["last_official_move"],
);
const useWinner = generateGobanHook((goban) => goban!.engine.winner, ["winner"]);
const usePaused = generateGobanHook(
    (goban) => goban!.pause_control && !!goban!.pause_control.paused,
    ["paused"],
);

// Converts move diff string into a ConditionalMoveTree.
// Caller should check that the moves start from the last official move and
// that the first move in the string is the opponent's.
function diffToConditionalMove(moves: string): ConditionalMoveTree {
    if (moves.length % 2 !== 0) {
        throw new Error("invalid move string");
    }

    let tree = new ConditionalMoveTree(null);
    const start = moves.length - 1 - ((moves.length - 1) % 4);
    for (let i = start; i >= 0; i -= 4) {
        const opponent = moves.slice(i, i + 2);
        const player = moves.slice(i + 2, i + 4) || null;

        tree.move = player;
        const parent = new ConditionalMoveTree(null, tree);
        if (player != null) {
            parent.children[opponent] = tree;
        }
        tree = parent;
    }
    return tree;
}

// Copies branch to conditional move planner (only copies up to the selected
// move). Should only be called in analyze mode.
function automateBranch(goban: GobanRenderer): void {
    if (goban.engine.phase === "finished") {
        return;
    }

    if (goban.engine.rengo) {
        toast(<div>{_("You cannot make conditional moves in Rengo games.")}</div>, 2000);
        return;
    }

    if (data.get("user").id === goban.engine.playerToMoveOnOfficialBranch()) {
        toast(<div>{_("You cannot make conditional moves on your turn.")}</div>, 2000);
        return;
    }

    const diff = goban.engine.getMoveDiff();

    if (diff.from !== goban.engine.last_official_move.move_number) {
        toast(<div>{_("Outdated branch")}</div>, 1000);
        return;
    }

    const before = goban.conditional_tree.duplicate();
    const tree = mergeConditionalMoves(before, diffToConditionalMove(diff.moves));

    goban.setConditionalTree(tree);
    goban.saveConditionalMoves();
    goban.setConditionalTree(before);
    toast(<div>{_("Copied branch to the conditional move planner")}</div>, 2000);
}

// Merges two conditional trees into one. If there are conflicts, the branch in
// `b` overwrites the one in `a`.
function mergeConditionalMoves(
    a: ConditionalMoveTree,
    b: ConditionalMoveTree,
): ConditionalMoveTree {
    const treeA = a.encode()[1];
    const treeB = b.encode()[1];
    mergeConditionalTrees(treeA, treeB);
    return ConditionalMoveTree.decode([null, treeA]);
}

function mergeConditionalTrees(
    a: ConditionalMoveResponseTree,
    b: ConditionalMoveResponseTree,
): void {
    if (a === b) {
        return;
    }

    for (const move in b) {
        if (!a.hasOwnProperty(move)) {
            // Deep copy.
            a[move] = JSON.parse(JSON.stringify(b[move]));
            continue;
        }

        const [responseA, nextA] = a[move];
        const [responseB, nextB] = b[move];
        if (responseA !== responseB) {
            // Overwrite subtree if the response moves are different.
            a[move] = JSON.parse(JSON.stringify(b[move]));
            continue;
        }

        mergeConditionalTrees(nextA, nextB);
    }
}

function AnnulmentReason({
    reason,
}: {
    reason: rest_api.AnnulmentReason | { cancellation?: true; premature_timeout?: true } | null;
}): React.ReactElement | null {
    if (!reason) {
        return null;
    }

    const arr: React.ReactElement[] = [];

    for (const key in reason) {
        switch (key) {
            case "bot_game_abandoned":
                // don't explicitly point out that we won't rate these games
                break;
            case "mass_correspondence_timeout_protection":
                arr.push(
                    <div key={key}>
                        {_(
                            "The server's mass correspondence timeout protection system has annulled this game. This system protects the rating system by annulling games when a player leaves the server for an extended period of time and as a result times out of many correspondence games. While unfortunate, this is a necessary behavior to protect the integrity of the rating system as a whole.",
                        )}
                    </div>,
                );
                break;
            case "correspondence_disconnection":
                // There was a bug that affected a few thousand games years
                // ago. Since this is not actively used going forward, this is
                // left untranslated.
                arr.push(<div key={key}>Correspondence disconnection</div>);
                break;
            case "moderator_annulled":
                arr.push(<div key={key}>{_("This game has been annulled by a moderator.")}</div>);
                break;
            case "bad_bot":
                // "Bad bots" are bots that were decidedly horrible and harmful
                // for the rating system. These primarily consist of older bots
                // and is not generally used for modern games, hence the reason
                // this is left untranslated.
                arr.push(<div key={key}>Bad bot</div>);
                break;
            case "handicap_out_of_range":
                // Some older games had extreme handicaps that were not within a meaningful range
                // and so have been annulled. This is left untranslated as it's not applicable to
                // modern games.
                arr.push(<div key={key}>Handicap out of range</div>);
                break;
            case "cancellation":
                arr.push(<div key={key}>{_("The game was canceled so will not be rated.")}</div>);
                break;
            case "premature_timeout":
                arr.push(
                    <div key={key}>
                        {_("Not enough moves were made for this game to be rated.")}
                    </div>,
                );
                break;
            default:
                arr.push(<div key={key}>{key}</div>);
                break;
        }
    }

    if (arr.length === 0) {
        return null;
    }

    return <div className="annulment-reason">{arr}</div>;
}
