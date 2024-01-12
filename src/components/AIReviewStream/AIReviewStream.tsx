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
import { ai_socket } from "sockets";
import { MoveTree, GobanSocketEvents } from "goban";
import { IdType } from "src/lib/types";

const analysis_requests_made: { [id: string]: boolean } = {};

interface AIReviewStreamProperties {
    uuid: string;
    game_id: IdType;
    ai_review_id: IdType;
    callback: (data: any) => any;
}

export function AIReviewStream(props: AIReviewStreamProperties): null {
    const uuid = props.uuid;
    const game_id = props.game_id;
    const ai_review_id = props.ai_review_id;

    React.useEffect(() => {
        if (!props.uuid) {
            console.log("No UUID for review stream");
            return;
        } else {
            ai_socket.on("connect", onConnect);
            ai_socket.on(uuid as keyof GobanSocketEvents, onMessage as any);
            if (ai_socket.connected) {
                onConnect();
            }
        }

        function onConnect() {
            ai_socket.send("ai-review-connect", { uuid, game_id, ai_review_id });
        }

        function onMessage(data?: any) {
            props.callback(data);
        }

        return () => {
            if (ai_socket.connected) {
                ai_socket.send("ai-review-disconnect", { uuid });
            }
            ai_socket.off("connect", onConnect);
            ai_socket.off(uuid as keyof GobanSocketEvents, onMessage as any);
        };
    }, [uuid]);

    return null;
}

export function ai_request_variation_analysis(
    uuid: string,
    game_id: number,
    ai_review_id: number,
    cur_move: MoveTree,
    trunk_move: MoveTree,
): void {
    if (!ai_socket?.connected) {
        console.warn(
            "Not sending request for variation analysis since we weren't connected to the AI server",
        );
        return;
    }

    const trunk_move_string = trunk_move.getMoveStringToThisPoint();
    const cur_move_string = cur_move.getMoveStringToThisPoint();
    const variation = cur_move_string.slice(trunk_move_string.length);

    const key = `${uuid}-${game_id}-${ai_review_id}-${trunk_move.move_number}-${variation}`;
    if (key in analysis_requests_made) {
        return;
    }
    analysis_requests_made[key] = true;

    const req = {
        uuid: uuid,
        game_id: game_id,
        ai_review_id: ai_review_id,
        from: trunk_move.move_number,
        variation: variation,
    };
    ai_socket?.send("ai-analyze-variation", req);
}
