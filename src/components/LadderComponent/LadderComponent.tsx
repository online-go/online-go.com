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
import { _, interpolate } from "translate";
import { get } from "requests";
import { errorAlerter } from "misc";
import { Player } from "Player";
import { PaginatedTable, PaginatedTableRef } from "PaginatedTable";
import { UIPush } from "UIPush";

interface LadderComponentProperties {
    ladderId: number;
    pageSize?: number;
    pageSizeOptions?: Array<number>;
    hidePageControls?: boolean;
    dontStartOnPlayersPage?: boolean /* default we will load whatever page the player is found on (based on ladder ranking), set to true to start on page 1 */;
    showTitle?: boolean;
}

interface Ladder {
    player_rank: number;
    name: string;
    size: number;
}

interface LadderComponentState {
    ladder_id: number;
    page_size: number;
    ladder?: Ladder;
}

export class LadderComponent extends React.PureComponent<
    LadderComponentProperties,
    LadderComponentState
> {
    ladder_table_ref = React.createRef<PaginatedTableRef>();

    constructor(props: LadderComponentProperties) {
        super(props);
        this.state = {
            ladder_id: props.ladderId,
            page_size: props.pageSize || 20,
            ladder: null,
        };
    }

    componentDidMount() {
        this.reload();
    }
    componentDidUpdate(old_props) {
        if (this.props.ladderId !== old_props.ladderId) {
            this.reload();
        }
    }

    onResize = () => {
        this.forceUpdate();
    };

    reload = () => {
        get("ladders/%%", this.props.ladderId)
            .then((ladder) => this.setState({ ladder: ladder }))
            .catch(errorAlerter);

        this.updatePlayers();
    };

    updatePlayers = () => {
        this.ladder_table_ref.current?.refresh();
    };

    render() {
        if (!this.state.ladder) {
            return null;
        }
        let startingPage = 1;
        if (!this.props.dontStartOnPlayersPage && this.state.ladder.player_rank > 0) {
            startingPage = Math.max(
                1,
                Math.ceil(this.state.ladder.player_rank / this.state.page_size),
            );
        }

        return (
            <div className="LadderComponent">
                <ReactResizeDetector handleWidth handleHeight onResize={() => this.onResize()} />

                <UIPush
                    event="players-updated"
                    channel={`ladder-${this.props.ladderId}`}
                    action={this.updatePlayers}
                />

                {(this.props.showTitle || null) && (
                    <h4>
                        {interpolate(_("{{ladder_name}} ladder"), {
                            ladder_name: this.state.ladder.name,
                        })}{" "}
                    </h4>
                )}

                {(this.props.showTitle || null) && (
                    <h4>
                        {interpolate(_("{{ladder_size}} players"), {
                            ladder_size: this.state.ladder.size,
                        })}
                    </h4>
                )}

                <PaginatedTable
                    className="ladder"
                    name="ladder"
                    ref={this.ladder_table_ref}
                    source={`ladders/${this.props.ladderId}/players?no_challenge_information=1`}
                    startingPage={startingPage}
                    pageSize={this.state.page_size}
                    pageSizeOptions={this.props.pageSizeOptions}
                    hidePageControls={this.props.hidePageControls}
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
