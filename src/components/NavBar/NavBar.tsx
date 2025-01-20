/*
 * Copyright (C)  Online-Go.com
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
import { Link, useLocation } from "react-router-dom";

import * as DynamicHelp from "react-dynamic-help";
import * as data from "@/lib/data";

import { _, pgettext } from "@/lib/translate";
import { PlayerIcon } from "@/components/PlayerIcon";
import { LineText } from "@/components/misc-ui";
import { createDemoBoard } from "@/components/ChallengeModal";
import { LanguagePicker } from "@/components/LanguagePicker";
import { GobanThemePicker } from "@/components/GobanThemePicker";
import { IncidentReportIndicator } from "@/components/IncidentReportTracker";
import { KBShortcut } from "@/components/KBShortcut";
import { NotificationList, notification_manager } from "@/components/Notifications";
import { TurnIndicator } from "@/components/TurnIndicator";
import { NotificationIndicator } from "@/components/NotificationIndicator";
import { TournamentIndicator } from "@/components/Announcements";
import { FriendIndicator } from "@/components/FriendList";
import { ChatIndicator } from "@/components/Chat";
import { GoTVIndicator } from "@/views/GoTV";

import { logout } from "@/lib/auth";
import { useUser, useData } from "@/lib/hooks";
import { OmniSearch } from "./OmniSearch";

const body = document.body;

function _update_theme(theme?: string) {
    if (!theme) {
        return;
    }

    if (body.classList.contains(theme)) {
        return;
    }
    body.classList.remove("light", "dark", "accessible");
    body.classList.add(theme);
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

export function NavBar(): React.ReactElement {
    const user = useUser();
    const location = useLocation();

    const [search, setSearch] = React.useState<string>("");
    const [search_focus, setSearchFocus] = React.useState<boolean>(false);
    const [omniMouseOver, setOmniMouseOver] = React.useState<boolean>(false);
    const [right_nav_active, setRightNavActive] = React.useState(false);
    const [notifications_active, setNotificationsActive] = React.useState(false);
    const [hamburger_expanded, setHamburgerExpanded] = React.useState(false);
    const search_input = React.useRef<HTMLInputElement>(null);
    const [force_nav_close, setForceNavClose] = React.useState(false);
    const [banned_user_id] = useData("appeals.banned_user_id");

    const { registerTargetItem } = React.useContext(DynamicHelp.Api);

    const { /* ref: toggleRightNavButton, */ used: rightNavToggled } =
        registerTargetItem("toggle-right-nav");

    const { ref: settingsNavLink } = registerTargetItem("settings-nav-link");

    const closeNavbar = () => {
        setRightNavActive(false);
        setNotificationsActive(false);
        setSearch("");
    };

    const toggleNotifications = () => {
        if (notifications_active === false) {
            notification_manager.event_emitter.emit("notification-count", 0);
        }
        setNotificationsActive(!notifications_active);
    };

    const toggleRightNav = () => {
        setRightNavActive(!right_nav_active);
        rightNavToggled();
    };

    const toggleHamburgerExpanded = () => {
        if (hamburger_expanded) {
            setSearch("");
        }
        setRightNavActive(false);
        setHamburgerExpanded(!hamburger_expanded);
    };

    const newDemo = () => {
        closeNavbar();
        createDemoBoard();
    };
    /*
    const newRecord = () => {
        closeNavbar();
        createGameRecord();
    };
    */

    React.useEffect(() => {
        setForceNavClose(true);
        setTimeout(() => {
            setForceNavClose(false);
        }, 50);
    }, [location]);

    React.useEffect(() => {
        setHamburgerExpanded(false);
        closeNavbar();
    }, [location.key]);

    React.useEffect(() => {
        // here we are watching in case 'theme' is updated by the
        // remote-storage update mechanism, which doesn't call setTheme()
        data.watch("theme", _update_theme);
    }, []);

    //const valid_user = user.anonymous ? null : user;

    // Don't show the sign-in link at the top if they arrived to the welcome page
    // (aka ChallengeLinkLanding)
    // because that page has special treatment of sign-in, which takes them
    // to the challenge that they accepted via a challenge link, after logging them in.
    // We don't want to offer them a way of bailing out and signing in outside that.
    // (If they manually navigate away, it's no real harm, it's just that they won't
    //  get taken to the challenge they were in the middle of accepting).

    const show_sign_in =
        !window.location.pathname.includes("/sign-in") && // don't show the link to the page we're on
        !window.location.pathname.includes("/welcome") && // a challenge link page is being shown
        !window.location.hash.includes("/welcome"); // the sign-in with redirect to challenge accept

    const show_appeal_box = !window.location.pathname.includes("/appeal");

    return (
        <header
            className={
                "NavBar" +
                (hamburger_expanded ? " hamburger-expanded" : "") +
                (force_nav_close ? " force-nav-close" : "")
            }
        >
            <KBShortcut shortcut="`" action={() => search_input.current?.focus()} />

            {banned_user_id && show_appeal_box ? <BanIndicator /> : null}

            <span className="hamburger">
                {hamburger_expanded ? (
                    <i className="fa fa-times" onClick={toggleHamburgerExpanded} />
                ) : (
                    <i className="fa fa-bars" onClick={toggleHamburgerExpanded} />
                )}
                <Link to="/">
                    <span className="ogs-nav-logo" />
                </Link>
            </span>

            <nav className="left">
                <Link to="/" className="Menu-title">
                    <span className="ogs-nav-logo" />
                    {_("Home")}
                </Link>
                <Menu title={_("Play")} to="/play">
                    <Link to="/play">
                        <i className="ogs-goban"></i>
                        {_("Play")}
                    </Link>
                    <Link to="/tournaments">
                        <i className="fa fa-trophy"></i>
                        {_("Tournaments")}
                    </Link>
                    <Link to="/ladders">
                        <i className="fa fa-list-ol"></i>
                        {_("Ladders")}
                    </Link>
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
                    <Link to="/gotv">
                        <i className="fa fa-tv"></i>
                        GoTV
                    </Link>
                </Menu>

                <Menu title={_("Community")} to="/chat">
                    <a href="https://forums.online-go.com/" target="_blank">
                        <i className="fa fa-comments"></i>
                        {_("Forums")}
                    </a>
                    <Link to="/chat">
                        <i className="fa fa-comment-o"></i>
                        {_("Chat")}
                    </Link>
                    <Link to="/groups">
                        <i className="fa fa-users"></i>
                        {_("Groups")}
                    </Link>
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
                    <Link to="/joseki">
                        <i className="fa fa-sitemap"></i>
                        {_("Joseki")}
                    </Link>
                    {user.anonymous ? null : (
                        <span className="fakelink" onClick={newDemo}>
                            <i className="fa fa-plus"></i>
                            {_("Demo Board")}
                        </span>
                    )}
                    {user.anonymous ? null : (
                        <Link to={`/library/${user.id}`}>
                            <i className="fa fa-book"></i>
                            {_("SGF Library")}
                        </Link>
                    )}

                    <Link to={`/rating-calculator`}>
                        <i className="fa fa-calculator"></i>
                        {_("Rating Calculator")}
                    </Link>

                    <a href="https://translate.online-go.com/projects/ogs/" target="_blank">
                        <i className="fa fa-globe"></i>
                        {_("Contribute To Translation")}
                    </a>

                    <Link className="admin-link" to="/reports-center">
                        <i className="fa fa-exclamation-triangle"></i>
                        {_("Reports Center")}
                    </Link>

                    {user.is_moderator && (
                        <Link className="admin-link" to="/moderator">
                            <i className="fa fa-gavel"></i>
                            {_("Moderator Center")}
                        </Link>
                    )}
                    {user.is_moderator && (
                        <Link className="admin-link" to="/appeals-center">
                            <i className="fa fa-gavel"></i>
                            {_("Appeals Center")}
                        </Link>
                    )}
                    {user.is_moderator && (
                        <Link className="admin-link" to="/admin/firewall">
                            <i className="fa fa-fire-extinguisher"></i>
                            Firewall
                        </Link>
                    )}
                    {(user.is_moderator || user.is_announcer) && (
                        <Link className="admin-link" to="/announcement-center">
                            <i className="fa fa-bullhorn"></i>
                            {_("Announcement Center")}
                        </Link>
                    )}
                    {user.is_superuser && (
                        <Link className="admin-link" to="/prize-batches">
                            <i className="fa fa-trophy"></i>
                            Prize Batches
                        </Link>
                    )}
                    {user.is_superuser && (
                        <Link className="admin-link" to="/admin">
                            <i className="fa fa-wrench"></i> Admin
                        </Link>
                    )}
                </Menu>

                <Menu title={_("Settings")} to="/settings" className="mobile-only">
                    <Link to={`/user/view/${user.id}`}>
                        <PlayerIcon user={user} size={16} />
                        {_("Profile")}
                    </Link>

                    <Link to="/user/settings" ref={settingsNavLink}>
                        <i className="fa fa-gear"></i>
                        {_("Settings")}
                    </Link>
                    <span className="fakelink" onClick={logout}>
                        <i className="fa fa-power-off"></i>
                        {_("Sign out")}
                    </span>
                </Menu>
            </nav>

            <section className="center OmniSearch-container">
                <div className="OmniSearch-input-container">
                    <i
                        className="fa fa-search"
                        onClick={() => {
                            (search_input.current as HTMLInputElement).focus();
                        }}
                    />
                    <input
                        type="text"
                        className="OmniSearch-input"
                        ref={search_input}
                        value={search}
                        autoComplete="off"
                        onChange={(ev) => setSearch(ev.target.value)}
                        onKeyUp={(ev) => {
                            if (ev.key === "Escape") {
                                setSearch("");
                                (ev.target as HTMLInputElement).blur();
                            }
                        }}
                        onFocus={() => setSearchFocus(true)}
                        onBlur={() => setSearchFocus(false)}
                        placeholder={_("Search")}
                    />
                </div>
                {(search_focus || omniMouseOver) && (
                    <OmniSearch
                        search={search}
                        onMouseOver={() => setOmniMouseOver(true)}
                        onMouseOut={() => setOmniMouseOver(false)}
                    />
                )}
            </section>

            <section className={`right ${search_focus ? "search-focused" : ""}`}>
                {user.anonymous ? (
                    <>
                        <span className="spacer" />
                        <i className="fa fa-adjust" onClick={toggleTheme} />
                        <LanguagePicker />
                        {show_sign_in && (
                            <Link className="sign-in" to={"/sign-in#" + location.pathname}>
                                {_("Sign In")}
                            </Link>
                        )}
                    </>
                ) : (
                    <>
                        <div className="spacer" />
                        <IncidentReportIndicator />
                        <ChatIndicator />
                        <TournamentIndicator />
                        <FriendIndicator />
                        <NotificationIndicator onClick={toggleNotifications} />
                        <GoTVIndicator />
                        <TurnIndicator />

                        <span className="icon-container mobile-only" onClick={toggleRightNav}>
                            <PlayerIcon user={user} size={64} />
                        </span>

                        <Menu
                            title={
                                <span className="icon-container">
                                    <PlayerIcon user={user} size={64} />
                                    <span className="username">{user.username}</span>
                                </span>
                            }
                            to={`/user/view/${user.id}`}
                            className="profile desktop-only"
                        >
                            <ProfileAndQuickSettingsBits settingsNavLink={settingsNavLink} />
                        </Menu>
                    </>
                )}
            </section>

            <div
                className={
                    "nav-menu-modal-backdrop " +
                    (notifications_active || right_nav_active ? "active" : "")
                }
                onClick={closeNavbar}
            />

            {notifications_active && <NotificationList />}

            {/* Right Nav drop down on mobile */}
            {right_nav_active && (
                <div className="RightNav">
                    <ProfileAndQuickSettingsBits settingsNavLink={settingsNavLink} />
                </div>
            )}
        </header>
    );
}

interface MenuProps {
    title: string | React.ReactElement;
    to?: string;
    children: React.ReactNode;
    className?: string;
}

function Menu({ title, to, children, className }: MenuProps): React.ReactElement {
    return (
        <section className={"Menu " + (className || "")}>
            {to ? (
                <Link to={to} className="Menu-title">
                    {title}
                </Link>
            ) : (
                <span className="Menu-title">{title}</span>
            )}
            <div className="Menu-children">{children}</div>
        </section>
    );
}

function ProfileAndQuickSettingsBits({
    settingsNavLink,
}: {
    settingsNavLink: any;
}): React.ReactElement {
    const user = useUser();

    return (
        <>
            <Link to={`/user/view/${user.id}`}>
                <PlayerIcon user={user} size={16} />
                {_("Profile")}
            </Link>

            <Link to="/user/settings" ref={settingsNavLink}>
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
        </>
    );
}

function BanIndicator(): React.ReactElement {
    return (
        <div className="BanIndicator">
            <h3>{_("Your account has been suspended")}</h3>
            <div>
                <Link to="/appeal">
                    {pgettext("Link for banned player to use to appeal their ban", "Appeal here")}
                </Link>
            </div>
        </div>
    );
}
