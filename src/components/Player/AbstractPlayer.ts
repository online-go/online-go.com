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
import {Player, is_guest, is_registered, player_name, player_attributes} from "data/Player";
import {Rank, rank_short_string, rank_long_string} from "data/Rank";



export interface AbstractPlayerProperties {
    user: any;              // The player to be displayed or their player id.
    disableCacheUpdate?: boolean;   // Don't update the player cache as the player details are known to be out-of-date.
                            // Also don't update our state if the cache changes.
}

export interface AbstractPlayerState {
    resolved: boolean;      // Have the player's details been retrieved?
    guest: boolean;         // Is the player a guest?
    username: string;       // What is the player's name?
    icon: string;           // What is the player's icon?
    country: string;        // What is the player's country?
    short_rank: string;     // What is the short string representation of the player's rank?
    long_rank: string;      // What is the long string representation of the player's rank?
    rating: string;         // What is the player's rating?
    className: string;      // The list of CSS classes that should be applied to the player.
}



// Given a Player object, calculate what state the AbstractPlayer component should have.
// Bonus points if you like Continuation monads.
function update_state(continuation: (state: AbstractPlayerState) => void, player: Player | void): void {
    if (!player) {
        continuation({
            resolved: false,
            guest: true,
            username: "...",
            icon: "",
            country: "un",
            short_rank: "",
            long_rank: "",
            rating: "",
            className: ""
        });
    }
    else if (is_guest(player)) {
        continuation({
            resolved: true,
            guest: true,
            username: player_name(player),
            icon: "",
            country: "un",
            short_rank: "",
            long_rank: "",
            rating: "",
            className: ""
        });
    }
    else if (is_registered(player)) {
        let suffix = (player.is.provisional ? "?" : "") + (player.is.timeout ? "T" : "");
        continuation({
            resolved: true,
            guest: false,
            username: player_name(player),
            icon: player.icon,
            country: player.country || "un",
            short_rank: "[" + rank_short_string(player.rank) + suffix + "]",
            long_rank: rank_long_string(player.rank),
            rating: "" + Math.round(player.rating),
            className: player_attributes(player).join(" ")
        });
    }
}



// An abstract superclass for implementing players in the user interface. This provides
// functionality common to the Player and PlayerDetails components.
export abstract class AbstractPlayer<S extends AbstractPlayerProperties, T extends AbstractPlayerState> extends React.PureComponent<S, T> {
    protected player_id: number;
    private subscribe: player_cache.Subscription;

    constructor(props: S) {
        super(props);

        let callback: (player: Player) => void;
        if (props.disableCacheUpdate) {
            callback = (player) => undefined;
        }
        else {
            callback = (player) => {
                setTimeout(() => {
                    // We must do this asynchronously to avoid an error
                    // from within React. It complains bitterly if we
                    // attempt to update our state during another
                    // component's constructor. This can happen if
                    // the other component's constructor causes our
                    // player to be republished after we've been mounted.
                    update_state(this.setState.bind(this), player);
                });
            };
        }
        this.subscribe = new player_cache.Subscription(callback);
        this.setup(props, (state) => { this.state = state; });
    }

    componentWillReceiveProps(new_props) {
        this.setup(new_props, this.setState.bind(this));
        this.subscribe.to([this.player_id]);
    }

    componentDidMount() {
        this.subscribe.to([this.player_id]);
    }

    componentWillUnmount() {
        this.subscribe.to([]);
    }

    // Perform the setup after the component has been created or received new props.
    setup(props: S, how_to_update: (state: T) => void): void {
        // Work out who we're subscribing to.
        let player_id = +props.user;
        let player: Player | void;
        if (isNaN(player_id)) {
            player = player_cache.update(props.user, props.disableCacheUpdate);
            player_id = player.id;
        }
        else {
            player = player_cache.lookup_by_id(player_id);
        }
        this.player_id = player_id;

        // Set up the state of the component.
        update_state(how_to_update, player);
    }
}
