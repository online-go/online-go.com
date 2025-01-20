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
import { Card } from "@/components/material";
import { pgettext, _ } from "@/lib/translate";
import { useGoban } from "./goban_context";
import { useUser } from "@/lib/hooks";
import { JGOFClockWithTransmitting, JGOFTimeControl } from "goban";
import { browserHistory } from "@/lib/ogsHistory";
import { toast } from "@/lib/toast";
import { StallingScoreEstimate } from "goban";

const ANTI_ESCAPING_TIMEOUT = 60; // number of seconds to wait before allowing the "Claim victory" button to be appear and be clicked

let on_game_page = false;
let live_game = false;
let live_game_id = 0;
let live_game_phase: string | null = null;
let last_toast: ReturnType<typeof toast> | null = null;
let was_player = false;

function checkForLeavingLiveGame(pathname: string) {
    try {
        const user = data.get("user");
        const goban = window.global_goban;
        const was_on_page = on_game_page;
        const was_live_game = live_game;

        if (goban) {
            const path = `/game/${goban.game_id}`;
            if (pathname === path) {
                on_game_page = true;
                live_game = goban.engine.time_control.speed !== "correspondence";
                live_game_id = goban.game_id;
                live_game_phase = goban.engine?.phase;
                was_player =
                    goban.engine?.config?.black_player_id === user?.id ||
                    goban.engine?.config?.white_player_id === user?.id;
                if (last_toast) {
                    last_toast.close();
                }
            } else {
                on_game_page = false;
            }
        }

        if (
            was_on_page &&
            was_player &&
            !on_game_page &&
            was_live_game &&
            live_game_phase === "play" &&
            !goban?.paused_since
        ) {
            const t = toast(
                <div>
                    {_(
                        "You have left a live game. If you do not return you will forfeit the match.",
                    )}
                </div>,
            );
            last_toast = t;

            const game_id = live_game_id; // capture the game id
            t.on("close", () => {
                last_toast = null;
                browserHistory.push(`/game/${game_id}`);
            });
        }
    } catch (e) {
        console.error(e);
    }
}
browserHistory.listen((obj) => {
    checkForLeavingLiveGame(obj?.location?.pathname);
});

export function AntiGrief(): React.ReactElement {
    checkForLeavingLiveGame(location?.pathname);

    return (
        <>
            <AntiEscaping />
            <AntiStalling />
        </>
    );
}
function AntiEscaping(): React.ReactElement | null {
    const user = useUser();
    const goban = useGoban();
    const [phase, setPhase] = React.useState(goban?.engine?.phase);
    const [clock, setClock] = React.useState<JGOFClockWithTransmitting | undefined | null>(
        goban?.last_emitted_clock,
    );
    const [expiration, setExpiration] = React.useState<number | undefined | null>(null);
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        setShow(false);
        setClock(goban?.last_emitted_clock);
        goban.on("clock", setClock);

        return () => {
            goban.off("clock", setClock);
        };
    }, [goban, setClock]);

    React.useEffect(() => {
        setPhase(goban?.engine?.phase);
    }, [goban?.engine?.phase]);

    React.useEffect(() => {
        const handleAutoResign = (data?: { player_id: number; expiration: number }) => {
            setShow(false);
            setExpiration(data?.expiration);
        };
        const handleClearAutoResign = () => {
            setShow(false);
            setExpiration(null);
        };

        goban.on("auto-resign", handleAutoResign);
        goban.on("clear-auto-resign", handleClearAutoResign);

        return () => {
            goban.off("auto-resign", handleAutoResign);
            goban.off("clear-auto-resign", handleClearAutoResign);
        };
    }, [goban]);

    React.useEffect((): (() => void) | void => {
        if (expiration) {
            const timer = setTimeout(() => {
                setExpiration(null);
                setShow(true);
            }, ANTI_ESCAPING_TIMEOUT * 1000);
            return () => {
                clearTimeout(timer);
            };
        }
    }, [expiration]);

    if (phase !== "play") {
        return null;
    }

    const time_control: JGOFTimeControl = goban?.engine?.time_control;

    if (!time_control) {
        return null;
    }

    if (time_control.speed === "correspondence") {
        return null;
    }

    if (!clock || clock.pause_state) {
        return null;
    }

    if (
        user.id !== goban?.engine?.config?.black_player_id &&
        user.id !== goban?.engine?.config?.white_player_id &&
        !user.is_moderator
    ) {
        return null;
    }

    if (!show) {
        return null;
    }

    const my_color = user.id === goban?.engine?.config?.black_player_id ? "black" : "white";

    return (
        <Card className="AntiEscaping">
            <div>
                {pgettext(
                    "This message is shown when one player has left the game",
                    "Your opponent is no longer connected. You can wait and see if they come back, or end the game.",
                )}
            </div>
            <div>
                <button
                    className="danger"
                    onClick={() => goban?.sendPreventEscaping(my_color, false)}
                >
                    {pgettext(
                        "This button is shown when one player has left the game, it allows the other player to end the game and claim victory",
                        "Claim victory",
                    )}
                </button>

                {/*
                <button
                    className="danger"
                    onClick={() => goban?.sendPreventEscaping(my_color, true)}
                >
                    {pgettext(
                        "This button is shown when one player has left the game, it allows the other player to end the game and claim victory",
                        "End game and don't rate",
                    )}
                </button>
                </div> <div>
                */}
                <button onClick={() => goban?.pauseGame()}>{_("Pause game")}</button>
            </div>
        </Card>
    );
}

function AntiStalling(): React.ReactElement | null {
    const user = useUser();
    const goban = useGoban();
    const [estimate, setEstimate] = React.useState<any>(null);
    const [phase, setPhase] = React.useState(goban?.engine?.phase);

    React.useEffect(() => {
        const onScoreEstimate = (estimate?: StallingScoreEstimate) => {
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

    if (phase !== "play" && phase !== "stone removal") {
        return null;
    }

    if (
        user.id !== goban?.engine?.config?.black_player_id &&
        user.id !== goban?.engine?.config?.white_player_id &&
        !user.is_moderator
    ) {
        return null;
    }

    if (estimate.move_number + 1 < goban.engine?.cur_move?.move_number) {
        // If we've placed a move since the estimate was made, we don't need to show it anymore
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
