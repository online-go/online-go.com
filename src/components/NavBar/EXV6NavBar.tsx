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
import { LineText } from "misc-ui";
import { createDemoBoard } from "ChallengeModal";
import { LanguagePicker } from "LanguagePicker";
import { GobanThemePicker } from "GobanThemePicker";
import { IncidentReportTracker } from "IncidentReportTracker";
import { NotificationList, notification_manager } from "Notifications";
import { TurnIndicator } from "TurnIndicator";
import { NotificationIndicator } from "NotificationIndicator";
import { TournamentIndicator } from "Announcements";
//import { FriendIndicator } from "FriendList";
import * as preferences from "preferences";
//import { ChatIndicator } from "Chat";
import { logout } from "auth";
import { useUser } from "hooks";
import { OmniSearch } from "./OmniSearch";

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

export function EXV6NavBar(): JSX.Element {
    const user = useUser();
    const [search, setSearch] = React.useState<string>("");
    const [path, setPath] = React.useState(window.location.pathname);
    const [right_nav_active, setRightNavActive] = React.useState(false);
    const [notifications_active, setNotificationsActive] = React.useState(false);

    const closeNavbar = () => {
        setRightNavActive(false);
        setNotificationsActive(false);
    };

    const toggleNotifications = () => {
        if (notifications_active === false) {
            notification_manager.event_emitter.emit("notification-count", 0);
        }
        setNotificationsActive(!notifications_active);
    };

    const toggleRightNav = () => {
        setRightNavActive(!right_nav_active);
    };

    const newDemo = () => {
        closeNavbar();
        createDemoBoard();
    };

    React.useEffect(() => {
        // here we are watching in case 'theme' is updated by the
        // remote-storage update mechanism, which doesn't call setTheme()
        data.watch("theme", _update_theme);

        browserHistory.listen((update) => {
            closeNavbar();
            setPath(update.location.pathname);
        });
    }, []);

    //const valid_user = user.anonymous ? null : user;

    const groups = data.get("cached.groups", []);
    const tournaments = data.get("cached.active_tournaments", []);
    const ladders = data.get("cached.ladders", []);

    return (
        <header className="NavBar">
            <nav className="left">
                <Link to="/">{_("Home")}</Link>
                <Menu title={_("Play")} to="/play">
                    <Link to="/play">
                        <i className="ogs-goban"></i> {_("Play")}
                    </Link>
                    <div className="submenu-container">
                        <Link to="/tournaments">
                            <i className="fa fa-trophy"></i>
                            {_("Tournaments")}
                        </Link>
                        {tournaments.length > 0 && (
                            <div className="submenu">
                                {tournaments.map((tournament) => (
                                    <Link to={`/tournaments/${tournament.id}`} key={tournament.id}>
                                        <img src={tournament.icon} />
                                        {tournament.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="submenu-container">
                        <Link to="/ladders">
                            <i className="fa fa-list-ol"></i>
                            {_("Ladders")}
                        </Link>
                        {ladders.length > 0 && (
                            <div className="submenu">
                                {ladders.map((ladder) => (
                                    <Link to={`/groups/${ladder.id}`} key={ladder.id}>
                                        <span className="ladder-rank">#{ladder.player_rank}</span>{" "}
                                        {ladder.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </Menu>
                <Menu title={_("Learn")} to="/learn-to-play-go">
                    <Link to="/learn-to-play-go">
                        <i className="fa fa-graduation-cap"></i>
                        {_("Learn to play Go")}
                    </Link>
                    <Link to="/supporter">
                        <i className="fa fa-star"></i>
                        {_("Sign up for AI game reviews")}
                    </Link>
                    <Link to="/puzzles">
                        <i className="fa fa-puzzle-piece"></i>
                        {_("Puzzles")}
                    </Link>
                    <Link to="/docs/other-go-resources">
                        <i className="fa fa-link"></i>
                        {_("Other Go Resources")}
                    </Link>
                </Menu>
                <Menu title={_("Watch")} to="/observe-games">
                    <Link to="/observe-games">
                        <i className="fa fa-eye"></i>
                        {_("Games")}
                    </Link>
                </Menu>

                <Menu title={_("Community")} to="/chat">
                    <Link to="/chat">
                        <i className="fa fa-comment-o"></i>
                        {_("Chat")}
                    </Link>
                    <div className="submenu-container">
                        <Link to="/groups">
                            <i className="fa fa-users"></i>
                            {_("Groups")}
                        </Link>
                        {groups.length > 0 && (
                            <div className="submenu">
                                {groups.map((group) => (
                                    <Link to={`/groups/${group.id}`} key={group.id}>
                                        <img src={group.icon} />
                                        {group.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    <a href="https://forums.online-go.com/" target="_blank">
                        <i className="fa fa-comments"></i>
                        {_("Forums")}
                    </a>
                    <Link to="/supporter">
                        <i className="fa fa-star"></i>
                        {_("Support OGS")}
                    </Link>
                    <Link to="/docs/about">
                        <i className="fa fa-info-circle"></i>
                        {_("About")}
                    </Link>
                    <a href="https://github.com/online-go/online-go.com/" target="_blank">
                        <i className="fa fa-github"></i>
                        {_("GitHub")}
                    </a>
                    <a href="https://github.com/online-go/online-go.com/wiki">
                        <i className="fa fa-question-circle"></i>
                        {_("Documentation & FAQ")}
                    </a>
                </Menu>

                <Menu title={_("Tools")}>
                    <section className="OmniSearch-container">
                        <i className="fa fa-search" />
                        <input
                            type="text"
                            className="OmniSearch-input"
                            value={search}
                            onChange={(ev) => setSearch(ev.target.value)}
                            onKeyUp={(ev) => {
                                if (ev.key === "Escape") {
                                    setSearch("");
                                }
                            }}
                            placeholder={_("Search")}
                        />
                        <OmniSearch search={search} />
                    </section>

                    <Link to="/joseki">
                        <i className="fa fa-sitemap"></i>
                        {_("Joseki")}
                    </Link>
                    <span className="fakelink" onClick={newDemo}>
                        <i className="fa fa-plus"></i>
                        {_("Demo Board")}
                    </span>
                    <Link to={`/library/${user.id}`}>
                        <i className="fa fa-book"></i>
                        {_("SGF Library")}
                    </Link>

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
                </Menu>
            </nav>

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
                    <TurnIndicator />
                    <NotificationIndicator onClick={toggleNotifications} />
                    <span className="icon-container" onClick={toggleRightNav}>
                        {user.username}
                    </span>
                </section>
            )}

            <div
                className={
                    "nav-menu-modal-backdrop " +
                    (notifications_active || right_nav_active ? "active" : "")
                }
                onClick={closeNavbar}
            />

            {notifications_active && <NotificationList />}

            {/* Right Nav */}
            {right_nav_active && (
                <div className="RightNav">
                    <Link to={`/user/view/${user.id}`}>
                        <PlayerIcon user={user} size={16} />
                        {_("Profile")}
                    </Link>

                    <Link to="/user/settings">
                        <i className="fa fa-gear"></i>
                        {_("Settings")}
                    </Link>
                    <span className="fakelink" onClick={logout}>
                        <i className="fa fa-power-off"></i>
                        {_("Sign out")}
                    </span>

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
                </div>
            )}
        </header>
    );
}

interface MenuProps {
    title: string;
    to?: string;
    children: React.ReactNode;
}

function Menu({ title, to, children }: MenuProps): JSX.Element {
    return (
        <section className="menu">
            {to ? <Link to={to}>{title}</Link> : <span className="fakelink">{title}</span>}
            <div className="menu-children">{children}</div>
        </section>
    );
}
