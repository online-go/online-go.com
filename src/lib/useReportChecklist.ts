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
import { buildResults, evaluateAsyncChecks } from "@/lib/report_checklist";

import type {
    AsyncOutcomes,
    ChecklistItem,
    ChecklistItemId,
    ChecklistItemResult,
    Gamedata,
} from "@/lib/report_checklist";

interface UseReportChecklistArgs {
    /** Must be referentially stable across renders — wrap getChecklist() in useMemo. */
    items: ChecklistItem[];
    game_id?: number;
    review_id?: number;
    reported_user_id?: number;
    note: string;
    stalling_kind?: string;
    attestations: Record<ChecklistItemId, boolean>;
}

export function useReportChecklist({
    items,
    game_id,
    review_id,
    reported_user_id,
    note,
    stalling_kind,
    attestations,
}: UseReportChecklistArgs): ChecklistItemResult[] {
    const [outcomes, set_outcomes] = React.useState<AsyncOutcomes | null>(null);

    // One in-flight request per game, shared by every check that needs game data.
    // Either both fields are set or the ref is null: a game id can never sit here
    // without the promise that belongs to it.
    const gamedata_cache = React.useRef<{ game_id: number; promise: Promise<Gamedata> } | null>(
        null,
    );

    const fetchGamedata = React.useCallback((): Promise<Gamedata> => {
        if (!game_id) {
            return Promise.reject(new Error("no reported game"));
        }
        const cached = gamedata_cache.current;
        if (cached && cached.game_id === game_id) {
            return cached.promise;
        }
        const promise = get(`/termination-api/game/${game_id}`) as Promise<Gamedata>;
        gamedata_cache.current = { game_id, promise };
        // A cached rejection would silently disable this game's screening for the
        // rest of the dialog session. Clear it so the next call retries; the identity
        // check keeps this from wiping a newer entry that has since replaced it.
        promise.catch(() => {
            if (gamedata_cache.current?.promise === promise) {
                gamedata_cache.current = null;
            }
        });
        return promise;
    }, [game_id]);

    // Guards against a slow response for one report type or game landing after the
    // reporter has moved on and overwriting what they are looking at.
    const generation = React.useRef(0);

    React.useEffect(() => {
        const mine = ++generation.current;
        set_outcomes(null);

        void evaluateAsyncChecks(items, {
            game_id,
            review_id,
            reported_user_id,
            note,
            stalling_kind,
            fetchGamedata,
        }).then((result) => {
            if (generation.current === mine) {
                set_outcomes(result);
            }
        });
        // `note` and `stalling_kind` are deliberately absent from the dependencies.
        // Async checks must not read them: they would see a stale value frozen at the
        // last report-type or game change, not what the reporter is currently
        // entering, and including them here would restart evaluation — flashing every
        // check back to pending — on every change. A check that needs live form state
        // must be `sync: true`; synchronous checks read the live values through
        // buildResults below, which runs on every render.
    }, [items, game_id, review_id, reported_user_id, fetchGamedata]);

    return buildResults(
        items,
        { game_id, review_id, reported_user_id, note, stalling_kind, fetchGamedata },
        outcomes,
        attestations,
    );
}
