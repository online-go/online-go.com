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
import * as preferences from "preferences";
import { MAX_DOCK_DELAY } from "Settings";

interface DockProperties {
    className?: string;
}
interface DockState {
    dock_delay: number;
}

export class Dock extends React.Component<DockProperties, DockState> {
    constructor(props: DockProperties) {
        super(props);
        this.state = {
            dock_delay: preferences.get("dock-delay"),
        };
    }

    mouseEntered = (ev) => {
        let delay = this.state.dock_delay;
        if (delay === MAX_DOCK_DELAY) {
            console.log("NO slide out");
            delay = 99999;
        }
        // open dock at speed set by preference 'dock-delay'
        const modified_transition = `all 0.1s ease-in ${delay}s`;
        const dock = document.getElementsByClassName("Dock")[0] as HTMLElement;
        // tested on Opera, Chrome, Safari, Edge, Firefox
        dock.style.transition = modified_transition;
        dock.style.webkitTransition = modified_transition;
    };

    mouseExited = (ev) => {
        // always close fast
        const fast_transition = `all 0.1s ease-in 0s`;
        const dock = document.getElementsByClassName("Dock")[0] as HTMLElement;
        dock.style.transition = fast_transition;
        dock.style.webkitTransition = fast_transition;
    };

    render() {
        return (
            <div
                onMouseEnter={this.mouseEntered}
                onMouseLeave={this.mouseExited}
                {...this.props}
                className={"Dock" + (this.props.className || "")}
            >
                {this.props.children}
            </div>
        );
    }
}
