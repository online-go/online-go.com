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
import { DataSchema } from "./data_schema";

/**
 * React Hook that gives the value for a given key.  This should be preferred
 * to data.get() when inside a React Functional Component.
 *
 * Note: this function may return undefined.  One can emulate data.get(key, default_value)
 * by using null coalescing:
 *
 *     useData(key) ?? default_value;
 */
export function useData<KeyT extends Extract<keyof DataSchema, string>>(
    key: KeyT,
): DataSchema[KeyT] | undefined {
    const [val, setVal] = React.useState<DataSchema[KeyT]>(data.get(key));

    React.useEffect(() => {
        data.watch(key, setVal);
        return () => data.unwatch(key, setVal);
    }, []);

    return val;
}

export function useUser(): rest_api.UserConfig {
    return useData("user");
}
