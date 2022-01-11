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
import * as data from "data";
import { _, pgettext, interpolate } from "translate";

export class Developer extends React.PureComponent {
    constructor(props) {
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

                <h1>API</h1>
                <div className="row">
                    <div>
                        <a href="/api/" target="_self">
                            <img src={data.get("config.cdn_release") + "/img/drf-logo.png"} className="top-image" />
                        </a>
                    </div>
                </div>

                <h1>Documentation</h1>
                <div>
                    <div>
                        <a target="_blank" href="http://docs.ogs.apiary.io/">
                            <img
                                src={data.get("config.cdn_release") + "/img/apiary-on-white.png"}
                                className="top-image"
                            />
                        </a>
                    </div>
                    <div>
                        <a
                            target="_blank"
                            href="http://ogs.readme.io/"
                            style={{ paddingTop: "20px", display: "inline-block" }}
                        >
                            <span style={{ fontSize: "60px", fontFamily: '"Courier New", Courier, monospace' }}>
                                <b>read</b>me.io
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
