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

import * as data from "@/lib/data";

import { ChallengeModalRankedSettings } from "./ChallengeModalRankedSettings";
import { ChallengeModalBoardSizeSettings } from "./ChallengeModalBoardSizeSettings";
import { applyBotRanked } from "./ChallengeModal.utils";
import {
    ChallengeInput,
    ChallengeModalConf,
    ChallengeModalState,
    GameInput,
} from "./ChallengeModal.types";

type ChallengeModalAdditionalSettingsProps = {
    forkingGame: boolean;
    mode: string;
    challenge: ChallengeInput;
    conf: any;
    updateChallengeSettings: (challenge: any) => void;
    updateGameSettings: (game: any) => void;
    updateConf: (config: any) => void;
    setState: (state: any) => void;
};

export function ChallengeModalAdditionalSettings({
    forkingGame,
    mode,
    challenge,
    conf,
    setState,
    updateConf,
    updateGameSettings,
}: ChallengeModalAdditionalSettingsProps) {
    const showRankedSettings = !forkingGame && mode !== "computer";
    const game = challenge.game;
    const showBoardSizeSettings = !forkingGame;

    const updateRanked = React.useCallback(
        (ranked: boolean) => {
            setState((prev: ChallengeModalState) => {
                const userData = data.get("user");
                const prevGame = prev.challenge.game;

                const nextChallenge = {
                    ...prev.challenge,
                    game: {
                        ...prev.challenge.game,
                        ranked,
                    },
                };
                const nextConf = {
                    ...prev.conf,
                };

                if (ranked && challenge && userData) {
                    const min_ranking = Math.min(
                        Math.max(prev.challenge.min_ranking, userData.ranking - 9),
                        userData.ranking + 9,
                    );
                    const max_ranking = Math.max(
                        Math.min(prev.challenge.max_ranking, userData.ranking + 9),
                        userData.ranking - 9,
                    );

                    nextChallenge.game.handicap = Math.min(9, prevGame.handicap);
                    nextChallenge.game.komi_auto = "automatic";
                    nextChallenge.min_ranking = min_ranking;
                    nextChallenge.max_ranking = max_ranking;

                    if (
                        prev.conf.selected_board_size !== "19x19" &&
                        prev.conf.selected_board_size !== "13x13" &&
                        prev.conf.selected_board_size !== "9x9"
                    ) {
                        nextConf.selected_board_size = "19x19";
                        nextChallenge.game.width = 19;
                        nextChallenge.game.height = 19;
                    }
                } else {
                    nextChallenge.aga_ranked = false;
                }

                return {
                    ...prev,
                    challenge: nextChallenge,
                    conf: nextConf,
                };
            });
        },
        [setState],
    );

    const updateBoardSize = React.useCallback(
        (selection: string) => {
            updateConf((prev: ChallengeModalConf) => ({
                ...prev,
                selected_board_size: selection,
            }));

            if (selection === "custom") {
                return;
            }

            const sizes = selection.split("x");
            const width = parseInt(sizes[0]);
            const height = parseInt(sizes[1]);

            updateGameSettings((prev: GameInput) => {
                const next = {
                    ...prev,
                    width: width,
                    height: height,
                };
                if (mode === "computer") {
                    return applyBotRanked(next);
                }
                return next;
            });
        },
        [updateGameSettings, mode],
    );

    const updateBoardWidth = React.useCallback(
        (width: number | null) => {
            updateGameSettings((prev: GameInput) => {
                const next = {
                    ...prev,
                    width: width,
                };
                if (mode === "computer") {
                    return applyBotRanked(next);
                }
                return next;
            });
        },
        [updateGameSettings, mode],
    );

    const updateBoardHeight = React.useCallback(
        (height: number | null) => {
            updateGameSettings((prev: GameInput) => {
                const next = {
                    ...prev,
                    height: height,
                };
                if (mode === "computer") {
                    return applyBotRanked(next);
                }
                return next;
            });
        },
        [updateGameSettings, mode],
    );

    return (
        <div id="challenge-basic-settings" className="right-pane pane form-horizontal" role="form">
            {showRankedSettings && (
                <ChallengeModalRankedSettings game={game} updateRanked={updateRanked} />
            )}
            {showBoardSizeSettings && (
                <ChallengeModalBoardSizeSettings
                    game={game}
                    conf={conf}
                    mode={mode}
                    updateBoardSize={updateBoardSize}
                    updateBoardWidth={updateBoardWidth}
                    updateBoardHeight={updateBoardHeight}
                />
            )}
        </div>
    );
}
