/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {Link} from "react-router";
import {_} from "translate";
import {Card} from "material";
import {GameList} from "GameList";
import {AdUnit} from "AdUnit";
import {createOpenChallenge} from "ChallengeModal";
import {UIPush} from "UIPush";
import {post, get, abort_requests_in_flight} from "requests";
import {Goban} from "goban";
import {toast} from "toast";
import {Player} from "Player";
import {PlayerIcon} from "PlayerIcon";
import online_status from "online_status";
import * as data from "data";
import {errorAlerter} from "misc";
import {longRankString, getUserRating, is_novice, is_provisional} from "rank_utils";
import {FriendList} from "FriendList";
import {ChallengesList} from "./ChallengesList";
import {EmailBanner} from "EmailBanner";
import {SupporterGoals} from "SupporterGoals";


let UserRating = (props: {rating: number}) => {
    let wholeRating = Math.floor(props.rating);
    let tenthsRating = Math.floor(props.rating * 10) % 10;
    return <span className="UserRating">{wholeRating}{(tenthsRating > 0) && <sup><span className="frac"><sup>{tenthsRating}</sup>&frasl;<sub>10</sub></span></sup>}</span>;
};


export class Overview extends React.Component<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            overview: {
                active_games: [],
            },
            resolved: false,
        };
    }

    componentDidMount() {
        this.refresh();
    }

    refresh() {
        abort_requests_in_flight("ui/overview");
        return get("ui/overview").then((overview) => {
            this.setState({"overview": overview, resolved: true});
        }).catch((err) => {
            this.setState({resolved: true});
            errorAlerter(err);
        });
    }

    componentWillUnmount() {
        abort_requests_in_flight("ui/overview");
    }

    render() {
        let user = data.get("config.user");

        let rating = user ? getUserRating(user, 'overall', 0) : null;

        return (
        <div id="Overview-Container">
            <AdUnit unit="cdm-zone-01" nag/>
            <SupporterGoals />
            <div id="Overview">
                <div className="left">
                    <EmailBanner />
                    <ChallengesList onAccept={() => this.refresh()} />

                    {((this.state.resolved && this.state.overview.active_games.length) || null) &&
                        <div className="active-games">
                            <h2>{_("Active Games")}</h2>
                            <GameList list={this.state.overview.active_games} player={user}
                                emptyMessage={_("You're not currently playing any games. Start a new game with the \"Create a new game\" or \"Look for open games\" buttons above.")}
                            />
                        </div>
                    }
                    {((this.state.resolved && this.state.overview.active_games.length === 0) || null) &&
                        <div className="no-active-games">
                            <div style={{"marginBottom": "1rem"}}>{_("You're not currently playing any games.")}</div>
                            <Link to="/play" className="btn primary">Find a game</Link>
                        </div>
                    }
                </div>
                <div className="right">
                    <div className="profile">
                        <PlayerIcon id={user.id} size={80} />

                        <div className="profile-right">
                            <div style={{fontSize: '1.2em'}}>
                                <Player user={user} nodetails rank={false} />
                            </div>
                            {rating && rating.professional &&
                                <div>
                                    <span className="rank">{rating.rank_label}</span>
                                </div>
                            }
                            {rating && !rating.professional &&
                                <div>
                                    <span className="rating">{Math.round(rating.rating)} &plusmn; {Math.round(rating.deviation)}</span>
                                </div>
                            }
                            {rating && !rating.professional && !is_novice(user) && !is_provisional(user) &&
                                <div>
                                    <span className="rank">{rating.partial_bounded_rank_label} &plusmn; {rating.rank_deviation.toFixed(1)}</span>
                                </div>
                            }
                        </div>
                    </div>

                    <div style={{justifyContent: 'center'}}>
                        <AdUnit unit='cdm-zone-02' />
                    </div>

                    <div className="overview-categories">
                        <h3><Link to="/tournaments"><i className="fa fa-trophy"></i> {_("Tournaments")}</Link></h3>
                        <TournamentList />

                        <h3><Link to="/ladders"><i className="fa fa-list-ol"></i> {_("Ladders")}</Link></h3>
                        <LadderList />

                        <h3><Link to="/groups"><i className="fa fa-users"></i> {_("Groups")}</Link></h3>
                        <GroupList />

                        <h3><Link to="/chat"><i className="fa fa-comment-o"></i> {_("Chat with friends")}</Link></h3>
                        <FriendList />
                    </div>

                </div>

            </div>
        </div>
        );
    }
}



export class GroupList extends React.PureComponent<{}, any> { /* {{{ */
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            invitations: [],
            resolved: false
        };
    }

    componentDidMount() {{{
        this.refresh();
    }}}
    refresh() {{{
        get("me/groups", {}).then((res) => {
            this.setState({"groups": res.results, resolved: true});
        }).catch((err) => {
            this.setState({resolved: true});
            console.info("Caught", err);
        });
        get("me/groups/invitations", {page_size: 100}).then((res) => {
            this.setState({"invitations": res.results.filter(invite => invite.user === data.get('user').id && invite.is_invitation)});
        }).catch((err) => {
            console.info("Caught", err);
        });
    }}}
    componentWillUnmount() {{{
        abort_requests_in_flight("me/groups");
    }}}
    acceptInvite(invite) {{{
        post("me/groups/invitations", {"request_id": invite.id})
        .then(() => this.refresh())
        .catch(() => this.refresh());
    }}}
    rejectInvite(invite) {{{
        post("me/groups/invitations", {"request_id": invite.id, "delete": true})
        .then(() => this.refresh())
        .catch(() => this.refresh());
    }}}
    render() {
        if (!this.state.resolved) {
            return null;
        }

        return (
            <div className="Overview-GroupList">
                {this.state.invitations.map((invite) => (
                    <div className='invite' key={invite.id}>
                        <i className='fa fa-times' onClick={this.rejectInvite.bind(this, invite)} />
                        <i className='fa fa-check' onClick={this.acceptInvite.bind(this, invite)} />
                        <Link key={invite.group.id} to={`/group/${invite.group.id}`}><img src={invite.group.icon}/> {invite.group.name}</Link>
                    </div>
                ))}
                {this.state.groups.map((group) => <Link key={group.id} to={`/group/${group.id}`}><img src={group.icon}/> {group.name}</Link>)}
            </div>
        );
    }
} /* }}} */
export class TournamentList extends React.PureComponent<{}, any> { /* {{{ */
    constructor(props) {
        super(props);
        this.state = {
            my_tournaments: [],
            open_tournaments: [],
            resolved: false
        };
    }

    componentDidMount() {{{
        get("me/tournaments", {ended__isnull: true, ordering: "name"}).then((res) => {
            this.setState({"my_tournaments": res.results, resolved: true});
        }).catch((err) => {
            this.setState({resolved: true});
            console.info("Caught", err);
        });
        get("tournaments", {started__isnull: true, group__isnull: true, ordering: "name"}).then((res) => {
            this.setState({"open_tournaments": res.results, resolved: true});
        }).catch((err) => {
            this.setState({resolved: true});
            console.info("Caught", err);
        });
    }}}
    componentWillUnmount() {{{
        abort_requests_in_flight("me/tournaments");
    }}}
    render() {
        if (!this.state.resolved) {
            return null;
        }

        return (
            <div className="Overview-TournamentList">
                {this.state.open_tournaments.map((tournament) => (
                    <Link key={tournament.id} to={`/tournament/${tournament.id}`}><img src={tournament.icon}/> {tournament.name}</Link>
                ))}
                {(this.state.open_tournaments.length === 0 || null) &&
                    null
                }

                {this.state.my_tournaments.map((tournament) => (
                    <Link key={tournament.id} to={`/tournament/${tournament.id}`}><img src={tournament.icon}/> {tournament.name}</Link>
                ))}
                {(this.state.my_tournaments.length === 0 || null) &&
                    null
                }
            </div>
        );
    }
} /* }}} */
export class LadderList extends React.PureComponent<{}, any> { /* {{{ */
    constructor(props) {
        super(props);
        this.state = {
            ladders: [],
            resolved: false
        };
    }

    componentDidMount() {{{
        get("me/ladders", {}).then((res) => {
            this.setState({"ladders": res.results, resolved: true});
        }).catch((err) => {
            this.setState({resolved: true});
            console.info("Caught", err);
        });
    }}}
    componentWillUnmount() {{{
        abort_requests_in_flight("me/ladders");
    }}}
    render() {
        if (!this.state.resolved) {
            return null;
        }

        return (
            <div className="Overview-LadderList">
                {this.state.ladders.map((ladder) =>
                    <Link key={ladder.id} to={`/ladder/${ladder.id}`}>
                        <span className="ladder-rank">#{ladder.player_rank}</span>  {ladder.name}
                    </Link>
                ) }
                {(this.state.ladders.length === 0 || null) &&
                    null
                }
            </div>
        );
    }
} /* }}} */
