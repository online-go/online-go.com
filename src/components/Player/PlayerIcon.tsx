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
import {PlayerComponentProperties, PlayerComponent} from "./PlayerComponent";

interface PlayerIconProperties extends PlayerComponentProperties {
    size?: number;
}

export function icon_size_url(url: string, size: number): string {
    return url.replace(/-[0-9]+.png$/, `-${size}.png`).replace(/s=[0-9]+/, `s=${size}`);
}

export class PlayerIcon extends PlayerComponent<PlayerIconProperties> {
    render() {
        return <img className={`PlayerIcon PlayerIcon-${this.props.size}`} src={icon_size_url(this.state.player.icon, this.props.size || 16)} />;
    }
}
