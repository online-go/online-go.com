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
import * as preferences from "@/lib/preferences";
import { MAX_DOCK_DELAY } from "@/lib/SettingsCommon";

interface DockProperties {
    className?: string;
    children: React.ReactNode;
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

    mouseEntered = () => {
        const dock = document.getElementsByClassName("Dock")[0] as HTMLElement;
        dock.style.transition = this.getTransitionStyle();
        dock.style.webkitTransition = this.getTransitionStyle();
    };

    mouseExited = () => {
        // always close fast
        const fast_transition = `all 0.1s ease-in 0s`;
        const dock = document.getElementsByClassName("Dock")[0] as HTMLElement;
        dock.style.transition = fast_transition;
        dock.style.webkitTransition = fast_transition;
        setTimeout(() => {
            dock.style.transition = this.getTransitionStyle();
            dock.style.webkitTransition = this.getTransitionStyle();
        }, 100);
    };

    getTransitionStyle = () => {
        let delay = this.state.dock_delay;
        if (delay === MAX_DOCK_DELAY) {
            delay = 99999;
        }
        const modified_transition = `all 0.1s ease-in ${delay}s`;
        return modified_transition;
    };

    render() {
        return (
            <div
                onMouseEnter={this.mouseEntered}
                onMouseLeave={this.mouseExited}
                {...this.props}
                className={"Dock" + (this.props.className || "")}
                style={{ transition: this.getTransitionStyle() }}
            >
                {this.props.children}
            </div>
        );
    }
}
