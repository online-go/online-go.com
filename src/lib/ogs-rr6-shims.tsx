/*
 * Copyright 2012-2022  Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* This file contains shims to make it so we can use our pre-existing class
 * React components with React Router 6. We should strive to elimiate this the
 * need for this in time. */

import React from "react";
import { useLocation, useParams } from "react-router-dom";

// Types derived heavily from @types/react-router-dom, with some fields we don't use eliminated

export interface StaticContext {
    statusCode?: number | undefined;
}

export interface match<Params extends { [K in keyof Params]?: string } = {}> {
    params: Params;
    path: string;
    url: string;
}

export interface RouteComponentProps<Params extends Partial<Record<keyof Params, string>> = {}> {
    location: Location;
    match: match<Params>;
}

export function rr6ClassShim(Class: React.ComponentType<any>): (props: any) => JSX.Element {
    return (props) => {
        const location = useLocation();
        const params = useParams();

        const { pathname = "/", search = "", hash = "" } = location;

        const path = pathname + search + hash;

        const match = {
            url: globalThis.location.origin + path,
            path,
            params,
        };

        return <Class {...{ location, match }} {...props} />;
    };
}
