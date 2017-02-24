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
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";

interface ResizableProperties {
    id?: string;
    className?: string;
    onResize?: (w, h) => void;
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
}

export class Resizable extends React.Component<any, {}> {
    refs: {
        div
    };

    last_width = 0;
    last_height = 0;
    check_interval = null;

    constructor(props) {
        super(props);
        this.checkForResize = this.checkForResize.bind(this);
    }

    checkForResize() {
        let width = this.refs.div.clientWidth;
        let height = this.refs.div.clientHeight;

        if (this.last_width !== width || this.last_height !== height) {
            this.last_width = width;
            this.last_height = height;
            if (this.props.onResize) {
                this.props.onResize(width, height);
            }
        }
    }

    componentDidMount() {
        this.last_width = this.refs.div.clientWidth;
        this.last_height = this.refs.div.clientHeight;
        this.check_interval = setInterval(this.checkForResize, 50);
    }
    componentWillUnmount() {
        clearInterval(this.check_interval);
    }

    render() {
        return (
            <div ref="div" id={this.props.id} className={"Resizable " + (this.props.className || "")}>{this.props.children}</div>
        );
    }
}
