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
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import * as preferences from "preferences";
import {GameList} from "GameList";
import {ActiveAnnouncements} from "Announcements";
import {comm_socket} from "sockets";
import { ObserveGamesComponent } from 'ObserveGamesComponent';

interface ObserveGamesProperties {
}

export class ObserveGames extends React.PureComponent<ObserveGamesProperties, any> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
        <div className="ObserveGames">
            <div className="container">
                <ObserveGamesComponent announcements={true} channel='' />
            </div>
        </div>
        );
    }
}
