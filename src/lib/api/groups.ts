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

export interface GroupsDetail_GET_Request {
}
export interface GroupsDetail_GET_Response {
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
    banner: string;
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
}
export interface GroupsDetail_GET {
    request: GroupsDetail_GET_Request;
    response: GroupsDetail_GET_Response;
}

export type GroupsMembers_POST_Request = Player | { 'delete': boolean; [k:string]: any } | {};
export interface GroupsMembers_POST_Response {
    success?: boolean;
    pending?: boolean;
}

export interface GroupsMembers_POST {
    request: GroupsMembers_POST_Request;
    response: GroupsMembers_POST_Response;
}

export interface GroupsNews_POST_Request {
    id?: number;
    title?: string;
    content?: string;
    'delete'?: boolean;
}
export interface GroupsNews_POST {
    request: GroupsNews_POST_Request;
    response: GroupsNews_POST_Response;
}
export interface GroupsNews_POST_Response {
    id: number;
    success: string;
}

export interface GroupsNews_PUT_Request {
    id: number;
    title: string;
    content: string;
}
export interface GroupsNews_PUT {
    request: GroupsNews_PUT_Request;
    response: GroupsNews_PUT_Response;
}
export interface GroupsNews_PUT_Response {
    id: number;
    success: string;
}

export interface Groups_GET_Request {
    page_size?: number;
    page?: number;
    ordering?: string;
    name__istartswith?: string;
}
export interface Groups_GET {
    request: Groups_GET_Request;
    response: Groups_GET_Response;
}
export interface Groups_GET_Response {
    count: number;
    next: string;
    previous: any;
    results: Array<{
        id: number;
        name: string;
        summary: string;
        require_invitation: boolean;
        is_public: boolean;
        hide_details: boolean;
        member_count: number;
        icon: string;
    }>;
}
export interface GroupsNews_GET_Request {
}
export interface GroupsNews_GET {
    request: GroupsNews_GET_Request;
    response: GroupsNews_GET_Response;
}
export interface GroupsMembers_GET_Request {
    page_size: number;
    page: number;
}
export interface GroupsMembers_GET {
    request: GroupsMembers_GET_Request;
    response: GroupsMembers_GET_Response;
}
export interface GroupsNews_GET_Response {
    count: number;
    next: any;
    previous: any;
    results: Array<any>;
}
export interface GroupsMembers_GET_Response {
    count: number;
    next: string;
    previous: any;
    results: Array<{
        id: number;
        user: Player;
        is_primary: boolean;
        is_admin: boolean;
    }>;
}

export interface Groups_POST_Request {
    name: string;
    require_invitation: boolean;
    is_public: boolean;
    hide_details: boolean;
}
export interface Groups_POST_Response {
    id: number;
    success: string;
}
export interface Groups_POST {
    request: Groups_POST_Request;
    response: Groups_POST_Response;
}
