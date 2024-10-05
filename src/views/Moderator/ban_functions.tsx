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

import * as React from "react";
import { BanModal } from "@/components/BanModal";
import { openModal } from "@/components/Modal";
import { post, put } from "@/lib/requests";
import { alert } from "@/lib/swal_config";

function moderate(player_id: number, prompt: string, obj: any) {
    return new Promise((resolve, reject) => {
        alert
            .fire({
                text: prompt,
                input: "text",
                showCancelButton: true,
            })
            .then(({ value: reason, isConfirmed }) => {
                if (isConfirmed) {
                    obj.moderation_note = reason;
                    console.log(obj);
                    put("players/" + player_id + "/moderate", obj)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject();
                }
            })
            .catch(reject);
    });
}

export function ban(player_id: number) {
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            ban: 1,
            user_id: player_id,
        });
    } else {
        /*
        return moderate(player_id, "Reason for banning? This will be visible to the player now.", {
            is_banned: 1,
        });
        */
        openModal(<BanModal player_id={player_id} />);
    }
    return undefined;
}
export function shadowban(player_id: number) {
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            ban: 1,
            user_id: player_id,
        });
    } else {
        return moderate(player_id, "Reason for shadow banning?", { is_shadowbanned: 1 });
    }
}
export function remove_ban(player_id: number) {
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            ban: 0,
            user_id: player_id,
        });
    } else {
        return moderate(player_id, "Reason for restoring account?", { is_banned: 0 });
    }
}
export function remove_shadowban(player_id: number) {
    if (player_id < 0) {
        return post("moderation/shadowban_anonymous_user", {
            ban: 0,
            user_id: player_id,
        });
    } else {
        return moderate(player_id, "Reason for removing the shadow ban?", { is_shadowbanned: 0 });
    }
}
