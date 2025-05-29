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

import { CreatedChallengeInfo, RuleSet } from "@/lib/types";
import {
    GobanEngineInitialState,
    JGOFTimeControl,
    JGOFTimeControlSpeed,
    JGOFTimeControlSystem,
} from "goban";
import { TimeControl, TimeControlTypes } from "../TimeControl";
import { ViewMode } from "@/views/Game";

export type ChallengeDetails = rest_api.ChallengeDetails;

export type ChallengeModes = "open" | "computer" | "player" | "demo";

export interface ChallengeModalProperties {
    mode: ChallengeModes;
    game_record_mode?: boolean /* when true, if mode === "demo", we will create a game instance instead of a review instance */;
    playerId?: number;
    initialState?: any;
    config?: ChallengeModalConfig;
    autoCreate?: boolean;
    playersList?: Array<{ name: string; rank: number }>;
    tournamentRecordId?: number;
    tournamentRecordRoundId?: number;
    libraryCollectionId?: number;
    created?: (c: CreatedChallengeInfo) => void;
}

export interface ChallengeModalInput extends ChallengeModalProperties {
    modal: {
        close?: () => void;
        on: (event: "open" | "close", callback: () => void) => void;
        off: (event: "open" | "close", callback: () => void) => void;
    };
}

/* These rejection details come from gtp2ogs and allows bots to
 * be clear about why a challenge is being rejected. */
export interface RejectionDetails {
    rejection_code:
        | "blacklisted"
        | "board_size_not_square"
        | "board_size_not_allowed"
        | "handicap_not_allowed"
        | "unranked_not_allowed"
        | "ranked_not_allowed"
        | "blitz_not_allowed"
        | "too_many_blitz_games"
        | "live_not_allowed"
        | "too_many_live_games"
        | "correspondence_not_allowed"
        | "too_many_correspondence_games"
        | "time_control_system_not_allowed"
        | "time_increment_out_of_range"
        | "period_time_out_of_range"
        | "periods_out_of_range"
        | "main_time_out_of_range"
        | "max_time_out_of_range"
        | "per_move_time_out_of_range"
        | "player_rank_out_of_range"
        | "not_accepting_new_challenges"
        | "too_many_games_for_player"
        | "komi_out_of_range";
    details: {
        [key: string]: any;
    };
}

export interface PreferredSettingOption {
    value: number; // index of the setting
    label: string; // challenge text description
    setting: ChallengeDetails;
}

export interface ChallengeModalConfig {
    challenge: {
        min_ranking?: number;
        max_ranking?: number;
        challenger_color: rest_api.ColorSelectionOptions;
        invite_only: boolean;

        game: {
            name?: string;
            rules: RuleSet;
            ranked: boolean;
            handicap: number;
            komi_auto: rest_api.KomiOption;
            disable_analysis: boolean;
            initial_state: GobanEngineInitialState | null;
            private: boolean;
            time_control?: JGOFTimeControl;
            width?: number;
            height?: number;
            komi?: number;
            pause_on_weekends?: boolean;
        };
    };
    conf: {
        restrict_rank: boolean;
        selected_board_size?: string;
    };
    time_control: TimeControlConfig;
}

interface TimeControlConfig {
    system: JGOFTimeControlSystem;
    speed: JGOFTimeControlSpeed;
    initial_time?: number;
    main_time?: number;
    time_increment?: number;
    max_time?: number;
    period_time?: number;
    periods?: number;
    pause_on_weekends: boolean;
}

export type ChallengeModalConf = {
    mode: ChallengeModes;
    username: string;
    bot_id: number;
    selected_board_size: string;
    restrict_rank: boolean;
};

export type GameInput = {
    name: string;
    rules: RuleSet;
    ranked: boolean;
    width: number | null;
    height: number | null;
    handicap: number;
    komi_auto: rest_api.KomiOption;
    komi?: number | null;
    disable_analysis: boolean;
    initial_state: {
        black: string;
        white: string;
    };
    private: boolean;
    rengo: boolean;
    rengo_casual_mode: boolean;
    pause_on_weekends?: boolean;
    time_control?: TimeControlTypes.TimeControlSystem;
    time_control_parameters?: TimeControl;
    speed?: JGOFTimeControlSpeed;
};

export type ChallengeInput = {
    min_ranking: number;
    max_ranking: number;
    challenger_color: rest_api.ColorSelectionOptions;
    rengo_auto_start: number;
    invite_only?: boolean;
    boardWidth?: number;
    boardHeight?: number;
    game: GameInput;
};

export type DemoSettings = {
    name: string;
    rules: RuleSet;
    width: number | null;
    height: number | null;
    black_name: string;
    black_ranking: number;
    white_name: string;
    white_ranking: number;
    private: boolean;
    komi_auto: rest_api.KomiOption;
    komi?: number | null;
};

export type ChallengeModalState = {
    challenge: ChallengeInput;
    conf: ChallengeModalConf;
    demo: DemoSettings;
    forking_game: boolean;
    hide_preferred_settings_on_portrait: boolean;
    preferred_settings: ChallengeDetails[];
    selected_demo_player_black: number;
    selected_demo_player_white: number;
    time_control: TimeControl;
    view_mode: ViewMode;
    player_username_resolved?: boolean;
    show_computer_settings?: boolean;
    initial_state?: {
        black: string;
        white: string;
    };
};

export type UpdateFn<T> = (prev: T) => T;
