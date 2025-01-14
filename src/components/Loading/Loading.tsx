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

interface LoadingProps {
    large?: boolean;
    small?: boolean;
    slow?: boolean;
}

// This shenanigans is to allow the caller to select classes via props.
// if there's a better way, please do tell :)
export function Loading(props: LoadingProps): React.ReactElement {
    return (
        <span
            className={
                "Loading" +
                (props.small ? " small" : "") +
                (props.large ? " large" : "") +
                (props.slow ? " slow" : "")
            }
        >
            <span className="loading-spinner" />
        </span>
    );
}

export function LoadingPage(props: LoadingProps): React.ReactElement {
    return (
        <span className="LoadingPage">
            <Loading {...props} />
        </span>
    );
}
