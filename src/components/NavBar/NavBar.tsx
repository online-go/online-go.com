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
import { browserHistory } from "ogsHistory";

import * as data from "data";

import { _ } from "translate";
import { PlayerIcon } from "PlayerIcon";
import { get, abort_requests_in_flight } from "requests";
import { ignore } from "misc";
import { LineText } from "misc-ui";
import { createDemoBoard } from "ChallengeModal";
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
import { ChatIndicator } from "Chat";
import { logout } from "auth";

const body = $(document.body);

function _update_theme(theme: string) {
    if (body.hasClass(theme)) {
        return;
    }
    body.removeClass("light dark accessible");
    body.addClass(theme);
}

function setTheme(theme: string) {
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

export function NavBar(): JSX.Element {
    const omnisearch_input_ref = React.useRef<HTMLInputElement>();
    const notification_list = React.useRef<NotificationList>();

    const [user, setUser] = React.useState(data.get("config.user"));
    const [path, setPath] = React.useState(window.location.pathname);
    const [left_nav_active, setLeftNavActive] = React.useState(false);
    const [right_nav_active, setRightNavActive] = React.useState(false);
    const [omnisearch_string, setOmnisearchString] = React.useState("");
    const [omnisearch_loading, setOmnisearchLoading] = React.useState(false);
    const [omnisearch_sitemap, setOmnisearchSitemap] = React.useState([]);
    const [omnisearch_players, setOmnisearchPlayers] = React.useState([]);
    const [omnisearch_groups, setOmnisearchGroups] = React.useState([]);
    const [omnisearch_tournaments, setOmnisearchTournaments] = React.useState([]);

    const clearOmnisearch = () => {
        abortOmnisearch();
        setOmnisearchString("");
        setOmnisearchPlayers([]);
        setOmnisearchGroups([]);
        setOmnisearchTournaments([]);
        setOmnisearchSitemap([]);

        $(omnisearch_input_ref.current).blur();
    };
    const abortOmnisearch = () => {
        abort_requests_in_flight("ui/omniSearch");
    };

    const closeNavbar = () => {
        setLeftNavActive(false);
        setRightNavActive(false);
        clearOmnisearch();
    };

    const toggleLeftNav = (ev?) => {
        if (!left_nav_active) {
            if (ev && ev.type === "keydown") {
                omnisearch_input_ref.current.focus();
            }
        } else {
            clearOmnisearch();
        }
        setLeftNavActive(!left_nav_active);
    };
    const toggleRightNav = () => {
        if (right_nav_active === false) {
            notification_list.current.markAllAsRead();
        }
        setRightNavActive(!right_nav_active);
    };

    const toggleDebug = () => {
        data.set("debug", !data.get("debug", false));
        window.location.reload();
    };
    const newDemo = () => {
        closeNavbar();
        createDemoBoard();
    };

    const updateOmnisearch = (ev) => {
        try {
            const q = ev.target.value || "";

            if (q.trim() !== omnisearch_string.trim()) {
                abortOmnisearch();
            } else {
                setOmnisearchString(q);
                return;
            }
            if (q === "") {
                setOmnisearchString(q);
                //setSitemap([]);
            } else {
                setOmnisearchLoading(true);
                setOmnisearchString(q);
                setOmnisearchSitemap(match_sitemap(q));
                setOmnisearchPlayers([]);
                setOmnisearchTournaments([]);
                setOmnisearchGroups([]);

                get("ui/omniSearch", { q: q.trim() })
                    .then((res) => {
                        player_cache.update(res.players);
                        setOmnisearchLoading(false);
                        setOmnisearchPlayers(res.players);
                        setOmnisearchTournaments(res.tournaments);
                        setOmnisearchGroups(res.groups);
                    })
                    .catch(ignore);
            }
        } catch (e) {
            console.log(e);
            // ignore
        }
    };

    const onOmnisearchKeyPress = (ev) => {
        try {
            if (ev.keyCode === 27) {
                clearOmnisearch();
            } else if (ev.keyCode === 192) {
                /* grav */
                if (omnisearch_string === "") {
                    clearOmnisearch();
                }
            }
        } catch (e) {
            console.log(e);
            // ignore
        }
    };

    React.useEffect(() => {
        data.watch("config.user", (user) => {
            setUser(user);
        });

        // here we are watching in case 'theme' is updated by the
        // remote-storage update mechanism, which doesn't call setTheme()
        data.watch("theme", _update_theme);

        browserHistory.listen((update) => {
            closeNavbar();
            setPath(update.location.pathname);
        });
    }, []);

    const valid_user = user.anonymous ? null : user;
    const anon = user.anonymous;

    const show_debug = data.get("user").is_superuser;
    const debug = data.get("debug", false);

    let omnisearch_searching = false;
    try {
        omnisearch_searching = !!omnisearch_input_ref.current.value.trim();
    } catch (e) {
        // ignore
    }

    const omnisearch_result_count =
        omnisearch_players.length +
        omnisearch_tournaments.length +
        omnisearch_groups.length +
        omnisearch_sitemap.length;

    return (
        <div id="NavBar" className={left_nav_active || right_nav_active ? "active" : ""}>
            <KBShortcut shortcut="`" action={toggleLeftNav} />
            <KBShortcut shortcut="alt-`" action={toggleRightNav} />
            <KBShortcut shortcut="shift-`" action={toggleRightNav} />
            <KBShortcut shortcut="escape" action={closeNavbar} />

            <span className="ogs-nav-logo-container" onClick={toggleLeftNav}>
                <i className="fa fa-bars" />
                <span className="ogs-nav-logo" />
            </span>

            <section className="left">
                {valid_user && <Link to="/overview">{_("Home")}</Link>}
                {valid_user && <Link to="/play">{_("Play")}</Link>}
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
                {valid_user && <Link to={`/user/view/${user.id}`}>{_("Profile")}</Link>}
                {/*
                <a href='https://ogs.readme.io/'>{_("Help")}</a>
                */}
            </section>

            {user.anonymous ? (
                <section className="right">
                    <i className="fa fa-adjust" onClick={toggleTheme} />
                    <LanguagePicker />
                    <Link className="sign-in" to={"/sign-in#" + path}>
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
                    <span className="icon-container" onClick={toggleRightNav}>
                        <NotificationIndicator />
                        <PlayerIcon user={user} size="64" />
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
                    (left_nav_active || right_nav_active ? "active" : "")
                }
                onClick={closeNavbar}
            />

            {/* Right Nav */}
            {valid_user && (
                <div className={"rightnav " + (right_nav_active ? "active" : "")}>
                    <NotificationList ref={notification_list} />

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
                            <button className={debug ? "sm info" : "sm"} onClick={toggleDebug}>
                                {debug ? "Turn debugging off" : "Turn debugging on"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Left Nav */}
            <div className={"leftnav " + (left_nav_active ? "active" : "")}>
                <div className="search-row">
                    <i className="fa fa-search" />
                    <input
                        ref={omnisearch_input_ref}
                        type="text"
                        className="OmniSearch-input"
                        value={omnisearch_string}
                        onKeyDown={onOmnisearchKeyPress}
                        onChange={updateOmnisearch}
                        placeholder={_("Search")}
                    />
                </div>
                {(!omnisearch_searching || null) && (
                    <ul id="items">
                        {valid_user && (
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
                        {valid_user && (
                            <li>
                                <Link to="/play">
                                    <i className="fa ogs-goban"></i>
                                    {_("Play")}
                                </Link>
                            </li>
                        )}
                        {valid_user && (
                            <li>
                                <span className="fakelink" onClick={newDemo}>
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
                        {valid_user && (
                            <li>
                                <Link to={`/library/${user.id}`}>
                                    <i className="fa fa-book"></i>
                                    {_("SGF Library")}
                                </Link>
                            </li>
                        )}
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

                        {valid_user && <li className="divider"></li>}
                        <li>
                            <Link to="/supporter">
                                <i className="fa fa-star"></i>
                                {_("Support OGS")}
                            </Link>
                        </li>
                        {valid_user && (
                            <li>
                                <Link to={`/user/view/${user.id}`}>
                                    <i className="fa fa-user"></i>
                                    {_("Profile")}
                                </Link>
                            </li>
                        )}
                        {valid_user && (
                            <li>
                                <Link to="/user/settings">
                                    <i className="fa fa-gear"></i>
                                    {_("Settings")}
                                </Link>
                            </li>
                        )}
                        {valid_user && (
                            <li>
                                <span className="fakelink" onClick={logout}>
                                    <i className="fa fa-sign-out"></i>
                                    {_("Logout")}
                                </span>
                            </li>
                        )}

                        {(user.is_moderator || user.is_announcer) && <li className="divider"></li>}
                        {user.is_moderator && (
                            <li>
                                <Link className="admin-link" to="/moderator">
                                    <i className="fa fa-gavel"></i>
                                    {_("Moderator Center")}
                                </Link>
                            </li>
                        )}
                        {user.is_moderator && (
                            <li>
                                <Link className="admin-link" to="/appeals-center">
                                    <i className="fa fa-gavel"></i>
                                    {_("Appeals Center")}
                                </Link>
                            </li>
                        )}
                        {user.is_moderator && (
                            <li>
                                <Link className="admin-link" to="/admin/firewall">
                                    <i className="fa fa-fire-extinguisher"></i>
                                    Firewall
                                </Link>
                            </li>
                        )}
                        {(user.is_moderator || user.is_announcer) && (
                            <li>
                                <Link className="admin-link" to="/announcement-center">
                                    <i className="fa fa-bullhorn"></i>
                                    {_("Announcement Center")}
                                </Link>
                            </li>
                        )}
                        {user.is_superuser && (
                            <li>
                                <Link className="admin-link" to="/admin">
                                    <i className="fa fa-wrench"></i> Admin
                                </Link>
                            </li>
                        )}
                    </ul>
                )}
                {(omnisearch_searching || null) && (
                    <div className="OmniSearch-results">
                        {(omnisearch_sitemap.length || null) && (
                            <div>
                                <h3>{_("Site")}</h3>
                                {omnisearch_sitemap.map((e, idx) => (
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
                        {(omnisearch_loading || null) && (
                            <div className="loading">{_("Loading...")}</div>
                        )}
                        {((!omnisearch_loading && omnisearch_result_count === 0) || null) && (
                            <div className="no-results">
                                {_("No results.") /* translators: No search results */}
                            </div>
                        )}

                        {(omnisearch_players.length || null) && (
                            <div>
                                <h3>{_("Players")}</h3>
                                {omnisearch_players.map((e, idx) => (
                                    <div key={idx}>
                                        <Player user={e} icon rank />
                                    </div>
                                ))}
                            </div>
                        )}
                        {(omnisearch_groups.length || null) && (
                            <div>
                                <h3>{_("Groups")}</h3>
                                {omnisearch_groups.map((e, idx) => (
                                    <div key={idx}>
                                        <img src={e.icon} />{" "}
                                        <Link to={`/group/${e.id}`}>{e.name}</Link>
                                    </div>
                                ))}
                            </div>
                        )}
                        {(omnisearch_tournaments.length || null) && (
                            <div>
                                <h3>{_("Tournaments")}</h3>
                                {omnisearch_tournaments.map((e, idx) => (
                                    <div key={idx}>
                                        <img src={e.icon} />{" "}
                                        <Link to={`/tournament/${e.id}`}>{e.name}</Link>
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
omnisearch_sitemap[_("Contact Information")] = [
    _("Contact Information"),
    "/docs/contact-information",
];

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
