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

export function icon_size_url(url, size) {
    return url.replace(/-[0-9]+.png$/, `-${size}.png`).replace(/s=[0-9]+/, `s=${size}`);
}

export function getPlayerIconURL(id, size): Promise<string> {{{
    return new Promise((resolve, reject) => {
        player_cache.fetch(id, ["icon"]).then((user) => {
            resolve(icon_size_url(user.icon, size));
        })
        .catch(reject);
    });
}}}


export class PlayerIcon extends React.PureComponent<PlayerIconProps, {url}> {
    player_id:number;
    mounted: boolean = false;

    constructor(props) {
        super(props);
        this.player_id = parseInt(props.id || props.user.id || props.user.user_id);
        if (isNaN(this.player_id)) {
            console.error("PlayerIcon player_id was NaN", props);
            this.state = { url: null };
            return;
        }

        let user = player_cache.lookup(this.player_id);
        let size = props.size;
        this.state = {
            url: user && user.icon ? icon_size_url(user.icon, size) : null
        };
        if (!this.state.url) {
            this.fetch(this.player_id, props);
        }
        if (this.player_id > 0) {
            player_cache.watch(this.player_id, this.onCacheUpdate);
        }
    }
    onCacheUpdate = (user) => {
        this.fetch(this.player_id, this.props);
    }
    fetch(id, props) {
        getPlayerIconURL(id, props.size).then((url) => {
            if (id === parseInt(props.id || props.user.id || props.user.user_id)) {
                if (this.mounted && this.state.url !== url) {
                    this.setState({url: url});
                }
            }
        })
        .catch(errorLogger);
    }
    componentDidMount() {
        this.mounted = true;
    }
    componentWillUnmount() {
        this.mounted = false;
        player_cache.watch(this.player_id, this.onCacheUpdate);
    }
    componentWillReceiveProps(next_props) {
        let current_id = parseInt(this.props.id || this.props.user.id || this.props.user.user_id);
        let next_id = parseInt(next_props.id || next_props.user.id || next_props.user.user_id);
        this.player_id = next_id;
        if (current_id !== next_id) {
            this.setState({url: null});
            player_cache.unwatch(current_id, this.onCacheUpdate);
            if (next_id > 0) {
                player_cache.watch(next_id, this.onCacheUpdate);
            }

            if (!next_id || isNaN(next_id)) {
                return;
            }

            this.fetch(next_id, next_props);
        }
    }
    render() {
        return <img className={`PlayerIcon PlayerIcon-${this.props.size} ${this.props.className || ""}`} src={this.state.url} />;
    }
}
