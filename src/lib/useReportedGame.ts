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

import { get } from "@/lib/requests";

import type { Gamedata } from "@/lib/report_checklist";

export type ReportedGameState =
    | { state: "none" }
    | { state: "pending" }
    | { state: "unavailable" }
    | { state: "ready"; gamedata: Gamedata };

export interface ReportedGame {
    /**
     * Fetches the reported game's data: one request per game id however many
     * callers ask. Stable while the game id is, so it is safe in effect
     * dependencies. Rejects when there is no game.
     */
    fetchGamedata: () => Promise<Gamedata>;
    /** The same data, resolved for rendering. */
    reported_game: ReportedGameState;
}

/**
 * The report dialog's view of the reported game. The dialog reads `reported_game`
 * to decide which types to offer, and the checklist's data checks read the game
 * through `fetchGamedata`, so both see one response.
 */
export function useReportedGame(game_id?: number): ReportedGame {
    // Either both fields are set or the ref is null: a game id can never sit here
    // without the promise that belongs to it.
    const cache = React.useRef<{ game_id: number; promise: Promise<Gamedata> } | null>(null);

    const fetchGamedata = React.useCallback((): Promise<Gamedata> => {
        if (!game_id) {
            return Promise.reject(new Error("no reported game"));
        }
        const cached = cache.current;
        if (cached && cached.game_id === game_id) {
            return cached.promise;
        }
        const promise = get(`/termination-api/game/${game_id}`) as Promise<Gamedata>;
        cache.current = { game_id, promise };
        // A cached rejection would silently disable this game's screening for the
        // rest of the dialog session. Clear it so the next call retries; the identity
        // check keeps this from wiping a newer entry that has since replaced it.
        promise.catch(() => {
            if (cache.current?.promise === promise) {
                cache.current = null;
            }
        });
        return promise;
    }, [game_id]);

    const [reported_game, set_reported_game] = React.useState<ReportedGameState>(
        game_id ? { state: "pending" } : { state: "none" },
    );

    React.useEffect(() => {
        if (!game_id) {
            set_reported_game({ state: "none" });
            return;
        }
        let current = true;
        set_reported_game({ state: "pending" });
        fetchGamedata().then(
            (gamedata) => {
                if (current) {
                    set_reported_game({ state: "ready", gamedata });
                }
            },
            () => {
                if (current) {
                    set_reported_game({ state: "unavailable" });
                }
            },
        );
        return () => {
            current = false;
        };
    }, [game_id, fetchGamedata]);

    return { fetchGamedata, reported_game };
}
