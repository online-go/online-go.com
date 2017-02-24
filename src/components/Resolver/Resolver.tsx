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
import {OGSComponent} from "../OGSComponent";

export class Resolver<Props, State> extends OGSComponent<Props, State> {
    resolved: boolean = true;
    resolve_error: boolean = false;
    resolve_promise: any = null;

    constructor(props) {
        super(props);
    }

    componentWillMount() {
        super.componentWillMount();

        this.resolved = false;
        this.resolve_promise = this.resolve(this.props);

        if (this.resolve_promise) {
            let instant_resolution = true;
            this.resolve_promise.then(() => {
                this.resolved = true;
                if (!instant_resolution) {
                    this.forceUpdate();
                }
            }).catch((err) => {
                console.log("Resolve error");
                this.resolve_error = true;
            });
            instant_resolution = false;
        }

    }
    componentWillUnmount() {
        super.componentWillUnmount();
        if (!this.resolved) {
            this.abortResolve(this.resolve_promise);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!this.resolved) {
            this.abortResolve(this.resolve_promise);
        }

        this.resolved = false;
        this.resolve_promise = this.resolve(nextProps);

        if (this.resolve_promise) {
            let instant_resolution = true;
            this.resolve_promise.then(() => {
                this.resolved = true;
                if (!instant_resolution) {
                    this.forceUpdate();
                }
            }).catch((err) => {
                console.log("Resolve error");
                this.resolve_error = true;
            });
            instant_resolution = false;
        }
    }

    resolve(props: any) {
        return {then: (cb) => {cb(); }};
    }

    abortResolve(promise?: any) {
        if (!promise) {
            promise = this.resolve_promise;
        }

        /* default is nop */
        try {
            if (promise && (promise as any).abort) {
                console.log("calling .abort()");
                (promise as any).abort();
            }
        } catch (e) {
            console.error(e);
        }
    }

    render() {
        if (this.resolved) {
            return this.resolvedRender();
        } else {
            return <div className="loading"/>;
        }
    }

    resolvedRender() {
        return <div>[Generic Resolved Render]</div>;
    }
}
