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
import {get} from 'requests';
import {errorAlerter} from "misc";
import player_cache from "player_cache";
import {User} from './User';


declare let swal;

interface UserByNameProperties {
    params: any;
}

export class UserByName extends React.PureComponent<UserByNameProperties, any> {
    constructor(props) {
        super(props);

        let user = player_cache.lookup_by_username(props.params.username);

        this.state = {
            user_id: user ? user.id : null
        };
    }

    componentDidMount() {
        if (!this.state.user_id) {
            this.doFetch(this.props.params.username);
        }
    }

    componentWillReceiveProps(next_props) {
        if (next_props.params.username !== this.props.params.username) {
            let user = player_cache.lookup_by_username(next_props.params.username);

            this.setState({user_id: user ? user.id : null});

            if (!user || !user.id) {
                this.doFetch(next_props.params.username);
            }
        }
    }

    doFetch(username:string) {
        get("players", 0, {username: username})
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
            return <User params={{user_id: this.state.user_id}}/>;
        }
        return null;
    }
}

