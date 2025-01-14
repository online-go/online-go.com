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

import { errorAlerter } from "@/lib/misc";

import { BlockPlayerModal, getAllBlocksWithUsernames } from "@/components/BlockPlayer";

export function BlockedPlayerPreferences(): React.ReactElement {
    const [blocked_players, setBlockedPlayers]: [
        Array<any> | null,
        (x: Array<any> | null) => void,
    ] = React.useState<Array<any> | null>(null);

    React.useEffect(() => {
        getAllBlocksWithUsernames()
            .then((blocks) => setBlockedPlayers(blocks))
            .catch(errorAlerter);
    }, []);

    if (blocked_players === null) {
        return <div id="BlockedPlayers"></div>;
    }

    return (
        <div id="BlockedPlayers">
            <h2>{_("Blocked players")}</h2>
            <div>
                {blocked_players.map((block_state) => {
                    const user_id = block_state.blocked;
                    if (!user_id) {
                        return null;
                    }
                    return (
                        <div key={user_id} className="blocked-player-row">
                            <span className="blocked-player">{block_state.username}</span>
                            <BlockPlayerModal playerId={user_id} inline={true} />
                        </div>
                    );
                })}

                {blocked_players.length === 0 ? (
                    <div>{_("You have not blocked any players")}</div>
                ) : null}
            </div>
            <br />
        </div>
    );
}
