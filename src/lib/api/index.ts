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

interface GenericRequestResponse {
    'request': any;
    'response': any;
}

export interface API {
    'GET': {
        '/api/v0/logout': GenericRequestResponse;
        '/termination-api/players': GenericRequestResponse;
        'announcements': GenericRequestResponse;
        'games/%%': GenericRequestResponse;
        'games/%%/acl': GenericRequestResponse;
        'groups': GenericRequestResponse;
        'groups/%%': GenericRequestResponse;
        'groups/%%/members': GenericRequestResponse;
        'groups/%%/news': GenericRequestResponse;
        'host_ip_settings': GenericRequestResponse;
        'ladders': GenericRequestResponse;
        'ladders/%%': GenericRequestResponse;
        'ladders/%%/players': GenericRequestResponse;
        'leaderboards': GenericRequestResponse;
        'library/%%': GenericRequestResponse;
        'me/blocks': GenericRequestResponse;
        'me/challenges': GenericRequestResponse;
        'me/groups': GenericRequestResponse;
        'me/groups/invitations': GenericRequestResponse;
        'me/ladders': GenericRequestResponse;
        'me/purchase_transactions': GenericRequestResponse;
        'me/settings': GenericRequestResponse;
        'me/supporter': GenericRequestResponse;
        'me/tournaments': GenericRequestResponse;
        'moderation': GenericRequestResponse;
        'moderation/recent_users': GenericRequestResponse;
        'players': GenericRequestResponse;
        'players/%%/aliases': GenericRequestResponse;
        'players/%%/full': GenericRequestResponse;
        'players/%%/games': GenericRequestResponse;
        'puzzles/%%': GenericRequestResponse;
        'puzzles/%%/collection_summary': GenericRequestResponse;
        'puzzles/%%/rate': GenericRequestResponse;
        'puzzles/collections': GenericRequestResponse;
        'reviews': GenericRequestResponse;
        'reviews/%%': GenericRequestResponse;
        'reviews/%%/acl': GenericRequestResponse;
        'supporter_center/player/%%': GenericRequestResponse;
        'tournament_schedules': GenericRequestResponse;
        'tournaments': GenericRequestResponse;
        'tournaments/%%': GenericRequestResponse;
        'tournaments/%%/players/all': GenericRequestResponse;
        'tournaments/%%/rounds': GenericRequestResponse;
        'ui/config': GenericRequestResponse;
        'ui/friends': GenericRequestResponse;
        'ui/omniSearch': GenericRequestResponse;
        'ui/overview': GenericRequestResponse;
        'https://api.github.com/repos/online-go/online-go.com/contributors': GenericRequestResponse;
    };
    'POST': {
        '/api/v0/changePassword': GenericRequestResponse;
        '/api/v0/login': GenericRequestResponse;
        '/api/v0/register': GenericRequestResponse;
        '/api/v0/reset': GenericRequestResponse;
        'announcements': GenericRequestResponse;
        'challenges': GenericRequestResponse;
        'challenges/%%/accept': GenericRequestResponse;
        'demos': GenericRequestResponse;
        'games/%%/acl': GenericRequestResponse;
        'games/%%/annul': GenericRequestResponse;
        'games/%%/moderate': GenericRequestResponse;
        'games/%%/reviews': GenericRequestResponse;
        'groups': GenericRequestResponse;
        'groups/%%/members': GenericRequestResponse;
        'groups/%%/news': GenericRequestResponse;
        'host_ip_settings': GenericRequestResponse;
        'ladders/%%/players': GenericRequestResponse;
        'ladders/%%/players/challenge': GenericRequestResponse;
        'library/%%': GenericRequestResponse;
        'library/%%/collections': GenericRequestResponse;
        'me/challenges/%%/accept': GenericRequestResponse;
        'me/friends': GenericRequestResponse;
        'me/friends/invitations': GenericRequestResponse;
        'me/games/sgf/%%': GenericRequestResponse;
        'me/groups/invitations': GenericRequestResponse;
        'me/payment_accounts': GenericRequestResponse;
        'me/supporter': GenericRequestResponse;
        'me/tournaments/invitations': GenericRequestResponse;
        'me/validateEmail': GenericRequestResponse;
        'moderation/incident': GenericRequestResponse;
        'moderation/incident/%%': GenericRequestResponse;
        'moderation/shadowban_anonymous_user': GenericRequestResponse;
        'players/%%/challenge': GenericRequestResponse;
        'puzzles': GenericRequestResponse;
        'puzzles/collections': GenericRequestResponse;
        'reviews/%%/acl': GenericRequestResponse;
        'tournaments': GenericRequestResponse;
        'tournaments/%%/players': GenericRequestResponse;
        'tournaments/%%/start': GenericRequestResponse;
        'ui/bot/generateAPIKey': GenericRequestResponse;
    };
    'PUT': {
        'groups/%%': GenericRequestResponse;
        'groups/%%/banner': GenericRequestResponse;
        'groups/%%/icon': GenericRequestResponse;
        'groups/%%/members': GenericRequestResponse;
        'groups/%%/news': GenericRequestResponse;
        'me/payment_methods/%%': GenericRequestResponse;
        'me/settings': GenericRequestResponse;
        'me/vacation': GenericRequestResponse;
        'players/%%': GenericRequestResponse;
        'players/%%/block': GenericRequestResponse;
        'players/%%/icon': GenericRequestResponse;
        'players/%%/moderate': GenericRequestResponse;
        'players/%%/moderate/notes': GenericRequestResponse;
        'puzzles/%%': GenericRequestResponse;
        'puzzles/%%/rate': GenericRequestResponse;
        'tournaments': GenericRequestResponse;
        'tournaments/%%/players': GenericRequestResponse;
        'ui/bot/saveBotInfo': GenericRequestResponse;
    };
    'PATCH': {
        'host_ip_settings/%%': GenericRequestResponse;
    };
    'DELETE': {
        'announcements/%%': GenericRequestResponse;
        'challenges/%%': GenericRequestResponse;
        'games/acl/%%': GenericRequestResponse;
        'groups/%%': GenericRequestResponse;
        'ladders/%%/players': GenericRequestResponse;
        'me/challenges/%%': GenericRequestResponse;
        'me/supporter': GenericRequestResponse;
        'me/vacation': GenericRequestResponse;
        'players/%%/icon': GenericRequestResponse;
        'puzzles/%%': GenericRequestResponse;
        'reviews/acl/%%': GenericRequestResponse;
        'tournaments/%%': GenericRequestResponse;
    };
}
