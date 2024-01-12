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

interface CountDownProps {
    to: Date;
}

export class CountDown extends React.PureComponent<CountDownProps, any> {
    timeout: any;

    constructor(props: CountDownProps) {
        super(props);
        this.state = {
            display: this.format(props.to.getTime() - Date.now()),
        };
    }

    update() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        const left = this.props.to.getTime() - Date.now();

        if (left > 0) {
            //this.timeout = setTimeout(() => this.update(), left % 100 || 100);
            this.timeout = setTimeout(() => this.update(), 100);
        }

        this.setState({ display: this.format(left) });
    }

    format(ms: number): string {
        if (ms < 0) {
            return "0:00.0";
        }

        const minutes = Math.floor(ms / 60000);
        ms -= minutes * 60000;
        const seconds = Math.floor(ms / 1000);
        ms -= seconds * 1000;
        const tenths = Math.floor(ms / 100);
        if (isNaN(minutes) || isNaN(seconds) || isNaN(tenths)) {
            return "";
        }

        if (seconds < 10) {
            return `${minutes}:0${seconds}.${tenths}`;
        }
        return `${minutes}:${seconds}.${tenths}`;
    }

    componentDidMount() {
        this.update();
    }

    componentDidUpdate() {
        this.update();
    }

    componentWillUnmount() {
        clearTimeout(this.timeout);
    }

    render() {
        return <div>{this.state.display}</div>;
    }
}
