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
import { Link } from "react-router-dom";
import * as DynamicHelp from "react-dynamic-help";

import { _ } from "translate";

import * as data from "data";
import * as preferences from "preferences";
import cached from "cached";

import { post, get, abort_requests_in_flight } from "requests";

import { GameList } from "GameList";
import { errorAlerter, ignore } from "misc";
import { DismissableNotification } from "DismissableNotification";
import { ChallengesList } from "./ChallengesList";
import { InviteList } from "./InviteList";
import { notification_manager } from "Notifications";
import { ActiveAnnouncements } from "Announcements";
import { ActiveTournamentList, Group } from "src/lib/types";
import { DismissableMessages } from "DismissableMessages";
import { EmailBanner } from "EmailBanner";

declare let ogs_missing_translation_count: number;

type UserType = rest_api.UserConfig;
type ActiveGameType = rest_api.players.full.Game;

interface OverviewState {
    boards_to_move_on?: number;
    user?: UserType;
    resolved: boolean;
    overview: { active_games: Array<ActiveGameType> };
    show_translation_dialog: boolean;
}
export class EXV6Overview extends React.Component<{}, OverviewState> {
    private static defaultTitle = "OGS";

    static contextType = DynamicHelp.Api;
    declare context: React.ContextType<typeof DynamicHelp.Api>;

    constructor(props: {}) {
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
        const count = this.state.boards_to_move_on ? `(${this.state.boards_to_move_on}) ` : "";
        window.document.title = `${count}${EXV6Overview.defaultTitle}`;
    }

    setBoardsToMoveOn = (boardsToMoveOn?: number) => {
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
        if (window.location.hash.includes("challenge-link")) {
            this.context.triggerFlow("guest-user-intro-rengo");
            this.context.triggerFlow("guest-user-intro-exv6");
        }
    }

    updateUser = (user: UserType) => {
        this.setState({ user: user });
    };

    refresh(): Promise<void> {
        abort_requests_in_flight("ui/overview");
        return get("ui/overview")
            .then((overview: OverviewState["overview"]) => {
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
        window.document.title = EXV6Overview.defaultTitle;
        data.unwatch("config.user", this.updateUser);
    }

    render() {
        const user = this.state.user;

        return (
            <div id="Overview-Container">
                <div id="Overview">
                    <div className="left">
                        <DismissableMessages />
                        <EmailBanner />
                        <ActiveAnnouncements />
                        <ChallengesList onAccept={() => this.refresh()} />
                        <InviteList />

                        {((user && user.provisional) || null) && (
                            <DismissableNotification
                                className="learn-how-to-play"
                                dismissedKey="learn-how-to-play"
                            >
                                <Link to="/learn-to-play-go">
                                    {_("New to Go? Click here to learn how to play!")}
                                </Link>
                            </DismissableNotification>
                        )}

                        {((this.state.resolved && this.state.overview.active_games.length) ||
                            null) && (
                            <div className="active-games">
                                <h2>
                                    {_("Active Games")} ({this.state.overview.active_games.length})
                                </h2>
                                <GameList
                                    list={this.state.overview.active_games}
                                    player={user}
                                    emptyMessage={_(
                                        'You\'re not currently playing any games. Start a new game with the "Create a new game" or "Look for open games" buttons above.',
                                    )}
                                />
                            </div>
                        )}
                        {((this.state.resolved && this.state.overview.active_games.length === 0) ||
                            null) && (
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
                </div>
            </div>
        );
    }

    dismissTranslationDialog = () => {
        preferences.set("translation-dialog-dismissed", Date.now());
        this.setState({
            show_translation_dialog: false,
        });
    };

    neverShowTranslationDialog = () => {
        preferences.set("translation-dialog-never-show", true);
        this.setState({
            show_translation_dialog: false,
        });
    };
}

type InvitationType = rest_api.me.Invitation;
interface GroupState {
    groups: Group[];
    invitations: InvitationType[];
}
export class GroupList extends React.PureComponent<{}, GroupState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            groups: [],
            invitations: [],
        };
    }

    componentDidMount() {
        data.watch(cached.groups, this.updateGroups);
        data.watch(cached.group_invitations, this.updateGroupInvitations);
    }

    updateGroups = (groups: Group[]) => {
        this.setState({ groups: groups });
    };
    updateGroupInvitations = (invitations: InvitationType[]) => {
        this.setState({ invitations: invitations });
    };

    componentWillUnmount() {
        data.unwatch(cached.groups, this.updateGroups);
        data.unwatch(cached.group_invitations, this.updateGroupInvitations);
    }
    acceptInvite(invite: { id: number }) {
        post("me/groups/invitations", { request_id: invite.id })
            .then(() => 0)
            .catch(() => 0);
    }
    rejectInvite(invite: { id: number }) {
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

interface TournamentListState {
    my_tournaments: ActiveTournamentList;
}

export class TournamentList extends React.PureComponent<{}, TournamentListState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            my_tournaments: [],
        };
    }

    componentDidMount() {
        data.watch(cached.active_tournaments, this.update);
    }
    update = (tournaments: ActiveTournamentList) => {
        this.setState({ my_tournaments: tournaments });
    };

    componentWillUnmount() {
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
            </div>
        );
    }
}

type LadderType = rest_api.me.Ladder;
interface LadderListState {
    ladders: LadderType[];
}

export class LadderList extends React.PureComponent<{}, LadderListState> {
    constructor(props: {}) {
        super(props);
        this.state = { ladders: [] };
    }

    componentDidMount() {
        data.watch(cached.ladders, this.update);
    }

    update = (ladders: LadderType[]) => {
        this.setState({ ladders: ladders });
    };

    componentWillUnmount() {
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
