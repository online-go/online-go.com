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
import { CreatedChallengeInfo } from "@/lib/types";
import {
    ChallengeModalConfig,
    ChallengeModes,
} from "@/components/ChallengeModal/ChallengeModal.types";
import { openModal } from "@/components/Modal";
import { ChallengeModal, isStandardBoardSize } from "@/components/ChallengeModal/ChallengeModal";
import { GobanEngineConfig, GobanEnginePlayerEntry, GobanRenderer } from "goban";
import { dup } from "@/lib/misc";

export function challenge(
    player_id?: number,
    initial_state?: any,
    computer?: boolean,
    config?: ChallengeModalConfig,
    created?: (c: CreatedChallengeInfo) => void,
) {
    // TODO: Support challenge by player, w/ initial state, or computer

    if (player_id && typeof player_id !== "number") {
        console.log("Invalid player id: ", player_id);
        throw Error("Invalid player id");
    }

    let mode: ChallengeModes = "open";
    if (player_id) {
        mode = "player";
    }
    if (computer) {
        mode = "computer";
    }

    return openModal(
        <ChallengeModal
            playerId={player_id}
            initialState={initial_state}
            config={config}
            mode={mode}
            created={created}
        />,
    );
}
export function createGameRecord(props: {
    library_collection_id?: number;
    players_list?: Array<{ name: string; rank: number }>;
    tournament_record_id?: number;
    tournament_record_round_id?: number;
}) {
    const mode: ChallengeModes = "demo";
    return openModal(
        <ChallengeModal
            mode={mode}
            game_record_mode={true}
            libraryCollectionId={props.library_collection_id}
            playersList={props.players_list}
            tournamentRecordId={props.tournament_record_id}
            tournamentRecordRoundId={props.tournament_record_round_id}
        />,
    );
}
export function createDemoBoard(
    players_list?: Array<{ name: string; rank: number }>,
    tournament_record_id?: number,
    tournament_record_round_id?: number,
) {
    const mode: ChallengeModes = "demo";
    return openModal(
        <ChallengeModal
            mode={mode}
            playersList={players_list}
            tournamentRecordId={tournament_record_id}
            tournamentRecordRoundId={tournament_record_round_id}
        />,
    );
}

export function challengeComputer(settings?: ChallengeModalConfig) {
    return challenge(undefined, null, true, settings);
}
export function challengeRematch(
    goban: GobanRenderer,
    opponent: GobanEnginePlayerEntry,
    original_game_meta: GobanEngineConfig & { pause_on_weekends?: boolean },
) {
    /* TODO: Fix up challengeRematch time control stuff */
    const conf = goban.engine;

    const board_size = `${conf.width}x${conf.height}`;

    console.log(original_game_meta);

    //config.syncBoardSize();
    //config.syncTimeControl();

    const config: ChallengeModalConfig = {
        conf: {
            selected_board_size: isStandardBoardSize(board_size) ? board_size : "custom",
            restrict_rank: false,
        },
        challenge: {
            challenger_color:
                conf.players.black.id === opponent.id ? ("white" as const) : ("black" as const),
            game: {
                handicap: conf.handicap,
                time_control: conf.time_control,
                rules: conf.rules,
                ranked: !!conf.config.ranked,
                width: conf.width,
                height: conf.height,
                komi_auto: "custom",
                komi: conf.komi,
                disable_analysis: conf.disable_analysis,
                pause_on_weekends: original_game_meta.pause_on_weekends ?? false,
                initial_state: null,
                private: (conf as any)["private"], // this is either missing from the type def or invalid
            },
            invite_only: false, // maybe one day we will support challenge-links on the rematch dialog!
        },
        time_control: dup(conf.time_control),
    };

    challenge(opponent.id, null, false, config);
}
