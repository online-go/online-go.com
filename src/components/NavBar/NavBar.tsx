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
import { browserHistory } from "ogsHistory";

import * as data from "data";

import { _, current_language, languages } from "translate";
import { PlayerIcon } from "PlayerIcon";
import { post, get, abort_requests_in_flight } from "requests";
import { TypedEventEmitter } from "TypedEventEmitter";
import {
    acceptGroupInvite,
    acceptTournamentInvite,
    rejectGroupInvite,
    rejectTournamentInvite,
    ignore,
    errorLogger,
} from "misc";
import { LineText } from "misc-ui";
import { challenge, createDemoBoard } from "ChallengeModal";
import { openNewGameModal } from "NewGameModal";
import { KBShortcut } from "KBShortcut";
import { LanguagePicker } from "LanguagePicker";
import { GobanThemePicker } from "GobanThemePicker";
import { IncidentReportTracker } from "IncidentReportTracker";
import { NotificationIndicator, TurnIndicator, NotificationList } from "Notifications";
import { TournamentIndicator } from "Announcements";
import { FriendIndicator } from "FriendList";
import { Player } from "Player";
import * as player_cache from "player_cache";
import * as preferences from "preferences";
import cached from "cached";
import { ChatIndicator } from "Chat";

const body = $(document.body);

function _update_theme(theme) {
    if (body.hasClass(theme)) {
        return;
    }
    body.removeClass("light dark accessible");
    body.addClass(theme);
}

function previewTheme(theme) {
    _update_theme(theme);
}
function exitThemePreview() {
    _update_theme(data.get("theme"));
}

function setTheme(theme) {
    data.set("theme", theme, data.Replication.REMOTE_OVERWRITES_LOCAL); // causes _update_theme to be called via the data.watch() in constructor
}

function toggleTheme() {
    if (data.get("theme") === "dark") {
        setTheme("light");
    } else if (data.get("theme") === "light") {
        setTheme("accessible");
    } else {
        setTheme("dark");
    }
}
const setThemeLight = setTheme.bind(null, "light");
const setThemeDark = setTheme.bind(null, "dark");
const setThemeAccessible = setTheme.bind(null, "accessible");

export function logout() {
    get("/api/v0/logout")
        .then((config) => {
            data.set(cached.config, config);
            window.location.href = "/";
        })
        .catch(errorLogger);
}

export class NavBar extends React.PureComponent<{}, any> {
    refs: {
        input: any;
        notification_list: NotificationList;
        omnisearch_input;
    };

    constructor(props) {
        super(props);
        this.state = {
            user: data.get("config.user"),
            left_nav_active: false,
            right_nav_active: false,
            tournament_invites: [],
            tournaments: [],
            ladders: [],
            group_invites: [],
            groups: [],

            omnisearch_string: "",
            omnisearch_loading: false,
            omnisearch_sitemap: [],
            omnisearch_players: [],
            omnisearch_groups: [],
            omnisearch_tournaments: [],

            path: window.location.pathname,
        };

        this.closeNavbar = this.closeNavbar.bind(this);
        this.toggleLeftNav = this.toggleLeftNav.bind(this);
        this.toggleRightNav = this.toggleRightNav.bind(this);
        this.toggleDebug = this.toggleDebug.bind(this);

        data.watch("theme", _update_theme); // here we are watching in case 'theme' is updated by the remote-storage update mechanism, which doesn't call setTheme()
    }

    UNSAFE_componentWillMount() {
        data.watch("config.user", (user) => this.setState({ user: user }));

        browserHistory.listen((location) => {
            this.closeNavbar();
            this.setState({ path: location.pathname });
        });
    }

    closeNavbar() {
        this.setState({
            left_nav_active: false,
            right_nav_active: false,
        });
        this.clearOmnisearch();
    }

    toggleLeftNav(ev?) {
        if (!this.state.left_nav_active) {
            if (ev && ev.type === "keydown") {
                this.refs.omnisearch_input.focus();
            }
        } else {
            this.clearOmnisearch();
        }
        this.setState({ left_nav_active: !this.state.left_nav_active });
    }
    toggleRightNav() {
        if (this.state.right_nav_active === false) {
            this.refs.notification_list.markAllAsRead();
        }
        this.setState({ right_nav_active: !this.state.right_nav_active });
    }

    toggleDebug() {
        data.set("debug", !data.get("debug", false));
        window.location.reload();
    }
    toggleAdOverride() {
        data.set("ad-override", !data.get("ad-override", false));
        window.location.reload();
    }
    newGame = () => {
        this.closeNavbar();
        openNewGameModal();
    };
    newDemo = () => {
        this.closeNavbar();
        createDemoBoard();
    };

    clearOmnisearch() {
        this.abortOmnisearch();
        this.setState({
            omnisearch_string: "",
            omnisearch_players: [],
            omnisearch_groups: [],
            omnisearch_tournaments: [],
            omnisearch_sitemap: [],
        });
        $(this.refs.omnisearch_input).blur();
    }
    abortOmnisearch() {
        abort_requests_in_flight("ui/omniSearch");
    }
    updateOmnisearch = (ev) => {
        try {
            const q = ev.target.value || "";

            if (q.trim() !== this.state.omnisearch_string.trim()) {
                this.abortOmnisearch();
            } else {
                this.setState({ omnisearch_string: q });
                return;
            }
            if (q === "") {
                this.setState({
                    omnisearch_string: q,
                    sitemap: [],
                });
            } else {
                this.setState({
                    omnisearch_loading: true,
                    omnisearch_string: q,
                    omnisearch_sitemap: match_sitemap(q),
                    omnisearch_players: [],
                    omnisearch_tournaments: [],
                    omnisearch_groups: [],
                });

                get("ui/omniSearch", { q: q.trim() })
                    .then((res) => {
                        player_cache.update(res.players);
                        this.setState({
                            omnisearch_loading: false,
                            omnisearch_players: res.players,
                            omnisearch_tournaments: res.tournaments,
                            omnisearch_groups: res.groups,
                        });
                    })
                    .catch(ignore);
            }
        } catch (e) {
            console.log(e);
            // ignore
        }
    };

    onOmnisearchKeyPress = (ev) => {
        try {
            if (ev.keyCode === 27) {
                this.clearOmnisearch();
            } else if (ev.keyCode === 192) {
                /* grav */
                if (this.state.omnisearch_string === "") {
                    this.clearOmnisearch();
                }
            }
        } catch (e) {
            console.log(e);
            // ignore
        }
    };

    render() {
        const user = this.state.user.anonymous ? null : this.state.user;
        const anon = this.state.user.anonymous;
        const tournament_invites = this.state.tournament_invites;
        const tournaments = this.state.tournaments;
        const ladders = this.state.ladders;
        const group_invites = this.state.group_invites;
        const groups = this.state.groups;

        const show_debug = data.get("user").is_superuser;
        const debug = data.get("debug", false);
        const no_results = false;

        let omnisearch_searching = false;
        try {
            omnisearch_searching = !!this.refs.omnisearch_input.value.trim();
        } catch (e) {
            // ignore
        }

        const omnisearch_result_count =
            this.state.omnisearch_players.length +
            this.state.omnisearch_tournaments.length +
            this.state.omnisearch_groups.length +
            this.state.omnisearch_sitemap.length;

        return (
            <div id="NavBar" className={this.state.left_nav_active || this.state.right_nav_active ? "active" : ""}>
                <KBShortcut shortcut="`" action={this.toggleLeftNav} />
                <KBShortcut shortcut="alt-`" action={this.toggleRightNav} />
                <KBShortcut shortcut="shift-`" action={this.toggleRightNav} />
                <KBShortcut shortcut="escape" action={this.closeNavbar} />

                <span className="ogs-nav-logo-container" onClick={this.toggleLeftNav}>
                    <i className="fa fa-bars" />
                    <span className="ogs-nav-logo" />
                </span>

                <section className="left">
                    {(!this.state.user.anonymous || null) && <Link to="/overview">{_("Home")}</Link>}
                    {user && <Link to="/play">{_("Play")}</Link>}
                    <Link to="/observe-games">{_("Games")}</Link>
                    <Link to="/chat">{_("Chat")}</Link>
                    <Link to="/puzzles">{_("Puzzles")}</Link>
                    <Link to="/joseki">{_("Joseki")}</Link>
                    <Link to="/tournaments">{_("Tournaments")}</Link>
                    <Link to="/ladders">{_("Ladders")}</Link>
                    <Link to="/groups">{_("Groups")}</Link>
                    <Link to="/leaderboards">{_("Leaderboards")}</Link>
                    <a target="_blank" href="https://forums.online-go.com/" rel="noopener">
                        {_("Forums")}
                    </a>
                    {user && <Link to={`/user/view/${user.id}`}>{_("Profile")}</Link>}
                    {/*
                <a href='https://ogs.readme.io/'>{_("Help")}</a>
                */}
                </section>

                {this.state.user.anonymous ? (
                    <section className="right">
                        <i className="fa fa-adjust" onClick={toggleTheme} />
                        <LanguagePicker />
                        <Link className="sign-in" to={"/sign-in#" + this.state.path}>
                            {_("Sign In")}
                        </Link>
                    </section>
                ) : (
                    <section className="right">
                        {!preferences.get("hide-incident-reports") && <IncidentReportTracker />}
                        {preferences.get("show-tournament-indicator") && <TournamentIndicator />}
                        <ChatIndicator />
                        <FriendIndicator />
                        <TurnIndicator />
                        <span className="icon-container" onClick={this.toggleRightNav}>
                            <NotificationIndicator />
                            <PlayerIcon user={this.state.user} size="64" />
                            <i className="fa fa-caret-down" />
                        </span>
                    </section>
                )}

                {/*

                <Link to='/'>Incident Reports</Link>
                <Link to='/'>Tournament Icon</Link>
                <Link to='/'>Friends Online</Link>
                <Link to='/'>Search</Link>
                <Link to='/'>Move Indicator</Link>
                <Link to='/'>Notification</Link>

            */}

                <div
                    className={
                        "nav-menu-modal-backdrop " +
                        (this.state.left_nav_active || this.state.right_nav_active ? "active" : "")
                    }
                    onClick={this.closeNavbar}
                />

                {/* Right Nav */}
                {user && (
                    <div className={"rightnav " + (this.state.right_nav_active ? "active" : "")}>
                        <div style={{ textAlign: "right" }}>
                            <Player user={user} disable-cache-update />
                        </div>

                        <NotificationList ref="notification_list" />

                        <LineText>{_("Theme")}</LineText>

                        <div className="theme-selectors">
                            <button className="theme-button light" onClick={setThemeLight}>
                                <i className="fa fa-sun-o" />
                            </button>
                            <button className="theme-button dark" onClick={setThemeDark}>
                                <i className="fa fa-moon-o" />
                            </button>
                            <button className="theme-button accessible" onClick={setThemeAccessible}>
                                <i className="fa fa-eye" />
                            </button>
                        </div>

                        <div className="theme-selectors">
                            <GobanThemePicker />
                        </div>

                        {(show_debug || null) && <LineText>{_("Debug")}</LineText>}
                        {(show_debug || null) && (
                            <div style={{ textAlign: "center" }}>
                                <button className={debug ? "sm info" : "sm"} onClick={this.toggleDebug}>
                                    {debug ? "Turn debugging off" : "Turn debugging on"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Left Nav */}
                <div className={"leftnav " + (this.state.left_nav_active ? "active" : "")}>
                    <div className="search-row">
                        <i className="fa fa-search" />
                        <input
                            ref="omnisearch_input"
                            type="text"
                            className="OmniSearch-input"
                            value={this.state.omnisearch_string}
                            onKeyDown={this.onOmnisearchKeyPress}
                            onChange={this.updateOmnisearch}
                            placeholder={_("Search")}
                        />
                    </div>
                    {(!omnisearch_searching || null) && (
                        <ul id="items">
                            {user && (
                                <li>
                                    <Link to="/overview">
                                        <i className="fa fa-home"></i>
                                        {_("Home")}
                                    </Link>
                                </li>
                            )}
                            {anon && (
                                <li>
                                    <Link to="/sign-in">
                                        <i className="fa fa-sign-in"></i>
                                        {_("Sign In")}
                                    </Link>
                                </li>
                            )}
                            {user && (
                                <li>
                                    <Link to="/play">
                                        <i className="fa ogs-goban"></i>
                                        {_("Play")}
                                    </Link>
                                </li>
                            )}
                            {/* user && <li><span className="fakelink" onClick={this.newGame}><i className="fa fa-plus"></i>{_("New Game")}</span></li> */}
                            {user && (
                                <li>
                                    <span className="fakelink" onClick={this.newDemo}>
                                        <i className="fa fa-plus"></i>
                                        {_("Demo Board")}
                                    </span>
                                </li>
                            )}
                            <li>
                                <Link to="/observe-games">
                                    <i className="fa fa-eye"></i>
                                    {_("Games")}
                                </Link>
                            </li>
                            <li>
                                <Link to="/leaderboards">
                                    <i className="fa fa-list-ol"></i>
                                    {_("Leaderboards")}
                                </Link>
                            </li>
                            <li>
                                <Link to="/chat">
                                    <i className="fa fa-comment-o"></i>
                                    {_("Chat")}
                                </Link>
                            </li>
                            <li className="divider"></li>
                            {/*
                        <li ng-if='::global_user'><Link to='/mail'><i className='fa fa-envelope'></i>{_("Mail")}
                            <ogs-on-ui-push event='mail-update' action='mail_unread_count = data["unread-count"]'></ogs-on-ui-push>
                            <span ng-if='mail_unread_count > 0' style='font-weight: bold; display: inline;'> ({mail_unread_count})</span>
                        </Link></li>
                        */}

                            <li>
                                <Link to="/learn-to-play-go">
                                    <i className="fa fa-graduation-cap"></i>
                                    {_("Learn to play Go")}
                                </Link>
                            </li>
                            <li>
                                <Link to="/puzzles">
                                    <i className="fa fa-puzzle-piece"></i>
                                    {_("Puzzles")}
                                </Link>
                            </li>
                            <li>
                                <Link to="/joseki">
                                    <i className="fa fa-sitemap"></i>
                                    {_("Joseki")}
                                </Link>
                            </li>
                            {/* <li><Link to='/library'><i className='fa fa-university'></i>{_("Server Library")}</Link></li> */}
                            {user && (
                                <li>
                                    <Link to={`/library/${user.id}`}>
                                        <i className="fa fa-book"></i>
                                        {_("SGF Library")}
                                    </Link>
                                </li>
                            )}
                            {/* {user && <li><Link to='/library/game-history'><i className='fa fa-archive'></i>{_("Game History")}</Link></li>} */}

                            {/* <li className='divider'></li> */}

                            <li>
                                <Link to="/tournaments">
                                    <i className="fa fa-trophy"></i>
                                    {_("Tournaments")}
                                </Link>
                            </li>
                            <li>
                                <Link to="/ladders">
                                    <i className="fa fa-list-ol"></i>
                                    {_("Ladders")}
                                </Link>
                            </li>
                            <li>
                                <Link to="/groups">
                                    <i className="fa fa-users"></i>
                                    {_("Groups")}
                                </Link>
                            </li>
                            <li>
                                <a href="http://forums.online-go.com/" target="_blank">
                                    <i className="fa fa-comments"></i>
                                    {_("Forums")}
                                </a>
                            </li>
                            <li>
                                <Link to="/docs/about">
                                    <i className="fa fa-info-circle"></i>
                                    {_("About")}
                                </Link>
                            </li>
                            <li>
                                <a href="https://github.com/online-go/online-go.com/wiki">
                                    <i className="fa fa-question-circle"></i>
                                    {_("Documentation & FAQ")}
                                </a>
                            </li>
                            <li>
                                <Link to="/docs/other-go-resources">
                                    <i className="fa fa-link"></i>
                                    {_("Other Go Resources")}
                                </Link>
                            </li>

                            {user && <li className="divider"></li>}
                            <li>
                                <Link to="/user/supporter">
                                    <i className="fa fa-star"></i>
                                    {_("Support OGS")}
                                </Link>
                            </li>
                            {user && (
                                <li>
                                    <Link to={`/user/view/${user.id}`}>
                                        <i className="fa fa-user"></i>
                                        {_("Profile")}
                                    </Link>
                                </li>
                            )}
                            {user && (
                                <li>
                                    <Link to="/user/settings">
                                        <i className="fa fa-gear"></i>
                                        {_("Settings")}
                                    </Link>
                                </li>
                            )}
                            {user && (
                                <li>
                                    <span className="fakelink" onClick={logout}>
                                        <i className="fa fa-sign-out"></i>
                                        {_("Logout")}
                                    </span>
                                </li>
                            )}

                            {user && (user.is_moderator || user.is_announcer) && <li className="divider"></li>}
                            {user && user.is_moderator && (
                                <li>
                                    <Link className="admin-link" to="/moderator">
                                        <i className="fa fa-gavel"></i>
                                        {_("Moderator Center")}
                                    </Link>
                                </li>
                            )}
                            {user && (user.is_moderator || user.is_announcer) && (
                                <li>
                                    <Link className="admin-link" to="/announcement-center">
                                        <i className="fa fa-bullhorn"></i>
                                        {_("Announcement Center")}
                                    </Link>
                                </li>
                            )}
                            {user && user.is_superuser && (
                                <li>
                                    <Link className="admin-link" to="/admin">
                                        <i className="fa fa-wrench"></i> Admin
                                    </Link>
                                </li>
                            )}

                            {(tournament_invites.length || tournaments.length || false) && (
                                <li className="divider"></li>
                            )}
                            {(tournament_invites.length || tournaments.length || false) && (
                                <ul>
                                    <li>
                                        <h5>{_("Tournaments")}</h5>
                                    </li>
                                    {tournament_invites.map((ti, idx) => (
                                        <li key={idx}>
                                            <img src={ti.icon} height="15" width="15" />
                                            <i
                                                className="fa fa-check accept clickable"
                                                onClick={() => acceptTournamentInvite(ti.id)}
                                            ></i>
                                            <i
                                                className="fa fa-times reject clickable"
                                                onClick={() => rejectTournamentInvite(ti.id)}
                                            ></i>
                                            <Link to={`/tournament/${ti.tournament_id}/`} title={ti.message}>
                                                {" "}
                                                {ti.name}
                                            </Link>
                                        </li>
                                    ))}
                                    {tournaments.map((tournament, idx) => (
                                        <li key={idx}>
                                            <Link to={`/tournament/${tournament.id}/`}>
                                                <img src={tournament.icon} height="15" width="15" /> {tournament.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {(ladders.length || false) && <li className="divider"></li>}
                            {(ladders.length || false) && (
                                <ul>
                                    <li>
                                        <h5>{_("Ladders")}</h5>
                                    </li>
                                    {ladders.map((ladder, idx) => (
                                        <li key={idx} className="group">
                                            <Link to={`/ladder/${ladder.id}/`}>
                                                #{ladder.rank} <img src={ladder.icon} height="15" width="15" />{" "}
                                                {_(ladder.name)}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {(group_invites.length || groups.length || false) && <li className="divider"></li>}
                            {(group_invites.length || groups.length || false) && (
                                <ul>
                                    <li>
                                        <h5>{_("Groups")}</h5>
                                    </li>

                                    {group_invites.map((gi, idx) => (
                                        <li key={idx} className="invite">
                                            <img src={gi.icon} height="15" width="15" />
                                            <i
                                                className="fa fa-check accept clickable"
                                                onClick={() => acceptGroupInvite(gi.id)}
                                            ></i>
                                            <i
                                                className="fa fa-times reject clickable"
                                                onClick={() => rejectGroupInvite(gi.id)}
                                            ></i>
                                            <Link to={`/group/${gi.group_id}/`}> {gi.name}</Link>
                                        </li>
                                    ))}
                                    {groups.map((group, idx) => (
                                        <li key={idx} className="group">
                                            <Link to={`/group/${group.id}/`}>
                                                <img src={group.icon} height="15" width="15" /> {group.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </ul>
                    )}
                    {(omnisearch_searching || null) && (
                        <div className="OmniSearch-results">
                            {(this.state.omnisearch_sitemap.length || null) && (
                                <div>
                                    <h3>{_("Site")}</h3>
                                    {this.state.omnisearch_sitemap.map((e, idx) => (
                                        <div key={idx}>
                                            {e?.[1]?.[0] === "/" ? (
                                                <Link to={e[1]}>{e[0]}</Link>
                                            ) : (
                                                <a href={e[1]} target="_blank">
                                                    {e[0]}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(this.state.omnisearch_loading || null) && (
                                <div className="loading">{_("Loading...")}</div>
                            )}
                            {((!this.state.omnisearch_loading && omnisearch_result_count === 0) || null) && (
                                <div className="no-results">
                                    {_("No results.") /* translators: No search results */}
                                </div>
                            )}

                            {(this.state.omnisearch_players.length || null) && (
                                <div>
                                    <h3>{_("Players")}</h3>
                                    {this.state.omnisearch_players.map((e, idx) => (
                                        <div key={idx}>
                                            <Player user={e} icon rank />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(this.state.omnisearch_groups.length || null) && (
                                <div>
                                    <h3>{_("Groups")}</h3>
                                    {this.state.omnisearch_groups.map((e, idx) => (
                                        <div key={idx}>
                                            <img src={e.icon} /> <Link to={`/group/${e.id}`}>{e.name}</Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(this.state.omnisearch_tournaments.length || null) && (
                                <div>
                                    <h3>{_("Tournaments")}</h3>
                                    {this.state.omnisearch_tournaments.map((e, idx) => (
                                        <div key={idx}>
                                            <img src={e.icon} /> <Link to={`/tournament/${e.id}`}>{e.name}</Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

declare let ogs_version;
const omnisearch_sitemap = {};

omnisearch_sitemap[_("Home")] = [_("Home"), "/overview"];
omnisearch_sitemap[_("Play")] = [_("Play"), "/play"];
omnisearch_sitemap[_("Games")] = [_("Games"), "/observe-games"];
omnisearch_sitemap[_("Players")] = [_("Players"), "/user/list"];
omnisearch_sitemap[_("Tournaments")] = [_("Tournaments"), "/tournaments"];
omnisearch_sitemap[_("Ladders")] = [_("Ladders"), "/ladders"];
omnisearch_sitemap[_("Developers")] = [_("Developers & API Access"), "/developer"];
omnisearch_sitemap[_("API Access")] = [_("Developers & API Access"), "/developer"];
omnisearch_sitemap[_("API")] = [_("Developers & API Access"), "/developer"];
omnisearch_sitemap[_("Mail")] = [_("Mail"), "/mail"];
omnisearch_sitemap[_("Chat")] = [_("Chat & Lobby"), "/chat"];
omnisearch_sitemap[_("Lobby")] = [_("Chat & Lobby"), "/chat"];
omnisearch_sitemap[_("Settings")] = [_("Settings"), "/user/settings"];
omnisearch_sitemap[_("Configuration")] = [_("Settings"), "/user/settings"];
omnisearch_sitemap[_("Options")] = [_("Settings"), "/user/settings"];
omnisearch_sitemap[_("Support OGS")] = [_("Support OGS"), "/user/supporter"];
omnisearch_sitemap[_("Donate")] = [_("Donations"), "/user/supporter"];
omnisearch_sitemap[_("Money")] = [_("Donations"), "/user/supporter"];
omnisearch_sitemap[_("Contributing")] = [_("Contributing"), "/user/supporter"];
omnisearch_sitemap[_("Price")] = [_("Donations"), "/user/supporter"];
omnisearch_sitemap[_("Learn to play Go")] = [_("Learn to play Go"), "/learn-to-play-go"];
omnisearch_sitemap[_("Learn")] = [_("Learn to play Go"), "/learn-to-play-go"];
omnisearch_sitemap[_("Tutorial")] = [_("Learn to play Go"), "/learn-to-play-go"];
omnisearch_sitemap[_("How to play go")] = [_("Learn to play Go"), "/learn-to-play-go"];
omnisearch_sitemap[_("FAQ")] = [_("F.A.Q."), "https://forums.online-go.com/c/faq"];
omnisearch_sitemap[_("F.A.Q.")] = [_("F.A.Q."), "https://forums.online-go.com/c/faq"];
omnisearch_sitemap[_("Help")] = [_("F.A.Q."), "https://forums.online-go.com/c/faq"];
omnisearch_sitemap[_("Changelog")] = [_("Changelog"), "docs/changelog"];
omnisearch_sitemap[_("About")] = [_("About"), "/docs/about"];
omnisearch_sitemap[_("Refund Policy")] = [_("Refund Policy"), "/docs/refund-policy"];
omnisearch_sitemap[_("Terms of Service")] = [_("Terms of Service"), "/docs/terms-of-service"];
omnisearch_sitemap["ToS"] = [_("Terms of Service"), "/docs/terms-of-service"];
omnisearch_sitemap[_("Privacy Policy")] = [_("Privacy Policy"), "/docs/privacy-policy"];
omnisearch_sitemap[_("Contact Information")] = [_("Contact Information"), "/docs/contact-information"];

function match_sitemap(q) {
    q = q.trim().toLowerCase();

    const res = [];

    for (const k in omnisearch_sitemap) {
        if (q.length >= Math.min(5, k.length) && k.toLowerCase().indexOf(q) === 0) {
            res.push(omnisearch_sitemap[k]);
        }
    }
    return res;
}
