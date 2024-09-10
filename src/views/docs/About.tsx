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
import { Link } from "react-router-dom";
import * as data from "@/lib/data";
import { ServerTimeDisplay } from "@/components/ServerTimeDisplay";

declare let ogs_version: string;
declare let ogs_current_language: string;

export class About extends React.Component<{}, any> {
    constructor(props: {}) {
        super(props);
    }

    componentDidMount() {
        window.document.title = _("About");
    }

    render() {
        const server_version = data.get("config")?.version;
        const cdn_release = data.get("config.cdn_release");

        return (
            <div className="About container">
                <a href="https://github.com/online-go/online-go.com/">
                    <img
                        className="github-link"
                        src={`${cdn_release}/img/fork_me_right_gray_6d6d6d.svg`}
                        alt="Fork me on GitHub"
                    />
                </a>

                <div className="main-about">
                    <h2 className="title-version">
                        Online-Go.com
                        <span className="links">
                            <Link to="/docs/team">{_("Team")}</Link>
                            <a
                                className="changelog"
                                href="https://github.com/online-go/online-go.com/commits/devel"
                            >
                                {_("Change Log")}
                            </a>
                        </span>
                    </h2>

                    {_(
                        "Online-go.com is made possible by the generous financial support from hundreds of individual site supporters, the guidance and welcome friendly attitudes of the Go community at large, and by a large collection of volunteers that have helped translate Online-Go.com into a multitude of different languages from all over the world.",
                    )}

                    <h4 className="about-links">
                        <a href="https://translate.online-go.com" target="_blank">
                            {_("Help translate Online-Go.com")}
                        </a>
                        <Link to="/developer">Developers</Link>
                    </h4>

                    <hr />

                    <div className="about-links">
                        <Link to="/docs/refund-policy">Refund Policy</Link>
                        <Link to="/docs/privacy-policy">Privacy Policy</Link>
                    </div>

                    <div className="about-links">
                        <Link to="/docs/contact-information">Contact Information</Link>
                        <Link to="/docs/terms-of-service">Terms of Service</Link>
                    </div>

                    <div className="about-links version">
                        <div>
                            <span className="version-details">UI: {ogs_version}</span>
                        </div>
                        <div>
                            <span className="version-details">[{ogs_current_language}]</span>
                        </div>
                        <div>
                            <span className="version-details">API: {server_version}</span>
                        </div>
                    </div>

                    <div className="server-time">
                        <ServerTimeDisplay />
                    </div>
                </div>
            </div>
        );
    }
}
