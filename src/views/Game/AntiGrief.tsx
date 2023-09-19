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
import { Card } from "material";
import { pgettext, _ } from "translate";
import { useGoban } from "./goban_context";
import { useUser } from "hooks";

export function AntiGrief(): JSX.Element {
    return (
        <>
            <AntiStalling />
        </>
    );
}

function AntiStalling(): JSX.Element {
    const user = useUser();
    const goban = useGoban();
    const [estimate, setEstimate] = React.useState(null);
    const [phase, setPhase] = React.useState(goban?.engine?.phase);

    React.useEffect(() => {
        const onScoreEstimate = (estimate) => {
            setEstimate(estimate);
        };

        onScoreEstimate(goban.config?.stalling_score_estimate);
        goban.on("stalling_score_estimate", onScoreEstimate);

        return () => {
            goban.off("stalling_score_estimate", onScoreEstimate);
        };
    }, [goban, goban.config?.stalling_score_estimate]);

    React.useEffect(() => {
        setPhase(goban?.engine?.phase);
    }, [goban?.engine?.phase]);

    if (!estimate) {
        return null;
    }

    if (phase !== "play") {
        return null;
    }

    if (
        user.id !== goban?.engine?.config?.black_player_id &&
        user.id !== goban?.engine?.config?.white_player_id &&
        !user.is_moderator
    ) {
        return null;
    }

    // capitalize first letter
    const predicted_winner =
        estimate.predicted_winner.charAt(0).toUpperCase() + estimate.predicted_winner.slice(1);
    const win_rate = (
        (estimate.win_rate > 0.5 ? estimate.win_rate : 1.0 - estimate.win_rate) * 100.0
    ).toFixed(1);

    return (
        <Card className="AntiStalling">
            <div>
                {pgettext(
                    "This message is shown when the server thinks the game is over, but one player is stalling the game by continually playing useless moves",
                    "Predicted winner: ",
                )}{" "}
                {_(predicted_winner)} ({win_rate}%)
            </div>
            <div>
                <button
                    className="danger"
                    onClick={() => goban?.sendPreventStalling(estimate.predicted_winner)}
                >
                    {pgettext(
                        "This message is shown when the server thinks the game is over, but one player is stalling the game by continually playing useless moves",
                        "Accept predicted winner and end game",
                    )}
                </button>
            </div>
        </Card>
    );
}
