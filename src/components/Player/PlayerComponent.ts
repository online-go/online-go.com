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
import {Player, RegisteredPlayer, is_player} from "data/Player";
import {from_server_player} from "compatibility/Player";


export interface PlayerComponentProperties {
    user: Player | number;  // The Player or id that we're interested in.
    using_cache?: boolean;  // Should we link to the player cache? Assumed to be true if a
}                           // player is specified by id.

export interface PlayerComponentState {
    player: Player;
}

export abstract class PlayerComponent<P extends PlayerComponentProperties> extends React.PureComponent<P, PlayerComponentState> {
    private subscriber = new player_cache.Subscriber(player => this.setState({player: player}));

    componentWillMount() {
        this.initialise(this.props);
    }

    componentWillUnmount() {
        this.finalise(this.props);
    }

    componentWillReceiveProps(next_props: P) {
        this.finalise(this.props);
        this.initialise(next_props);
    }

    protected initialise(props: P) {
        // Compatibility with untyped code.
        let user: Player | number;
        if (typeof props.user !== "number" && !is_player(props.user)) {
            user = from_server_player(props.user);
        }
        else {
            user = props.user;
        }
        // End compatibility section.

        if (typeof user === "number") {
            player_cache.fetch(user);
            this.subscriber.on(user);
            this.state = {player: player_cache.lookup(user)};
        }
        else if (props.using_cache) {
            player_cache.update(user);
            this.subscriber.on(user.id);
            this.state = {player: player_cache.lookup(user.id)};
        }
        else {
            this.state = {player: user};
        }
    }

    protected finalise(props: P) {
        if (typeof props.user === "number" || props.using_cache) {
            this.subscriber.off(this.state.player);
        }
    }
}
