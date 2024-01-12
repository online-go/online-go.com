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

import { put } from "requests";
import * as data from "data";
import { errorAlerter, errorLogger } from "misc";
import ITC from "ITC";
import cached from "cached";
import * as player_cache from "player_cache";

export class BlockState {
    blocked: number; // player id
    username?: string;

    block_chat = false;
    block_games = false;
    block_announcements = false;

    constructor(blocked: number) {
        this.blocked = blocked;
    }
}

const ignores: { [player_id: number | string]: boolean } = {};
let block_states: { [player_id: number | string]: BlockState } = {};

export function setIgnore(player_id: number, tf: boolean) {
    if (tf) {
        ignoreUser(player_id);
    } else {
        unIgnoreUser(player_id);
    }

    if (player_id > 0) {
        if (!(player_id in block_states)) {
            block_states[player_id] = new BlockState(player_id);
        }
        block_states[player_id].block_chat = tf;
        put(`players/${player_id}/block`, { block_chat: tf ? 1 : 0 })
            .then(() => {
                ITC.send("update-blocks", true);
            })
            .catch(errorAlerter);
    }
}

export function setGameBlock(player_id: number, tf: boolean) {
    if (player_id > 0) {
        if (!(player_id in block_states)) {
            block_states[player_id] = new BlockState(player_id);
        }
        block_states[player_id].block_games = tf;
        put(`players/${player_id}/block`, { block_games: tf ? 1 : 0 })
            .then(() => {
                ITC.send("update-blocks", true);
            })
            .catch(errorAlerter);
    }
}

export function setAnnouncementBlock(player_id: number, tf: boolean) {
    if (player_id > 0) {
        if (!(player_id in block_states)) {
            block_states[player_id] = new BlockState(player_id);
        }
        block_states[player_id].block_announcements = tf;
        put(`players/${player_id}/block`, { block_announcements: tf ? 1 : 0 })
            .then(() => {
                ITC.send("update-blocks", true);
            })
            .catch(errorAlerter);
    }
}

export function getBlocks(player_id: number): BlockState {
    return block_states[player_id] || new BlockState(player_id);
}

export function getAllBlocks(): BlockState[] {
    return Object.keys(block_states).map((k: number | string) => block_states[k]);
}

export function getAllBlocksWithUsernames(): Promise<BlockState[]> {
    const ret: BlockState[] = Object.keys(block_states).map((k) => block_states[k]);

    return Promise.all(
        ret
            .filter((bs) => bs.blocked)
            .map((bs) =>
                player_cache
                    .fetch(bs.blocked, ["username"])
                    .then((player) => (bs.username = player.username)),
            ),
    ).then(() => {
        ret.sort((a, b) => a.username?.localeCompare(b.username ?? "") ?? 0);
        return ret;
    });
}

export function player_is_ignored(user_id: number) {
    return user_id in ignores;
}

function ignoreUser(uid: number, dont_fetch = false) {
    if (dont_fetch) {
        ignores[uid] = true;
        $(
            "<style type='text/css'> .chat-user-" + uid + " { display: none !important; } </style>",
        ).appendTo("head");
    } else {
        player_cache
            .fetch(uid, ["ui_class"])
            .then((obj) => {
                if ((obj.ui_class?.indexOf("moderator") || 0) < 0) {
                    ignores[uid] = true;
                    $(
                        "<style type='text/css'> .chat-user-" +
                            uid +
                            " { display: none !important; } </style>",
                    ).appendTo("head");
                } else {
                    console.error("Can't ignore a moderator.");
                }
            })
            .catch(errorLogger);
    }
}
function unIgnoreUser(uid: number) {
    delete ignores[uid];
    $(
        "<style type='text/css'> .chat-user-" + uid + " { display: block !important; } </style>",
    ).appendTo("head");
}

data.watch(cached.blocks, (blocks: BlockState[]) => {
    try {
        if (!blocks) {
            return;
        }

        block_states = {};
        const new_ignores: { [player_id: number]: boolean } = {};
        for (const entry of blocks) {
            block_states[entry.blocked] = entry;
            if (entry.block_chat) {
                new_ignores[entry.blocked] = true;
            }
        }

        for (const uid in new_ignores) {
            if (!(uid in ignores)) {
                ignoreUser(Number(uid), true);
            }
        }
        for (const uid in ignores) {
            if (!(uid in new_ignores)) {
                unIgnoreUser(Number(uid));
            }
        }
    } catch (e) {
        console.error("Failed to set blocks. Blocks was ", blocks);
        console.error(e);
        data.remove(cached.blocks);
    }
});
