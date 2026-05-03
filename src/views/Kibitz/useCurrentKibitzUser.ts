/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 * General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import * as data from "@/lib/data";
import { getCurrentKibitzUser, type KibitzAnalysisUser } from "./kibitzAnalysisPolicy";

export function useCurrentKibitzUser(): KibitzAnalysisUser | null {
    const [currentUser, setCurrentUser] = React.useState(() => getCurrentKibitzUser());

    React.useEffect(() => {
        const updateCurrentUser = () => {
            setCurrentUser(getCurrentKibitzUser());
        };

        data.watch("config.user", updateCurrentUser);
        data.watch("user", updateCurrentUser);

        return () => {
            data.unwatch("config.user", updateCurrentUser);
            data.unwatch("user", updateCurrentUser);
        };
    }, []);

    return currentUser;
}
