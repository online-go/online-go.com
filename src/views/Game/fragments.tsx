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
import { useShowTitle, useTitle, useCurrentMove, useAIReviewEnabled, useMode } from "./GameHooks";
import { GAME_KEYBOARD_SHORTCUT_GROUPS } from "./game_keyboard_shortcuts";
import { _, interpolate } from "@/lib/translate";
import { rulesText } from "@/lib/misc";
import { KBShortcut } from "@/components/KBShortcut";
import { AIDemoReview } from "@/components/AIReview/AIDemoReview";
import { AIReview } from "@/components/AIReview/AIReview";
import { FairPlayGameSummary } from "@moderator-ui/FairPlay";

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
    const [config, setConfig] = React.useState(goban?.engine?.config);
    const [zen_mode, set_zen_mode] = React.useState(goban_controller.zen_mode);

    React.useEffect(() => {
        const handleUpdate = () => {
            setConfig(goban?.engine?.config);
        };
        goban?.on("load", handleUpdate);
        goban_controller.on("zen_mode", set_zen_mode);
        return () => {
            goban?.off("load", handleUpdate);
            goban_controller.off("zen_mode", set_zen_mode);
        };
    }, [goban, goban_controller]);

    if (zen_mode) {
        return null;
    }

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

export function GameKeyboardShortcuts(): React.ReactElement | null {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const mode = useMode(goban);

    // The list is rebuilt when the goban changes mode so `when` guards, such
    // as F10 only applying in analysis mode, are re-evaluated.
    const bindings = React.useMemo(
        () =>
            GAME_KEYBOARD_SHORTCUT_GROUPS.flatMap((group) =>
                group.shortcuts
                    .filter((entry) => !entry.when || entry.when(goban_controller))
                    .map((entry) => ({
                        shortcut: entry.shortcut,
                        action: () => entry.action(goban_controller),
                    })),
            ),
        [goban_controller, mode],
    );

    return (
        <div>
            {bindings.map(({ shortcut, action }) => (
                <KBShortcut key={shortcut} shortcut={shortcut} action={action} />
            ))}
        </div>
    );
}

interface FragAIReviewProps {
    simul_black?: boolean | null;
    simul_white?: boolean | null;
    showGameTimings?: boolean;
}

export function FragAIReview(props: FragAIReviewProps): React.ReactElement | null {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const cur_move = useCurrentMove(goban);
    const game_id = goban?.engine?.game_id;
    const review_id = goban?.review_id;
    const ai_review_enabled = useAIReviewEnabled(goban_controller);

    if (!goban) {
        return null;
    }

    const isSupportedBoardSize =
        (goban.engine?.width === 19 && goban.engine?.height === 19) ||
        (goban.engine?.width === 13 && goban.engine?.height === 13) ||
        (goban.engine?.width === 9 && goban.engine?.height === 9);

    // Games - finished games with AI review
    if (
        cur_move &&
        goban.engine &&
        goban.engine.config &&
        goban.engine.phase === "finished" &&
        goban.engine.game_id === game_id &&
        isSupportedBoardSize
    ) {
        return (
            <AIReview
                onAIReviewSelected={(r) => goban_controller.setSelectedAiReviewUuid(r?.uuid)}
                game_id={game_id}
                move={cur_move}
                hidden={!ai_review_enabled}
                simul_black={props.simul_black}
                simul_white={props.simul_white}
                showGameTimings={props.showGameTimings}
                moves={goban.engine.config.moves}
                start_time={goban.engine.config.start_time}
                end_time={goban.engine.config.end_time}
                free_handicap_placement={goban.engine.config.free_handicap_placement}
                handicap={goban.engine.config.handicap}
            />
        );
    }

    // Ongoing games - show timings only when requested (for moderators)
    // Render FairPlayGameSummary directly to avoid AIReview's API call for ai_reviews
    if (
        props.showGameTimings &&
        cur_move &&
        goban.engine &&
        goban.engine.config &&
        goban.engine.phase !== "finished" &&
        goban.engine.game_id === game_id &&
        isSupportedBoardSize &&
        goban.engine.config.black_player_id &&
        goban.engine.config.white_player_id
    ) {
        return (
            <FairPlayGameSummary
                game_id={game_id}
                black_player_id={goban.engine.config.black_player_id}
                white_player_id={goban.engine.config.white_player_id}
                board_size={goban.engine.width}
                currentMoveNumber={cur_move.move_number - 1}
                moves={goban.engine.config.moves}
                start_time={goban.engine.config.start_time}
                end_time={goban.engine.config.end_time}
                free_handicap_placement={goban.engine.config.free_handicap_placement}
                handicap={goban.engine.config.handicap}
                simul_black={props.simul_black}
                simul_white={props.simul_white}
            />
        );
    }

    if (
        goban.review_controller_id &&
        goban.engine &&
        goban.review_id === review_id &&
        isSupportedBoardSize
    ) {
        return <AIDemoReview goban={goban} controller={goban.review_controller_id} />;
    }
    return null;
}
