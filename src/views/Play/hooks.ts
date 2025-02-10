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
import { automatch_manager } from "@/lib/automatch_manager";
import { Challenge } from "@/lib/challenge_utils";
import { EventEmitter } from "eventemitter3";

interface Events {
    challenges: (challenges: { [id: string]: Challenge } | undefined) => void;
    clear: () => void;
}

/* This emitter is called by the CustomGames component which creates the
 * SeekGraph instance which does the work of subscribing to this data. */
export const active_challenges_emitter = new EventEmitter<Events>();

export function useHaveActiveGameSearch(): boolean {
    const [have_active_automatch, setHaveActiveAutomatch] = React.useState(
        automatch_manager.active_live_automatcher,
    );
    const [have_live_user_challenge, setHaveLiveUserChallenge] = React.useState(false);

    React.useEffect(() => {
        function updateLiveAutomatcherStatus() {
            setHaveActiveAutomatch(automatch_manager.active_live_automatcher);
        }

        automatch_manager.on("entry", updateLiveAutomatcherStatus);
        automatch_manager.on("start", updateLiveAutomatcherStatus);
        automatch_manager.on("cancel", updateLiveAutomatcherStatus);

        return () => {
            automatch_manager.removeListener("entry", updateLiveAutomatcherStatus);
            automatch_manager.removeListener("start", updateLiveAutomatcherStatus);
            automatch_manager.removeListener("cancel", updateLiveAutomatcherStatus);
        };
    }, []);

    React.useEffect(() => {
        function updateChallenges(args?: { [id: string]: Challenge }) {
            let found_live_user_challenge = false;

            for (const challenge of Object.values(args || {})) {
                if (
                    challenge.user_challenge &&
                    challenge.time_per_move > 0 &&
                    challenge.time_per_move < 3600
                ) {
                    found_live_user_challenge = true;
                }
            }

            setHaveLiveUserChallenge(found_live_user_challenge);
        }

        active_challenges_emitter.on("challenges", updateChallenges);
        active_challenges_emitter.on("clear", updateChallenges);

        return () => {
            active_challenges_emitter.removeListener("challenges", updateChallenges);
            active_challenges_emitter.removeListener("clear", updateChallenges);
        };
    }, []);

    return !!(have_active_automatch || have_live_user_challenge);
}
