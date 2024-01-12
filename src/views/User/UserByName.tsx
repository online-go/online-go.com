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
import { get } from "requests";
import { errorAlerter } from "misc";
import * as player_cache from "player_cache";
import { useParams } from "react-router-dom";
import { User } from "./User";

export function UserByName(): JSX.Element | null {
    const { username } = useParams();
    const [user_id, set_user_id] = React.useState<number>();

    const doFetch = (username: string) => {
        get("players", { username: username })
            .then((res) => {
                if (res.results.length) {
                    set_user_id(res.results[0].id);
                } else {
                    set_user_id(-1);
                }
            })
            .catch(errorAlerter);
    };

    React.useEffect(() => {
        const user_id = player_cache.lookup_by_username(username)?.id;
        if (user_id != null) {
            set_user_id(user_id);
            return;
        }

        if (username) {
            doFetch(username);
        }
    }, [username]);

    if (user_id) {
        return <User user_id={user_id} />;
    }
    return null;
}
