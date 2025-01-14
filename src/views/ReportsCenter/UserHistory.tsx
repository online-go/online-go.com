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
import { useUser } from "@/lib/hooks";

import { Player } from "@/components/Player";
import { ModTools } from "@/views/User";
import { ModLog } from "@/views/User";

export function UserHistory({
    target_user: target_user,
}: {
    target_user: any;
}): React.ReactElement | null {
    const user = useUser();

    if (!target_user) {
        return null;
    }

    return (
        <>
            <h3>
                History for <Player user={target_user} />
            </h3>
            {user.is_moderator && (
                <ModTools user_id={target_user.id} show_mod_log={true} collapse_same_users={true} />
            )}
            {!user.is_moderator && !!user.moderator_powers && (
                <ModLog user_id={target_user.id} warnings_only={true} />
            )}
        </>
    );
}
