/*
 * Copyright (C) 2012-2019  Online-Go.com
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

export class OGSIframeLogo extends React.PureComponent<{}, any> {

    constructor(props) {
        super(props);
    }

    openInNewTab() {
        window.open(document.URL);
    }

    render() {
        return (
            <span className="ogs-iframe-logo-container" onClick={this.openInNewTab}>
                <span className="ogs-nav-logo"/>
            </span>
        );
    }
}

export function isIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}
