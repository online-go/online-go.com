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
import {PlayerIcon} from "components";
import online_status from "online_status";
import data from "data";
import {errorAlerter} from "misc";
import {longRankString} from "rank_utils";
import {FirstTimeSetup} from "FirstTimeSetup";
import {FriendList} from "FriendList";
import {ChallengesList} from "./ChallengesList";
import {EmailBanner} from "EmailBanner";



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
        if (!data.get("user").setup_rank_set) {
            return <FirstTimeSetup/>;
        }

        let user = data.get("config.user");

        return (
        <div id="Overview-Container">
            <AdUnit unit="cdm-zone-01" nag/>
            <div id="Overview">
                <div className="left">
                    <EmailBanner />
                    <ChallengesList />

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
                            <span className="username">{user.username}</span>

                            <div className="rank-and-progress">
                                <span className="rank">{longRankString(user)} &nbsp;</span>
                                <div className="progress">
                                    <div className="progress-bar primary" style={{width: ((1000 + user.rating) % 100.0) + "%"}}>&nbsp;</div>
                                </div>
                            </div>

                            <Link className="view-and-edit-link" to={`/player/${user.id}`}>{_("View and edit profile") /* translators: View and edit profile */} &gt;</Link>
                        </div>
                    </div>

                    <div className="right-header">
                        <h3>{_("Tournaments")}</h3>
                        <Link to="/tournaments">{_("All tournaments") /* translators: Link to view all tournaments */} &gt;</Link>
                    </div>
                    <TournamentList />

                    <div className="right-header">
                        <h3>{_("Ladders")}</h3>
                        <Link to="/ladders">{_("All ladders") /* translators: Link to view all ladders */} &gt;</Link>
                    </div>
                    <LadderList />

                    <div className="right-header">
                        <h3>{_("Groups")}</h3>
                        <Link to="/groups">{_("Find Groups") /* translators: Link to view all groups */} &gt;</Link>
                    </div>
                    <GroupList />

                    <div className="right-header">
                        <h3>{_("Friends")}</h3>
                        <Link to="/chat">{_("Meet some in Chat!") /* translators: Meet some friends in chat */} &gt;</Link>
                    </div>
                    <FriendList />
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
            resolved: false
        };
    }

    componentDidMount() {{{
        get("me/groups", {}).then((res) => {
            this.setState({"groups": res.results, resolved: true});
        }).catch((err) => {
            this.setState({resolved: true});
            console.info("Caught", err);
        });
    }}}
    componentWillUnmount() {{{
        abort_requests_in_flight("me/groups");
    }}}
    render() {
        if (!this.state.resolved) {
            return null;
        }

        return (
            <div className="Overview-GroupList">
                {this.state.groups.map((group) => <Link key={group.id} to={`/group/${group.id}`}><img src={group.icon}/> {group.name}</Link>)}
                {(this.state.groups.length === 0 || null) &&
                    null
                }
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
        get("me/tournaments", {ended__isnull: true, order_by: "name"}).then((res) => {
            this.setState({"my_tournaments": res.results, resolved: true});
        }).catch((err) => {
            this.setState({resolved: true});
            console.info("Caught", err);
        });
        get("tournaments", {started__isnull: true, group__isnull: true, order_by: "name"}).then((res) => {
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
