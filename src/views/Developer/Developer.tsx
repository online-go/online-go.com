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
import { _ } from "@/lib/translate";

export class Developer extends React.PureComponent {
    constructor(props: {}) {
        super(props);
        // TODO: remove this
        this.state = {};
    }

    render() {
        return (
            <div className="Developer container">
                <h1>{_("Source Code")}</h1>
                <h2>
                    <a href="https://github.com/online-go/online-go.com/">Source Code on GitHub</a>
                </h2>
                <iframe src="https://ghbtns.com/github-btn.html?user=online-go&repo=online-go.com&type=star&count=true&size=large"></iframe>
                <iframe src="https://ghbtns.com/github-btn.html?user=online-go&repo=online-go.com&type=fork&count=true&size=large"></iframe>

                <h1>{_("Application management")}</h1>
                <h2>
                    <a href="/oauth2/applications/">OAuth2 Application Manager</a>
                </h2>

                <h1>API Documentation</h1>
                <h2>
                    <a href="https://docs.online-go.com" target="_blank">
                        https://docs.online-go.com
                    </a>
                </h2>
            </div>
        );
    }
}
