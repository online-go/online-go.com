/*
 * Copyright (C) 2012-2019  Online-Go.com
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

import { PlayerCacheEntry } from 'player_cache';
import { GoEngineRules, JGOFTimeControl } from 'goban';

export interface Player extends PlayerCacheEntry {
    professional: boolean;
}

export interface Group {
    hide_details: boolean;
    icon: string;
    id: number;
    is_public:  boolean;
    member_count: number;
    name: string;
    require_invitation:  boolean;
    summary: string;
}

export type GroupList = Array<Group>;


export type TournamentPairingMethod = "slaughter" | "random" | "slide" | "strength";
export type TournamentExclusivity = "open" | "group" | "invite";
export type TournamentType = 'mcmahon' | 's_mcmahon' | 'roundrobin' | 'swiss' | 's_title' | 's_elimination' | 'elimination' | 'double_elimination';

export interface ActiveTournament {
    active_round: number;
    analysis_enabled: boolean;
    auto_start_on_max: boolean;
    board_size: number;
    description: string;
    director: Player;
    ended: number | null;
    exclude_provisional: boolean;
    exclusivity: TournamentExclusivity;
    first_pairing_method: TournamentPairingMethod;
    group: Group;
    handicap: number;
    icon: string;
    id: number;
    is_open: boolean;
    max_ranking: number;
    min_ranking: number;
    name: string;
    player_count: number;
    players_start: number;
    rules: GoEngineRules;
    schedule: any;
    start_waiting: string; // timestamp
    started: string | null; // timestamp;
    subsequent_pairing_method: TournamentPairingMethod;
    time_control_parameters: JGOFTimeControl;
    time_per_move: number;
    time_start: string | null; // timestamp
    title: string | null;
    tournament_type: TournamentType;
}

export type ActiveTournamentList = Array<ActiveTournament>;
