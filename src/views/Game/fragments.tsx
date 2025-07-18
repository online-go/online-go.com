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
import { useGobanController } from "./goban_context";
import { useShowTitle, useTitle, useCurrentMove } from "./GameHooks";
import { _, interpolate } from "@/lib/translate";
import { rulesText } from "@/lib/misc";
import { KBShortcut } from "@/components/KBShortcut";
import { AIDemoReview } from "./AIDemoReview";
import { AIReview } from "./AIReview";
import { GameTimings } from "./GameTimings";

export function RengoHeader(): React.ReactElement | null {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const show_title = useShowTitle(goban);
    const title = useTitle(goban);

    if (!goban?.engine?.rengo) {
        return null;
    }
    return (
        <div className="rengo-header-block">
            {!goban?.review_id && show_title && <div className="game-state">{title}</div>}
        </div>
    );
}

export function EstimateScore(): React.ReactElement | null {
    const [score_estimate_winner, set_score_estimate_winner] = React.useState<string>();
    const [score_estimate_amount, set_score_estimate_amount] = React.useState<number>();
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;

    React.useEffect(() => {
        if (goban) {
            const onScoreEstimate = (est: any) => {
                set_score_estimate_winner(est?.winner || "");
                set_score_estimate_amount(est?.amount);
            };
            goban.on("score_estimate", onScoreEstimate);
            return () => {
                goban.off("score_estimate", onScoreEstimate);
            };
        }
        return;
    }, [goban]);

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

export function GameInformation(): React.ReactElement | null {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const [zen_mode, set_zen_mode] = React.useState(goban_controller.zen_mode);

    React.useEffect(() => {
        goban_controller.on("zen_mode", set_zen_mode);
        return () => {
            goban_controller.off("zen_mode", set_zen_mode);
        };
    }, [goban]);

    if (zen_mode) {
        return null;
    }

    const config = goban?.engine?.config;
    if (!config) {
        return null;
    }
    const rules = config?.rules ? rulesText(config.rules) : null;
    return (
        <div className="condensed-game-information">
            <div className="condensed-game-ranked">
                {config.ranked ? _("Ranked") : _("Unranked")}
            </div>
            {rules && (
                <div className="condensed-game-rules">
                    {_("Rules")}: {rules}
                </div>
            )}
        </div>
    );
}

export function GameKeyboardShortcuts() {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;

    return (
        <div>
            <KBShortcut shortcut="up" action={goban_controller.nav_up} />
            <KBShortcut shortcut="down" action={goban_controller.nav_down} />
            <KBShortcut shortcut="left" action={goban_controller.nav_prev} />
            <KBShortcut shortcut="right" action={goban_controller.nav_next} />
            <KBShortcut shortcut="page-up" action={goban_controller.nav_prev_10} />
            <KBShortcut shortcut="page-down" action={goban_controller.nav_next_10} />
            <KBShortcut shortcut="space" action={goban_controller.nav_play_pause} />
            <KBShortcut shortcut="home" action={goban_controller.nav_first} />
            <KBShortcut shortcut="end" action={goban_controller.nav_last} />
            <KBShortcut shortcut="escape" action={goban_controller.handleEscapeKey} />
            <KBShortcut
                shortcut="f1"
                action={() => goban_controller.setAnalyzeTool("stone", "alternate")}
            />
            <KBShortcut
                shortcut="f2"
                action={() => goban_controller.setAnalyzeTool("stone", "black")}
            />
            <KBShortcut
                shortcut="f4"
                action={() => goban_controller.setAnalyzeTool("label", "triangle")}
            />
            <KBShortcut
                shortcut="f5"
                action={() => goban_controller.setAnalyzeTool("label", "square")}
            />
            <KBShortcut
                shortcut="f6"
                action={() => goban_controller.setAnalyzeTool("label", "circle")}
            />
            <KBShortcut
                shortcut="f7"
                action={() => goban_controller.setAnalyzeTool("label", "letters")}
            />
            <KBShortcut
                shortcut="f8"
                action={() => goban_controller.setAnalyzeTool("label", "numbers")}
            />
            <KBShortcut shortcut="ctrl-c" action={goban_controller.copyBranch} />
            <KBShortcut shortcut="ctrl-v" action={goban_controller.pasteBranch} />
            <KBShortcut
                shortcut="f9"
                action={() =>
                    goban_controller.setAnalyzeTool("draw", goban_controller.analyze_pencil_color)
                }
            />
            {goban?.mode === "analyze" && (
                <KBShortcut shortcut="f10" action={goban_controller.clear_and_sync} />
            )}
            <KBShortcut shortcut="del" action={goban_controller.deleteBranch} />
            <KBShortcut shortcut="shift-z" action={goban_controller.toggleZenMode} />
            <KBShortcut shortcut="shift-c" action={goban_controller.toggleCoordinates} />
            <KBShortcut shortcut="shift-i" action={goban_controller.toggleAIReview} />
            <KBShortcut shortcut="shift-a" action={goban_controller.gameAnalyze} />
            <KBShortcut shortcut="shift-r" action={goban_controller.startReview} />
            <KBShortcut shortcut="shift-e" action={goban_controller.estimateScore} />
            <KBShortcut
                shortcut="shift-p"
                action={() => goban_controller.goban.setModeDeferred("play")}
            />
        </div>
    );
}
export function FragAIReview() {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const cur_move = useCurrentMove(goban);
    const game_id = goban?.engine?.game_id;
    const review_id = goban?.review_id;
    const ai_review_enabled = goban_controller.ai_review_enabled;

    if (!goban) {
        return;
    }
    // Games
    if (
        cur_move &&
        goban.engine &&
        goban.engine.phase === "finished" &&
        goban.engine.game_id === game_id &&
        ((goban.engine.width === 19 && goban.engine.height === 19) ||
            (goban.engine.width === 13 && goban.engine.height === 13) ||
            (goban.engine.width === 9 && goban.engine.height === 9))
    ) {
        return (
            <AIReview
                onAIReviewSelected={(r) => (goban_controller.selected_ai_review_uuid = r?.uuid)}
                game_id={game_id}
                move={cur_move}
                hidden={!ai_review_enabled}
            />
        );
    }

    if (
        goban.review_controller_id &&
        goban.engine &&
        goban.review_id === review_id &&
        ((goban.engine.width === 19 && goban.engine.height === 19) ||
            (goban.engine.width === 13 && goban.engine.height === 13) ||
            (goban.engine.width === 9 && goban.engine.height === 9))
    ) {
        return <AIDemoReview goban={goban} controller={goban.review_controller_id} />;
    }
    return null;
}
export function FragBelowBoardControls() {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const [view_mode, set_view_mode] = React.useState(goban_controller.view_mode);
    const [autoplaying, set_autoplaying] = React.useState(goban_controller.autoplaying);

    React.useEffect(() => {
        goban_controller.on("view_mode", set_view_mode);
        goban_controller.on("autoplaying", set_autoplaying);
        return () => {
            goban_controller.off("view_mode", set_view_mode);
            goban_controller.off("autoplaying", set_autoplaying);
        };
    }, [goban_controller]);

    return (
        <div className="action-bar">
            <span className="icons" />
            <span className="controls">
                <button type="button" onClick={goban_controller.nav_first} className="move-control">
                    <i className="fa fa-fast-backward"></i>
                </button>
                <button
                    type="button"
                    onClick={goban_controller.nav_prev_10}
                    className="move-control"
                >
                    <i className="fa fa-backward"></i>
                </button>
                <button type="button" onClick={goban_controller.nav_prev} className="move-control">
                    <i className="fa fa-step-backward"></i>
                </button>
                <button
                    type="button"
                    onClick={goban_controller.nav_play_pause}
                    className="move-control"
                >
                    <i className={"fa " + (autoplaying ? "fa-pause" : "fa-play")}></i>
                </button>
                <button type="button" onClick={goban_controller.nav_next} className="move-control">
                    <i className="fa fa-step-forward"></i>
                </button>
                <button
                    type="button"
                    onClick={goban_controller.nav_next_10}
                    className="move-control"
                >
                    <i className="fa fa-forward"></i>
                </button>
                <button type="button" onClick={goban_controller.nav_last} className="move-control">
                    <i className="fa fa-fast-forward"></i>
                </button>
            </span>

            {view_mode !== "portrait" && (
                <span className="move-number">
                    {interpolate(_("Move {{move_number}}"), {
                        move_number: goban?.engine.getMoveNumber(),
                    })}
                </span>
            )}
        </div>
    );
}

export function FragTimings() {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;

    if (goban?.engine?.config) {
        return (
            <GameTimings
                moves={goban.engine.config.moves ?? []}
                start_time={goban.engine.config.start_time ?? 0}
                end_time={goban.engine.config.end_time}
                free_handicap_placement={goban.engine.config.free_handicap_placement ?? false}
                handicap={goban.engine.config.handicap ?? 0}
                black_id={goban.engine.config.black_player_id ?? 0}
                white_id={goban.engine.config.white_player_id ?? 0}
            />
        );
    }

    return null;
}
