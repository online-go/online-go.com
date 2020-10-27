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


import * as React from "react";
import { ai_socket } from "sockets";

interface AIReviewStreamProperties {
    uuid?: string;
    game_id?: number | string;
    ai_review_id?: number | string;
    callback: (data: any) => any;
}

export function AIReviewStream(props:AIReviewStreamProperties):JSX.Element {
    const uuid = props.uuid;
    const game_id = props.game_id;
    const ai_review_id = props.ai_review_id;

    React.useEffect(() => {
        if (!props.uuid) {
            console.log("No UUID for review stream");
            return;
        } else {
            ai_socket.on('connect', onConnect);
            ai_socket.on(uuid, onMessage);
            if (ai_socket.connected) {
                onConnect();
            }
        }

        function onConnect() {
            ai_socket.send('ai-review-connect', {uuid, game_id, ai_review_id});
        }

        function onMessage(data: any) {
            props.callback(data);
        }

        return () => {
            if (ai_socket.connected) {
                ai_socket.send('ai-review-disconnect', {uuid});
            }
            ai_socket.off('connect', onConnect);
            ai_socket.off(uuid, onMessage);
        }
    }, [uuid]);

    return null;
}
