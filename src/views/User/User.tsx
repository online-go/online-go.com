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
import { _, pgettext, cc_to_country_name } from "translate";
import { Link } from "react-router-dom";
import { post, get, put, patch } from "requests";
import { parse } from "query-string";
import * as data from "data";
import * as moment from "moment";
import { Card } from "material";
import { GameList } from "GameList";
import * as preferences from "preferences";
import { updateDup, ignore } from "misc";
import { ModTools } from "./ModTools";
import { GameHistoryTable } from "./GameHistoryTable";
import { ReviewsAndDemosTable } from "./ReviewsAndDemosTable";
import {
    rankString,
    getUserRating,
    humble_rating,
    rating_to_rank,
    boundedRankString,
    rank_deviation,
} from "rank_utils";
import { daysOnlyDurationString } from "TimeControl";
import { openModerateUserModal } from "ModerateUser";
import { errorAlerter } from "misc";
import * as player_cache from "player_cache";
import { getPrivateChat } from "PrivateChat";
import { Flag } from "Flag";
import { Markdown } from "Markdown";
import { RatingsChart } from "RatingsChart";
import { RatingsChartByGame } from "RatingsChartByGame";
import { associations } from "associations";
import { Toggle } from "Toggle";
import { AchievementList } from "Achievements";
import swal from "sweetalert2";
import * as History from "history";
import { VersusCard } from "./VersusCard";
import { AvatarCard, AvatarCardEditableFields } from "./AvatarCard";

interface UserProperties {
    match: {
        params: { user_id: string };
    };
    location: History.Location;
}

const marginBottom0 = { marginBottom: "0" };

// API: players/%%/full
export interface UserInfo {
    id: number;
    on_vacation: boolean;
    vacation_left: number;
    supporter: boolean;
    is_moderator: boolean;
    is_superuser: boolean;
    last_ip: string;
    last_name: string;
    first_name: string;
    username: string;
    about: string;
    website: string;
    country: string;
    real_name_is_private: boolean;
    is_bot: boolean;
    self_reported_account_linkages: any;
    is_watched: boolean;
    ui_class_extra: any;
    timeout_provisional: boolean; // deprecated
    is_tournament_moderator: boolean;
    name: string;
    bot_ai: string;
    bot_owner: player_cache.PlayerCacheEntry;
    professional: boolean;
    ip_shadowbanned?: boolean;
    icon?: string;
}

interface UserState {
    user: UserInfo;
    vs: rest_api.PlayerDetails["vs"];
    ratings: {};
    ip?: {
        country: string;
        subdivisions: string[];
        location: string[];
    };
    vacation_left?: number;
    vacation_left_text: string;
    syncRating: null;
    host_ip_settings?: {
        id: number;
        address: string;
        clients_limit: string;
        ban_affects_all: boolean;
        chatban_affects_all: boolean;
    };
    new_icon: { preview: string };
    bot_apikey: null;
    bot_ai?: string;
    editing: boolean;
    selected_speed: "overall";
    selected_size: 0;
    resolved: boolean;
    temporary_show_ratings: boolean;
    show_ratings_in_rating_grid: boolean;
    rating_graph_plot_by_games: boolean;
    show_graph_type_toggle: boolean;
    rating_chart_type_toggle_left?: number;
    hovered_game_id?: number;
    friend_request_sent?: boolean;
    friend_request_received?: boolean;
    is_friend?: boolean;
    active_games?: rest_api.players.full.Game[];
    achievements?: any[];
    titles?: any[];
    trophies?: any[];
    ladders?: any[];
    tournaments?: any[];
    groups?: any[];
}

export class User extends React.PureComponent<UserProperties, UserState> {
    user_id: number;
    vacation_left: string;
    original_username: string;
    vacation_update_interval: any;
    show_mod_log: boolean;

    constructor(props) {
        super(props);
        this.state = {
            user: null,
            vs: {} as any,
            ratings: {},
            ip: null,
            vacation_left: null,
            vacation_left_text: "",
            syncRating: null,
            host_ip_settings: null,
            new_icon: null,
            bot_apikey: null,
            bot_ai: null,
            editing: /edit/.test(window.location.hash),
            selected_speed: "overall",
            selected_size: 0,
            resolved: false,
            temporary_show_ratings: false,
            show_ratings_in_rating_grid: preferences.get("show-ratings-in-rating-grid"),
            rating_graph_plot_by_games: preferences.get("rating-graph-plot-by-games"),
            show_graph_type_toggle: !preferences.get("rating-graph-always-use"),
            hovered_game_id: null,
        };

        try {
            this.show_mod_log = parse(this.props.location.search)["show_mod_log"] === "1";
        } catch (e) {
            this.show_mod_log = false;
        }
    }

    componentDidMount() {
        window.document.title = _("Player");
        this.resolve(this.props);
    }

    isSpecialUser() {
        if (
            this.state.user.supporter ||
            this.state.user.is_moderator ||
            this.state.user.is_superuser
        ) {
            return true;
        }
        return false;
    }

    vacationAccrued() {
        if (this.state.user) {
            const vacation_time_accrued = this.state.user.vacation_left;
            if (this.isSpecialUser()) {
                return daysOnlyDurationString(vacation_time_accrued) + " " + _("out of 60 Days");
            } else {
                return daysOnlyDurationString(vacation_time_accrued) + " " + _("out of 30 Days");
            }
        }
        return "User not Found";
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.match.params.user_id !== this.props.match.params.user_id) {
            this.setState({ user: null, resolved: false });
            this.resolve(nextProps);
        }
    }
    resolve(props) {
        this.setState({ user: null, editing: /edit/.test(window.location.hash) });
        this.user_id = parseInt(props.match.params.user_id || data.get("user").id);
        get("players/%%/full", this.user_id)
            .then((state) => {
                this.setState({ resolved: true });
                try {
                    this.original_username = state.user.username;
                    player_cache.update(state.user);
                    this.update(state);
                    window.document.title = state.user.username;
                } catch (err) {
                    console.error(err.stack);
                }
            })
            .catch((err) => {
                console.error(err);
                this.setState({ user: null, resolved: true });
            });
    }

    update(state) {
        state.bot_apikey = state.user.bot_apikey;

        state.user.ratings = state.user.ratings;
        state.user.rating = parseFloat(state.user.rating);
        state.user.rating_live = parseFloat(state.user.rating_live);
        state.user.rating_blitz = parseFloat(state.user.rating_blitz);
        state.user.rating_correspondence = parseFloat(state.user.rating_correspondence);
        const user = state.user;
        try {
            state.website_href =
                user.website.trim().toLowerCase().indexOf("http") !== 0
                    ? "http://" + user.website
                    : user.website;
        } catch (e) {
            console.log(e.stack);
        }

        state.syncRating = (rank, type) => {
            if (type === "overall") {
                state.user.rating = rank * 100 + 50 - 900;
            } else {
                state.user["rating_" + type] = rank * 100 + 50 - 900;
            }
        };

        if (data.get("config.user").is_moderator) {
            /* aliases  */ state.ip = null;
            state.host_ip_settings = null;
        }
        state.temporary_show_ratings = false;

        this.setState(state);
        this.updateHostIpSettings();
    }

    updateHostIpSettings() {
        if (!this.state.user) {
            return;
        }

        const last_ip = this.state.user.last_ip;
        get("host_ip_settings/", { address: last_ip })
            .then((lst) => {
                this.setState({
                    host_ip_settings: lst.count
                        ? lst.results[0]
                        : {
                              id: 0,
                              address: last_ip,
                              clients_limit: 5,
                              ban_affects_all: true,
                              chatban_affects_all: true,
                          },
                });
            })
            .catch(ignore);
    }

    saveHostIpSettings() {
        console.log("Saving host ip settings: ", this.state.host_ip_settings);
        const obj = {
            address: this.state.host_ip_settings.address,
            clients_limit: this.state.host_ip_settings.clients_limit,
            ban_affects_all: this.state.host_ip_settings.ban_affects_all ? 1 : 0,
            chatban_affects_all: this.state.host_ip_settings.chatban_affects_all ? 1 : 0,
        };
        console.log("->", obj);

        $("#host-ip-saved").addClass("hidden");

        if (this.state.host_ip_settings.id) {
            patch("host_ip_settings/%%", this.state.host_ip_settings.id, obj)
                .then(() => $("#host-ip-saved").removeClass("hidden"))
                .catch(errorAlerter);
        } else {
            post("host_ip_settings/", obj)
                .then(() => {
                    $("#host-ip-saved").removeClass("hidden");
                    this.updateHostIpSettings();
                })
                .catch(errorAlerter);
        }
    }

    addFriend(id) {
        post("me/friends", { player_id: id })
            .then(() => this.setState({ friend_request_sent: true }))
            .catch(errorAlerter);
    }
    removeFriend(id) {
        swal({
            text: _("Are you sure you wish to remove this friend?"),
            showCancelButton: true,
        })
            .then(() => {
                post("me/friends", { delete: true, player_id: id })
                    .then(() =>
                        this.setState({
                            friend_request_sent: false,
                            friend_request_received: false,
                            is_friend: false,
                        }),
                    )
                    .catch(errorAlerter);
            })
            .catch(ignore);
    }
    acceptFriend(id) {
        post("me/friends/invitations", { from_user: id })
            .then(() =>
                this.setState({
                    friend_request_sent: false,
                    friend_request_received: false,
                    is_friend: true,
                }),
            )
            .catch(errorAlerter);
    }
    generateAPIKey() {
        if (
            !confirm(
                "Generating a new key will immediate invalidate the previous key, are you sure you wish to continue?",
            )
        ) {
            return;
        }
        post("ui/bot/generateAPIKey", { bot_id: this.state.user.id })
            .then((res) =>
                this.setState({
                    bot_apikey: res.bot_apikey,
                }),
            )
            .catch(errorAlerter);
    }
    saveBot() {
        put("ui/bot/saveBotInfo", { bot_id: this.state.user.id, bot_ai: this.state.bot_ai })
            .then(() => {
                swal("Bot Engine updated").catch(swal.noop);
                this.resolve(this.props);
            })
            .catch(errorAlerter);
    }
    pm() {
        getPrivateChat(this.user_id).open();
    }
    saveSuperUserStuff() {
        let moderation_note = null;
        do {
            moderation_note = prompt("Moderator note:");
            if (moderation_note == null) {
                return;
            }
            moderation_note = moderation_note.trim();
        } while (moderation_note === "");

        put("players/%%/moderate", this.user_id, {
            player_id: this.user_id,
            is_bot: $("#user-su-is-bot").is(":checked") ? 1 : 0,
            bot_owner: $("#user-su-bot-owner").val(),
            username: $("#user-su-username").val(),
            password: $("#user-su-password").val(),
            email: $("#user-su-email").val(),

            moderation_note: moderation_note,
            numProvisional: parseInt($("#user-su-num-provisional").val()),
            ranking: parseInt($("#user-su-ranking-overall").val()),
            rating: $("#user-su-rating-overall").val(),
            ranking_blitz: parseInt($("#user-su-ranking-blitz").val()),
            rating_blitz: $("#user-su-rating-blitz").val(),
            ranking_live: parseInt($("#user-su-ranking-live").val()),
            rating_live: $("#user-su-rating-live").val(),
            ranking_correspondence: parseInt($("#user-su-ranking-correspondence").val()),
            rating_correspondence: $("#user-su-rating-correspondence").val(),
            is_active: $("#user-su-active").is(":checked") ? 1 : 0,
            supporter: $("#user-su-site-supporter").is(":checked") ? 1 : 0,
            is_banned: $("#user-su-banned").is(":checked") ? 1 : 0,
            is_shadowbanned: $("#user-su-shadowbanned").is(":checked") ? 1 : 0,
            is_watched: $("#user-su-watched").is(":checked") ? 1 : 0,
            can_create_tournaments: $("#user-su-can-create-tournaments").is(":checked") ? 1 : 0,
            locked_username: $("#user-su-locked-username").is(":checked") ? 1 : 0,
            locked_ranking: $("#user-su-locked-ranking").is(":checked") ? 1 : 0,
            clear_icon: $("#user-su-clear-icon").is(":checked") ? 1 : 0,
        })
            //.then(()=>$("#user-su-controls").modal('toggle'))
            .then(() => alert("Should be toggling modal")) // TODO
            .catch(errorAlerter);
    }

    toggleRatings = () => {
        this.setState((state) => ({ temporary_show_ratings: !state.temporary_show_ratings }));
    };
    saveAbout = (ev) => {
        this.setState({ user: Object.assign({}, this.state.user, { about: ev.target.value }) });
    };
    saveEditChanges(profile_card_changes: AvatarCardEditableFields) {
        this.setState({
            editing: false,
            user: Object.assign({}, this.state.user, profile_card_changes, {
                name: `${profile_card_changes.first_name} ${profile_card_changes.last_name}`,
            }),
        });
        put("players/%%", this.user_id, {
            ...profile_card_changes,
            about: this.state.user.about,
        })
            .then(console.log)
            .catch(errorAlerter);
    }
    openModerateUser = () => {
        const modal = openModerateUserModal(this.state.user);
        modal.on("close", () => {
            this.resolve(this.props);
        });
    };

    updateTogglePosition = (_height: number, width: number) => {
        this.setState({ rating_chart_type_toggle_left: width + 30 }); // eyeball enough extra left pad
    };

    render() {
        const user = this.state.user;
        if (!user) {
            return this.renderInvalidUser();
        }
        const editing = this.state.editing;
        const showRatings = this.state.temporary_show_ratings;

        /* any dom binding stuff needs to happen after the template has been
         * processed and added to the dom, this can be done with a 0ms timer */
        const doDomWork = () => {
            try {
                $("#user-su-is-bot").prop("checked", this.state.user.is_bot);
            } catch (e) {
                console.log(e.stack);
            }
        };
        setTimeout(doDomWork, 0);

        const global_user = data.get("config.user");
        const cdn_release = data.get("config.cdn_release");
        const account_links = user.self_reported_account_linkages;

        return (
            <div className="User container">
                <div>
                    <div className="profile-card">
                        <div className="avatar-and-ratings-row">
                            <AvatarCard
                                user={user}
                                force_show_ratings={this.state.temporary_show_ratings}
                                editing={this.state.editing}
                                openModerateUser={this.openModerateUser}
                                onEdit={() => this.setState({ editing: true })}
                                onSave={this.saveEditChanges.bind(this)}
                            />

                            {(!preferences.get("hide-ranks") ||
                                this.state.temporary_show_ratings) &&
                                (!user.professional || global_user.id === user.id) && (
                                    <div className="ratings-container">
                                        {/* Ratings  */}
                                        <h3 className="ratings-title">
                                            {_("Ratings")}
                                            <Toggle
                                                height={14}
                                                width={30}
                                                checked={this.state.show_ratings_in_rating_grid}
                                                id="show-ratings-or-ranks"
                                                onChange={(checked) => {
                                                    this.setState({
                                                        show_ratings_in_rating_grid: checked,
                                                    });
                                                    preferences.set(
                                                        "show-ratings-in-rating-grid",
                                                        checked,
                                                    );
                                                }}
                                            />
                                        </h3>
                                        {this.renderRatingGrid(
                                            this.state.show_ratings_in_rating_grid,
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                {(!preferences.get("hide-ranks") || this.state.temporary_show_ratings) &&
                    (!user.professional || global_user.id === user.id) && (
                        <div className="ratings-row">
                            <div className="ratings-chart">
                                {this.state.rating_graph_plot_by_games ? (
                                    <RatingsChartByGame
                                        playerId={this.user_id}
                                        speed={this.state.selected_speed}
                                        size={this.state.selected_size}
                                        updateChartSize={this.updateTogglePosition}
                                    />
                                ) : (
                                    <RatingsChart
                                        playerId={this.user_id}
                                        speed={this.state.selected_speed}
                                        size={this.state.selected_size}
                                        updateChartSize={this.updateTogglePosition}
                                    />
                                )}
                            </div>
                            {this.state.show_graph_type_toggle && (
                                <div
                                    className="graph-type-toggle"
                                    style={{
                                        left: this.state.rating_chart_type_toggle_left,
                                    }}
                                >
                                    <Toggle
                                        height={10}
                                        width={20}
                                        checked={this.state.rating_graph_plot_by_games}
                                        id="show-ratings-in-days"
                                        onChange={(checked) => {
                                            this.setState({ rating_graph_plot_by_games: checked });
                                            preferences.set("rating-graph-plot-by-games", checked);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                {preferences.get("hide-ranks") && (
                    <button className="danger toggle-ratings" onClick={this.toggleRatings}>
                        {showRatings ? _("Hide ratings") : _("Show ratings")}
                    </button>
                )}

                <div className="row">
                    <div className="col-sm-8">
                        {(window["user"]?.is_moderator || null) && (
                            <ModTools user_id={this.user_id} show_mod_log={this.show_mod_log} />
                        )}

                        {(user.about || editing || null) && (
                            <Card>
                                <div className="about-container">
                                    {!editing && user.about && (
                                        <div className="about-markdown">
                                            <Markdown source={user.about} />
                                        </div>
                                    )}
                                    {(editing || null) && (
                                        <textarea
                                            className="about-editor"
                                            rows={15}
                                            onChange={this.saveAbout}
                                            placeholder={_("About yourself")}
                                            value={user.about}
                                        />
                                    )}
                                </div>
                            </Card>
                        )}

                        {(this.state.active_games.length > 0 || null) && (
                            <h2>
                                {_("Active Games")} ({this.state.active_games.length})
                            </h2>
                        )}
                        <GameList list={this.state.active_games} player={user} />

                        <div className="row">
                            <GameHistoryTable user_id={this.user_id} />
                        </div>

                        <div className="row">
                            <ReviewsAndDemosTable user_id={this.user_id} />
                        </div>
                    </div>

                    <div className="col-sm-4">
                        {!user.professional && (
                            <div>
                                {(!preferences.get("hide-ranks") ||
                                    this.state.temporary_show_ratings) &&
                                    (!user.professional || global_user.id === user.id) &&
                                    account_links && (
                                        <Card>
                                            <SelfReportedAccountLinkages links={account_links} />
                                        </Card>
                                    )}

                                {(this.state.achievements.length > 0 || null) && (
                                    <Card>
                                        <h3>{_("Achievements")}</h3>
                                        <AchievementList list={this.state.achievements} />
                                    </Card>
                                )}

                                {(this.state.titles.length > 0 ||
                                    this.state.trophies.length > 0 ||
                                    null) && (
                                    <Card>
                                        <h3>{_("Trophies")}</h3>

                                        {this.state.titles.length > 0 && (
                                            <div className="trophies">
                                                {this.state.titles.map((title, idx) => (
                                                    <img
                                                        key={idx}
                                                        className="trophy"
                                                        src={`${cdn_release}/img/trophies/${title.icon}`}
                                                        title={title.title}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {this.state.trophies.length > 0 && (
                                            <div className="trophies">
                                                {this.state.trophies.map((trophy, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={
                                                            trophy.tournament_id
                                                                ? "/tournament/" +
                                                                  trophy.tournament_id
                                                                : "#"
                                                        }
                                                    >
                                                        <img
                                                            className="trophy"
                                                            src={`${cdn_release}/img/trophies/${trophy.icon}`}
                                                            title={trophy.title}
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {(user.id === 519197 || null) && (
                                            <React.Fragment>
                                                <hr />
                                                <div className="SpicyDragon-trophy">
                                                    <img
                                                        src="https://cdn.online-go.com/spicydragon/spicydragon400.jpg"
                                                        width={400}
                                                        height={340}
                                                    />
                                                    <div>
                                                        {pgettext(
                                                            "Special trophy for a professional go player",
                                                            "1004 simultaneous correspondence games",
                                                        )}
                                                    </div>
                                                    <div>
                                                        {moment("2020-07-20T14:38:37").format(
                                                            "LLLL",
                                                        )}
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        )}
                                    </Card>
                                )}
                            </div>
                        )}

                        {this.state.vs.wins + this.state.vs.losses + this.state.vs.draws > 0 && (
                            <div>
                                <VersusCard
                                    {...this.state.vs}
                                    username={this.state.user.username}
                                />
                            </div>
                        )}

                        {user.is_bot && user.bot_owner && user.bot_owner.id === window["user"].id && (
                            <div>
                                <h2>{_("Bot Controls")}</h2>
                                <div className="well">
                                    <h5>
                                        {_("API Key")}
                                        <button
                                            className="btn btn-xs btn-default"
                                            onClick={() => this.generateAPIKey()}
                                        >
                                            {_("Generate API Key")}
                                        </button>
                                    </h5>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={this.state.bot_apikey}
                                        readOnly
                                    />
                                    <h5>{_("Bot Engine")}</h5>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={_("Engine Name")}
                                        value={this.state.bot_ai || ""}
                                        onChange={(event) =>
                                            this.setState({
                                                bot_ai: (event.target as HTMLInputElement).value,
                                            })
                                        }
                                    />
                                    <div style={{ textAlign: "right" }}>
                                        <button
                                            className="btn btn-xs btn-default"
                                            onClick={() => this.saveBot()}
                                        >
                                            {_("Save")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {this.state.ip && (
                            <Card>
                                <div>
                                    <b>IP</b>
                                    <span> {this.state.ip}</span>
                                </div>
                                <div>
                                    <b>Country</b>
                                    <span>
                                        {" "}
                                        {this.state.ip.country} /{" "}
                                        {cc_to_country_name(this.state.ip.country)}
                                    </span>
                                </div>
                                <div>
                                    <b>Region</b>
                                    {this.state.ip.subdivisions.map((sd, idx) => (
                                        <span key={idx}> {sd} </span>
                                    ))}
                                </div>
                                <div>
                                    <b>Map</b>
                                    <span>
                                        {" "}
                                        <a
                                            href={`https://maps.google.com/maps?ll=${this.state.ip.location[0]},${this.state.ip.location[1]}`}
                                            target="_blank"
                                        >
                                            map
                                        </a>
                                    </span>
                                </div>
                                <div>
                                    <b>IP Shadowbanned</b>{" "}
                                    <span>
                                        {parseInt(user.ip_shadowbanned as any) === 1
                                            ? _("Yes")
                                            : _("No")}
                                    </span>
                                </div>
                                {this.state.host_ip_settings && (
                                    <div>
                                        <form className="form-horizontal" role="form">
                                            <div className="form-group" style={marginBottom0}>
                                                <label
                                                    className="col-xs-7"
                                                    htmlFor="clients-limit "
                                                >
                                                    User limit
                                                </label>
                                                <div className="col-xs-5">
                                                    <input
                                                        type="number"
                                                        id="clients-limit"
                                                        style={{ width: "5rem" }}
                                                        value={
                                                            this.state.host_ip_settings
                                                                .clients_limit
                                                        }
                                                        onChange={(event) =>
                                                            this.setState({
                                                                host_ip_settings: updateDup(
                                                                    this.state.host_ip_settings,
                                                                    "clients_limit",
                                                                    parseInt(
                                                                        (
                                                                            event.target as HTMLInputElement
                                                                        ).value,
                                                                    ),
                                                                ),
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group" style={marginBottom0}>
                                                <label
                                                    className="col-xs-7"
                                                    htmlFor="ban-affects-all"
                                                >
                                                    Ban affects all
                                                </label>
                                                <div className="col-xs-5">
                                                    <input
                                                        type="checkbox"
                                                        id="ban-affects-all"
                                                        value={
                                                            this.state.host_ip_settings
                                                                .ban_affects_all as any
                                                        }
                                                        onChange={(event) =>
                                                            this.setState({
                                                                host_ip_settings: updateDup(
                                                                    this.state.host_ip_settings,
                                                                    "ban_affects_all",
                                                                    (
                                                                        event.target as HTMLInputElement
                                                                    ).checked,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group" style={marginBottom0}>
                                                <label
                                                    className="col-xs-7"
                                                    htmlFor="chatban-affects-all"
                                                >
                                                    Chatban affects all
                                                </label>
                                                <div className="col-xs-5">
                                                    <input
                                                        type="checkbox"
                                                        id="chatban-affects-all"
                                                        value={
                                                            this.state.host_ip_settings
                                                                .chatban_affects_all as any
                                                        }
                                                        onChange={(event) =>
                                                            this.setState({
                                                                host_ip_settings: updateDup(
                                                                    this.state.host_ip_settings,
                                                                    "chatban_affects_all",
                                                                    (
                                                                        event.target as HTMLInputElement
                                                                    ).checked,
                                                                ),
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group" style={marginBottom0}>
                                                <label className="col-xs-7" htmlFor=""></label>
                                                <div className="col-xs-5">
                                                    <button
                                                        className="btn btn-default btn-xs"
                                                        onClick={() => this.saveHostIpSettings()}
                                                    >
                                                        save
                                                    </button>
                                                    <i
                                                        id="host-ip-saved"
                                                        className="fa fa-check-circle-o won hidden"
                                                    ></i>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </Card>
                        )}

                        <h2>{_("Activity")}</h2>
                        <Card className="activity-card">
                            <h4>
                                {_("Vacation Accrued:")}{" "}
                                {this.isSpecialUser() ? _("(Supporter)") : _("(Non-Supporter)")}
                            </h4>
                            {!user.on_vacation && <div>{this.vacationAccrued()}</div>}
                            {user.on_vacation && <div>{_("User On Vacation")}</div>}
                            <h4>{_("Ladders")}</h4>
                            {this.state.ladders.length > 0 && (
                                <div>
                                    <dl className="activity-dl">
                                        {this.state.ladders.map((ladder, idx) => (
                                            <dd key={idx}>
                                                #{ladder.rank}{" "}
                                                <Link to={`/ladder/${ladder.id}`}>
                                                    {ladder.name}
                                                </Link>
                                            </dd>
                                        ))}
                                    </dl>
                                </div>
                            )}
                            {!this.state.ladders.length && (
                                <div>
                                    <div>{_("Not participating in any ladders")}</div>
                                </div>
                            )}

                            <h4>{_("Tournaments")}</h4>
                            {this.state.tournaments.length > 0 && (
                                <div>
                                    <dl className="activity-dl">
                                        {this.state.tournaments.map((tournament, idx) => (
                                            <dd key={idx}>
                                                <Link to={`/tournament/${tournament.id}`}>
                                                    <img src={tournament.icon} className="icon" />{" "}
                                                    {tournament.name}
                                                </Link>
                                            </dd>
                                        ))}
                                    </dl>
                                </div>
                            )}
                            {!this.state.tournaments.length && (
                                <div>
                                    <div>{_("Not participating in any tournaments")}</div>
                                </div>
                            )}

                            <h4>{_("Groups")}</h4>
                            {this.state.groups.length > 0 && (
                                <div>
                                    <dl className="activity-dl">
                                        {this.state.groups.map((group, idx) => (
                                            <dd key={idx}>
                                                <Link to={`/group/${group.id}`}>
                                                    <img src={group.icon} className="icon" />{" "}
                                                    {group.name}
                                                </Link>
                                            </dd>
                                        ))}
                                    </dl>
                                </div>
                            )}
                            {!this.state.groups.length && (
                                <div>
                                    <div>{_("Not a member of any groups")}</div>
                                </div>
                            )}
                        </Card>
                    </div>
                    {/* end right col  */}
                </div>
            </div>
        );
    }
    renderInvalidUser() {
        if (this.state.resolved) {
            return (
                <div className="User flex stetch">
                    <div className="container flex fill center-both">
                        <h3>{_("User not found")}</h3>
                    </div>
                </div>
            );
        }
        return (
            <div className="User flex stetch">
                <div className="container flex fill center-both"></div>
            </div>
        );
    }

    renderRatingGrid(show_ratings: boolean) {
        return (
            <div className="ratings-grid">
                <div className="title-row">
                    <span className="title" />
                    <span className="title">
                        <i className="speed-icon fa fa-circle-o" title={_("Overall")} />
                    </span>
                    <span className="title">
                        <i className="speed-icon fa fa-bolt" title={_("Blitz")} />
                    </span>
                    <span className="title">
                        <i className="speed-icon fa fa-clock-o" title={_("Live")} />
                    </span>
                    <span className="title">
                        <i className="speed-icon ogs-turtle" title={_("Correspondence")} />
                    </span>
                </div>
                {[0, 9, 13, 19].map((size) => (
                    <div key={size} className="speed">
                        {size > 0 ? (
                            <span className="title">
                                {size}x{size}
                            </span>
                        ) : (
                            <span className="title">
                                <i className="speed-icon fa fa-circle-o" title={_("Overall")} />
                            </span>
                        )}

                        {["overall", "blitz", "live", "correspondence"].map((speed) => (
                            <span key={speed} className="cell">
                                {this.renderRatingOrRank(speed, size, show_ratings)}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        );
    }
    renderRatingOrRank(speed, size, show_rating: boolean): JSX.Element {
        const r = getUserRating(this.state.user, speed, size);

        return (
            <div
                className={
                    `rating-entry ${speed}-${size}x${size} ` +
                    (r.unset ? "unset " : "") +
                    (speed === this.state.selected_speed && size === this.state.selected_size
                        ? "active"
                        : "")
                }
                onClick={() => this.setState({ selected_size: size, selected_speed: speed })}
            >
                <div className="rating">
                    <span className="left">
                        {show_rating
                            ? humble_rating(r.rating, r.deviation).toFixed(0)
                            : boundedRankString(
                                  rating_to_rank(humble_rating(r.rating, r.deviation)),
                                  true,
                              )}
                    </span>
                    &plusmn;
                    <span className="right">
                        {show_rating
                            ? r.deviation.toFixed(0)
                            : rank_deviation(r.rating, r.deviation).toFixed(1)}
                    </span>
                </div>
            </div>
        );
    }
}

function SelfReportedAccountLinkages({ links }: { links: any }): JSX.Element {
    const has_association = links.org1 || links.org2 || links.org3;
    let has_other_server = false;
    for (const key in links) {
        if (
            key !== "hidden" &&
            key !== "hidden_ids" &&
            key !== "last_updated" &&
            !(key.indexOf("org") === 0) &&
            links[key]
        ) {
            has_other_server = true;
        }
    }

    return (
        <div className="SelfReportedAccountLinkages">
            {has_association && <h3>{_("Associations")}</h3>}
            <AssociationLink country={links.org1} id={links.org1_id} rank={links.org1_rank} />
            <AssociationLink country={links.org2} id={links.org2_id} rank={links.org2_rank} />
            <AssociationLink country={links.org3} id={links.org3_id} rank={links.org3_rank} />

            {has_other_server && <h3>{_("Servers")}</h3>}
            <ServerLink name={_("KGS")} id={links.kgs_username} rank={links.kgs_rank} />
            <ServerLink name={_("IGS / PandaNet")} id={links.igs_username} rank={links.igs_rank} />
            <ServerLink name={_("DGS")} id={links.dgs_username} rank={links.dgs_rank} />
            <ServerLink
                name={_("Little Golem")}
                id={links.golem_username}
                rank={links.golem_rank}
            />
            <ServerLink name={_("WBaduk")} id={links.wbaduk_username} rank={links.wbaduk_rank} />
            <ServerLink name={_("Tygem")} id={links.tygem_username} rank={links.tygem_rank} />
            <ServerLink name={_("Fox")} id={links.fox_username} rank={links.fox_rank} />
            <ServerLink name={_("Yike Weiqi")} id={links.yike_username} rank={links.yike_rank} />
            <ServerLink name={_("GoQuest")} id={links.goquest_username} rank={links.goquest_rank} />
        </div>
    );
}
function AssociationLink({
    country,
    id,
    rank,
}: {
    country: string;
    id?: string;
    rank?: string;
}): JSX.Element {
    try {
        if (!country) {
            return null;
        }

        const association = associations.filter((a) => a.country === country)[0];
        let linker: (id: string) => string;

        if (country === "us") {
            linker = (id: string) => `https://agagd.usgo.org/player/${id}/`;
        }

        if (country === "eu") {
            linker = (id: string) =>
                `https://www.europeangodatabase.eu/EGD/Player_Card.php?&key=${id}`;
        }

        if (country === "ru") {
            linker = (id: string) => `https://gofederation.ru/players/${id}`;
        }

        return (
            <div className="association-link">
                <Flag country={country} />
                <span className="name">{association.acronym || association.name}</span>
                {linker && id ? (
                    <a className="id" href={linker(id)} rel="noopener">
                        {id}
                    </a>
                ) : (
                    <span className="id">{id || ""}</span>
                )}
                <span className="rank">{rank ? rankString(rank) : ""}</span>
            </div>
        );
    } catch (e) {
        return <div>[invalid association]</div>;
    }
}

function ServerLink({ name, id, rank }: { name: string; id?: string; rank?: string }): JSX.Element {
    if (!id && !rank) {
        return null;
    }

    return (
        <div className="server-link">
            <span className="name">{name}</span>
            <span className="id">{id || ""}</span>
            <span className="rank">{rank ? rankString(rank) : ""}</span>
        </div>
    );
}
