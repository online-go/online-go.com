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
import * as data from "@/lib/data";
import { DataSchema } from "./data_schema";
import { Goban } from "goban";

/**
 * React Hook that gives the value for a given key.  This should be preferred
 * to data.get() when inside a React Functional Component.
 */
export function useData<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
): [
    DataSchema[KeyT] | undefined,
    React.Dispatch<React.SetStateAction<DataSchema[KeyT] | undefined>>,
];
export function useData<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
    default_value: DataSchema[KeyT],
): [DataSchema[KeyT], React.Dispatch<React.SetStateAction<DataSchema[KeyT] | undefined>>];
export function useData<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
    default_value?: DataSchema[KeyT],
): [
    DataSchema[KeyT] | undefined,
    React.Dispatch<React.SetStateAction<DataSchema[KeyT] | undefined>>,
] {
    const [val, setVal] = React.useState<DataSchema[KeyT] | undefined>(
        data.get(key, default_value as DataSchema[KeyT]),
    );

    React.useEffect(() => {
        data.watch(key, setVal);
        return () => data.unwatch(key, setVal);
    }, []);

    React.useEffect(() => {
        data.set(key, val);
    }, [val]);

    return [val, setVal];
}

export function useUser(): rest_api.UserConfig {
    return useData("user")[0] as rest_api.UserConfig;
}

export function useRefresh(): () => void {
    const [, refresh] = React.useState(0);
    return React.useCallback(() => refresh(() => Math.random()), [refresh]);
}

export function useMainGoban(): Goban | null | undefined {
    return window.global_goban;
}

export function useIsDesktop(): boolean {
    const [isDesktop, setIsDesktop] = React.useState(true);

    React.useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 850px)");
        const handleResize = () => setIsDesktop(mediaQuery.matches);

        handleResize(); // Check on mount
        mediaQuery.addEventListener("change", handleResize); // Listen for changes

        return () => mediaQuery.removeEventListener("change", handleResize);
    }, []);

    return isDesktop;
}
