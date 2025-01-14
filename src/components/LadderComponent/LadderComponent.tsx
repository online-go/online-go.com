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
import { Player } from "@/components/Player";
import { PaginatedTable } from "@/components/PaginatedTable";
import { useResizeDetector } from "@/components/OgsResizeDetector";

interface LadderComponentProperties {
    ladderId: number;
}

export function LadderComponent({ ladderId }: LadderComponentProperties): React.ReactElement {
    const { ref } = useResizeDetector();

    return (
        <div className="LadderComponent" ref={ref}>
            <PaginatedTable
                className="ladder"
                name="ladder"
                source={`ladders/${ladderId}/players?no_challenge_information=1`}
                pageSize={10}
                hidePageControls={true}
                uiPushProps={{
                    event: "players-updated",
                    channel: `ladder-${ladderId}`,
                }}
                columns={[
                    { header: _("Rank"), className: "rank-column", render: (lp) => lp.rank },
                    {
                        header: _("Player"),
                        className: "player-column",
                        render: (lp) => (
                            <div className="player-challenge-container">
                                <div className="primary-player">
                                    <Player flag user={lp.player} />
                                </div>
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    );
}
