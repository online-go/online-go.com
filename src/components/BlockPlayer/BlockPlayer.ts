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

import {get, put} from "requests";
import * as data from "data";
import {ignore, errorAlerter} from "misc";
import ITC from "ITC";
import cached from 'cached';
import * as player_cache from "player_cache";

let ignores = {};
let block_state = {};

export function setIgnore(player_id: number, tf: boolean) {
    if (tf) {
        ignoreUser(player_id);
    } else {
        unIgnoreUser(player_id);
    }

    if (player_id > 0) {
        if (!(player_id in block_state)) {
            block_state[player_id] = {};
        }
        block_state[player_id].block_chat = tf;
        put("players/%%/block", player_id, {block_chat: tf ? 1 : 0})
        .then(() => {
            ITC.send("update-blocks", true);
        })
        .catch(errorAlerter);
    }
}
export function setGameBlock(player_id: number, tf: boolean) {
    if (player_id > 0) {
        if (!(player_id in block_state)) {
            block_state[player_id] = {};
        }
        block_state[player_id].block_games = tf;
        put("players/%%/block", player_id, {block_games: tf ? 1 : 0})
        .then(() => {
            ITC.send("update-blocks", true);
        })
        .catch(errorAlerter);
    }
}

export function getBlocks(player_id: number) {
    return block_state[player_id] || {
        block_chat: false,
        block_games: false,
    };
}

export function player_is_ignored(user_id) {
    return user_id in ignores;
}



function ignoreUser(uid, dont_fetch = false) {
    if (dont_fetch) {
        ignores[uid] = true;
        $("<style type='text/css'> .chat-user-" + uid + " { display: none !important; } </style>").appendTo("head");
    }
    else {
        player_cache.fetch(uid, ['ui_class']).then((obj) => {
            if (obj.ui_class.indexOf('moderator') < 0) {
                ignores[uid] = true;
                $("<style type='text/css'> .chat-user-" + uid + " { display: none !important; } </style>").appendTo("head");
            } else {
                console.error("Can't ignore a moderator.");
            }
        });
    }
}
function unIgnoreUser(uid) {
    delete ignores[uid];
    $("<style type='text/css'> .chat-user-" + uid + " { display: block !important; } </style>").appendTo("head");
}


data.watch(cached.blocks, (blocks) => {
    block_state = {};
    let new_ignores = {};
    for (let entry of blocks) {
        block_state[entry.blocked] = entry;
        if (entry.block_chat) {
            new_ignores[entry.blocked] = true;
        }
    }

    for (let uid in new_ignores) {
        if (!(uid in ignores)) {
            ignoreUser(uid, true);
        }
    }
    for (let uid in ignores) {
        if (!(uid in new_ignores)) {
            unIgnoreUser(uid);
        }
    }
});
