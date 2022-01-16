/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { _ } from "translate";
import * as Sentry from "@sentry/browser";

export class ErrorBoundary extends React.Component<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            info: null,
            eventId: null,
        };
    }

    componentDidCatch(error, info) {
        this.setState({
            hasError: true,
            error: error,
            info: info,
        });

        try {
            console.error(error.message);
            console.error(info.componentStack);
        } catch (e) {
            console.error(e);
        }

        try {
            Sentry.withScope((scope) => {
                try {
                    scope.setUser({
                        id: data.get("user").id,
                        username: data.get("user").username,
                    });
                } catch (e) {
                    console.error(e);
                    try {
                        scope.setUser({});
                    } catch (e) {
                        console.error(e);
                    }
                }

                scope.setExtras(info);
                const eventId = Sentry.captureException(error);
                this.setState({ eventId });
            });
        } catch (e) {
            console.error(e);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="ErrorBoundary"
                    onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId })}
                >
                    <h3>{_("Congratulations, you found a bug!")}</h3>
                    <div>
                        {_(
                            "Our team has been notified of the bug, however if you have more details you'd like to provide, please click here to fill out a report.",
                        )}
                    </div>
                    <hr />
                    <h5>{this.state.error.message}</h5>
                    <pre>{this.state.info.componentStack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

window["test_sentry"] = () => {
    try {
        throw new Error("SENTRY TEST");
    } catch (e) {
        console.log(Sentry.captureException(e));
    }
};
