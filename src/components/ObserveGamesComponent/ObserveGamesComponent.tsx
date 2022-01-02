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
import * as data from "data";
import * as preferences from "preferences";
import { _, pgettext, interpolate } from "translate";
import { post, get } from "requests";
import { dup } from "misc";
import { GameList } from "GameList";
import { ActiveAnnouncements } from "Announcements";
import { comm_socket } from "sockets";

interface ObserveGamesComponentProperties {
    announcements: boolean;
    updateTitle: boolean;
    miniGobanProps?: any;
    channel?: string;
    namesByGobans?: boolean;
    preferenceNamespace?: string;
}

interface GameListWhere {
    hide_ranked?: boolean;
    hide_unranked?: boolean;
    hide_19x19?: boolean;
    hide_9x9?: boolean;
    hide_13x13?: boolean;
    hide_other?: boolean;
    hide_tournament?: boolean;
    hide_ladder?: boolean;
    hide_open?: boolean;
    hide_handicap?: boolean;
    hide_even?: boolean;
    hide_bot_games?: boolean;
    hide_beginning?: boolean;
    hide_middle?: boolean;
    hide_end?: boolean;
    players?: Array<number>;
}

interface ObserveGamesComponentState {
    page: number | ""; // this is sometimes set to the empty string when the user enters invalid input
    num_pages: number;
    page_size: number;
    page_size_text_input: number;
    viewing: "live" | "corr";
    game_list: [];
    live_game_count: number;
    corr_game_count: number;
    show_filters: boolean;
    force_list: boolean;
    filters: GameListWhere;
}

export class ObserveGamesComponent extends React.PureComponent<
    ObserveGamesComponentProperties,
    ObserveGamesComponentState
> {
    private last_refresh: number;
    private next_refresh: any;
    private auto_refresh: number;
    private channel?: string;
    private show_announcements: boolean;

    constructor(props) {
        super(props);
        this.state = {
            page: 1,
            num_pages: 0,
            page_size: this.namespacedPreferenceGet("observed-games-page-size"),
            page_size_text_input: this.namespacedPreferenceGet(
                "observed-games-page-size",
            ),
            viewing: this.namespacedPreferenceGet(
                "observed-games-viewing",
            ) /* live / correspondence */,
            game_list: [],
            live_game_count: 0,
            corr_game_count: 0,
            show_filters: false,
            force_list: this.namespacedPreferenceGet(
                "observed-games-force-list",
            ) as boolean,
            filters: this.namespacedPreferenceGet(
                "observed-games-filter",
            ) as GameListWhere,
        };
        this.channel = props.channel;
        this.show_announcements = props.show_announcements;
    }

    namespacedPreferenceGet(key: preferences.ValidPreference): any {
        if (this.props.preferenceNamespace) {
            return data.get(
                `observed-games.${this.props.preferenceNamespace}.${key}`,
                preferences.get(key),
            );
        }
        return preferences.get(key);
    }

    namespacedPreferenceSet(key: preferences.ValidPreference, value: any): any {
        if (this.props.preferenceNamespace) {
            return data.set(
                `observed-games.${this.props.preferenceNamespace}.${key}`,
                value,
            );
        }
        return preferences.set(key, value);
    }

    syncSubscribe = () => {
        if (
            Object.keys(this.namespacedPreferenceGet("observed-games-filter"))
                .length === 0
        ) {
            comm_socket.send("gamelist/count/subscribe", this.channel);
        } else {
            comm_socket.send("gamelist/count/unsubscribe", this.channel);
        }
    };

    componentDidUpdate(
        prevProps: ObserveGamesComponentProperties,
        prevState: any,
    ) {
        if (this.props.channel !== prevProps.channel) {
            console.log("Should be reconnecting");
            this.destroy();
            this.channel = this.props.channel;
            this.init();
        }
    }

    init() {
        if (this.props.updateTitle) {
            window.document.title = _("Games");
        }
        console.log("Channel: ", this.channel);
        if (this.channel) {
            comm_socket.on(`gamelist-count-${this.channel}`, this.updateCounts);
        } else {
            comm_socket.on("gamelist-count", this.updateCounts);
        }
        comm_socket.on("connect", this.syncSubscribe);
        if (comm_socket.connected) {
            this.syncSubscribe();
        }
        this.refresh();
        //this.auto_refresh = setInterval(this.refresh, 500);
    }
    destroy() {
        if (this.channel) {
            comm_socket.off(
                `gamelist-count-${this.channel}`,
                this.updateCounts,
            );
        } else {
            comm_socket.off("gamelist-count", this.updateCounts);
        }
        comm_socket.off("connect", this.syncSubscribe);
        if (comm_socket.connected) {
            comm_socket.send("gamelist/count/unsubscribe", this.channel);
        }
        if (this.auto_refresh) {
            clearInterval(this.auto_refresh);
        }
    }

    componentDidMount() {
        this.init();
    }
    componentWillUnmount() {
        this.destroy();
    }
    updateCounts = (counts) => {
        console.log(counts);
        this.setState({
            live_game_count: counts.live,
            corr_game_count: counts.correspondence,
        });
    };
    setPageSize = (ev) => {
        if (
            ev.target.value &&
            parseInt(ev.target.value) >= 3 &&
            parseInt(ev.target.value) <= 100
        ) {
            const ct: number = parseInt(ev.target.value);
            this.namespacedPreferenceSet("observed-games-page-size", ct);
            this.setState({
                page_size: ct,
                page_size_text_input: ct,
            });
            this.setPage(1);
            setTimeout(this.refresh, 1);
        } else {
            this.setState({ page_size_text_input: ev.target.value });
        }
    };
    refresh = () => {
        const now = Date.now();
        if (this.last_refresh != null && now - this.last_refresh < 1000.0) {
            if (!this.next_refresh) {
                this.next_refresh = setTimeout(() => {
                    this.next_refresh = null;
                    this.refresh();
                }, 1000 - (now - this.last_refresh));
            }
            return;
        }
        this.last_refresh = now;

        const filter = dup(
            this.namespacedPreferenceGet("observed-games-filter"),
        );
        if (filter.friend_games_only) {
            delete filter.friend_games_only;
            try {
                filter.players = data
                    .get("cached.friends")
                    .map((friend) => friend.id);
            } catch (e) {
                console.error(e);
            }
        }

        comm_socket.send(
            "gamelist/query",
            {
                list: this.state.viewing,
                sort_by: "rank",
                where: filter,
                from: ((this.state.page as number) - 1) * this.state.page_size,
                limit: this.state.page_size,
                channel: this.channel,
            },
            (res) => {
                console.log(res);

                const state_update: any = {
                    num_pages: Math.ceil(res.size / this.state.page_size),
                    game_list: res.results,
                    page: Math.max(
                        1,
                        Math.min(
                            this.state.page as number,
                            this.state.num_pages,
                        ),
                    ),
                };

                if (res.where) {
                    if (res.list === "live") {
                        state_update.live_game_count = res.size;
                        state_update.corr_game_count = 0;
                    } else {
                        state_update.corr_game_count = res.size;
                        state_update.live_game_count = 0;
                    }
                }

                this.setState(state_update);
            },
        );
    };
    prevPage = () => {
        this.setPage((this.state.page as number) - 1);
    };
    nextPage = () => {
        if (typeof this.state.page === "number") {
            this.setPage(this.state.page + 1);
        } else {
            this.setPage(1);
        }
    };
    setPage = (ev_or_page) => {
        let page = parseInt(
            typeof ev_or_page === "number"
                ? ev_or_page
                : (ev_or_page.target as any).value,
        );
        if (isNaN(page)) {
            this.setState({ page: "" });
            return;
        }
        page = Math.max(
            1,
            Math.min(
                Math.ceil(
                    (this.state.viewing === "live"
                        ? this.state.live_game_count
                        : this.state.corr_game_count) / this.state.page_size,
                ),
                page,
            ),
        );
        this.setState({ page: page });
        setTimeout(this.refresh, 1);
    };

    viewLive = () => {
        this.setState({ viewing: "live", page: 0 });
        this.namespacedPreferenceSet("observed-games-viewing", "live");
        setTimeout(this.refresh, 1);
    };
    viewCorrespondence = () => {
        this.setState({ viewing: "corr", page: 0 });
        this.namespacedPreferenceSet("observed-games-viewing", "corr");
        setTimeout(this.refresh, 1);
    };

    toggleShowFilters = () => {
        this.setState({ show_filters: !this.state.show_filters });
    };
    toggleForceList = () => {
        this.namespacedPreferenceSet(
            "observed-games-force-list",
            !this.state.force_list,
        );
        this.setState({ force_list: !this.state.force_list });
    };

    render() {
        const n_filters = Object.keys(this.state.filters).length;

        return (
            <div className="ObserveGamesComponent">
                <div className="container">
                    <div className="games">
                        <div className="header">
                            <div className="btn-group">
                                <button
                                    className={
                                        this.state.viewing === "live"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={this.viewLive}
                                >
                                    {interpolate(_("{{count}} live games"), {
                                        count: this.state.live_game_count || "",
                                    })}
                                </button>
                                <button
                                    className={
                                        this.state.viewing === "corr"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={this.viewCorrespondence}
                                >
                                    {interpolate(
                                        _("{{count}} correspondence games"),
                                        {
                                            count:
                                                this.state.corr_game_count ||
                                                "",
                                        },
                                    )}
                                </button>

                                <button
                                    className="btn default"
                                    onClick={this.toggleShowFilters}
                                >
                                    <i className="fa fa-filter"></i>{" "}
                                    {n_filters ? `(${n_filters})` : ""}
                                </button>
                                <button
                                    className={
                                        "btn default " +
                                        (this.state.force_list ? "active" : "")
                                    }
                                    onClick={this.toggleForceList}
                                >
                                    <i className="fa fa-list"></i>
                                </button>
                            </div>

                            <button
                                className="btn xs primary"
                                onClick={this.refresh}
                            >
                                <i className="fa fa-refresh"></i> {_("Refresh")}
                            </button>

                            <div className="page-controls">
                                {((this.state.num_pages &&
                                    this.state.num_pages > 0) ||
                                    null) && (
                                    <div className="left">
                                        {this.state.page > 1 ? (
                                            <i
                                                className="fa fa-step-backward"
                                                onClick={this.prevPage}
                                            />
                                        ) : (
                                            <i className="fa" />
                                        )}
                                        <input
                                            onChange={this.setPage}
                                            value={this.state.page}
                                        />
                                        <span className="of"> / </span>
                                        <span className="total">
                                            {this.state.num_pages.toString()}
                                        </span>
                                        {this.state.page <
                                        this.state.num_pages ? (
                                            <i
                                                className="fa fa-step-forward"
                                                onClick={this.nextPage}
                                            />
                                        ) : (
                                            <i className="fa" />
                                        )}
                                    </div>
                                )}
                                <div className="right">
                                    <label className="labelshow">
                                        {_("Show") + ":"}
                                    </label>
                                    <input
                                        className="show"
                                        onChange={this.setPageSize}
                                        value={this.state.page_size_text_input}
                                        type="number"
                                        min="3"
                                        max="100"
                                        step="1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {this.state.show_filters && this.renderFilters()}
                </div>

                {this.props.announcements && <ActiveAnnouncements />}

                <GameList
                    list={this.state.game_list}
                    disableSort={true}
                    emptyMessage={_("No games being played")}
                    miniGobanProps={this.props.miniGobanProps}
                    namesByGobans={this.props.namesByGobans}
                    forceList={this.state.force_list}
                />
            </div>
        );
    }

    private filterOption(filter_field: string, name: string): JSX.Element {
        const self = this;

        function toggle(ev) {
            const new_filters = dup(self.state.filters);

            if (!new_filters[filter_field]) {
                new_filters[filter_field] = true;
            } else {
                delete new_filters[filter_field];
            }

            self.namespacedPreferenceSet("observed-games-filter", new_filters);
            self.setState({ filters: new_filters });
            self.syncSubscribe();
            self.refresh();
        }

        const hide_mode = filter_field.indexOf("hide") === 0;

        return (
            <div className="filter-option">
                <input
                    id={filter_field}
                    type="checkbox"
                    checked={
                        hide_mode
                            ? !this.state.filters[filter_field]
                            : !!this.state.filters[filter_field]
                    }
                    onChange={toggle}
                />
                <label htmlFor={filter_field}>{name}</label>
            </div>
        );
    }

    private renderFilters(): JSX.Element {
        return (
            <div className="filters">
                <div className="filter-group">
                    {this.filterOption(
                        "hide_ranked",
                        pgettext("Filter games list", "Ranked"),
                    )}
                    {this.filterOption(
                        "hide_unranked",
                        pgettext("Filter games list", "Unranked"),
                    )}
                    {this.filterOption(
                        "friend_games_only",
                        pgettext("Filter games list", "Friend games only"),
                    )}
                </div>

                <div className="filter-group">
                    {this.filterOption(
                        "hide_beginning",
                        pgettext("Filter games list", "Beginning"),
                    )}
                    {this.filterOption(
                        "hide_middle",
                        pgettext("Filter games list", "Middle"),
                    )}
                    {this.filterOption(
                        "hide_end",
                        pgettext("Filter games list", "End"),
                    )}
                </div>

                <div className="filters-group-group">
                    <div className="filter-group">
                        {this.filterOption(
                            "hide_19x19",
                            pgettext("Filter games list", "19x19"),
                        )}
                        {this.filterOption(
                            "hide_13x13",
                            pgettext("Filter games list", "13x13"),
                        )}
                    </div>
                    <div className="filter-group">
                        {this.filterOption(
                            "hide_9x9",
                            pgettext("Filter games list", "9x9"),
                        )}
                        {this.filterOption(
                            "hide_other",
                            pgettext(
                                "Filter games list (odd board sizes)",
                                "Other",
                            ),
                        )}
                    </div>
                </div>

                <div className="filter-group">
                    {this.filterOption(
                        "hide_tournament",
                        pgettext("Filter games list", "Tournament Games"),
                    )}
                    {this.filterOption(
                        "hide_ladder",
                        pgettext("Filter games list", "Ladder Games"),
                    )}
                    {this.filterOption(
                        "hide_open",
                        pgettext(
                            "Filter games list (non ladder / tournament games)",
                            "Single Games",
                        ),
                    )}
                </div>

                <div className="filter-group">
                    {this.filterOption(
                        "hide_even",
                        pgettext("Filter games list", "Even Games"),
                    )}
                    {this.filterOption(
                        "hide_handicap",
                        pgettext("Filter games list", "Handicap Games"),
                    )}
                    {this.filterOption(
                        "hide_bot_games",
                        pgettext("Filter games list", "Bot Games"),
                    )}
                </div>
            </div>
        );
    }
}
