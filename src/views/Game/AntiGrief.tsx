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
import { useGobanController } from "./goban_context";
import { useUser } from "@/lib/hooks";
import { GobanInteractive, JGOFClockWithTransmitting, JGOFTimeControl } from "goban";
import { browserHistory } from "@/lib/ogsHistory";
import { toast } from "@/lib/toast";
import { StallingScoreEstimate } from "goban";
import "./AntiGrief.css";

const ANTI_ESCAPING_TIMEOUT = 60; // number of seconds to wait before allowing the "Claim victory" button to be appear and be clicked

let on_game_page = false;
let live_game = false;
let last_game_id = 0;
let live_game_phase: string | null = null;
let last_toast: ReturnType<typeof toast> | null = null;
let is_player = false; // Changed from was_player to is_player for clarity
let last_pathname = "";
let paused_since: number | undefined;
let last_goban: GobanInteractive | undefined | null;

// Exported function to be called by Game.tsx
export function updateAntiGriefGameState(goban: GobanInteractive | null) {
    const user_id = data.get("user").id;

    if (last_goban) {
        last_goban.off("clock", updatePauseState);
    }

    if (!goban) {
        last_goban = null;
        return;
    }

    const isPlayer =
        goban.engine?.config?.black_player_id === user_id ||
        goban.engine?.config?.white_player_id === user_id;

    const isLiveGame = goban.engine?.time_control?.speed !== "correspondence";
    const gamePhase = goban.engine?.phase;

    on_game_page = true;
    is_player = isPlayer;
    live_game = isLiveGame;
    last_game_id = goban.game_id;
    live_game_phase = gamePhase;
    last_goban = goban;
    paused_since = goban.paused_since;
    const clock = goban.last_emitted_clock;
    if (clock?.pause_state && !paused_since) {
        paused_since = clock.paused_since || Date.now();
    }

    goban.on("clock", updatePauseState);
}

function updatePauseState() {
    if (last_goban) {
        paused_since = last_goban.paused_since;
        // Also check the last emitted clock for pause state
        const clock = last_goban.last_emitted_clock;
        if (clock?.pause_state && !paused_since) {
            // If clock says paused but paused_since not set, use current time
            paused_since = clock.paused_since || Date.now();
        }
    }
}

function checkForLeavingLiveGame(pathname: string) {
    try {
        if (pathname === last_pathname) {
            return;
        }

        // Capture the previous state before updating
        const was_on_page = on_game_page;
        const was_live_game = live_game;
        const was_player = is_player;

        // Check if we're navigating TO a game page
        const isGamePage = pathname.startsWith(`/game/`);

        if (isGamePage) {
            // Close any existing toast when navigating back to a game
            if (last_toast) {
                last_toast.close();
            }
        } else {
            on_game_page = false;
        }

        const shouldShowToast =
            was_on_page &&
            was_player &&
            !on_game_page &&
            was_live_game &&
            live_game_phase === "play" &&
            !paused_since;

        if (shouldShowToast) {
            const t = toast(
                <div>
                    {_(
                        "You have left a live game. If you do not return you will forfeit the match.",
                    )}
                </div>,
            );
            last_toast = t;

            t.on("close", () => {
                last_toast = null;
                browserHistory.push(`/game/${last_game_id}`);
            });
        }
    } catch (e) {
        console.error(e);
    }
    last_pathname = pathname;
}
browserHistory.listen((obj: any) => {
    checkForLeavingLiveGame(obj?.location?.pathname);
    if (!obj?.location?.pathname.startsWith("/game/")) {
        last_goban = null;
        paused_since = undefined;
        on_game_page = false;
        live_game = false;
        live_game_phase = null;
        is_player = false;
    }
});

export function AntiGrief(): React.ReactElement {
    return (
        <>
            <AntiEscaping />
            <AntiStalling />
        </>
    );
}
function AntiEscaping(): React.ReactElement | null {
    const user = useUser();
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
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
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
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
