/*
 * Copyright (C) 2012-2020  Online-Go.com
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

function anon() {
    let user = data.get('config.user');
    if (!user) {
        return true;
    }
    return user.anonymous;
}

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
        config: (cb?:() => void) => {
            get('ui/config').then((config) => {
                data.set(cached.config, config);
                data.set('config', config);
                if (cb) {
                    cb();
                }
            }).catch((err) => {
                console.error("Error retrieving friends list: ", err);
            });
        },

        challenge_list: () => {
            if (anon()) {
                data.set(cached.challenge_list, []);
                return;
            }

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
            if (anon()) {
                data.set(cached.group_invitations, []);
                return;
            }

            get("me/groups/invitations", {page_size: 100}).then((res) => {
                let invitations = res.results.filter(invite => invite.user === data.get('user').id && invite.is_invitation);
                data.set(cached.group_invitations, invitations);
            }).catch((err) => {
                console.error("Error retrieving group invitation list: ", err);
            });
        },

        friends: () => {
            if (anon()) {
                data.set(cached.friends, []);
                return;
            }

            get('ui/friends').then((res) => {
                data.set(cached.friends, res.friends);
            }).catch((err) => {
                console.error("Error retrieving friends list: ", err);
            });
        },

        groups: () => {
            if (anon()) {
                data.set(cached.groups, []);
                return;
            }

            get('me/groups', {page_size: 100}).then((res) => {
                let groups = res.results;
                groups.sort((a, b) => a.name.localeCompare(b.name));
                data.set(cached.groups, groups);
            }).catch((err) => {
                console.error("Error retrieving groups: ", err);
            });
        },

        active_tournaments: () => {
            if (anon()) {
                data.set(cached.active_tournaments, []);
                return;
            }

            get('me/tournaments', {ended__isnull: true, page_size: 100}).then((res) => {
                let tournaments = res.results;
                tournaments.sort((a, b) => a.name.localeCompare(b.name));
                data.set(cached.active_tournaments, tournaments);
            }).catch((err) => {
                console.error("Error retrieving active tournaments: ", err);
            });
        },

        ladders: () => {
            if (anon()) {
                data.set(cached.ladders, []);
                return;
            }

            get('me/ladders').then((res) => {
                let ladders = res.results;
                ladders.sort((a, b) => a.name.localeCompare(b.name));
                data.set(cached.ladders, ladders);
            }).catch((err) => {
                console.error("Error retrieving ladders: ", err);
            });

        },

        blocks: () => {
            if (anon()) {
                data.set(cached.blocks, []);
                return;
            }

            get("me/blocks")
            .then((blocks) => {
                data.set(cached.blocks, blocks);
            }).catch((err) => {
                console.error("Error retrieving block list: ", err);
            });
        },


    }
};


let current_user_id:number = 0;
let refresh_debounce = setTimeout(refresh_all, 10);
function refresh_all() {
    refresh_debounce = null;
    cached.refresh.config();

    for (let k in cached.refresh) {
        if (k !== 'config') {
            cached.refresh[k]();
        }
    }
}

data.watch('user', (user) => {
    if (user.id !== current_user_id) {
        current_user_id = user.id;
        if (refresh_debounce) {
        clearTimeout(refresh_debounce);
        }
        refresh_debounce = setTimeout(refresh_all, 10);
    }
});

push_manager.on('update-friend-list', cached.refresh.friends);
push_manager.on('challenge-list-updated', cached.refresh.challenge_list);
push_manager.on('update-groups', cached.refresh.groups);
push_manager.on('update-groups', cached.refresh.group_invitations);
push_manager.on('update-tournaments', cached.refresh.active_tournaments);

ITC.register("update-blocks", cached.refresh.blocks);


export default cached;
