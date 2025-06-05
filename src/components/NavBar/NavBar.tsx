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
import clsx from "clsx";

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
import { Menu, MenuContext } from "./Menu";

import { logout } from "@/lib/auth";
import { useUser, useData } from "@/lib/hooks";
import { OmniSearch } from "./OmniSearch";
import { forwardRef, useId, useState } from "react";
import { MODERATOR_POWERS } from "@/lib/moderation";

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

    const searchInputId = useId();

    const [activeMenu, setActiveMenu] = useState<null | string>(null);

    return (
        <MenuContext.Provider value={{ setActiveMenu, activeMenu }}>
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

                <nav className="left" aria-label={_("Main Navigation")}>
                    <ul>
                        <li>
                            <Link to="/" className="Menu-title">
                                <span className="ogs-nav-logo" aria-hidden={true} />
                                {_("Home")}
                            </Link>
                        </li>
                        <Menu
                            menuId="play"
                            title={_("Play")}
                            to="/play"
                            openMenuLabel={_("Open play menu")}
                        >
                            <MenuLink
                                title={_("Play")}
                                to="/play"
                                icon={<i className="ogs-goban" />}
                            />
                            <MenuLink
                                title={_("Tournaments")}
                                to="/tournaments"
                                icon={<i className="fa fa-trophy" />}
                            />
                            <MenuLink
                                title={_("Ladders")}
                                to="/ladders"
                                icon={<i className="fa fa-list-ol" />}
                            />
                        </Menu>
                        <Menu
                            menuId="learn"
                            title={_("Learn")}
                            to="/learn-to-play-go"
                            openMenuLabel={_("Open learn menu")}
                        >
                            <MenuLink
                                title={_("Learn to play Go")}
                                to="/learn-to-play-go"
                                icon={<i className="fa fa-graduation-cap" />}
                            />
                            <MenuLink
                                title={_("Sign up for AI game reviews")}
                                to="/supporter"
                                icon={<i className="fa fa-star" />}
                            />
                            <MenuLink
                                title={_("Puzzles")}
                                to="/puzzles"
                                icon={<i className="fa fa-puzzle-piece" />}
                            />
                            <MenuLink
                                title={_("Other Go Resources")}
                                to="/docs/other-go-resources"
                                icon={<i className="fa fa-link" />}
                            />
                        </Menu>
                        <Menu
                            menuId="watch"
                            title={_("Watch")}
                            to="/observe-games"
                            openMenuLabel={_("Open watch menu")}
                        >
                            <MenuLink
                                title={_("Games")}
                                to="/observe-games"
                                icon={<i className="fa fa-eye" />}
                            />
                            <MenuLink title={"GoTV"} to="/gotv" icon={<i className="fa fa-tv" />} />
                        </Menu>
                        <Menu
                            menuId="community"
                            title={_("Community")}
                            to="/chat"
                            openMenuLabel={_("Open community menu")}
                        >
                            <MenuLink
                                title={_("Forums")}
                                to="https://forums.online-go.com/"
                                icon={<i className="fa fa-comments" />}
                                target="_blank"
                                external={true}
                            />
                            <MenuLink
                                title={_("Chat")}
                                to="/chat"
                                icon={<i className="fa fa-comment-o" />}
                            />
                            <MenuLink
                                title={_("Groups")}
                                to="/groups"
                                icon={<i className="fa fa-users" />}
                            />
                            <MenuLink
                                title={_("Support OGS")}
                                to="/supporter"
                                icon={<i className="fa fa-star" />}
                            />
                            <MenuLink
                                title={_("About")}
                                to="/docs/about"
                                icon={<i className="fa fa-info-circle" />}
                            />
                            <MenuLink
                                title={_("GitHub")}
                                to="https://github.com/online-go/online-go.com/"
                                icon={<i className="fa fa-github" />}
                                target="_blank"
                                external={true}
                            />
                            <MenuLink
                                title={_("Documentation & FAQ")}
                                to="https://github.com/online-go/online-go.com/wiki"
                                icon={<i className="fa fa-question-circle" />}
                                target="_blank"
                                external={true}
                            />
                        </Menu>
                        <Menu
                            menuId="tools"
                            title={_("Tools")}
                            openMenuLabel={_("Open tools menu")}
                        >
                            <MenuLink
                                title={_("Joseki")}
                                to="/joseki"
                                icon={<i className="fa fa-sitemap" />}
                            />
                            {user.anonymous ? null : (
                                <MenuLink
                                    title={_("Demo Board")}
                                    onClick={newDemo}
                                    icon={<i className="fa fa-plus" />}
                                />
                            )}
                            {user.anonymous ? null : (
                                <MenuLink
                                    title={_("SGF Library")}
                                    to={`/library/${user.id}`}
                                    icon={<i className="fa fa-book" />}
                                />
                            )}

                            <MenuLink
                                title={_("Rating Calculator")}
                                to="/rating-calculator"
                                icon={<i className="fa fa-calculator" />}
                            />

                            <MenuLink
                                title={_("Contribute To Translation")}
                                to="https://translate.online-go.com/projects/ogs/"
                                icon={<i className="fa fa-globe" />}
                                target="_blank"
                                external={true}
                            />

                            <MenuLink
                                title={_("Reports Center")}
                                to="/reports-center"
                                icon={<i className="fa fa-exclamation-triangle" />}
                            />
                            {user.is_moderator && (
                                <MenuLink
                                    title={_("Moderator Center")}
                                    to="/moderator"
                                    icon={<i className="fa fa-gavel" />}
                                />
                            )}
                            {user.is_moderator && (
                                <MenuLink
                                    title={_("Appeals Center")}
                                    to="/appeals-center"
                                    icon={<i className="fa fa-gavel" />}
                                />
                            )}
                            {(user.is_moderator ||
                                (user.moderator_powers & MODERATOR_POWERS.AI_DETECTOR) !== 0) && (
                                <MenuLink
                                    title={_("AI Detection")}
                                    to="/moderator/ai-detection"
                                    icon={<i className="fa fa-search" />}
                                />
                            )}
                            {user.is_moderator && (
                                <MenuLink
                                    title="Firewall"
                                    to="/admin/firewall"
                                    icon={<i className="fa fa-fire-extinguisher" />}
                                />
                            )}
                            {(user.is_moderator || user.is_announcer) && (
                                <MenuLink
                                    title={_("Announcement Center")}
                                    icon={<i className="fa fa-bullhorn" />}
                                    to="/announcement-center"
                                />
                            )}
                            {user.is_superuser && (
                                <MenuLink
                                    title="Prize Batches"
                                    icon={<i className="fa fa-trophy" />}
                                    to="/prize-batches"
                                />
                            )}
                            {user.is_superuser && (
                                <MenuLink
                                    title="Admin"
                                    icon={<i className="fa fa-wrench" />}
                                    to="/admin"
                                />
                            )}
                        </Menu>
                        <Menu
                            menuId="setting-mobile"
                            title={_("Settings")}
                            to="/settings"
                            className="mobile-only"
                            openMenuLabel={_("Open settings menu")}
                        >
                            <MenuLink
                                title={_("Profile")}
                                to={`/user/view/${user.id}`}
                                icon={<PlayerIcon user={user} size={16} />}
                            />

                            <MenuLink
                                title={_("Settings")}
                                to="/user/settings"
                                icon={<i className="fa fa-gear" />}
                                ref={settingsNavLink}
                            />

                            <MenuLink
                                title={_("Sign out")}
                                onClick={logout}
                                icon={<i className="fa fa-power-off" />}
                            />
                        </Menu>
                    </ul>
                </nav>

                <section className="center OmniSearch-container">
                    <div className="OmniSearch-input-container">
                        <label htmlFor={searchInputId}>
                            <i aria-hidden={true} className="fa fa-search" />
                            <span className="sr-only">{_("Search the site")}</span>
                        </label>

                        <input
                            id={searchInputId}
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
                                menuId="settings"
                                title={
                                    <span className="icon-container">
                                        <PlayerIcon user={user} size={64} />
                                        <span className="username">{user.username}</span>
                                    </span>
                                }
                                to={`/user/view/${user.id}`}
                                className="profile desktop-only"
                                as="nav"
                                aria-label={_("Profile")}
                                openMenuLabel={_("Open profile and settings menu")}
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
                    <ul className="RightNav">
                        <ProfileAndQuickSettingsBits settingsNavLink={settingsNavLink} />
                    </ul>
                )}
            </header>
        </MenuContext.Provider>
    );
}

interface MenuLinkProps {
    title: string | React.ReactElement;
    to?: string;
    target?: string;
    icon?: React.ReactNode;
    external?: boolean;
    onClick?: React.MouseEventHandler;
    centered?: boolean;
}

const MenuLink = forwardRef<HTMLElement, MenuLinkProps>(
    ({ title, to, icon, target, external, onClick, centered }, ref): React.ReactElement => {
        // Determine the appropriate element type
        let Element: any;
        const elementProps: any = {
            className: clsx("MenuLink", { centered: centered }),
            ref,
        };

        if (!to) {
            // Button (fakelink)
            Element = "button";
            elementProps.onClick = onClick;
        } else if (external) {
            // External link
            Element = "a";
            elementProps.href = to;
            elementProps.target = target;
        } else {
            // Internal link
            Element = Link;
            elementProps.to = to;
            elementProps.target = target;
        }

        return (
            <li>
                <Element {...elementProps}>
                    {icon && <span aria-hidden={true}>{icon}</span>}
                    <span className="MenuLinkTitle">{title}</span>
                </Element>
            </li>
        );
    },
);

function ProfileAndQuickSettingsBits({
    settingsNavLink,
}: {
    settingsNavLink: any;
}): React.ReactElement {
    const user = useUser();
    const themeId = useId();

    return (
        <>
            <MenuLink
                title={_("Profile")}
                to={`/user/view/${user.id}`}
                icon={<PlayerIcon user={user} size={16} />}
            />
            <MenuLink
                title={_("Settings")}
                to="/user/settings"
                icon={<i className="fa fa-gear"></i>}
                ref={settingsNavLink}
            />
            <MenuLink
                title={_("Sign out")}
                onClick={logout}
                icon={<i className="fa fa-power-off"></i>}
            />
            <li role="none" className="ThemeMenu">
                <h4>
                    <LineText>
                        <span id={themeId}>{_("Theme")}</span>
                    </LineText>
                </h4>
                <div role="group" aria-labelledby={themeId} className="theme-selectors-container">
                    <h5 className="sr-only">{_("Website theme")}</h5>
                    <div className="theme-selectors">
                        <button
                            className="theme-button light"
                            onClick={setThemeLight}
                            aria-label={pgettext(
                                "Name of the browser/app theme with a light background",
                                "Light theme",
                            )}
                        >
                            <i className="fa fa-sun-o" />
                        </button>
                        <button
                            className="theme-button dark"
                            onClick={setThemeDark}
                            aria-label={pgettext(
                                "Name of the browser/app theme with a dark background",
                                "Dark theme",
                            )}
                        >
                            <i className="fa fa-moon-o" />
                        </button>
                        <button
                            className="theme-button accessible"
                            onClick={setThemeAccessible}
                            aria-label={pgettext(
                                "Name of the browser/app theme designed for users with visual impairments",
                                "Accessible theme",
                            )}
                        >
                            <i className="fa fa-eye" />
                        </button>
                    </div>
                    <h5 className="sr-only">{_("Goban theme")}</h5>
                    <div className="theme-selectors">
                        <GobanThemePicker />
                    </div>
                </div>
            </li>
            <MenuLink
                title={pgettext("Link to settings page with more theme options", "More options")}
                centered={true}
                to="/settings/theme"
            />
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
