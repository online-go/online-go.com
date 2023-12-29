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

import React from "react";
import { LogData } from "./Game";
import moment from "moment";

const log = [
    {
        timestamp: "2023-12-29T06:41:48.723Z",
        event: "game_ended",
        data: {
            winner: 1300,
            outcome_text: "33.5 points",
            annul: false,
        },
    },
    {
        timestamp: "2023-12-29T06:41:48.722Z",
        event: "stone_removal_stones_accepted",
        data: {
            player_id: 1300,
            stones: "eafafbfcgcfdhdgehfifig",
            strict_seki_mode: false,
            move_number: 48,
            current_removal_string: "eafafbfcgcfdhdgehfifig",
        },
    },
    {
        timestamp: "2023-12-29T06:41:46.613Z",
        event: "stone_removal_stones_accepted",
        data: {
            player_id: 1369,
            stones: "eafafbfcgcfdhdgehfifig",
            strict_seki_mode: false,
            move_number: 48,
            current_removal_string: "eafafbfcgcfdhdgehfifig",
        },
    },
    {
        timestamp: "2023-12-29T06:41:44.036Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1369,
            color: "white",
            stones: "fcfdfbfaeagcfdfcfbfaeagchdgefbfcfdgcfaeafafbfcfdgceagcfcfdfbfaeahdhdifighfgehdhfifig",
            removed: true,
            move_number: 48,
            current_removal_string: "eafafbfcgcfdhdgehfifig",
        },
    },
    {
        timestamp: "2023-12-29T06:41:41.139Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1300,
            color: "black",
            stones: "fcfdfbfaeagcfdfcfbfaeagchdgefbfcfdgcfaeafafbfcfdgceagcfcfdfbfaeahdhdifighfgehdhfifig",
            removed: false,
            move_number: 48,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:41:41.139Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1300,
            color: "black",
            stones: "acadbdbececfcgbhdhdiei",
            removed: false,
            move_number: 48,
            current_removal_string: "eafafbfcgcfdhdgehfifig",
        },
    },
    {
        timestamp: "2023-12-29T06:41:37.599Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1369,
            color: "white",
            stones: "acadbdbececfcgbhdhdiei",
            removed: true,
            move_number: 48,
            current_removal_string: "eafafbacfcgcadbdfdhdbecegecfhfifcgigbhdhdiei",
        },
    },
    {
        timestamp: "2023-12-29T06:41:35.967Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1369,
            color: "white",
            stones: "fcfdfbfaeagcfdfcfbfaeagchdgefbfcfdgcfaeafafbfcfdgceagcfcfdfbfaeahdhdifighfgehdhfifig",
            removed: true,
            move_number: 48,
            current_removal_string: "eafafbfcgcfdhdgehfifig",
        },
    },
    {
        timestamp: "2023-12-29T06:41:34.414Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1300,
            color: "black",
            stones: "fbfcfdgcfaeafbfcfdgcfaeafafbfcfdgceagcfcfdfbfaeahdhdifighfgehdhfifigfdfcfbfaeagchdge",
            removed: false,
            move_number: 48,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:41:32.760Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1369,
            color: "white",
            stones: "fcfdfbfaeagcfdfcfbfaeagchdgefbfcfdgcfaeafafbfcfdgceagcfcfdfbfaeahdhdifighfgehdhfifig",
            removed: true,
            move_number: 48,
            current_removal_string: "eafafbfcgcfdhdgehfifig",
        },
    },
    {
        timestamp: "2023-12-29T06:41:30.120Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1300,
            color: "black",
            stones: "",
            removed: true,
            move_number: 48,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:41:30.116Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1300,
            color: "black",
            stones: "",
            removed: false,
            move_number: 48,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:41:30.103Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1369,
            color: "white",
            stones: "",
            removed: true,
            move_number: 48,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:41:30.099Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1369,
            color: "white",
            stones: "",
            removed: false,
            move_number: 48,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:41:29.460Z",
        event: "stone_removal_phase_entered",
        data: {
            force_autoscore: false,
        },
    },
    {
        timestamp: "2023-12-29T06:41:14.763Z",
        event: "stone_removal_stones_rejected",
        data: {
            player_id: 1300,
        },
    },
    {
        timestamp: "2023-12-29T06:41:14.761Z",
        event: "stone_removal_phase_resumed_game",
        data: null,
    },
    {
        timestamp: "2023-12-29T06:41:03.119Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1369,
            color: "white",
            stones: "aaabacbbbaca",
            removed: false,
            move_number: 43,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:41:02.025Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1369,
            color: "white",
            stones: "aaabacbbbaca",
            removed: true,
            move_number: 43,
            current_removal_string: "aaabacbbbaca",
        },
    },
    {
        timestamp: "2023-12-29T06:40:50.189Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1369,
            color: "white",
            stones: "",
            removed: false,
            move_number: 43,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:40:50.186Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1369,
            color: "white",
            stones: "",
            removed: true,
            move_number: 43,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:40:50.172Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1300,
            color: "black",
            stones: "",
            removed: true,
            move_number: 43,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:40:50.164Z",
        event: "stone_removal_stones_set",
        data: {
            player_id: 1300,
            color: "black",
            stones: "",
            removed: false,
            move_number: 43,
            current_removal_string: "",
        },
    },
    {
        timestamp: "2023-12-29T06:40:49.522Z",
        event: "stone_removal_phase_entered",
        data: {
            force_autoscore: false,
        },
    },
    {
        timestamp: "2023-12-29T06:39:15.901Z",
        event: "game_created",
        data: {
            white_player_id: 1369,
            black_player_id: 1300,
            group_ids: [58, 39],
            game_id: 16243,
            game_name: "asdf vs. asdfg",
            private: false,
            pause_on_weekends: false,
            players: {
                black: {
                    username: "asdf",
                    rank: 22.285257244037446,
                    professional: false,
                },
                white: {
                    username: "asdfg",
                    rank: 21.734478311913662,
                    professional: false,
                },
            },
            ranked: true,
            disable_analysis: true,
            handicap: 0,
            komi: 5.5,
            width: 9,
            height: 9,
            rules: "japanese",
            rengo: false,
            rengo_teams: {
                black: [],
                white: [],
            },
            rengo_casual_mode: false,
            time_control: {
                system: "byoyomi",
                main_time: 300,
                period_time: 30,
                periods: 5,
                pause_on_weekends: false,
                time_control: "byoyomi",
            },
            meta_groups: [2, 7, 39, 58, 60],
        },
    },
];

const config = {
    white_player_id: 1369,
    black_player_id: 1300,
    group_ids: [58, 39],
    game_id: 16243,
    game_name: "asdf vs. asdfg",
    private: false,
    pause_on_weekends: false,
    players: {
        black: {
            username: "asdf",
            rank: 22.285257244037446,
            professional: false,
            id: 1300,
            accepted_stones: "eafafbfcgcfdhdgehfifig",
            accepted_strict_seki_mode: false,
        },
        white: {
            username: "asdfg",
            rank: 21.734478311913662,
            professional: false,
            id: 1369,
            accepted_stones: "eafafbfcgcfdhdgehfifig",
            accepted_strict_seki_mode: false,
        },
    },
    ranked: true,
    disable_analysis: true,
    handicap: 0,
    komi: 5.5,
    width: 9,
    height: 9,
    rules: "japanese",
    rengo: false,
    rengo_teams: { black: [], white: [] },
    rengo_casual_mode: false,
    time_control: {
        system: "byoyomi",
        main_time: 300,
        period_time: 30,
        periods: 5,
        pause_on_weekends: false,
        time_control: "byoyomi",
        speed: "live",
    },
    meta_groups: [2, 7, 39, 58, 60],
    phase: "finished",
    initial_player: "black",
    moves: [
        [4, 4, 5537],
        [6, 4, 1634.5],
        [4, 2, 1701],
        [6, 2, 1359],
        [4, 6, 1587.5],
        [2, 4, 1566.4999999999418],
        [2, 2, 1792.5],
        [2, 6, 1485.5],
        [6, 6, 1728],
        [7, 5, 1629.5],
        [7, 6, 1651.5],
        [5, 1, 1665.5],
        [4, 1, 1669.5],
        [3, 7, 2435.5],
        [4, 7, 1809.5],
        [1, 3, 1977.5],
        [1, 2, 1888.0000000000582],
        [8, 6, 2574],
        [8, 7, 1714],
        [8, 5, 1567],
        [7, 8, 2082],
        [4, 0, 3532.000000000058],
        [3, 0, 2412.500000000058],
        [5, 0, 1799.5],
        [2, 1, 2554],
        [4, 8, 2485.5],
        [5, 8, 1533.5],
        [3, 8, 1539.5000000000582],
        [3, 5, 5139],
        [2, 5, 1591],
        [6, 5, 3366.5],
        [7, 3, 1581],
        [5, 4, 1738.5],
        [5, 3, 1539],
        [4, 3, 2099],
        [5, 2, 2122],
        [3, 6, 2820],
        [1, 7, 1524.5000000000582],
        [2, 3, 4521.5],
        [0, 3, 1897],
        [3, 4, 2474],
        [-1, -1, 3015.5],
        [-1, -1, 2147],
        [0, 2, 31429.5],
        [0, 1, 2011.0000000000582],
        [1, 4, 2558.499999999942],
        [-1, -1, 2307.5],
        [-1, -1, 1639],
    ],
    allow_self_capture: false,
    automatic_stone_removal: false,
    free_handicap_placement: false,
    aga_handicap_scoring: false,
    allow_ko: false,
    allow_superko: true,
    superko_algorithm: "noresult",
    player_pool: {
        "1300": {
            username: "asdf",
            rank: 22.285257244037446,
            professional: false,
            id: 1300,
            accepted_stones: "eafafbfcgcfdhdgehfifig",
            accepted_strict_seki_mode: false,
        },
        "1369": {
            username: "asdfg",
            rank: 21.734478311913662,
            professional: false,
            id: 1369,
            accepted_stones: "eafafbfcgcfdhdgehfifig",
            accepted_strict_seki_mode: false,
        },
    },
    score_territory: true,
    score_territory_in_seki: false,
    score_stones: false,
    score_handicap: false,
    score_prisoners: true,
    score_passes: true,
    white_must_pass_last: false,
    opponent_plays_first_after_resume: true,
    strict_seki_mode: false,
    initial_state: { black: "", white: "" },
    start_time: 1703831955,
    original_disable_analysis: true,
    state_version: 120,
    malkovich_present: false,
    clock: {
        game_id: 16243,
        current_player: 1300,
        black_player_id: 1300,
        white_player_id: 1369,
        title: "asdf vs. asdfg",
        last_move: 1703832089451,
        expiration: 1703832487377,
        black_time: { thinking_time: 247.92600000000002, periods: 5, period_time: 30 },
        white_time: { thinking_time: 249.53699999999998, periods: 5, period_time: 30 },
        paused_since: 1703832089451,
        pause_delta: 0,
        expiration_delta: 397926,
        stone_removal_mode: true,
        stone_removal_expiration: 1703832404036,
    },
    latencies: { "1300": 65, "1369": 47 },
    pause_control: { "stone-removal": true },
    removed: "",
    paused_since: 1703832089451,
    auto_scoring_done: true,
    score: {
        white: {
            total: 15.5,
            stones: 0,
            territory: 10,
            prisoners: 0,
            scoring_positions: "aeafbfagbgahchaibici",
            handicap: 0,
            komi: 5.5,
        },
        black: {
            total: 49,
            stones: 0,
            territory: 38,
            prisoners: 11,
            scoring_positions:
                "aabacabbeafagahaiafbgbhbibfcgchcicfdgdhdidgeheiehfifigdbdcddeffffgfhghhhgiii",
            handicap: 0,
            komi: 0,
        },
    },
    winner: 1300,
    outcome: "33.5 points",
    end_time: 1703832108,
};

export function FakeGameLog() {
    return log.map((entry, idx) => (
        <tr key={entry.timestamp + ":" + idx} className="entry">
            <td className="timestamp">{moment(entry.timestamp).format("L LTS")}</td>
            <td className="event">{entry.event.replace(/_/g, " ")}</td>
            <td className="data">
                <LogData
                    key={idx}
                    config={config as any}
                    markCoords={() => {}}
                    event={entry.event}
                    data={entry.data}
                />
            </td>
        </tr>
    ));
}
