/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 */

import * as React from "react";
import type { JGOFClockWithTransmitting } from "goban";
import { Clock, SGFClock } from "@/components/Clock";
import { Player } from "@/components/Player";
import { subscribeAllEvents } from "@/components/GobanView";
import { usePhase, usePlayerToMoveOnOfficialBranch } from "@/views/Game/GameHooks";
import { interpolate, npgettext, pgettext } from "@/lib/translate";
import type { GobanController } from "@/lib/GobanController";
import "./KibitzThinPlayer.css";

export function KibitzThinPlayer({
    controller,
    color,
}: {
    controller: GobanController;
    color: "black" | "white";
}): React.ReactElement {
    const goban = controller.goban;
    const phase = usePhase(goban);
    const playerToMove = usePlayerToMoveOnOfficialBranch(goban);
    const readPlayer = React.useCallback(
        () => ({
            player: { ...goban.engine.players[color] },
            captures: goban.engine.computeScore(true)[color].prisoners,
        }),
        [goban, color],
    );
    const [state, setState] = React.useState(readPlayer);
    const [paused, setPaused] = React.useState(false);
    const [hideCaptures, setHideCaptures] = React.useState(false);
    const summaryRef = React.useRef<HTMLDivElement>(null);
    const clockRef = React.useRef<HTMLSpanElement>(null);
    const capturesRef = React.useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
        const sync = () => setState(readPlayer());
        sync();
        setPaused(false);
        const onClock = (clock: JGOFClockWithTransmitting | null) =>
            setPaused(Boolean(clock?.pause_state));
        goban.on("clock", onClock);
        const unsubscribe = subscribeAllEvents(
            goban,
            ["cur_move", "gamedata", "phase", "mode", "stone-removal.updated"],
            sync,
        );
        return () => {
            unsubscribe();
            goban.off("clock", onClock);
        };
    }, [goban, readPlayer]);

    React.useLayoutEffect(() => {
        const summary = summaryRef.current;
        const clock = clockRef.current;
        const captures = capturesRef.current;
        if (!summary || !clock || !captures) {
            return;
        }
        const measure = () =>
            setHideCaptures(clock.offsetWidth + captures.offsetWidth + 8 > summary.clientWidth);
        measure();
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver(measure);
        for (const element of [summary, clock, captures]) {
            observer.observe(element);
        }
        return () => observer.disconnect();
    }, [state.captures]);

    const theirTurn = phase === "play" && playerToMove === state.player.id;
    const captureText = interpolate(
        npgettext(
            "Kibitz player captures",
            "{{count}} capture",
            "{{count}} captures",
            state.captures,
        ),
        { count: state.captures },
    );

    return (
        <div
            className={`KibitzThinPlayer ${color}${theirTurn ? " their-turn" : ""}`}
            role="group"
            aria-label={
                theirTurn
                    ? color === "black"
                        ? pgettext("Kibitz player colour and turn", "Black to play")
                        : pgettext("Kibitz player colour and turn", "White to play")
                    : color === "black"
                      ? pgettext("Kibitz player colour", "Black")
                      : pgettext("Kibitz player colour", "White")
            }
        >
            <div className="KibitzThinPlayer-name">
                <span className="KibitzThinPlayer-stone" aria-hidden="true" />
                {state.player.id ? (
                    <Player
                        user={state.player.id}
                        historical={state.player}
                        gameId={goban.game_id}
                        flag={false}
                        flare={false}
                        online={false}
                    />
                ) : (
                    <span className="KibitzThinPlayer-name-plain">{state.player.username}</span>
                )}
            </div>
            <div className="KibitzThinPlayer-summary" ref={summaryRef}>
                <span className="KibitzThinPlayer-time" ref={clockRef}>
                    {phase !== "finished" && !goban.review_id ? (
                        <Clock goban={goban} color={color} compact lineSummary />
                    ) : goban.engine.sgf_time_settings ? (
                        <SGFClock goban={goban} color={color} />
                    ) : phase === "finished" ? (
                        pgettext("Kibitz game clock", "Finished")
                    ) : (
                        pgettext("Kibitz game clock", "No clock")
                    )}
                </span>
                {paused && (
                    <span className="KibitzThinPlayer-paused">
                        {pgettext("Kibitz game clock", "Paused")}
                    </span>
                )}
                <span
                    ref={capturesRef}
                    className={
                        "KibitzThinPlayer-captures" +
                        (hideCaptures || paused ? " is-overflowing" : "")
                    }
                    aria-hidden={hideCaptures || paused}
                >
                    {captureText}
                </span>
            </div>
        </div>
    );
}
