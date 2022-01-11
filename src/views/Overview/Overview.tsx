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
import { Link } from "react-router-dom";
import { _, interpolate } from "translate";
import { Card } from "material";
import { GameList } from "GameList";
import { createOpenChallenge } from "ChallengeModal";
import { UIPush } from "UIPush";
import { post, get, abort_requests_in_flight } from "requests";
import { Goban } from "goban";
import { toast } from "toast";
import { Player } from "Player";
import { PlayerIcon } from "PlayerIcon";
import online_status from "online_status";
import * as data from "data";
import cached from "cached";
import * as preferences from "preferences";
import { errorAlerter, ignore } from "misc";
import { DismissableNotification } from "DismissableNotification";
import { FriendList } from "FriendList";
import { ChallengesList } from "./ChallengesList";
import { EmailBanner } from "EmailBanner";
import { SupporterGoals } from "SupporterGoals";
import { ProfileCard } from "ProfileCard";
import { notification_manager } from "Notifications";
import { ActiveAnnouncements } from "Announcements";
import { FabX, FabCheck } from "material";

const UserRating = (props: { rating: number }) => {
    const wholeRating = Math.floor(props.rating);
    const tenthsRating = Math.floor(props.rating * 10) % 10;
    return (
        <span className="UserRating">
            {wholeRating}
            {tenthsRating > 0 && (
                <sup>
                    <span className="frac">
                        <sup>{tenthsRating}</sup>&frasl;<sub>10</sub>
                    </span>
                </sup>
            )}
        </span>
    );
};

declare let ogs_missing_translation_count;

export class Overview extends React.Component<{}, any> {
    private static defaultTitle = "OGS";

    constructor(props) {
        super(props);

        let show_translation_dialog = false;
        try {
            if (
                ogs_missing_translation_count > 0 &&
                !preferences.get("translation-dialog-never-show") &&
                Date.now() - preferences.get("translation-dialog-dismissed") > 14 * 86400 * 1000
            ) {
                show_translation_dialog = true;
            }
        } catch (e) {
            console.error(e);
        }

        this.state = {
            user: data.get("config.user"),
            overview: {
                active_games: [],
            },
            show_translation_dialog: show_translation_dialog,
            resolved: false,
            boards_to_move_on: Object.keys(notification_manager.boards_to_move_on).length,
        };
    }

    setTitle() {
        const count = this.state.boards_to_move_on > 0 ? `(${this.state.boards_to_move_on}) ` : "";
        window.document.title = `${count}${Overview.defaultTitle}`;
    }

    setBoardsToMoveOn = (boardsToMoveOn) => {
        this.setState({ boards_to_move_on: boardsToMoveOn });
    };

    componentDidMount() {
        this.setTitle();
        notification_manager.event_emitter.on("turn-count", this.setBoardsToMoveOn);
        data.watch("config.user", this.updateUser);
        this.refresh().then(ignore).catch(ignore);
    }

    componentDidUpdate() {
        this.setTitle();
    }

    updateUser = (user) => {
        this.setState({ user: user });
    };

    refresh() {
        abort_requests_in_flight("ui/overview");
        return get("ui/overview")
            .then((overview) => {
                this.setState({ overview: overview, resolved: true });
            })
            .catch((err) => {
                this.setState({ resolved: true });
                errorAlerter(err);
            });
    }

    componentWillUnmount() {
        abort_requests_in_flight("ui/overview");
        notification_manager.event_emitter.off("turn-count", this.setBoardsToMoveOn);
        window.document.title = Overview.defaultTitle;
        data.unwatch("config.user", this.updateUser);
    }

    render() {
        const user = this.state.user;

        return (
            <div id="Overview-Container">
                <SupporterGoals />
                <div id="Overview">
                    <div className="left">
                        <EmailBanner />
                        <ActiveAnnouncements />
                        <ChallengesList onAccept={() => this.refresh()} />

                        {((user && user.provisional) || null) && (
                            <DismissableNotification className="learn-how-to-play" dismissedKey="learn-how-to-play">
                                <Link to="/learn-to-play-go">{_("New to Go? Click here to learn how to play!")}</Link>
                            </DismissableNotification>
                        )}

                        {((this.state.resolved && this.state.overview.active_games.length) || null) && (
                            <div className="active-games">
                                <h2>
                                    {_("Active Games")} ({this.state.overview.active_games.length})
                                </h2>
                                <GameList
                                    list={
                                        // GameList is expecting rengo info on the game (like in ObserveGamesComponent) but here that information is on game.json, so we have to promote it ...
                                        this.state.overview.active_games.map((game) => ({
                                            rengo: game.json.rengo,
                                            rengo_teams: game.json.rengo_teams,
                                            ...game,
                                        }))
                                    }
                                    player={user}
                                    emptyMessage={_(
                                        'You\'re not currently playing any games. Start a new game with the "Create a new game" or "Look for open games" buttons above.',
                                    )}
                                />
                            </div>
                        )}
                        {((this.state.resolved && this.state.overview.active_games.length === 0) || null) && (
                            <div className="no-active-games">
                                <div style={{ marginBottom: "1rem" }}>
                                    {_("You're not currently playing any games.")}
                                </div>
                                <Link to="/play" className="btn primary">
                                    {_("Find a game")}
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="right">
                        <ProfileCard user={user} />

                        <div className="overview-categories">
                            {this.state.show_translation_dialog && (
                                <Card className="translation-dialog">
                                    <FabX onClick={this.dismissTranslationDialog} />

                                    <div>
                                        {_(
                                            "Hello! Did you know that online-go.com is translated entirely volunteers in the Go community? Because of that, sometimes our translations get behind, like right now. In this language there are some missing translation strings. If you would like to help fix this, click the green button below, and thanks in advance!",
                                        )}
                                    </div>

                                    <a className="btn success" href="https://translate.online-go.com/">
                                        {_("I'll help translate!")}
                                    </a>

                                    <button
                                        className="btn xs never-show-this-message-button"
                                        onClick={this.neverShowTranslationDialog}
                                    >
                                        {_("Never show this message")}
                                    </button>
                                </Card>
                            )}

                            <h3>
                                <Link to="/tournaments">
                                    <i className="fa fa-trophy"></i> {_("Tournaments")}
                                </Link>
                            </h3>
                            <TournamentList />

                            <h3>
                                <Link to="/ladders">
                                    <i className="fa fa-list-ol"></i> {_("Ladders")}
                                </Link>
                            </h3>
                            <LadderList />

                            <h3>
                                <Link to="/groups">
                                    <i className="fa fa-users"></i> {_("Groups")}
                                </Link>
                            </h3>
                            <GroupList />

                            <h3>
                                <Link to="/chat">
                                    <i className="fa fa-comment-o"></i> {_("Chat with friends")}
                                </Link>
                            </h3>
                            <FriendList />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    dismissTranslationDialog = (ev) => {
        preferences.set("translation-dialog-dismissed", Date.now());
        this.setState({
            show_translation_dialog: false,
        });
    };

    neverShowTranslationDialog = (ev) => {
        preferences.set("translation-dialog-never-show", true);
        this.setState({
            show_translation_dialog: false,
        });
    };
}

export class GroupList extends React.PureComponent<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            invitations: [],
            resolved: false,
        };
    }

    componentDidMount() {
        data.watch(cached.groups, this.updateGroups);
        data.watch(cached.group_invitations, this.updateGroupInvitations);
    }

    updateGroups = (groups) => {
        this.setState({ groups: groups });
    };
    updateGroupInvitations = (invitations) => {
        this.setState({ invitations: invitations });
    };

    componentWillUnmount() {
        data.unwatch(cached.groups, this.updateGroups);
        data.unwatch(cached.group_invitations, this.updateGroupInvitations);
    }
    acceptInvite(invite) {
        post("me/groups/invitations", { request_id: invite.id })
            .then(() => 0)
            .catch(() => 0);
    }
    rejectInvite(invite) {
        post("me/groups/invitations", { request_id: invite.id, delete: true })
            .then(() => 0)
            .catch(() => 0);
    }
    render() {
        return (
            <div className="Overview-GroupList">
                {this.state.invitations.map((invite) => (
                    <div className="invite" key={invite.id}>
                        <i className="fa fa-times" onClick={this.rejectInvite.bind(this, invite)} />
                        <i className="fa fa-check" onClick={this.acceptInvite.bind(this, invite)} />
                        <Link key={invite.group.id} to={`/group/${invite.group.id}`}>
                            <img src={invite.group.icon} /> {invite.group.name}
                        </Link>
                    </div>
                ))}
                {this.state.groups.map((group) => (
                    <Link key={group.id} to={`/group/${group.id}`}>
                        <img src={group.icon} /> {group.name}
                    </Link>
                ))}
            </div>
        );
    }
}
export class TournamentList extends React.PureComponent<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            my_tournaments: [],
            open_tournaments: [],
            resolved: false,
        };
    }

    componentDidMount() {
        data.watch(cached.active_tournaments, this.update);
        /*
        get("tournaments", {started__isnull: true, group__isnull: true, ordering: "name"}).then((res) => {
            this.setState({"open_tournaments": res.results, resolved: true});
        }).catch((err) => {
            this.setState({resolved: true});
            console.info("Caught", err);
        });
        */
    }
    update = (tournaments) => {
        this.setState({ my_tournaments: tournaments });
    };

    componentWillUnmount() {
        abort_requests_in_flight("me/tournaments");
        data.unwatch(cached.active_tournaments, this.update);
    }
    render() {
        return (
            <div className="Overview-TournamentList">
                {this.state.my_tournaments.map((tournament) => (
                    <Link key={tournament.id} to={`/tournament/${tournament.id}`}>
                        <img src={tournament.icon} /> {tournament.name}
                    </Link>
                ))}
                {(this.state.my_tournaments.length === 0 || null) && null}
            </div>
        );
    }
}
export class LadderList extends React.PureComponent<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            ladders: [],
            resolved: false,
        };
    }

    componentDidMount() {
        data.watch(cached.ladders, this.update);
    }

    update = (ladders) => {
        this.setState({ ladders: ladders });
    };

    componentWillUnmount() {
        abort_requests_in_flight("me/ladders");
        data.unwatch(cached.ladders, this.update);
    }
    render() {
        return (
            <div className="Overview-LadderList">
                {this.state.ladders.map((ladder) => (
                    <Link key={ladder.id} to={`/ladder/${ladder.id}`}>
                        <span className="ladder-rank">#{ladder.player_rank}</span> {ladder.name}
                    </Link>
                ))}
                {(this.state.ladders.length === 0 || null) && null}
            </div>
        );
    }
}
