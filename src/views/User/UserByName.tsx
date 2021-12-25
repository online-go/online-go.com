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
import {get} from 'requests';
import {errorAlerter} from "misc";
import * as player_cache from "player_cache";
import {User} from './User';
import { RouteComponentProps } from "react-router";


type UserByNameProperties = RouteComponentProps<{username: string}>;

interface UserByNameState { user_id?: number }

export class UserByName extends React.PureComponent<UserByNameProperties, UserByNameState> {
    constructor(props) {
        super(props);

        const user = player_cache.lookup_by_username(props.match.params.username);

        this.state = {
            user_id: user ? user.id : null
        };
    }

    componentDidMount() {
        if (!this.state.user_id) {
            this.doFetch(this.props.match.params.username);
        }
    }

    UNSAFE_componentWillReceiveProps(next_props) {
        if (next_props.match.params.username !== this.props.match.params.username) {
            const user = player_cache.lookup_by_username(next_props.match.params.username);

            this.setState({user_id: user ? user.id : null});

            if (!user || !user.id) {
                this.doFetch(next_props.match.params.username);
            }
        }
    }

    doFetch(username: string) {
        get("players", {username: username})
        .then((res) => {
            if (res.results.length) {
                this.setState({
                    user_id: res.results[0].id
                });
            } else {
                this.setState({user_id: -1});
            }
        })
        .catch(errorAlerter);
    }

    render() {
        if (this.state.user_id) {
            return <User
                match={{params: {user_id: this.state.user_id.toString()}}}
                location={this.props.location}
            />;
        }
        return null;
    }
}

