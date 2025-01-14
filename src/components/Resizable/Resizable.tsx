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

interface ResizableProperties {
    id?: string;
    className?: string;
    onResize?: (w: number, h: number) => void;
    children?: React.ReactNode;
}

export class Resizable extends React.Component<ResizableProperties, {}> {
    div: HTMLDivElement | null = null;

    last_width = 0;
    last_height = 0;
    check_interval: ReturnType<typeof setInterval> | null = null;

    constructor(props: ResizableProperties) {
        super(props);
    }

    checkForResize = () => {
        if (!this.div) {
            return;
        }

        const div = this.div;
        let width: number;
        let height: number;

        try {
            height = div.clientHeight;
            width = div.clientWidth;
        } catch (e) {
            /*
            We're seeing an error

               null is not an object (evaluating 'this.div.clientHeight')

            on mobile safari 11.0

            With the !this.div guard, it seems like this should not be
            possible, but reality seems to be different.

              - anoek 2017-11-28
            */

            console.warn("Resizable.checkForResize errored out");
            console.warn(e);
            console.warn("This was: ", this);
            console.warn("Div was: ", div, this.div);
            throw e;
        }

        if (this.last_width !== width || this.last_height !== height) {
            this.last_width = width;
            this.last_height = height;
            if (this.props.onResize) {
                this.props.onResize(width, height);
            }
        }
    };

    componentDidMount() {
        const div = this.div;
        if (div) {
            this.last_width = div.clientWidth;
            this.last_height = div.clientHeight;
        }
        this.check_interval = setInterval(this.checkForResize, 50);
    }

    componentWillUnmount() {
        if (this.check_interval) {
            clearInterval(this.check_interval);
        }
    }

    set_div_ref = (el: HTMLDivElement) => {
        this.div = el;
    };

    render() {
        return (
            <div
                ref={this.set_div_ref}
                id={this.props.id}
                className={"Resizable " + (this.props.className || "")}
            >
                {this.props.children}
            </div>
        );
    }
}
