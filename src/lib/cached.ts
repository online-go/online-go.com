/*
 * Copyright (C) 2012-2017  Online-Go.com
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

import { push_manager } from 'UIPush';
import * as data from 'data';
import { get } from 'requests';
import ITC from 'ITC';
import * as player_cache from 'player_cache';


/**
 * This is a set of keys to be used for data.get(..) and data.watch(..) calls.
 * On load we refresh these keys, and on various ui-push events.
 */

export let cached = {
    config: 'cached.config',
    friends: 'cached.friends',
    groups: 'cached.groups',
    active_tournaments: 'cached.active_tournaments',
    ladders: 'cached.ladders',
    blocks: 'cached.blocks',
    challenge_list: 'cached.challenge_list',
    group_invitations: 'cached.group_invitations',

    refresh: {
        config: () => {
            get('ui/config').then((config) => {
                data.set(cached.config, config);
            }).catch((err) => {
                console.error("Error retrieving friends list: ", err);
            });
        },

        challenge_list: () => {
            get("me/challenges", {page_size: 30}).then((res) => {
                for (let challenge of res.results) {
                    player_cache.update(challenge.challenger);
                    player_cache.update(challenge.challenged);
                    challenge.game.time_control = JSON.parse(challenge.game.time_control_parameters);
                }
                data.set(cached.challenge_list, res.results);
            }).catch((err) => {
                console.error("Error retrieving challenge list: ", err);
            });
        },

        group_invitations: () => {
            get("me/groups/invitations", {page_size: 100}).then((res) => {
                let invitations = res.results.filter(invite => invite.user === data.get('user').id && invite.is_invitation);
                data.set(cached.group_invitations, invitations);
            }).catch((err) => {
                console.error("Error retrieving group invitation list: ", err);
            });
        },

        friends: () => {
            get('ui/friends').then((res) => {
                data.set(cached.friends, res.friends);
            }).catch((err) => {
                console.error("Error retrieving friends list: ", err);
            });
        },

        groups: () => {
            get('me/groups', {page_size: 100}).then((res) => {
                let groups = res.results;
                groups.sort((a, b) => a.name.localeCompare(b.name));
                data.set(cached.groups, groups);
            }).catch((err) => {
                console.error("Error retrieving groups: ", err);
            });
        },

        active_tournaments: () => {
            get('me/tournaments', {ended__isnull: true, page_size: 100}).then((res) => {
                let tournaments = res.results;
                tournaments.sort((a, b) => a.name.localeCompare(b.name));
                data.set(cached.active_tournaments, tournaments);
            }).catch((err) => {
                console.error("Error retrieving active tournaments: ", err);
            });
        },

        ladders: () => {
            get('me/ladders').then((res) => {
                let ladders = res.results;
                ladders.sort((a, b) => a.name.localeCompare(b.name));
                data.set(cached.ladders, ladders);
            }).catch((err) => {
                console.error("Error retrieving ladders: ", err);
            });

        },

        blocks: () => {
            get("me/blocks")
            .then((blocks) => {
                data.set(cached.blocks, blocks);
            }).catch((err) => {
                console.error("Error retrieving block list: ", err);
            });
        },


    }
};


setTimeout(() => {
    cached.refresh.config();

    for (let k in cached.refresh) {
        if (k !== 'config') {
            cached.refresh[k]();
        }
    }
}, 10);

push_manager.on('update-friend-list', cached.refresh.friends);
push_manager.on('challenge-list-updated', cached.refresh.challenge_list);
push_manager.on('update-groups', cached.refresh.groups);
push_manager.on('update-groups', cached.refresh.group_invitations);
push_manager.on('update-tournaments', cached.refresh.active_tournaments);

ITC.register("update-blocks", cached.refresh.blocks);


export default cached;
