/*
 * Copyright 2012-2017 Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Player } from './Player';

export interface MeBlocks_GET_Request {
}

export type MeBlocks_GET_Response = Array<{
    block_games: boolean;
    block_chat: boolean;
    blocked: number;
}>;

export interface MeSupporter_GET_Request {
}

export interface MePurchaseTransactions_GET_Request {
    order_by: string;
    page_size: number;
}

export interface MePurchaseTransactions_GET_Response {
    count: number;
    next: string;
    previous: any;
    results: Array<{
        id: number;
        purchase: {
            id: number;
            rate_plan: number;
            name: string;
            description: string;
            user: number;
            payment_method: {
                id: number;
                payment_token: string;
                active: boolean;
                verified: boolean;
                name: string;
                card_type: string;
                expiration_month: string;
                expiration_year: string;
                card_number: string;
            };
            price: string;
            recurring: boolean;
            order_id: string;
            active: boolean;
            created: string;
            activation: string;
            cancelation: any;
        };
        action: string;
        transaction_id: string;
        created: string;
        amount: string;
        method: string;
        account: string;
    }>;
}

export interface MeSupporter_GET_Response {
    payment_method: {
        id: number;
        payment_account: {
            id: number;
            payment_vendor: string;
            user: number;
            account_id: string;
            created: string;
            verified: boolean;
            active: boolean;
        };
        payment_token: string;
        active: boolean;
        verified: boolean;
        name: string;
        card_type: string;
        expiration_month: string;
        expiration_year: string;
        card_number: string;
    };
    is_supporter: boolean;
    payment_account: {
        id: number;
        payment_vendor: string;
        user: number;
        account_id: string;
        created: string;
        verified: boolean;
        active: boolean;
        payment_methods: {
            id: number;
            payment_token: string;
            active: boolean;
            verified: boolean;
            name: string;
            card_type: string;
            expiration_month: string;
            expiration_year: string;
            card_number: string;
        };
    };
    purchase: {
        price: number;
    };
}

export interface MeChallenges_GET_Request {
    page_size?: number;
}

export interface MeTournaments_GET_Request {
    ended__isnull?: boolean;
    started__isnull?: boolean;
    page_size?: number;
    ordering?: string;
}

export interface MeLadders_GET_Request {
}

export interface MeGroups_GET_Request {
}

export interface MeGroupsInvitations_GET_Request {
    page_size: number;
}

export interface MeGroupsInvitations_GET_Response {
    count: number;
    next: any;
    previous: any;
    results: Array<any>;
}

export interface MeChallenges_GET_Response {
    count: number;
    next: any;
    previous: any;
    results: Array<any>;
}

export interface MeLadders_GET_Response {
    count: number;
    next: any;
    previous: any;
    results: Array<{
        id: number;
        name: string;
        board_size: number;
        group: {
            id: number;
            name: string;
            summary: string;
            require_invitation: boolean;
            is_public: boolean;
            hide_details: boolean;
            member_count: number;
            icon: string;
        };
        size: number;
        player_rank: number;
        player_is_member_of_group: boolean;
    }>;
}

export interface MeTournaments_GET_Response {
    count: number;
    next: any;
    previous: any;
    results: Array<{
        id: number;
        name: string;
        director: Player;
        description: string;
        schedule: any;
        title: any;
        tournament_type: string;
        handicap: number;
        rules: string;
        time_control_parameters: {
            time_control: string;
            initial_time: number;
            max_time: number;
            time_increment: number;
        };
        is_open: boolean;
        exclude_provisional: boolean;
        group: {
            id: number;
            name: string;
            summary: string;
            require_invitation: boolean;
            is_public: boolean;
            hide_details: boolean;
            member_count: number;
            icon: string;
        };
        player_is_member_of_group: boolean;
        auto_start_on_max: boolean;
        time_start: string;
        players_start: number;
        first_pairing_method: string;
        subsequent_pairing_method: string;
        min_ranking: number;
        max_ranking: number;
        analysis_enabled: boolean;
        exclusivity: string;
        started: string;
        ended: any;
        start_waiting: string;
        board_size: number;
        active_round: number;
        settings: {
            num_rounds: number;
            active_round: number;
            player_losses: {
                [id:number]: number;
            };
            maximum_players: number;
        };
        rounds: Array<{
            finished_matches: number;
            total_matches: number;
            round_number: number;
            byes: number;
        }>;
        icon: string;
    }>;
}

export interface MeGroups_GET_Response {
    count: number;
    next: any;
    previous: any;
    results: Array<{
        id: number;
        name: string;
        short_description: string;
        description: string;
        website: string;
        location: string;
        require_invitation: boolean;
        is_public: boolean;
        hide_details: boolean;
        icon: string;
        banner: any;
        has_banner: boolean;
        has_icon: boolean;
        member_count: number;
        bulletin: string;
        admins: Array<Player>;
        latest_news: {
            id: number;
            group: {
                id: number;
                name: string;
                summary: string;
                require_invitation: boolean;
                is_public: boolean;
                hide_details: boolean;
                member_count: number;
                icon: string;
            };
            author: Player;
            posted: string;
            title: string;
            content: string;
        };
        settings: {
            newsNotification: string;
        };
        is_member: boolean;
        ladder_ids: Array<number>;
        founder: Player;
    }>;
}



export interface MeBlocks_GET {
    request: MeBlocks_GET_Request;
    response: MeBlocks_GET_Response;
}
export interface MeChallenges_GET {
    request: MeChallenges_GET_Request;
    response: MeChallenges_GET_Response;
}
export interface MeTournaments_GET {
    request: MeTournaments_GET_Request;
    response: MeTournaments_GET_Response;
}
export interface MeLadders_GET {
    request: MeLadders_GET_Request;
    response: MeLadders_GET_Response;
}
export interface MeGroups_GET {
    request: MeGroups_GET_Request;
    response: MeGroups_GET_Response;
}
export interface MeGroupsInvitations_GET {
    request: MeGroupsInvitations_GET_Request;
    response: MeGroupsInvitations_GET_Response;
}
export interface MeSupporter_GET {
    request: MeSupporter_GET_Request;
    response: MeSupporter_GET_Response;
}
export interface MePurchaseTransactions_GET {
    request: MePurchaseTransactions_GET_Request;
    response: MePurchaseTransactions_GET_Response;
}
