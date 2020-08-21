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
import {_, pgettext, interpolate, cc_to_country_name, sorted_locale_countries} from "translate";
import {Link} from "react-router-dom";
import {openModal} from 'Modal';
import {NotesModal} from 'NotesModal';
import {post, get, put, del, patch} from "requests";
import { parse } from 'query-string';
import * as data from "data";
import * as moment from "moment";
import {Card} from 'material';
import {PlayerIcon} from 'PlayerIcon';
import {GameList} from "GameList";
import {Player} from "Player";
import * as preferences from "preferences";
import {updateDup, alertModerator, getGameResultText, ignore} from "misc";
import {longRankString, rankString, getUserRating, humble_rating, effective_outcome} from "rank_utils";
import {durationString, daysOnlyDurationString} from "TimeControl";
import {openModerateUserModal} from "ModerateUser";
import {openSupporterAdminModal} from "SupporterAdmin";
import {PaginatedTable} from "PaginatedTable";
import {challenge} from "ChallengeModal";
import {errorAlerter} from "misc";
import * as player_cache from "player_cache";
import {getPrivateChat} from "PrivateChat";
import {PlayerAutocomplete} from "PlayerAutocomplete";
import * as Dropzone from "react-dropzone";
import {image_resizer} from "image_resizer";
import {Flag} from "Flag";
import {Markdown} from "Markdown";
import {RatingsChart} from 'RatingsChart';
import {UIPush} from "UIPush";

declare let swal;

interface UserProperties {
    match: {
        params: any
    };
    location?: any;
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
}

let UserRating = (props: {rating: number}) => {
    let wholeRating = Math.floor(props.rating);
    return <span className="UserRating">{wholeRating}</span>;
};

let rating_percentage = (rating: number) => {
    rating %= 100;
    rating = rating >= 0 ? rating : rating + 100;
    return rating;
};

let Rank = (props: {ranking: number, pro?: boolean}) => (<span>{rankString(props)}</span>);

let inlineBlock = {display: "inline-flex", "align-items": "center"};
let marginRight0 = {marginRight: "0"};
let marginBottom0 = {marginBottom: "0"};
let nowrapAlignTop = {whiteSpace: "nowrap", verticalAlign: "top"};

export class User extends React.PureComponent<UserProperties, any> {
    refs: {
        vacation_left;
        bot_ai;
        game_table;
        review_table;
    };
    user_id: number;
    vacation_left: string;
    original_username: string;
    vacation_update_interval: any;
    moderator_note:any = null;
    moderator_log:any = null;
    moderator_log_anchor: any = React.createRef();
    show_mod_log: boolean;

    constructor(props) {
        super(props);
        this.state = {
            user: null,
            vs: {},
            ratings: {},
            ip: null,
            vacation_left: null,
            vacation_left_text: "",
            ranks: [],
            syncRating: null,
            host_ip_settings: null,
            new_icon: null,
            bot_apikey: null,
            bot_ai: null,
            editing: /edit/.test(window.location.hash),
            selected_speed: 'overall',
            selected_size: 0,
            resolved: false,
            temporary_show_ratings: false,
        };

        this.show_mod_log = parse(this.props.location.search)['show_mod_log'] === '1';
    }

    componentDidMount() {
        window.document.title = _("Player");
        let interval_start = Date.now();
        this.vacation_update_interval = setInterval(() => {
            if (this.state.user) {
                if (this.state.user.on_vacation) {
                    let time_diff = Math.round(((Date.now()) - interval_start) / 1000);
                    let vacation_time_left = this.state.user.vacation_left - time_diff;
                    this.setState({
                        vacation_left_text: vacation_time_left > 0 ? durationString(vacation_time_left) : ("0 " + _("Seconds").toLowerCase())
                    });
                }
            }
        }, 1000);
        this.resolve(this.props);
    }

    componentDidUpdate() {
        if (this.show_mod_log && this.moderator_log_anchor.current !== null) {
            this.moderator_log_anchor.current.scrollIntoView();
        }
    }

    componentWillUnmount() {
        clearInterval(this.vacation_update_interval);
    }

    isSpecialUser() {
        if (this.state.user.supporter || this.state.user.is_moderator || this.state.user.is_superUser) {
            return true;
        }
        return false;
    }

    vacationAccrued() {
        if (this.state.user) {
            let vacation_time_accrued = this.state.user.vacation_left;
            if (this.isSpecialUser()) {
                return daysOnlyDurationString(vacation_time_accrued) + " " + _("out of 60 Days");
            }
            else {
                return daysOnlyDurationString(vacation_time_accrued) + " " + _("out of 30 Days");
            }
        }
        return "User not Found";
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.match.params.user_id !== this.props.match.params.user_id) {
            this.setState({"user": null, resolved: false});
            this.resolve(nextProps);
        }
    }
    resolve(props) {
        this.setState({"user": null, editing:  /edit/.test(window.location.hash)});
        this.user_id = parseInt(props.match.params.user_id || data.get("user").id);
        get("players/%%/full", this.user_id).then((state) => {
            this.setState({resolved: true});
            try {
                this.original_username = state.user.username;
                player_cache.update(state.user);
                this.update(state);
                window.document.title = state.user.username;
            } catch (err) {
                console.error(err.stack);
            }
        }).catch((err) => {
            console.error(err);
            this.setState({"user": null});
        });
    }

    update(state) {
        state.bot_apikey = state.user.bot_apikey;

        state.user.ratings = state.user.ratings;
        state.user.rating = parseFloat(state.user.rating);
        state.user.rating_live = parseFloat(state.user.rating_live);
        state.user.rating_blitz = parseFloat(state.user.rating_blitz);
        state.user.rating_correspondence = parseFloat(state.user.rating_correspondence);
        let user = state.user;
        try {
            state.website_href = user.website.trim().toLowerCase().indexOf("http") !== 0 ? "http://" + user.website : user.website;
        } catch (e) {
            console.log(e.stack);
        }


        let vs = state.vs;
        state.vs.total = vs.wins + vs.losses + vs.draws;
        state.vs.winPercent = (vs.wins / vs.total) * 100.0;
        state.vs.lossPercent = (vs.losses / vs.total) * 100.0;
        state.vs.drawPercent = (vs.draws / vs.total) * 100.0;
        state.vs.recent5 = vs.history ? vs.history.slice(0, 5) : [];
        for (let i = 0; i < state.vs.recent5.length; ++i) {
            state.vs.recent5[i].pretty_date = moment(new Date(state.vs.recent5[i].date)).format("ll");
            //state.vs.recent5[i].pretty_date = moment(new Date(state.vs.recent5[i].date)).calendar();
        }


        state.ranks = [];
        if (state.user.professional) {
            for (let i = 37; i < Math.max(state.user.ranking, 45) + 1; ++i) {
                state.ranks.push({"value": i, "text": longRankString({"ranking": i, "pro": 1})});
            }
        } else {
            for (let i = 0; i < Math.max(state.user.ranking, 35) + 1; ++i) {
                state.ranks.push({"value": i, "text": longRankString(i)});
            }
        }
        state.syncRating = (rank, type) => {
            if (type === "overall") {
                state.user.rating = rank * 100 + 50 - 900;
            } else {
                state.user["rating_" + type] = rank * 100 + 50 - 900;
            }
        };

         if (data.get("config.user").is_moderator) /* aliases  */ {
            state.ip = null;
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

        let last_ip = this.state.user.last_ip;
        get("host_ip_settings/", {"address": last_ip})
        .then((lst) => {
            this.setState({"host_ip_settings": lst.count ? lst.results[0] : {
                "id": 0,
                "address": last_ip,
                "clients_limit": 5,
                "ban_affects_all": true,
                "chatban_affects_all": true
            }});
        })
        .catch(ignore);
    }

    saveHostIpSettings() {
        console.log("Saving host ip settings: ", this.state.host_ip_settings);
        let obj = {
            "address": this.state.host_ip_settings.address,
            "clients_limit": this.state.host_ip_settings.clients_limit,
            "ban_affects_all": this.state.host_ip_settings.ban_affects_all ? 1 : 0,
            "chatban_affects_all": this.state.host_ip_settings.chatban_affects_all ? 1 : 0,
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
        post("me/friends", { "player_id": id })
        .then(() => this.setState({friend_request_sent: true}))
        .catch(errorAlerter);
    }
    removeFriend(id) {
        swal({
            text: _("Are you sure you wish to remove this friend?"),
            showCancelButton: true,
        }).then(() => {
            post("me/friends", { "delete": true, "player_id": id })
            .then(() => this.setState({
                friend_request_sent: false,
                friend_request_received: false,
                is_friend: false
            }))
            .catch(errorAlerter);
        })
        .catch(ignore);
    }
    acceptFriend(id) {
        post("me/friends/invitations", { "from_user": id })
        .then(() => this.setState({
            friend_request_sent: false,
            friend_request_received: false,
            is_friend: true
        }))
        .catch(errorAlerter);
    }
    generateAPIKey() {
        if (!confirm("Generating a new key will immediate invalidate the previous key, are you sure you wish to continue?")) {
            return;
        }
        post("ui/bot/generateAPIKey", { "bot_id": this.state.user.id })
        .then((res) => this.setState({
            bot_apikey: res.bot_apikey
        }))
        .catch(errorAlerter);
    }
    saveBot() {
        put("ui/bot/saveBotInfo", { "bot_id": this.state.user.id, "bot_ai": this.state.bot_ai })
        .then(() => {
            swal("Bot Engine updated");
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
            "player_id": this.user_id,
            "is_bot": $("#user-su-is-bot").is(":checked") ? 1 : 0,
            "bot_owner": $("#user-su-bot-owner").val(),
            "username": $("#user-su-username").val(),
            "password": $("#user-su-password").val(),
            "email": $("#user-su-email").val(),

            "moderation_note": moderation_note,
            "numProvisional": parseInt($("#user-su-num-provisional").val()),
            "ranking": parseInt($("#user-su-ranking-overall").val()),
            "rating": $("#user-su-rating-overall").val(),
            "ranking_blitz": parseInt($("#user-su-ranking-blitz").val()),
            "rating_blitz": $("#user-su-rating-blitz").val(),
            "ranking_live": parseInt($("#user-su-ranking-live").val()),
            "rating_live": $("#user-su-rating-live").val(),
            "ranking_correspondence": parseInt($("#user-su-ranking-correspondence").val()),
            "rating_correspondence": $("#user-su-rating-correspondence").val(),
            "is_active": $("#user-su-active").is(":checked") ? 1 : 0,
            "supporter": $("#user-su-site-supporter").is(":checked") ? 1 : 0,
            "is_banned": $("#user-su-banned").is(":checked") ? 1 : 0,
            "is_shadowbanned": $("#user-su-shadowbanned").is(":checked") ? 1 : 0,
            "is_watched": $("#user-su-watched").is(":checked") ? 1 : 0,
            "can_create_tournaments": $("#user-su-can-create-tournaments").is(":checked") ? 1 : 0,
            "locked_username": $("#user-su-locked-username").is(":checked") ? 1 : 0,
            "locked_ranking": $("#user-su-locked-ranking").is(":checked") ? 1 : 0,
            "clear_icon": $("#user-su-clear-icon").is(":checked") ? 1 : 0,
        })
        //.then(()=>$("#user-su-controls").modal('toggle'))
        .then(() => alert("Should be toggling modal")) // TODO
        .catch(errorAlerter);
    }

    updateIcon = (files) => {
        console.log(files);
        this.setState({new_icon: files[0]});
        image_resizer(files[0], 512, 512).then((file: Blob) => {
            put("players/%%/icon", this.user_id, file)
            .then((res) => {
                console.log("Upload successful", res);
                player_cache.update({
                    id: this.user_id,
                    icon: res.icon,
                });
            })
            .catch(errorAlerter);
        })
        .catch(errorAlerter);
    }
    clearIcon = () => {
        this.setState({new_icon: null});
        del("players/%%/icon", this.user_id)
        .then((res) => {
            console.log("Cleared icon", res);
            player_cache.update({
                id: this.user_id,
                icon: res.icon,
            });
        })
        .catch(errorAlerter);
    }
    toggleEdit = () => {
        if (this.state.editing) {
            this.saveEditChanges();
        } else {
            this.setState({editing: true});
        }
    }
    toggleRatings = () => {
        this.setState((state) => ({temporary_show_ratings: !state.temporary_show_ratings}));
    }
    saveCountry = (ev) => {
        this.setState({user: Object.assign({}, this.state.user, {country: ev.target.value})});
    }
    saveAbout = (ev) => {
        this.setState({user: Object.assign({}, this.state.user, {about: ev.target.value})});
    }
    saveUsername = (ev) => {
        this.setState({user: Object.assign({}, this.state.user, {username: ev.target.value})});
    }
    saveWebsite = (ev) => {
        this.setState({user: Object.assign({}, this.state.user, {website: ev.target.value})});
    }
    saveRealFirstName = (ev) => {
        this.setState({user: Object.assign({}, this.state.user, {
            first_name: ev.target.value,
            name: ev.target.value + " " + (this.state.user.last_name || ""),
        })});
    }
    saveRealLastName = (ev) => {
        this.setState({user: Object.assign({}, this.state.user, {
            last_name: ev.target.value,
            name: (this.state.user.first_name || "") + " " + ev.target.value,
        })});
    }
    saveRealNameIsPrivate = (ev) => {
        this.setState({user: Object.assign({}, this.state.user, { real_name_is_private: ev.target.checked})});
    }
    saveEditChanges() {
        let username = this.state.user.username.trim();
        let promise: Promise<void>;
        if (!data.get('user').is_moderator && (this.original_username !== username)) {
            promise = swal({
                text: _("You can only change your name once every 30 days. Are you sure you wish to change your username at this time?"),
                showCancelButton: true,
            });
        }
        else {
            promise = Promise.resolve();
        }
        promise.then(() => {
            this.setState({editing: false, user: Object.assign({}, this.state.user, {username: username})});
            put("players/%%", this.user_id, {
                "username": username,
                "first_name": this.state.user.first_name,
                "last_name": this.state.user.last_name,
                "about": this.state.user.about,
                "website": this.state.user.website,
                "country": this.state.user.country,
                "real_name_is_private": this.state.user.real_name_is_private,
            })
            .then((res) => {
                console.log(res);
            })
            .catch(errorAlerter);
        })
        .catch(ignore);
    }
    openModerateUser = () => {
        let modal = openModerateUserModal(this.state.user);
        modal.on("close", () => {
            this.resolve(this.props);
        });
    }

    updateGameSearch = (player) => {
        if (player) {
            this.refs.game_table.filter.alt_player = player.id;
        } else {
            delete this.refs.game_table.filter.alt_player;
        }
        this.refs.game_table.filter_updated();
    }
    updateReviewSearch = (player) => {
        if (player) {
            this.refs.review_table.filter.alt_player = player.id;
        } else {
            delete this.refs.review_table.filter.alt_player;
        }
        this.refs.review_table.filter_updated();
    }


    addModeratorNote = () => {
        let txt = this.moderator_note.value.trim();

        if (txt.length < 2) {
            this.moderator_note.focus();
            return;
        }

        put(`players/${this.user_id}/moderate`, {
            moderation_note: txt
        })
        .then(() => { })
        .catch(errorAlerter);

        this.moderator_note.value = "";
    }

    render() {
        let user = this.state.user;
        if (!user) { return this.renderInvalidUser(); }
        let editing = this.state.editing;
        let showRatings = this.state.temporary_show_ratings;

        /* any dom binding stuff needs to happen after the template has been
         * processed and added to the dom, this can be done with a 0ms timer */
        let domWorkScaleback = 1;
        let doDomWork = () => {
            try {
                $("#user-su-is-bot").prop("checked", this.state.user.is_bot);
            } catch (e) {
                console.log(e.stack);
            }
        };
        setTimeout(doDomWork, 0);

        const rows = [
            ["a1", "b1", "c1"],
            ["a2", "b2", "c2"],
            ["a3", "b3", "c3"],
            // .... and more
        ];

        let game_history_groomer = (results) => {

            let ret = [];
            for (let i = 0; i < results.length; ++i) {
                let r = results[i];
                let item: any = {
                    "id": r.id,
                };

                item.width = r.width;
                item.height = r.height;
                item.date = r.ended ? new Date(r.ended) : null;
                item.ranked = r.ranked;
                item.handicap = r.handicap;
                item.black = r.players.black;
                item.black_won = !r.black_lost && r.white_lost;
                item.black_class = item.black_won ? (item.black.id === this.user_id ? "library-won" : "library-lost") : "";
                item.white = r.players.white;
                item.white_won = !r.white_lost && r.black_lost;
                item.white_class = item.white_won ? (item.white.id === this.user_id ? "library-won" : "library-lost") : "";
                item.historical = r.historical_ratings;

                if (preferences.get("hide-ranks")) {
                    item.result_class = "library-hidden-result";
                } else {
                    let outcome = effective_outcome(item.historical.black.ratings.overall.rating, item.historical.white.ratings.overall.rating, item.handicap);
                    if ((r.white_lost && r.black_lost) || (!r.white_lost && !r.black_lost) || r.annulled) {
                        item.result_class = "library-tie-result";
                    } else if (item.white.id === this.user_id) /* played white */ {
                        if (item.ranked) {
                            if (item.white_won) /* player won */ {
                                item.result_class = outcome.white_effective_stronger ? "library-won-result-vs-weaker" : "library-won-result-vs-stronger";
                            } else if (item.black_won) /* player lost */ {
                                item.result_class = outcome.white_effective_stronger ? "library-lost-result-vs-weaker" : "library-lost-result-vs-stronger";
                            }
                        } else {
                            item.result_class = item.white_won ? "library-won-result-unranked" : "library-lost-result-unranked"; /* tie catched above */
                        }
                    } else if (item.black.id === this.user_id) /* played black */ {
                        if (item.ranked) {
                            if (item.black_won) /* player won */ {
                                item.result_class = outcome.black_effective_stronger ? "library-won-result-vs-weaker" : "library-won-result-vs-stronger";
                            } else if (item.white_won) /* player black */ {
                                item.result_class = outcome.black_effective_stronger ? "library-lost-result-vs-weaker" : "library-lost-result-vs-stronger";
                            }
                        } else {
                            item.result_class = item.black_won ? "library-won-result-unranked" : "library-lost-result-unranked"; /* tie catched above */
                        }
                    }
                }

                if ("time_control_parameters" in r) {
                    let tcp = JSON.parse(r.time_control_parameters);
                    if ("speed" in tcp) {
                        item.speed = tcp.speed[0].toUpperCase() + tcp.speed.slice(1); // capitalize string
                    }
                }
                if (!item.speed) { // fallback
                    if (r.time_per_move >= 3600 || r.time_per_move === 0) {
                        item.speed = "Correspondence";
                    } else if (r.time_per_move < 10 && r.time_per_move > 0) {
                        item.speed = "Blitz";
                    } else if (r.time_per_move < 3600 && r.time_per_move >= 10) {
                        item.speed = "Live";
                    } else {
                        console.log("time_per_move < 0");
                    }
                }
                if (item.speed === "Correspondence") {
                    item.speed_icon_class = "speed-icon ogs-turtle";
                } else if (item.speed === "Blitz") {
                    item.speed_icon_class = "speed-icon fa fa-bolt";
                } else if (item.speed === "Live") {
                    item.speed_icon_class = "speed-icon fa fa-clock-o";
                } else {
                    console.log("unsupported speed setting: " + item.speed);
                }

                item.name = r.name;

                if (item.name && item.name.trim() === "") {
                    item.name = item.href;
                }

                item.href = "/game/" + item.id;
                item.result = getGameResultText(r);

                ret.push(item);
            }
            return ret;
        };

        let review_history_groomer = (results) => {
            let ret = [];

            for (let i = 0; i < results.length; ++i) {
                let r = results[i];
                let item: any = {
                    "id": r.id,
                };

                item.width = r.width;
                item.height = r.height;
                item.date = r.created ? new Date(r.created) : null;
                item.black = r.players.black;
                item.black_won = !r.black_lost && r.white_lost;
                item.black_class = item.black_won ? (item.black.id === this.user_id ? "library-won" : "library-lost") : "";
                item.white = r.players.white;
                item.white_won = !r.white_lost && r.black_lost;
                item.white_class = item.white_won ? (item.white.id === this.user_id ? "library-won" : "library-lost") : "";
                item.name = r.name;
                item.href = "/review/" + item.id;
                item.historical = r.game.historical_ratings || { 'black': item.black, 'white': item.white };

                if (!item.name || item.name.trim() === "") {
                    item.name = item.href;
                }

                ret.push(item);
            }
            return ret;
        };

        let cleaned_website = "";
        if (user && user.website) {
            if (user.website.indexOf("http") !== 0) {
                cleaned_website = "http://" + user.website;
            } else {
                cleaned_website = user.website;
            }
        }


        let global_user = data.get("config.user");
        let cdn_release = data.get("config.cdn_release");

        return (
          <div className="User container">
            <div>{/* Profile card  */}
                <div className="profile-card">
                    <div className="avatar-and-ratings-row">
                        <div className="avatar-container">{/* Avatar container */}
                            {editing
                                ? <input className='username-input' value={user.username} onChange={this.saveUsername} placeholder={_("User Name")} />
                                : <span className='username'><Player user={user}/></span>
                            }

                            {preferences.get("hide-ranks") && this.state.temporary_show_ratings &&
                                 <span className='Player-rank'>{'[' + getUserRating(user).bounded_rank_label + ']'}</span>
                            }

                            {editing
                                ?  <div className='dropzone-container'><Dropzone className="Dropzone" onDrop={this.updateIcon} multiple={false}>
                                    {this.state.new_icon
                                        ? <img src={this.state.new_icon.preview} style={{height: "128px", width: "128px"}} />
                                        : <PlayerIcon id={user.id} size={128} />
                                    }
                                   </Dropzone></div>
                                : <PlayerIcon id={user.id} size={128} />
                            }
                            {editing &&
                                <div className='clear-icon-container'>
                                    <button className='xs' onClick={this.clearIcon}>{_("Clear icon")}</button>
                                </div>
                            }

                            <div className='avatar-subtext'>
                                {(global_user.is_moderator && user.is_watched) && <div ><h3 style={inlineBlock}><i className="fa fa-exclamation-triangle"></i> Watched <i className="fa fa-exclamation-triangle"></i></h3></div>}

                                {(user.ui_class_extra && user.ui_class_extra.indexOf("aga") >= 0) && <div ><h4 style={inlineBlock}><img src="https://cdn.online-go.com/assets/agaico1.png" /> {_("AGA Staff")} </h4></div>}

                                {(user.timeout_provisional) && <div ><h4 style={inlineBlock}><i className="fa fa-exclamation-triangle"></i> {_("Has recently timed out of a game")} <i className="fa fa-exclamation-triangle"></i></h4></div>}

                                {(!user.is_superuser && user.is_moderator) && <div ><h3 style={inlineBlock}><i className="fa fa-gavel"></i> {_("Moderator")}</h3></div>}

                                {(!user.is_moderator && user.supporter) && <div ><h3 style={inlineBlock}><i className="fa fa-star"></i> {_("Site Supporter")} <i className="fa fa-star"></i></h3></div>}

                                {(user.is_superuser) && <div ><h3 style={inlineBlock}><i className="fa fa-smile-o fa-spin"></i> {_("OGS Developer")} <i className="fa fa-smile-o fa-spin"></i></h3></div>}

                                {(!user.is_superuser && user.is_tournament_moderator) && <div ><h3 style={inlineBlock}><i className="fa fa-trophy"></i> {_("Tournament Moderator")} <i className="fa fa-trophy"></i></h3></div>}

                                {(user.on_vacation) && <div ><h3 style={inlineBlock}><i className="fa fa-smile-o fa-spin"></i> {_("On Vacation")} - {this.state.vacation_left_text} <i className="fa fa-smile-o fa-spin"></i></h3></div>}
                            </div>

                            {(editing || null) &&
                                <div>
                                    <input className='name-input' placeholder={_("First") /* translators: First name */} value={user.first_name || ""} onChange={this.saveRealFirstName}/>
                                    &nbsp;
                                    <input className='name-input' placeholder={_("Last") /* translators: Last name */} value={user.last_name || ""} onChange={this.saveRealLastName}/>
                                </div>
                            }
                            {(!editing && user.name) && <div className={user.real_name_is_private ? "italic" : ""}>{user.name}{user.real_name_is_private ? " " + _("(hidden)") : ""}</div>}


                            {(editing || null) && <div ><input type="checkbox" id="real-name-is-private" checked={user.real_name_is_private} onChange={this.saveRealNameIsPrivate}/> <label htmlFor="real-name-is-private">{_("Hide real name")}</label></div>}

                            {(user.is_bot) && <div ><i className="fa fa-star"></i> <b>{_("Artificial Intelligence")}</b> <i className="fa fa-star"></i></div>}
                            {(user.is_bot) && <div id="bot-ai-name">{pgettext("Bot AI engine", "Engine")}: {user.bot_ai}</div>}
                            {(user.is_bot) && <div>{_("Administrator")}: <Player user={user.bot_owner}/></div>}

                            {editing
                              ? <div className='country-line'>
                                    <Flag country={user.country} big/>
                                    <select value={user.country} onChange={this.saveCountry}>
                                        {sorted_locale_countries.map((C) => (
                                            <option key={C.cc} value={C.cc}>{C.name}</option>
                                        ))}
                                    </select>
                                </div>
                              : <div className='country-line'>
                                    <Flag country={user.country} big/>
                                    <span>{cc_to_country_name(user.country)}</span>
                                </div>
                            }


                            {(!editing && user.website) &&
                                <div className='website-url'><a target="_blank" rel="noopener" href={cleaned_website}>{user.website}</a></div>
                            }
                            {(editing || null) &&
                                <div className='website-url'><input type="url" value={user.website} onChange={this.saveWebsite} /></div>
                            }

                            <div className='avatar-buttons'>
                                {((global_user.id === user.id || global_user.is_moderator) || null)   &&
                                    <button onClick={this.toggleEdit} className='xs edit-button'>
                                        <i className={editing ? "fa fa-save" : "fa fa-pencil"}/> {" " + (editing ? _("Save") : _("Edit"))}
                                    </button>
                                }

                                { (window["user"].is_moderator) && <button className="danger xs pull-right" onClick={this.openModerateUser}>{_("Moderator Controls")}</button> }
                            </div>
                        </div>


                        {(!preferences.get("hide-ranks") || this.state.temporary_show_ratings) && (!user.professional || global_user.id === user.id) &&
                            <div className='ratings-container'>{/* Ratings  */}
                                <h3 className='ratings-title'>{_("Ratings")}</h3>
                                {this.renderRatingGrid()}
                            </div>
                        }

                    </div>
                </div>
            </div>


            {(!preferences.get("hide-ranks") || this.state.temporary_show_ratings) && (!user.professional || global_user.id === user.id) &&
                <div className='ratings-row'>
                    <div className='ratings-chart'>
                        <RatingsChart playerId={this.user_id} speed={this.state.selected_speed} size={this.state.selected_size} />
                    </div>
                </div>
            }

            { (preferences.get("hide-ranks")) &&
                <button className="danger toggle-ratings" onClick={this.toggleRatings}>{showRatings ? _("Hide ratings") : _("Show ratings")}</button>
            }

            <div className="row">
                <div className='col-sm-8'>
                    {((window["user"] && window["user"].is_moderator) || null) && <Card > {/* Moderator stuff  */}
                        <b>Users with the same IP or Browser ID</b>
                        <PaginatedTable
                            className="aliases"
                            name="aliases"
                            source={`players/${this.user_id}/aliases/`}
                            columns={[
                                {header: "Registered",   className: "date",       render: (X) => moment(X.registration_date).format("YYYY-MM-DD")},
                                {header: "Last Login",   className: "date",       render: (X) => moment(X.last_login).format("YYYY-MM-DD")},
                                {header: "Browser ID",   sortable:true, className: "browser_id", render: (X) => X.last_browser_id},
                                {header: "User",         className: "",           render: (X) => (
                                    <span>
                                        <Player user={X}/>
                                        {(X.has_notes || null) && <i className="fa fa-file-text-o clickable" onClick={() => openNotes(X.moderator_notes)} />}
                                    </span>
                                )},
                                {header: "Banned",       className: "banned",     render: (X) => X.is_banned ? _("Yes") : _("No")},
                                {header: "Shadowbanned", className: "banned",     render: (X) => X.is_shadowbanned ? _("Yes") : _("No")},
                            ]}
                        />

                        <b>Mod log</b>
                        <UIPush event={`modlog-${this.user_id}-updated`} channel="moderators" action={() => this.moderator_log.update()}/>
                        <div id='leave-moderator-note' ref={this.moderator_log_anchor}>
                            <textarea ref={(x) => this.moderator_note = x} placeholder="Leave note" id="moderator-note" />
                            <button onClick={this.addModeratorNote}>Add note</button>
                        </div>
                        <PaginatedTable
                            className="moderator-log"
                            name="moderator-log"
                            ref={(x) => this.moderator_log = x}
                            source={`moderation?player_id=${this.user_id}`}
                            columns={[
                                {header: "", className: "date", render: (X) => moment(X.timestamp).format("YYYY-MM-DD HH:mm:ss")},
                                {header: "", className: "",     render: (X) => <Player user={X.moderator} />},
                                {header: "", className: "",     render: (X) =>
                                    <div>
                                        <div className='action'>{X.game ? <Link to={`/game/${X.game.id}`}>{X.game.id}</Link> : null}{X.action}</div>
                                        {X.incident_report &&
                                            <div>
                                                {X.incident_report.cleared_by_user ? <div><b>Cleared by user</b></div> : null}
                                                <div>{X.incident_report.url}</div>
                                                <div>{X.incident_report.system_note}</div>
                                                <div>{X.incident_report.reporter_note}</div>
                                                {X.incident_report.moderator ? <Player user={X.incident_report.moderator} /> : null}
                                                <i> {X.incident_report.moderator_note}</i>
                                            </div>
                                        }
                                        <pre>{X.note}</pre>
                                    </div>
                                },
                            ]}
                        />
                    </Card>
                    }

                {(user.about || editing || null) &&
                    <Card>
                        <div className='about-container'>
                            {(!editing && user.about) && <div className='about-markdown'><Markdown source={user.about}/></div>}
                            {(editing || null) && <textarea className='about-editor' rows={15} onChange={this.saveAbout} placeholder={_("About yourself")} value={user.about}/>}
                        </div>
                    </Card>
                }

                {(this.state.active_games.length > 0 || null) && <h2>{_("Active Games")} ({this.state.active_games.length})</h2>}
                <GameList list={this.state.active_games} player={user}/>


                    <div className="row">{/* Game History  */}
                        <div className="col-sm-12">
                            <h2>{_("Game History")}</h2>
                            <Card>
                            <div>{/* loading-container="game_history.settings().$loading" */}
                                <div className="search">
                                    <i className="fa fa-search"></i><PlayerAutocomplete onComplete={this.updateGameSearch}/>
                                </div>

                                <PaginatedTable
                                    className="game-history-table"
                                    ref="game_table"
                                    name="game-history"
                                    method="get"
                                    source={`players/${this.user_id}/games/`}
                                    filter={{
                                        "source": "play",
                                        "ended__isnull": false,
                                    }}
                                    orderBy={["-ended"]}
                                    groom={game_history_groomer}
                                    columns={[
                                        {header: _(""),       className: () => "speed",                           render: (X) => <i className={X.speed_icon_class} title={X.speed} />},
                                        {header: _("Date"),   className: () => "date",                            render: (X) => moment(X.date).format("YYYY-MM-DD")},
                                        {header: _("Size"),   className: () => "board_size",                      render: (X) => `${X.width}x${X.height}`},
                                        {header: _("Name"),   className: () => "name",                            render: (X) => <Link to={X.href}>{X.name || interpolate('{{black_username}} vs. {{white_username}}', {'black_username': X.black.username, 'white_username': X.white.username}) }</Link>},
                                        {header: _("Black"),  className: (X) => ("player " + (X ? X.black_class : "")), render: (X) => <Player user={X.historical.black} disableCacheUpdate />},
                                        {header: _("White"),  className: (X) => ("player " + (X ? X.white_class : "")), render: (X) => <Player user={X.historical.white} disableCacheUpdate />},
                                        {header: _("Result"), className: (X) => (X ? X.result_class : ""),            render: (X) => X.result},
                                    ]}
                                />
                            </div>
                            </Card>
                        </div>
                    </div>

                    <div className="row">{/* Reviews and Demos */}
                        <div className="col-sm-12">
                            <h2>{_("Reviews and Demos")}</h2>
                            <Card>
                                <div>{/* loading-container="game_history.settings().$loading" */}
                                    <div className="search">
                                        <i className="fa fa-search"></i><PlayerAutocomplete onComplete={this.updateReviewSearch}/>
                                    </div>

                                    <PaginatedTable
                                        className="review-history-table"
                                        ref="review_table"
                                        name="review-history"
                                        method="get"
                                        source={`reviews/`}
                                        filter={{
                                            "owner_id": this.user_id,
                                        }}
                                        orderBy={["-created"]}
                                        groom={review_history_groomer}
                                        columns={[
                                            {header: _("Date"),   className: () => "date",                            render: (X) => moment(X.date).format("YYYY-MM-DD")},
                                            {header: _("Name"),   className: () => "name",                            render: (X) => <Link to={X.href}>{X.name}</Link>},
                                            {header: _("Black"),  className: (X) => ("player " + (X ? X.black_class : "")), render: (X) => <Player user={X.historical.black} disableCacheUpdate />},
                                            {header: _("White"),  className: (X) => ("player " + (X ? X.white_class : "")), render: (X) => <Player user={X.historical.white} disableCacheUpdate />},
                                        ]}
                                    />
                                </div>
                            </Card>
                        </div>
                    </div>

                </div>


                <div className="col-sm-4">
                    {(!(user.professional)) &&
                        <div >

                        {(this.state.titles.length > 0 || this.state.trophies.length > 0 || null) &&
                            <Card>
                                <h3>{_("Trophies")}</h3>

                                {(this.state.titles.length > 0) &&
                                    <div className="trophies">
                                        {this.state.titles.map((title, idx) => (<img key={idx} className="trophy" src={`${cdn_release}/img/trophies/${title.icon}`} title={title.title}/>))}
                                    </div>
                                }

                                {(this.state.trophies.length > 0) &&
                                    <div className="trophies">
                                        {this.state.trophies.map((trophy, idx) => (
                                            <a key={idx} href={trophy.tournament_id ? ("/tournament/" + trophy.tournament_id) : "#"}>
                                                <img className="trophy" src={`${cdn_release}/img/trophies/${trophy.icon}`} title={trophy.title}/>
                                            </a>
                                        ))}
                                    </div>
                                }

                                {(user.id === 519197 || null) &&
                                    <React.Fragment>
                                        <hr />
                                        <div className="SpicyDragon-trophy">
                                            <img src='https://cdn.online-go.com/spicydragon/spicydragon400.jpg' width={400} height={340} />
                                            <div>
                                                {pgettext("Special trophy for a professional go player", "1004 simultaneous correspondence games")}
                                            </div>
                                            <div>
                                                {moment("2020-07-20T14:38:37").format("LLLL")}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                }
                            </Card>
                        }

                        </div>
                    }

                    {(this.state.vs.total || null) && <div >
                        <Card>
                            <h5 style={{textAlign: "center"}}>{interpolate("You have won {{vs.wins}} out of {{vs.total}} games against {{username}}", {"vs.wins": this.state.vs.wins, "vs.total": this.state.vs.total, "username": user.username})}</h5>
                            <div className="progress">
                                 {(this.state.vs.winPercent > 0) &&
                                  <div className="progress-bar games-won" style={{width: this.state.vs.winPercent + "%"}}>{this.state.vs.wins}</div>}
                                 {(this.state.vs.lossPercent > 0) &&
                                  <div className="progress-bar games-lost" style={{width: this.state.vs.lossPercent + "%"}}>{this.state.vs.losses}</div>}
                                 {(this.state.vs.drawPercent > 0) &&
                                   <div className="progress-bar primary" style={{width: this.state.vs.drawPercent + "%"}}>{this.state.vs.draws}</div>}
                            </div>

                            {this.state.vs.recent5.map((game, idx) => (
                                <div style={{textAlign: "center"}} key={idx}>
                                    <span className="date">{game.pretty_date}</span> <a href={`/game/${game.game}`}>#{game.game}</a>
                                    {(game.state === "W") && <i  className="fa fa-check-circle-o won"></i>}
                                    {(game.state === "L") && <i  className="fa fa-times loss"></i>}
                                </div>
                            ))}
                        </Card>
                    </div>}

                    {(user.is_bot && user.bot_owner && user.bot_owner.id === window["user"].id) && <div >
                        <h2>{_("Bot Controls")}</h2>
                        <div className="well">
                            <h5>{_("API Key")}
                            <button className="btn btn-xs btn-default" onClick={() => this.generateAPIKey()}>{_("Generate API Key")}</button>
                            </h5>
                            <input type="text" className="form-control" value={this.state.bot_apikey} readOnly />
                            <h5>{_("Bot Engine")}</h5>
                            <input type="text" className="form-control" placeholder={_("Engine Name")} value={this.state.bot_ai || ""}
                                   onChange={(event) => this.setState({"bot_ai": (event.target as HTMLInputElement).value})}/>
                            <div style={{textAlign: "right"}}>
                                <button className="btn btn-xs btn-default" onClick={() => this.saveBot()}>{_("Save")}</button>
                            </div>
                        </div>
                    </div>}

                    {(this.state.ip) && <Card >
                        <div><b>IP</b><span> {this.state.ip}</span></div>
                        <div><b>Country</b><span> {this.state.ip.country} / {cc_to_country_name(this.state.ip.country)}</span></div>
                        <div><b>Region</b>{this.state.ip.subdivisions.map((sd, idx) => (<span key={idx} > {sd} </span>))}</div>
                        <div><b>Map</b><span> <a href={`https://maps.google.com/maps?ll=${this.state.ip.location[0]},${this.state.ip.location[1]}`} target="_blank">map</a></span></div>
                        <div><b>IP Shadowbanned</b> <span>{parseInt(user.ip_shadowbanned) === 1 ? _("Yes") : _("No")}</span></div>
                        {(this.state.host_ip_settings) && <div >
                            <form className="form-horizontal" role="form">
                                <div className="form-group" style={marginBottom0}>
                                    <label className="col-xs-7" htmlFor="clients-limit ">User limit</label>
                                    <div className="col-xs-5">
                                        <input type="number" id="clients-limit" style={{width: "5rem"}} value={this.state.host_ip_settings.clients_limit}
                                               onChange={(event) => this.setState({"host_ip_settings": updateDup(this.state.host_ip_settings, "clients_limit", parseInt((event.target as HTMLInputElement).value))})}
                                        />
                                    </div>
                                </div>
                                <div className="form-group" style={marginBottom0}>
                                    <label className="col-xs-7" htmlFor="ban-affects-all">Ban affects all</label>
                                    <div className="col-xs-5">
                                        <input type="checkbox" id="ban-affects-all" value={this.state.host_ip_settings.ban_affects_all}
                                               onChange={(event) => this.setState({"host_ip_settings": updateDup(this.state.host_ip_settings, "ban_affects_all", (event.target as HTMLInputElement).checked)})}
                                        />
                                    </div>
                                </div>
                                <div className="form-group" style={marginBottom0}>
                                    <label className="col-xs-7" htmlFor="chatban-affects-all">Chatban affects all</label>
                                    <div className="col-xs-5">
                                        <input type="checkbox" id="chatban-affects-all" value={this.state.host_ip_settings.chatban_affects_all}
                                               onChange={(event) => this.setState({"host_ip_settings": updateDup(this.state.host_ip_settings, "chatban_affects_all", (event.target as HTMLInputElement).checked)})}
                                        />
                                    </div>
                                </div>
                                <div className="form-group" style={marginBottom0}>
                                    <label className="col-xs-7" htmlFor=""></label>
                                    <div className="col-xs-5">
                                        <button className="btn btn-default btn-xs" onClick={() => this.saveHostIpSettings()}>save</button>
                                        <i id="host-ip-saved" className="fa fa-check-circle-o won hidden"></i>
                                    </div>
                                </div>
                            </form>
                        </div>}
                    </Card>}


                    <h2>{_("Activity")}</h2>
                    <Card className="activity-card">
                        <h4>{_("Vacation Accrued:")} {this.isSpecialUser() ? _("(Supporter)") : _("(Non-Supporter)")}</h4>
                        {!user.on_vacation && <div >{this.vacationAccrued()}</div>}
                        {user.on_vacation && <div >{_("User On Vacation")}</div>}
                        <h4>{_("Ladders")}</h4>
                        {(this.state.ladders.length > 0) && <div >
                            <dl className="activity-dl">
                                {this.state.ladders.map((ladder, idx) => (
                                <dd key={idx}>
                                    #{ladder.rank} <Link to={`/ladder/${ladder.id}`}>{ladder.name}</Link>
                                </dd>
                                ))}
                            </dl>
                        </div>}
                        {(!this.state.ladders.length) && <div >
                            <div>{_("Not participating in any ladders")}</div>
                        </div>}


                        <h4>{_("Tournaments")}</h4>
                        {(this.state.tournaments.length > 0) && <div >
                            <dl className="activity-dl">
                                {this.state.tournaments.map((tournament, idx) => (
                                <dd key={idx}>
                                    <Link to={`/tournament/${tournament.id}`}><img src={tournament.icon} className="icon" /> {tournament.name}</Link>
                                </dd>
                                ))}
                            </dl>
                        </div>}
                        {(!this.state.tournaments.length) && <div >
                            <div>{_("Not participating in any tournaments")}</div>
                        </div>}

                        <h4>{_("Groups")}</h4>
                        {(this.state.groups.length > 0) && <div >
                            <dl className="activity-dl">
                                {this.state.groups.map((group, idx) => (
                                <dd key={idx}>
                                    <Link to={`/group/${group.id}`}><img src={group.icon} className="icon" /> {group.name}</Link>
                                </dd>
                                ))}
                            </dl>
                        </div>}
                        {(!this.state.groups.length) && <div >
                            <div>{_("Not a member of any groups")}</div>
                        </div>}
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
            <div className="container flex fill center-both">
            </div>
        </div>
        );
    }


    renderRatingGrid() {
        return (
            <div className='ratings-grid'>
                <div className='title-row'>
                    <span className='title'/>
                    <span className='title'><i className="speed-icon fa fa-circle-o" title={_("Overall")} /></span>
                    <span className='title'><i className="speed-icon fa fa-bolt" title={_("Blitz")} /></span>
                    <span className='title'><i className="speed-icon fa fa-clock-o" title={_("Live")} /></span>
                    <span className='title'><i className="speed-icon ogs-turtle" title={_("Correspondence")} /></span>
                </div>
                {[0, 9, 13, 19].map((size) => (
                    <div key={size} className='speed'>
                        {size > 0
                            ?  <span className='title'>
                                 {size}x{size}
                               </span>
                            :  <span className='title'>
                                 <i className="speed-icon fa fa-circle-o" title={_("Overall")} />
                               </span>
                        }

                        {['overall', 'blitz', 'live', 'correspondence'].map((speed) => (
                            <span key={speed} className='cell'>
                                {this.renderRating(speed, size)}
                            </span>
                        ))}
                    </div>
                 ))
                }
            </div>
        );
    }
    renderRating(speed, size) {
        let r = getUserRating(this.state.user, speed, size);

        return (
            <div className={`rating-entry ${speed}-${size}x${size} ` + (r.unset ? 'unset ' : '') + (speed === this.state.selected_speed && size === this.state.selected_size ? 'active' : '')}
                 onClick={() => this.setState({'selected_size': size, 'selected_speed': speed})}
                >
                <div className='rating'>
                    <span className='left'>{humble_rating(r.rating, r.deviation).toFixed(0)}</span>&plusmn;<span className='right'>{r.deviation.toFixed(0)}</span>
                </div>
            </div>
        );
    }

}

function openNotes(notes) {
    openModal(<NotesModal notes={notes} fastDismiss />);
}
