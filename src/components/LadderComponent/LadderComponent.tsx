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
import ReactResizeDetector from "react-resize-detector";
import { _ } from "translate";
import { Player } from "Player";
import { PaginatedTable } from "PaginatedTable";

interface LadderComponentProperties {
    ladderId: number;
    pageSize?: number;
    pageSizeOptions?: Array<number>;
    hidePageControls?: boolean;
}

export class LadderComponent extends React.PureComponent<LadderComponentProperties> {
    onResize = () => {
        this.forceUpdate();
    };

    render() {
        return (
            <div className="LadderComponent">
                <ReactResizeDetector handleWidth handleHeight onResize={() => this.onResize()} />

                <PaginatedTable
                    className="ladder"
                    name="ladder"
                    source={`ladders/${this.props.ladderId}/players?no_challenge_information=1`}
                    pageSize={this.props.pageSize}
                    pageSizeOptions={this.props.pageSizeOptions}
                    hidePageControls={this.props.hidePageControls}
                    uiPushProps={{
                        event: "players-updated",
                        channel: `ladder-${this.props.ladderId}`,
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
}
