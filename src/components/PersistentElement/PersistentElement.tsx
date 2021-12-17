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

interface PersistentElementProps {
    elt: HTMLElement | JQuery;
    className?: string;
    extra_props?: object;  // hash of new props to put on the element
}

export class PersistentElement extends React.Component<PersistentElementProps> {
    container: HTMLDivElement;

    componentDidMount() {
        if (this.container) {
            const elt = this.props.elt instanceof jQuery ? this.props.elt[0] : this.props.elt;
            this.container.appendChild(elt);
        }
    }

    render() {
        return <div className={this.props.className || ""} {...this.props.extra_props} ref={e => this.container = e} />;
    }
}
