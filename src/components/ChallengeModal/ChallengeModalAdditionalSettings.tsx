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
import { ChallengeModalRankedSettings } from "./ChallengeModalRankedSettings";
import { ChallengeModalBoardSizeSettings } from "./ChallengeModalBoardSizeSettings";

type ChallengeModalAdditionalSettingsProps = {
    forkingGame: boolean;
    mode: string;
    game: any;
    conf: any;
    updateRanked: (ev: React.ChangeEvent<HTMLInputElement>) => void;
    updateBoardSize: (selection: string) => void;
    updateBoardWidth: (width: number | null) => void;
    updateBoardHeight: (height: number | null) => void;
};

export function ChallengeModalAdditionalSettings({
    forkingGame,
    mode,
    game,
    conf,
    updateRanked,
    updateBoardSize,
    updateBoardWidth,
    updateBoardHeight,
}: ChallengeModalAdditionalSettingsProps) {
    const showRankedSettings = !forkingGame && mode !== "computer";
    const showBoardSizeSettings = !forkingGame;

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
