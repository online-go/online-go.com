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

export function UserByName(props: UserByNameProperties) {
    const username = props.match.params.username;
    const [user_id, set_user_id] = React.useState<number>(null);

    const doFetch = async(username: string) => {
        try {
            const res = await get("players", { username: username });
            if (res.results.length) {
                set_user_id(res.results[0].id);
            } else {
                set_user_id(-1);
            }
        } catch (args) {
            return errorAlerter(args);
        }
    };

    React.useEffect(() => {
        const user_id = player_cache.lookup_by_username(username)?.id;
        if (user_id != null) {
            set_user_id(user_id);
            return;
        }

        void doFetch(username);
    }, [username]);

    if (user_id) {
        return <User
            match={{ params: { user_id: user_id.toString() } }}
            location={props.location}
        />;
    }
    return null;
}

