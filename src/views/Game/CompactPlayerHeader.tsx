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
import { PlayerCard } from "./PlayerCards";
import { CompactTurnStones } from "./CompactTurnStones";
import {
    useColorToMoveOnOfficialBranch,
    useGameRules,
    useOfficialMoveNumber,
    useScorePopup,
    useZenMode,
} from "./GameHooks";
import { useGobanController } from "./goban_context";
import "./CompactPlayerHeader.css";

type PlayerType = rest_api.games.Player;

interface CompactPlayerHeaderProps {
    historical_black: PlayerType | null;
    historical_white: PlayerType | null;
    estimating_score: boolean;
}

/**
 * Mobile compact layout: both players side by side above the board, black
 * on the left and white on the right, with the turn stones and the move
 * number between them. Replaces the pair of cards that otherwise straddle
 * the board, giving the board the row the second card would have taken.
 */
export function CompactPlayerHeader({
    historical_black,
    historical_white,
    estimating_score,
}: CompactPlayerHeaderProps): React.ReactElement {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;

    const zen_mode = useZenMode(goban_controller);
    const { show_score_breakdown, toggleScorePopup } = useScorePopup(goban);
    const to_move = useColorToMoveOnOfficialBranch(goban);
    const move_number = useOfficialMoveNumber(goban);
    const rules = useGameRules(goban);

    const card = (color: "black" | "white") => (
        <PlayerCard
            color={color}
            goban={goban}
            historical={color === "black" ? historical_black : historical_white}
            estimating_score={estimating_score}
            show_score_breakdown={show_score_breakdown}
            onScoreClick={toggleScorePopup}
            zen_mode={zen_mode}
            compact
        />
    );

    return (
        <div className="CompactPlayerHeader">
            <div className="player-icons">
                {card("black")}
                <CompactTurnStones to_move={to_move} move_number={move_number} rules={rules} />
                {card("white")}
            </div>
        </div>
    );
}
