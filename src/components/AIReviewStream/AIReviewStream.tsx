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
    game?: number;
    callback: (data: any) => any;
}





export function AIReviewStream(props:AIReviewStreamProperties):JSX.Element {
    const uuid = props.uuid;

    React.useEffect(() => {
        if (!props.uuid) {
            console.log("No UUID for review stream");
            return;
        } else {
            console.log("Connecting to AI review UUID", props.uuid);
            ai_socket.on('connect', onConnect);
            ai_socket.on(uuid, onMessage);
            if (ai_socket.connected) {
                onConnect();
            }
        }

        function onConnect() {
            console.info(`Subscribing to AI review `, uuid);
            ai_socket.send('ai-review-connect', {uuid});
        }

        function onMessage(data: any) {
            console.info(`AI: `, data);
            props.callback(data);
        }

        return () => {
            console.info(`Disconnected from AI review `, uuid);
            if (ai_socket.connected) {
                ai_socket.send('ai-review-disconnect', {uuid});
            }
            ai_socket.off('connect', onConnect);
            ai_socket.off(uuid, onMessage);
        }
    }, [uuid]);

    return null;
}

/*

//export let push_manager = new AIReviewStreamManager();

export class AIReviewStream extends React.Component<AIReviewStreamProperties, any> {
    handler: Handler = null;
    channel: string = null; // I'm here

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(next) {
        if (this.props. === next.event &&
            this.props.action === next.action &&
            this.props.channel === next.channel
        ) {
            return false;
        }
        return true;
    }

    removeHandler() {
        if (this.handler) {
            push_manager.off(this.handler);
            this.handler = null;
        }
    }
    unsubscribe() {
        if (this.channel) {
            push_manager.unsubscribe(this.channel);
            this.channel = null;
        }
    }

    sync() {
        if (this.handler) {
            this.removeHandler();
        }
        if (this.props.event) {
            this.handler = push_manager.on(this.props.event, this.props.action);
        }

        if (this.props.channel !== this.channel) {
            this.unsubscribe();
            this.channel = this.props.channel;
            push_manager.subscribe(this.channel);
        }
    }

    componentDidUpdate() {
        this.sync();
    }
    componentDidMount() {
        this.sync();
    }
    componentWillUnmount() {
        this.removeHandler();
        this.unsubscribe();
    }


    render() {
        return null;
    }
}
*/
