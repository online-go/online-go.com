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

import * as React from "react";
import * as player_cache from "player_cache";
import {errorLogger} from "misc";


interface PlayerIconProps {
    id?: number;
    user?: any;
    size?: number | string;
    className?: string;
}

export function icon_size_url(url: string, size: number): string {
    return url.replace(/-[0-9]+.png$/, `-${size}.png`).replace(/s=[0-9]+/, `s=${size}`);
}

export function getPlayerIconURL(id: number, size: number): Promise<string> {
    return player_cache.fetch(id, ["icon"]).then(user => icon_size_url(user.icon, size));
}


export class PlayerIcon extends React.PureComponent<PlayerIconProps, {url}> {
    mounted: boolean = false;
    subscriber = new player_cache.Subscriber(user => this.fetch(user.id, this.props));

    constructor(props:PlayerIconProps) {
        super(props);
        let id = this.getId(props);
        if (!id) {
            this.state = { url: null };
            return;
        }

        let user = player_cache.lookup(id);
        let size = typeof(props.size) === 'number' ? props.size : parseInt(props.size);
        this.state = {
            url: user && user.icon ? icon_size_url(user.icon, size) : null
        };
        if (!this.state.url) {
            this.fetch(id, props);
        }
    }

    getId(props:PlayerIconProps):number {
        let ret = parseInt(props.id || (props.user && (props.user.id || props.user.user_id)));
        if (isNaN(ret)) {
            ret = null;
        }
        return ret;
    }

    fetch(id, props) {
        getPlayerIconURL(id, props.size).then((url) => {
            if (id === this.getId(props)) {
                if (this.mounted && this.state.url !== url) {
                    this.setState({url: url});
                }
            }
        })
        .catch(errorLogger);
    }
    componentDidMount() {
        this.mounted = true;
        let id = this.getId(this.props);
        if (!isNaN(id) && id > 0) {
            this.subscriber.on(id);
        }
    }
    componentWillUnmount() {
        this.mounted = false;
        this.subscriber.off(this.subscriber.players());
    }

    componentWillReceiveProps(next_props) {
        let current_id = this.getId(this.props);
        let next_id = this.getId(next_props);
        if (current_id !== next_id) {
            this.setState({url: null});
            this.subscriber.off(this.subscriber.players());
            if (next_id > 0) {
                this.subscriber.on(next_id);
            }
            else {
                return;
            }
            this.fetch(next_id, next_props);
        }
    }
    render() {
        return <img className={`PlayerIcon PlayerIcon-${this.props.size} ${this.props.className || ""}`} src={this.state.url} />;
    }
}
