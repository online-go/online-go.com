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
import { _, pgettext } from "@/lib/translate";
import { PushNotificationsSection } from "./PushNotificationsSection";
import "./Developer.css";

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" };

export function Developer(): React.ReactElement {
    return (
        <div className="Developer container">
            <h1>{_("Developers")}</h1>
            <div className="developer-layout">
                <dl className="developer-resources">
                    <dt>{pgettext("Developer page: resource label", "Source code")}</dt>
                    <dd>
                        <a href="https://github.com/online-go/online-go.com/" {...EXTERNAL}>
                            github.com/online-go/online-go.com
                        </a>
                        <div className="github-buttons">
                            <iframe
                                title={pgettext("Developer page: GitHub button", "GitHub stars")}
                                src="https://ghbtns.com/github-btn.html?user=online-go&repo=online-go.com&type=star&count=true"
                            ></iframe>
                            <iframe
                                title={pgettext("Developer page: GitHub button", "GitHub forks")}
                                src="https://ghbtns.com/github-btn.html?user=online-go&repo=online-go.com&type=fork&count=true"
                            ></iframe>
                        </div>
                    </dd>

                    <dt>{pgettext("Developer page: resource label", "Design documentation")}</dt>
                    <dd>
                        <a href="https://deepwiki.com/online-go/online-go.com" {...EXTERNAL}>
                            deepwiki.com/online-go/online-go.com
                        </a>
                    </dd>

                    <dt>
                        {pgettext("Developer page: resource label", "API documentation")}{" "}
                        <span className="out-of-date">
                            {pgettext("Developer page: the API documentation", "(out of date)")}
                        </span>
                    </dt>
                    <dd>
                        <a href="https://docs.online-go.com" {...EXTERNAL}>
                            docs.online-go.com
                        </a>
                    </dd>

                    <dt>{_("Application management")}</dt>
                    <dd>
                        <a href="/oauth2/applications/">
                            {pgettext("Developer page link", "OAuth2 Application Manager")}
                        </a>
                    </dd>
                </dl>
                <PushNotificationsSection />
            </div>
        </div>
    );
}
