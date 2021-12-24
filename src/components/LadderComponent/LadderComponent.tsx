/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import ReactResizeDetector from 'react-resize-detector';
import {Link} from "react-router-dom";
import {browserHistory} from "ogsHistory";
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {errorAlerter} from "misc";
import {Player} from "Player";
import {PaginatedTable, PaginatedTableRef} from "PaginatedTable";
import {UIPush} from "UIPush";
import * as data from "data";
import tooltip from "tooltip";
import swal from 'sweetalert2';

interface LadderComponentProperties {
    ladderId: number;
    pageSize?: number;
    pageSizeOptions?: Array<number>;
    fullView?: boolean;
    showLinkToFullView?: boolean;
    hidePageControls?: boolean;
    dontStartOnPlayersPage?: boolean; /* default we will load whatever page the player is found on (based on ladder ranking), set to true to start on page 1 */
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

export class LadderComponent extends React.PureComponent<LadderComponentProperties, LadderComponentState> {
    ladder_table_ref?: PaginatedTableRef;

    constructor(props) {
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
    UNSAFE_componentWillReceiveProps(next_props) {
    }
    componentDidUpdate(old_props, old_state) {
        if (this.props.ladderId !== old_props.ladderId) {
            this.reload();
        }
    }

    onResize = () => {
        this.forceUpdate();
    };

    reload = () => {
        get("ladders/%%", this.props.ladderId)
        .then((ladder) => this.setState({ladder: ladder}))
        .catch(errorAlerter);

        this.updatePlayers();
    };

    updatePlayers = () => {
        this.ladder_table_ref?.refresh();
    };

    challenge(ladder_player) {
        console.log(ladder_player);
        swal({
            "text": interpolate(_("Are you ready to start your game with {{player_name}}?"), /* translators: ladder challenge */
                {player_name: ladder_player.player.username}),
            "showCancelButton": true,
            "confirmButtonText": _("Yes!"),
            "cancelButtonText": _("No"),
        })
        .then(() => {
            post("ladders/%%/players/challenge", this.props.ladderId, {
                "player_id": ladder_player.player.id,
            })
            .then((res) => {
                this.updatePlayers();
            })
            .catch(errorAlerter);
        })
        .catch(() => 0);
    }

    render() {
        if (!this.state.ladder) {
            return null;
        }
        const user = data.get("user");
        const full_view = this.props.fullView;
        let startingPage = 1;
        if (!this.props.dontStartOnPlayersPage && this.state.ladder.player_rank > 0) {
            startingPage = Math.max(1, Math.ceil(this.state.ladder.player_rank / this.state.page_size));
        }

        const thin_view = $(window).width() < 800;
        //let challenged_by = [];
        //let challenging = [];

        function by_ladder_rank(a, b) {
            let ar = a.player.ladder_rank;
            let br = b.player.ladder_rank;
            if (ar < 0) {
                ar = 1000000000;
            }
            if (br < 0) {
                br = 1000000000;
            }
            return ar - br;
        }

        function challenged_by(lp: any, label: boolean) {
            return (
                <div className="inline-challenge-line">
                    {((full_view && lp.incoming_challenges.length) || null) &&
                        <div>
                            {(label || null) &&
                                <b>{_("Challenged by") /* Translators: List of players that challenged this player in a ladder */}: </b>
                            }
                            {
                                lp.incoming_challenges.sort(by_ladder_rank).map((challenge, idx) => (
                                    <div key={idx}>
                                        <Link className="challenge-link" to={`/game/${challenge.game_id}`}>
                                            <span className="challenge-rank">#{challenge.player.ladder_rank}</span>
                                            <Player nolink user={challenge.player} />
                                        </Link>
                                    </div>
                                ))
                            }
                        </div>
                    }
                </div>
            );
        }
        function challenging(lp: any, label: boolean) {
            return (
                <div className="challenge-line">
                    {((full_view && lp.outgoing_challenges.length) || null) &&
                        <div>
                            {(label || null) &&
                                <b>{_("Challenging") /* Translators: List of players that have been challenged by this player in a ladder */}: </b>
                            }
                            {
                                lp.outgoing_challenges.sort(by_ladder_rank).map((challenge, idx) => (
                                    <div key={idx}>
                                        <Link className="challenge-link" to={`/game/${challenge.game_id}`}>
                                            <span className="challenge-rank">#{challenge.player.ladder_rank}</span>
                                            <Player nolink user={challenge.player} />
                                        </Link>
                                    </div>
                                ))
                            }
                        </div>
                    }
                </div>
            );
        }


        return (
            <div className="LadderComponent">
                <ReactResizeDetector handleWidth handleHeight onResize={() => this.onResize()} />

                <UIPush event="players-updated" channel={`ladder-${this.props.ladderId}`} action={this.updatePlayers} />

                {(this.props.showTitle || null) &&
                    <h4>{interpolate(_("{{ladder_name}} ladder"), {ladder_name: this.state.ladder.name})} </h4>
                }
                {(this.props.showLinkToFullView || null) &&
                    <div style={{textAlign: "center"}}>
                        <Link className="btn primary sm" to={`/ladder/${this.props.ladderId}`}>{_("Full View") /* translators: View details of the selected ladder */}</Link>
                    </div>
                }

                {(this.props.showTitle || null) &&
                    <h4>{interpolate(_("{{ladder_size}} players"), {"ladder_size": this.state.ladder.size})}</h4>
                }



                <PaginatedTable
                    className="ladder"
                    name="ladder"
                    ref={ref => this.ladder_table_ref = ref}
                    source={`ladders/${this.props.ladderId}/players` + (full_view ? '' : '?no_challenge_information=1')}
                    startingPage={startingPage}
                    pageSize={this.state.page_size}
                    pageSizeOptions={this.props.pageSizeOptions}
                    hidePageControls={this.props.hidePageControls}
                    columns={[
                        {header: _("Rank"), className: "rank-column", render: (lp) => lp.rank},


                        (((full_view && this.state.ladder.player_rank) > 0 || null) &&
                            {header: "", className: "challenge-column", render: (lp) =>
                                (lp.player.id !== user.id && lp.can_challenge || null) && ( lp.can_challenge.challengeable
                                    ? <button className="primary xs" onClick={this.challenge.bind(this, lp)}>{_("Challenge")}</button>
                                    : <span className="not-challengable"
                                        data-title={canChallengeTooltip(lp.can_challenge)}
                                        onClick={tooltip}
                                        onMouseOver={tooltip}
                                        onMouseOut={tooltip}
                                        onMouseMove={tooltip}
                                    >{_("Not challengable")}</span>
                                )
                            }
                        ),


                        {header: _("Player"), className: "player-column", render: (lp) => (
                            <div className="player-challenge-container">
                                <div className="primary-player">
                                    <Player flag user={lp.player}/>
                                </div>
                                {(thin_view || null) && challenged_by(lp, true)}
                                {(thin_view || null) && challenging(lp, true)}
                            </div>
                        )},

                        thin_view  || !full_view
                           ? null
                           : {header: _("Challenged By"),
                               className: "challenge-column", render: (lp) => challenged_by(lp, false)}
                        ,

                        thin_view  || !full_view
                           ? null
                           : {header: _("Challenging"),
                               className: "challenge-column", render: (lp) => challenging(lp, false)}
                        ,
                    ]}
                />
            </div>
        );
    }
}

function canChallengeTooltip(obj: any): string {
    if (obj.reason_code) {
        switch (obj.reason_code) {
            case 0x001: return pgettext("Can't challenge player in ladder because: ", "Can't challenge yourself");
            case 0x002: return pgettext("Can't challenge player in ladder because: ", "Player is a lower rank than you");
            case 0x003: return pgettext("Can't challenge player in ladder because: ", "Player is not in the ladder");
            case 0x004: return pgettext("Can't challenge player in ladder because: ", "Player's rank is too high");
            case 0x005: return interpolate(pgettext("Can't challenge player in ladder because: ", "Already playing {{number}} games you've initiated"), {"number": obj.reason_parameter });
            case 0x006: return pgettext("Can't challenge player in ladder because: ", "Already playing a game against this person");
            case 0x007: return pgettext("Can't challenge player in ladder because: ", "Last challenge within 7 days");
            case 0x008: return pgettext("Can't challenge player in ladder because: ", "Player already has the maximum number of challenges");
        }
    }

    if (obj.reason) {
        return obj.reason;
    }

    return null;
}
