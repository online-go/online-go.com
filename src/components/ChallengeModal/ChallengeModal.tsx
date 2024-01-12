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

import * as data from "data";
import * as player_cache from "player_cache";

import { OgsResizeDetector } from "OgsResizeDetector";
import { browserHistory } from "ogsHistory";
import { _, pgettext, interpolate } from "translate";
import { post, del } from "requests";
import { Modal, openModal } from "Modal";
import { socket } from "sockets";
import {
    rankString,
    getUserRating,
    amateurRanks,
    allRanks,
    rankList,
    bounded_rank,
} from "rank_utils";
import { CreatedChallengeInfo, RuleSet } from "types";
import { errorLogger, errorAlerter, rulesText, dup } from "misc";
import { PlayerIcon } from "PlayerIcon";
import {
    shortShortTimeControl,
    isLiveGame,
    TimeControlPicker,
    timeControlSystemText,
    TimeControl,
} from "TimeControl";
import { sfx } from "sfx";
import { notification_manager, NotificationManagerEvents } from "Notifications/NotificationManager";
import { one_bot, bot_count, bots_list } from "bots";
import { goban_view_mode } from "Game/util";
import {
    Goban,
    GoEngineConfig,
    GoEngineInitialState,
    GoEnginePlayerEntry,
    JGOFTimeControl,
    JGOFTimeControlSpeed,
    JGOFTimeControlSystem,
} from "goban";

import { copyChallengeLinkURL } from "ChallengeLinkButton";

import { alert } from "swal_config";
import {
    recallTimeControlSettings,
    saveTimeControlSettings,
    updateSystem,
} from "TimeControl/TimeControlUpdates";

export type ChallengeDetails = rest_api.ChallengeDetails;

type ChallengeModes = "open" | "computer" | "player" | "demo";

interface Events {}

interface ChallengeModalProperties {
    mode: ChallengeModes;
    playerId?: number;
    initialState?: any;
    config?: ChallengeModalConfig;
    autoCreate?: boolean;
    playersList?: Array<{ name: string; rank: number }>;
    tournamentRecordId?: number;
    tournamentRecordRoundId?: number;
    created?: (c: CreatedChallengeInfo) => void;
}

/* These rejection details come from gtp2ogs and allows bots to
 * be clear about why a challenge is being rejected. */
interface RejectionDetails {
    rejection_code:
        | "blacklisted"
        | "board_size_not_square"
        | "board_size_not_allowed"
        | "handicap_not_allowed"
        | "unranked_not_allowed"
        | "ranked_not_allowed"
        | "blitz_not_allowed"
        | "too_many_blitz_games"
        | "live_not_allowed"
        | "too_many_live_games"
        | "correspondence_not_allowed"
        | "too_many_correspondence_games"
        | "time_control_system_not_allowed"
        | "time_increment_out_of_range"
        | "period_time_out_of_range"
        | "periods_out_of_range"
        | "main_time_out_of_range"
        | "max_time_out_of_range"
        | "per_move_time_out_of_range"
        | "player_rank_out_of_range"
        | "not_accepting_new_challenges"
        | "too_many_games_for_player"
        | "komi_out_of_range";
    details: {
        [key: string]: any;
    };
}

/* Constants  */

const negKomiRanges: number[] = [];
const posKomiRanges: number[] = [];
const maxKomi = 36.5;
for (let komi = 0.0; komi <= maxKomi; komi += 0.5) {
    if (komi - maxKomi !== 0.0) {
        negKomiRanges.push(komi - maxKomi);
    }
    posKomiRanges.push(komi);
}

const handicapRanges: number[] = [];
for (let i = 1; i <= 36; ++i) {
    handicapRanges.push(i);
}

const ranks = amateurRanks();
const demo_ranks = allRanks();

const ranked_ranks = (() => {
    if (!data.get("user")) {
        return [];
    }

    const rankedMin = bounded_rank(getUserRating(data.get("user"), "overall", 0).bounded_rank - 9);
    const rankedMax = bounded_rank(getUserRating(data.get("user"), "overall", 0).bounded_rank + 9);

    return rankList(rankedMin, rankedMax, false);
})();

const standard_board_sizes: { [k: string]: string | undefined } = {
    "19x19": "19x19",
    "13x13": "13x13",
    "9x9": "9x9",
    "25x25": "25x25",
    "21x21": "21x21",
    "5x5": "5x5",
    "19x9": "19x9",
    "5x13": "5x13",
};

export class ChallengeModal extends Modal<Events, ChallengeModalProperties, any> {
    ref: React.RefObject<HTMLDivElement> = React.createRef();

    constructor(props: ChallengeModalProperties) {
        super(props);

        const speed = data.get("challenge.speed", "live");

        const challenge: ChallengeDetails = data.get(`challenge.challenge.${speed}`, {
            initialized: false,
            min_ranking: 5,
            max_ranking: 36,
            challenger_color: "automatic",
            rengo_auto_start: 0,
            game: {
                name: "",
                rules: "japanese",
                ranked: true,
                width: 19,
                height: 19,
                handicap: -1,
                komi_auto: "automatic",
                komi: 5.5,
                disable_analysis: false,
                initial_state: null,
                private: false,
                rengo: false,
                rengo_casual_mode: true,
            },
        });

        // make sure rengo=true doesn't persist into the wrong kinds of challenges
        if (challenge.game.ranked || challenge.game.private || this.props.mode !== "open") {
            challenge.game.rengo = false;
        }

        /* fix dirty data */
        if (
            isNaN(challenge.min_ranking) ||
            challenge.min_ranking < 0 ||
            challenge.min_ranking > 36
        ) {
            challenge.min_ranking = 5;
        }
        if (
            isNaN(challenge.max_ranking) ||
            challenge.max_ranking < 0 ||
            challenge.max_ranking > 36
        ) {
            challenge.max_ranking = 36;
        }

        challenge.game.initial_state = null;
        if (typeof challenge.game.komi !== "number" && !challenge.game.komi) {
            challenge.game.komi = 5.5;
        }

        if (this.props.initialState) {
            challenge.game.initial_state = this.props.initialState;
            challenge.game.komi_auto = "custom";
            challenge.game.komi = this.props.initialState.komi;
            challenge.game.ranked = false;
        }

        this.state = {
            conf: {
                mode: this.props.mode,
                username: "",
                bot_id: data.get("challenge.bot", 0),
                selected_board_size:
                    standard_board_sizes[`${challenge.game.width}x${challenge.game.height}`] ||
                    "custom",
                restrict_rank: data.get("challenge.restrict_rank", false),
            },
            challenge: challenge,

            demo: data.get("demo.settings", {
                name: "",
                rules: "japanese",
                width: 19,
                height: 19,
                black_name: _("Black"),
                black_ranking: 1039,
                white_name: _("White"),
                white_ranking: 1039,
                private: false,
            }),
            forking_game: !!this.props.initialState,
            selected_demo_player_black: 0,
            selected_demo_player_white: this.props.playersList
                ? this.props.playersList.length - 1
                : 0,

            preferred_settings: data.get("preferred-game-settings", []),
            view_mode: goban_view_mode(),
            hide_preferred_settings_on_portrait: true,
            input_value_warning: false,
            time_control: this.loadLastTimeControlSettings(),
        };

        if (this.props.playersList && this.props.playersList.length > 0) {
            this.state.demo.black_name = this.props.playersList[0].name;
            this.state.demo.black_ranking = this.props.playersList[0].rank;
            this.state.demo.white_name =
                this.props.playersList[this.props.playersList.length - 1].name;
            this.state.demo.white_ranking =
                this.props.playersList[this.props.playersList.length - 1].rank;
        }

        const state: any = this.state;

        if (this.props.config) {
            if (this.props.config.challenge) {
                state.challenge = Object.assign(this.state.challenge, this.props.config.challenge);
            }

            if (this.props.config.conf) {
                state.conf = Object.assign(this.state.conf, this.props.config.conf);
            }

            if (this.props.config.time_control) {
                console.log(
                    "Loading time control from config:",
                    JSON.stringify(this.props.config.time_control),
                );
                state.time_control = this.props.config.time_control;
            }
        }

        if (this.state.conf.mode === "computer" && bot_count()) {
            let found_bot = false;
            for (const bot of bots_list()) {
                if (this.state.conf.bot_id === bot.id) {
                    found_bot = true;
                }
            }
            if (!found_bot) {
                state.conf.bot_id = bots_list()[0].id;
            }
        }

        if (this.props.autoCreate) {
            setTimeout(() => {
                this.createChallenge();
                this.close();
            }, 1);
        }

        this.on("open", () => {
            data.watch("preferred-game-settings", this.preferredSettingsUpdated);
        });
        this.on("close", () => {
            data.unwatch("preferred-game-settings", this.preferredSettingsUpdated);
        });
    }

    onResize = () => {
        this.setState({ view_mode: goban_view_mode() });
    };

    preferredSettingsUpdated = (preferred_settings?: ChallengeDetails[]) => {
        if (!preferred_settings) {
            return;
        }
        this.setState({ preferred_settings: preferred_settings });
    };

    syncBoardSize(value: string) {
        const conf = dup(this.state.conf);
        const challenge = dup(this.state.challenge);

        conf.selected_board_size = value;
        if (value !== "custom") {
            const sizes = conf.selected_board_size.split("x");
            challenge.game.width = parseInt(sizes[0]);
            challenge.game.height = parseInt(sizes[1]);
        }

        this.setState({ conf: conf, challenge: challenge });
    }

    setRanked(tf: boolean) {
        const next = this.nextState();

        next.challenge.game.ranked = tf;
        if (tf && this.state.challenge && data.get("user")) {
            next.challenge.game.handicap = Math.min(9, next.challenge.game.handicap);
            next.challenge.game.komi_auto = "automatic";
            next.challenge.min_ranking = Math.max(
                next.challenge.min_ranking,
                data.get("user").ranking - 9,
            );
            next.challenge.min_ranking = Math.min(
                next.challenge.min_ranking,
                data.get("user").ranking + 9,
            );
            next.challenge.max_ranking = Math.max(
                next.challenge.max_ranking,
                data.get("user").ranking - 9,
            );
            next.challenge.max_ranking = Math.min(
                next.challenge.max_ranking,
                data.get("user").ranking + 9,
            );

            if (
                next.conf.selected_board_size !== "19x19" &&
                next.conf.selected_board_size !== "13x13" &&
                next.conf.selected_board_size !== "9x9"
            ) {
                next.conf.selected_board_size = "19x19";
                next.challenge.game.width = 19;
                next.challenge.game.height = 19;
            }
        } else {
            next.challenge.aga_ranked = false;
        }

        this.setState({
            challenge: next.challenge,
            conf: next.conf,
        });
    }

    loadLastTimeControlSettings(): TimeControl {
        const speed = data.get(`time_control.speed`, "correspondence");
        const system = data.get(`time_control.system`, "byoyomi");
        return recallTimeControlSettings(speed, system);
    }

    saveSettings() {
        const next = this.next();
        saveTimeControlSettings(this.state.time_control);
        const speed = data.get("challenge.speed", "live");
        data.set(`challenge.challenge.${speed}`, next.challenge);
        data.set("challenge.bot", next.conf.bot_id);
        data.set("challenge.restrict_rank", next.conf.restrict_rank);
        data.set("demo.settings", next.demo);
    }

    addToPreferredSettings = () => {
        const preferred_settings = data.get("preferred-game-settings", []);
        const challenge = JSON.parse(JSON.stringify(this.getChallenge()));
        preferred_settings.push(challenge);
        data.set(
            "preferred-game-settings",
            [...preferred_settings],
            data.Replication.REMOTE_OVERWRITES_LOCAL,
        );
        if (this.state.view_mode === "portrait") {
            this.setState({ hide_preferred_settings_on_portrait: false });
        }
    };

    deletePreferredSetting = (index: number) => {
        const preferred_settings = data.get("preferred-game-settings", []);
        preferred_settings.splice(index, 1);
        data.set(
            "preferred-game-settings",
            [...preferred_settings],
            data.Replication.REMOTE_OVERWRITES_LOCAL,
        );
    };

    usePreferredSetting = (index: number) => {
        const preferred_settings = data.get("preferred-game-settings", []);
        const setting: ChallengeDetails = JSON.parse(JSON.stringify(preferred_settings[index]));
        if (this.props.mode !== "open") {
            setting.rengo_auto_start = 0;
            setting.game.rengo = false;
            setting.game.rengo_casual_mode = true;
        }
        this.setState({
            challenge: setting,
            time_control: JSON.parse(JSON.stringify(setting.game.time_control_parameters)),
            conf: Object.assign(this.state.conf, {
                selected_board_size:
                    standard_board_sizes[`${setting.game.width}x${setting.game.height}`] ||
                    "custom",
                restrict_rank: setting.min_ranking === -1000 ? false : true,
            }),
        });
    };

    createDemo = () => {
        if (!this.validateBoardSize()) {
            return;
        }

        const next = this.next();

        next.demo.width = next.challenge.game.width;
        next.demo.height = next.challenge.game.height;
        next.demo.name = next.challenge.game.name;

        next.demo.width = next.challenge.game.width;
        next.demo.height = next.challenge.game.height;

        this.setState({
            demo: next.demo,
        });

        const demo: any = {};
        for (const k in next.demo) {
            demo[k] = next.demo[k];
        }

        demo.black_pro = demo.black_ranking > 1000 ? 1 : 0;
        if (demo.black_pro) {
            demo.black_ranking -= 1000;
        }
        demo.white_pro = demo.white_ranking > 1000 ? 1 : 0;
        if (demo.white_pro) {
            demo.white_ranking -= 1000;
        }

        demo.tournament_record_id = this.props.tournamentRecordId;
        demo.tournament_record_round_id = this.props.tournamentRecordRoundId;

        if (!demo.name) {
            demo.name = _("Demo Board");
        }

        console.log("Sending", demo);
        this.close();
        post("demos", demo)
            .then((res) => {
                console.log("Demo create response: ", res);
                browserHistory.push(`/demo/view/${res.id}`);
            })
            .catch(errorAlerter);
    };
    validateBoardSize() {
        const next = this.next();

        try {
            if (
                !parseInt(next.challenge.game.width) ||
                next.challenge.game.width < 1 ||
                next.challenge.game.width > 25
            ) {
                $("#challenge-goban-width").focus();
                return false;
            }
            if (
                !parseInt(next.challenge.game.height) ||
                next.challenge.game.height < 1 ||
                next.challenge.game.height > 25
            ) {
                $("#challenge-goban-height").focus();
                return false;
            }
        } catch (e) {
            return false;
        }
        return true;
    }

    getChallenge(): ChallengeDetails {
        const next = this.next();
        const conf = next.conf;

        const challenge: ChallengeDetails = Object.assign({}, next.challenge);
        challenge.game = Object.assign({}, next.challenge.game);

        if (
            !challenge.game.name ||
            challenge.game.name.trim() === "" ||
            this.props.mode === "computer"
        ) {
            challenge.game.name = _("Friendly Match");
        }

        if (!conf.restrict_rank) {
            challenge.min_ranking = -1000;
            challenge.max_ranking = 1000;
        }

        challenge.game.time_control = this.state.time_control.system;
        challenge.game.time_control_parameters = this.state.time_control;

        /* on our backend we still expect this to be named `time_control` for
         * old legacy reasons.. hopefully we can reconcile that someday */
        (challenge.game.time_control_parameters as any).time_control =
            this.state.time_control.system;
        challenge.game.pause_on_weekends = this.state.time_control.pause_on_weekends;

        // Autostart only in casual mode
        challenge.rengo_auto_start =
            (challenge.game.rengo_casual_mode && challenge.rengo_auto_start) || 0; // guard against it being set but empty

        if (
            challenge.game.initial_state &&
            Object.keys(challenge.game.initial_state).length === 0
        ) {
            challenge.game.initial_state = null;
        }

        challenge.game.rengo = next.challenge.game.rengo;
        challenge.game.rengo_casual_mode = next.challenge.game.rengo_casual_mode;

        return challenge;
    }

    createChallenge = () => {
        const next = this.next();

        if (!this.validateBoardSize()) {
            void alert.fire(_("Invalid board size, please correct and try again"));
            return;
        }
        /*
            void alert.fire(_("Invalid time settings, please correct them and try again"));
            return;
        }
        */
        const conf = next.conf;

        if (next.challenge.game.komi_auto === "custom" && next.challenge.game.komi === null) {
            void alert.fire(_("Invalid custom komi, please correct and try again"));
            return;
        }

        if (next.challenge.game.ranked) {
            next.challenge.game.komi_auto = "automatic";
        }
        if (next.challenge.game.komi_auto === "automatic") {
            next.challenge.game.komi = null;
        }

        let player_id = 0;
        if (this.props.mode === "player") {
            player_id = this.props.playerId as number;
            if (!player_id || player_id === data.get("user").id) {
                return;
            }
        }

        if (this.props.mode === "computer") {
            player_id = conf.bot_id;

            if (!player_id) {
                player_id = bot_count() === 0 ? 0 : one_bot()?.id ?? 0;
            }

            console.log("Bot set to ", player_id);
        }

        const challenge = this.getChallenge();

        const live = isLiveGame(
            this.state.time_control,
            challenge.game.width,
            challenge.game.height,
        );

        let open_now = false;
        if (live && !this.state.challenge.invite_only) {
            open_now = true; // invite-only goes to the Home page, it's not "open now"
        }
        if (this.props.mode === "computer") {
            open_now = true;
        }
        /*
        if (this.props.mode === "demo") {
            open_now = true;
        }
        */

        this.saveSettings();
        this.close();

        post(player_id ? `players/${player_id}/challenge` : "challenges", challenge)
            .then((res) => {
                // console.log("Challenge response: ", res);

                const challenge_id = res.challenge;
                const challenge_uuid = res.uuid;

                const game_id = typeof res.game === "object" ? res.game.id : res.game;
                let keepalive_interval: ReturnType<typeof setInterval> | undefined;

                const details: CreatedChallengeInfo = {
                    challenge_id: challenge_id,
                    live: live,
                    rengo: challenge.game.rengo,
                };

                if (this.props.created) {
                    this.props.created(details);
                }

                notification_manager.event_emitter.on("notification", checkForReject);

                if (open_now) {
                    if (this.props.mode !== "open") {
                        /* This is a direct challenge, which can be made in any context (not necessarily one showing challenges)
                           so it needs a dialog to let them know that we made the challenge.

                           This doesn't _have to be_ a modal, but currently is a modal pending a different design.
                         */
                        alert
                            .fire({
                                title: _("Waiting for opponent"),
                                html: '<div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>',
                                customClass: {
                                    confirmButton: "btn-danger",
                                },
                                confirmButtonText: pgettext("Cancel game challenge", "Cancel"),
                                allowOutsideClick: false,
                                allowEscapeKey: false,
                            })
                            .then(({ value: accept }) => {
                                off();
                                if (accept) {
                                    // cancel challenge
                                    void del(`me/challenges/${challenge_id}`);
                                }
                            })
                            .catch(() => {
                                off();
                            });
                    }
                    active_check();
                } else {
                    if (this.props.mode === "open") {
                        if (this.state.challenge.invite_only) {
                            const footer_text = _("View your invite-only challenges");
                            void alert.fire({
                                text: _("Invite-only Challenge created!"),
                                // It could be better if this were a <Link>
                                // The problem with this is discussed here: https://stackoverflow.com/a/72690830/554807
                                // This can be fixed when HistoryRouter is properly supported, if we can be bothered.
                                footer: `<a href='/'>${footer_text}</a>`,
                            });
                            copyChallengeLinkURL(
                                alert.getConfirmButton() as HTMLElement,
                                challenge_uuid,
                            );
                        } else {
                            void alert.fire(_("Challenge created!"));
                        }
                    } else if (this.props.mode === "player") {
                        void alert.fire(_("Challenge sent!"));
                    } else {
                        console.log(this.props.mode);
                    }
                }

                function active_check() {
                    keepalive_interval = setInterval(() => {
                        socket.send("challenge/keepalive", {
                            challenge_id: challenge_id,
                            game_id: game_id,
                        });
                    }, 1000);
                    socket.send("game/connect", { game_id: game_id });
                    socket.on(`game/${game_id}/gamedata`, onGamedata);
                }

                function onGamedata() {
                    off();
                    alert.close();
                    //sfx.play("game_accepted");
                    sfx.play("game_started", 3000);
                    //sfx.play("setup-bowl");
                    browserHistory.push(`/game/${game_id}`);
                }

                function onRejected(message?: string, details?: RejectionDetails) {
                    off();
                    alert.close();
                    void alert.fire({
                        text:
                            (details && rejectionDetailsToMessage(details)) ||
                            message ||
                            _("Game offer was rejected"),
                    });
                }

                function off() {
                    clearTimeout(keepalive_interval);
                    socket.send("game/disconnect", { game_id: game_id });
                    socket.off(`game/${game_id}/gamedata`, onGamedata);
                    //socket.off(`game/${game_id}/rejected`, onRejected);
                    notification_manager.event_emitter.off("notification", checkForReject);
                }

                function checkForReject(notification: NotificationManagerEvents["notification"]) {
                    console.log("challenge rejection check notification:", notification);
                    if (notification.type === "gameOfferRejected") {
                        /* non checked delete to purge old notifications that
                         * could be around after browser refreshes, connection
                         * drops, etc. */
                        notification_manager.deleteNotification(notification);
                        if (notification.game_id === game_id) {
                            onRejected(notification.message, notification.rejection_details);
                        }
                    }
                }
            })
            .catch((err) => {
                alert.close();
                errorAlerter(err);
            });
    };

    /* update bindings  */
    update_conf_bot_id = (ev: React.ChangeEvent<HTMLSelectElement>) =>
        this.upstate("conf.bot_id", parseInt(ev.target.value));
    update_challenge_game_name = (ev: React.ChangeEvent<HTMLInputElement>) =>
        this.upstate("challenge.game.name", ev);
    update_private = (ev: React.ChangeEvent<HTMLInputElement>) =>
        this.upstate([
            ["challenge.game.private", ev],
            ["challenge.game.ranked", false],
        ]);
    update_invite_only = (ev: React.ChangeEvent<HTMLInputElement>) =>
        this.upstate("challenge.invite_only", ev);
    update_rengo = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.forceTimeControlSystemIfNecessary(
            ev.target.checked,
            this.state.challenge.game.rengo_casual_mode,
        );
        this.upstate([
            ["challenge.game.rengo", ev],
            ["challenge.game.ranked", false],
            ["challenge.game.handicap", 0],
        ]);
    };
    update_rengo_casual = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.forceTimeControlSystemIfNecessary(this.state.challenge.game.rengo, ev.target.checked);
        this.upstate("challenge.game.rengo_casual_mode", ev);
    };

    update_rengo_auto_start = (ev: React.ChangeEvent<HTMLInputElement>) => {
        let new_val = parseInt(ev.target.value);
        if (isNaN(new_val)) {
            new_val = 0;
        }

        this.upstate("input_value_warning", new_val === 1 || new_val === 2);

        if (new_val >= 0) {
            // It's clearer to display blank ("") if there is no auto-start.  Blank means no autostart, the same as zero.
            this.upstate("challenge.rengo_auto_start", new_val || "");
        }
    };

    update_demo_private = (ev: React.ChangeEvent<HTMLInputElement>) =>
        this.upstate("demo.private", ev);
    update_ranked = (ev: React.ChangeEvent<HTMLInputElement>) => this.setRanked(ev.target.checked);
    update_demo_rules = (ev: React.ChangeEvent<HTMLSelectElement>) =>
        this.upstate("demo.rules", ev);
    update_board_size = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        this.syncBoardSize(ev.target.value);
    };

    update_board_width = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.state.challenge.game.width = parseInt(ev.target.value);
        this.setState({
            challenge: Object.assign({}, this.state.challenge),
        });
    };
    update_board_height = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.state.challenge.game.height = parseInt(ev.target.value);
        this.setState({
            challenge: Object.assign({}, this.state.challenge),
        });
    };

    update_rules = (ev: React.ChangeEvent<HTMLSelectElement>) =>
        this.upstate("challenge.game.rules", ev);
    update_handicap = (ev: React.ChangeEvent<HTMLSelectElement>) =>
        this.upstate("challenge.game.handicap", ev);
    update_komi_auto = (ev: React.ChangeEvent<HTMLSelectElement>) =>
        this.upstate("challenge.game.komi_auto", ev);
    update_komi = (ev: React.ChangeEvent<HTMLInputElement>) =>
        this.upstate("challenge.game.komi", ev.target.value || "0");
    update_challenge_color = (ev: React.ChangeEvent<HTMLSelectElement>) =>
        this.upstate("challenge.challenger_color", ev);
    update_disable_analysis = (ev: React.ChangeEvent<HTMLInputElement>) =>
        this.upstate("challenge.game.disable_analysis", ev);
    update_restrict_rank = (ev: React.ChangeEvent<HTMLInputElement>) =>
        this.upstate("conf.restrict_rank", ev);
    update_min_rank = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        const min_ranking = parseInt(ev.target.value);
        let max_ranking = this.state.challenge.max_ranking;
        if (min_ranking > max_ranking) {
            max_ranking = min_ranking;
        }
        this.setState({
            challenge: Object.assign({}, this.state.challenge, {
                min_ranking: min_ranking,
                max_ranking: max_ranking,
            }),
        });
    };
    update_max_rank = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        let min_ranking = this.state.challenge.min_ranking;
        const max_ranking = parseInt(ev.target.value);
        if (max_ranking < min_ranking) {
            min_ranking = max_ranking;
        }
        this.setState({
            challenge: Object.assign({}, this.state.challenge, {
                min_ranking: min_ranking,
                max_ranking: max_ranking,
            }),
        });
    };
    update_demo_black_name = (ev: React.ChangeEvent<HTMLInputElement>) =>
        this.upstate("demo.black_name", ev);
    update_demo_white_name = (ev: React.ChangeEvent<HTMLInputElement>) =>
        this.upstate("demo.white_name", ev);
    update_demo_black_ranking = (ev: React.ChangeEvent<HTMLSelectElement>) =>
        this.upstate("demo.black_ranking", ev);
    update_demo_white_ranking = (ev: React.ChangeEvent<HTMLSelectElement>) =>
        this.upstate("demo.white_ranking", ev);

    update_selected_demo_player_black = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        const idx = parseInt(ev.target.value);
        this.upstate("demo.black_name", this.props.playersList?.[idx].name);
        this.upstate("demo.black_ranking", this.props.playersList?.[idx].rank);
        this.setState({
            selected_demo_player_black: idx,
        });
    };
    update_selected_demo_player_white = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        const idx = parseInt(ev.target.value);
        this.upstate("demo.white_name", this.props.playersList?.[idx].name);
        this.upstate("demo.white_ranking", this.props.playersList?.[idx].rank);
        this.setState({
            selected_demo_player_white: idx,
        });
    };

    forceTimeControlSystemIfNecessary = (rengo: boolean, casual: boolean) => {
        if (rengo && casual) {
            const tc = updateSystem(
                this.state.time_control,
                "simple",
                this.state.challenge.boardWidth,
                this.state.challenge.boardHeight,
            );
            this.setState({
                time_control: tc,
            });
        }
    };

    /* rendering  */

    // game name and privacy
    basicSettings = () => {
        const mode = this.props.mode;
        return (
            <div
                id="challenge-basic-settings"
                className="left-pane pane form-horizontal"
                role="form"
            >
                {(mode === "computer" || null) && (
                    <div className="form-group">
                        <label className="control-label" htmlFor="engine">
                            {pgettext("Computer opponent", "AI Player")}
                        </label>
                        <div className="controls">
                            <select
                                id="challenge-ai"
                                value={this.state.conf.bot_id}
                                onChange={this.update_conf_bot_id}
                                required={true}
                            >
                                {bots_list().map((bot, idx) => (
                                    <option key={idx} value={bot.id}>
                                        {bot.username} ({rankString(getUserRating(bot).rank)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
                {(mode !== "computer" || null) && (
                    <div className="form-group">
                        <label className="control-label" htmlFor="challenge_game_name">
                            {_("Game Name")}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="text"
                                    value={this.state.challenge.game.name}
                                    onChange={this.update_challenge_game_name}
                                    className="form-control"
                                    id="challenge-game-name"
                                    placeholder={_("Game Name")}
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div className="form-group">
                    <label className="control-label" htmlFor="challenge-private">
                        {_("Private")}
                    </label>

                    <div className="controls">
                        {(mode !== "demo" || null) && (
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="challenge-private"
                                    disabled={this.state.challenge.game.rengo}
                                    checked={this.state.challenge.game.private}
                                    onChange={this.update_private}
                                />
                            </div>
                        )}
                        {(mode === "demo" || null) && (
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="challenge-private"
                                    checked={this.state.demo.private}
                                    onChange={this.update_demo_private}
                                />
                            </div>
                        )}
                    </div>
                </div>
                {!(this.props.playerId || null) && (mode === "open" || null) && (
                    <div className="form-group">
                        <label className="control-label" htmlFor="challenge-invite-only">
                            {pgettext(
                                "A checkbox to make a challenge open only to invited people who have the link to it",
                                "Invite-only",
                            )}
                        </label>
                        <div className="controls">
                            {(mode !== "demo" || null) && (
                                <div className="checkbox">
                                    <input
                                        type="checkbox"
                                        id="challenge-invite-only"
                                        checked={this.state.challenge.invite_only}
                                        onChange={this.update_invite_only}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {(mode === "open" || null) && (
                    <div className="form-group">
                        <label className="control-label" htmlFor="rengo-option">
                            {_("Rengo")}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="rengo-option"
                                    disabled={
                                        !this.state.challenge.game.rengo &&
                                        (this.state.challenge.game.private ||
                                            this.state.challenge.game.ranked)
                                    }
                                    checked={this.state.challenge.game.rengo}
                                    onChange={this.update_rengo}
                                />
                            </div>
                        </div>
                    </div>
                )}
                {(mode === "open" || null) && (
                    <>
                        <div
                            className={
                                "form-group" + (this.state.challenge.game.rengo ? "" : " hide")
                            }
                        >
                            <label className="control-label" htmlFor="rengo-casual-mode">
                                {_("Casual")}
                            </label>
                            <div className="controls">
                                <div className="checkbox">
                                    <input
                                        type="checkbox"
                                        id="rengo-casual-mode"
                                        checked={this.state.challenge.game.rengo_casual_mode}
                                        onChange={this.update_rengo_casual}
                                    />
                                    <a
                                        href="https://forums.online-go.com/t/how-does-rengo-work-at-ogs/42484"
                                        className="help"
                                        target="_blank"
                                    >
                                        <i className="fa fa-question-circle-o"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {(mode === "open" || null) && (
                    <>
                        <div
                            className={
                                "form-group" +
                                (this.state.challenge.game.rengo &&
                                this.state.challenge.game.rengo_casual_mode
                                    ? ""
                                    : " hide")
                            }
                        >
                            <label className="control-label" htmlFor="rengo-auto-start">
                                {_("Auto-start")}
                            </label>
                            <div className="controls">
                                <div className={"checkbox"}>
                                    <input
                                        type="number"
                                        value={this.state.challenge.rengo_auto_start}
                                        onChange={this.update_rengo_auto_start}
                                        id="rengo-auto-start"
                                        className="form-control"
                                        style={{ width: "3em" }}
                                        min="0"
                                        max=""
                                    />

                                    <i
                                        className={
                                            "fa fa-exclamation-circle " +
                                            (this.state.input_value_warning ? "value-warning" : "")
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    // board size and 'Ranked' checkbox
    additionalSettings = () => {
        const mode = this.props.mode;
        const conf = this.state.conf;
        const enable_custom_board_sizes = mode === "demo" || !this.state.challenge.game.ranked;

        return (
            <div
                id="challenge-basic-settings"
                className="right-pane pane form-horizontal"
                role="form"
            >
                {!this.state.forking_game && mode !== "demo" && (
                    <div>
                        <div className="form-group">
                            <label className="control-label" htmlFor="challenge-ranked">
                                {_("Ranked")}
                            </label>
                            <div className="controls">
                                <div className="checkbox">
                                    <input
                                        type="checkbox"
                                        id="challenge-ranked"
                                        disabled={
                                            !this.state.challenge.game.ranked &&
                                            (this.state.challenge.game.private ||
                                                this.state.challenge.game.rengo)
                                        }
                                        checked={this.state.challenge.game.ranked}
                                        onChange={this.update_ranked}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {(mode === "demo" || null) && (
                    <div>
                        <div className="form-group" id="challenge.game.rules-group">
                            <label className="control-label" htmlFor="rules">
                                {_("Rules")}
                            </label>
                            <div className="controls">
                                <div className="checkbox">
                                    <select
                                        value={this.state.demo.rules}
                                        onChange={this.update_demo_rules}
                                        className="challenge-dropdown form-control"
                                    >
                                        <option value="aga">{_("AGA")}</option>
                                        <option value="chinese">{_("Chinese")}</option>
                                        <option value="ing">{_("Ing SST")}</option>
                                        <option value="japanese">{_("Japanese")}</option>
                                        <option value="korean">{_("Korean")}</option>
                                        <option value="nz">{_("New Zealand")}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {!this.state.forking_game && (
                    <div className="form-group" id="challenge-board-size-group">
                        <label className="control-label" htmlFor="challenge-board-size">
                            {_("Board Size")}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <select
                                    id="challenge-board-size"
                                    value={this.state.conf.selected_board_size}
                                    onChange={this.update_board_size}
                                    className="challenge-dropdown form-control"
                                >
                                    <optgroup label={_("Normal Sizes")}>
                                        <option value="19x19">19x19</option>
                                        <option value="13x13">13x13</option>
                                        <option value="9x9">9x9</option>
                                    </optgroup>
                                    <optgroup label={_("Extreme Sizes")}>
                                        <option disabled={!enable_custom_board_sizes} value="25x25">
                                            25x25
                                        </option>
                                        <option disabled={!enable_custom_board_sizes} value="21x21">
                                            21x21
                                        </option>
                                        <option disabled={!enable_custom_board_sizes} value="5x5">
                                            5x5
                                        </option>
                                    </optgroup>
                                    <optgroup label={_("Non-Square")}>
                                        <option disabled={!enable_custom_board_sizes} value="19x9">
                                            19x9
                                        </option>
                                        <option disabled={!enable_custom_board_sizes} value="5x13">
                                            5x13
                                        </option>
                                    </optgroup>
                                    <optgroup label={_("Custom")}>
                                        <option
                                            disabled={!enable_custom_board_sizes}
                                            value="custom"
                                        >
                                            {_("Custom Size")}
                                        </option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {!this.state.forking_game && (conf.selected_board_size === "custom" || null) && (
                    <div className="form-group">
                        <label
                            className="control-label"
                            htmlFor="challenge-board-size-custom"
                        ></label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="number"
                                    value={this.state.challenge.game.width}
                                    onChange={this.update_board_width}
                                    id="challenge-goban-width"
                                    className="form-control"
                                    style={{ width: "3em" }}
                                    min="1"
                                    max="25"
                                />
                                x
                                <input
                                    type="number"
                                    value={this.state.challenge.game.height}
                                    onChange={this.update_board_height}
                                    id="challenge-goban-height"
                                    className="form-control"
                                    style={{ width: "3em" }}
                                    min="1"
                                    max="25"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    advancedDemoSettings = () => {
        return (
            <div
                id="challenge-advanced-fields"
                className="challenge-pane-container form-inline"
                style={{ marginTop: "1em" }}
            >
                <div className="left-pane pane form-horizontal">
                    <div className="form-group">
                        <label className="control-label" htmlFor="demo-black-name">
                            {_("Black Player")}
                        </label>
                        <div className="controls">
                            {this.props.playersList ? (
                                <select
                                    value={this.state.selected_demo_player_black}
                                    onChange={this.update_selected_demo_player_black}
                                >
                                    {this.props.playersList.map((player, idx) => (
                                        <option key={idx} value={idx}>
                                            {player.name} [{rankString(player.rank)}]
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="checkbox">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={this.state.demo.black_name}
                                        onChange={this.update_demo_black_name}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    {(!this.props.playersList || null) && (
                        <div className="form-group">
                            <label className="control-label" htmlFor="demo-black-name">
                                {_("Rank")}
                            </label>
                            <div className="controls">
                                <div className="checkbox">
                                    <select
                                        value={this.state.demo.black_ranking}
                                        onChange={this.update_demo_black_ranking}
                                        className="challenge-dropdown form-control"
                                    >
                                        {demo_ranks.map((r, idx) => (
                                            <option key={idx} value={r.rank}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="right-pane pane form-horizontal">
                    <div className="form-group">
                        <label className="control-label" htmlFor="demo-white-name">
                            {_("White Player")}
                        </label>
                        <div className="controls">
                            {this.props.playersList ? (
                                <select
                                    value={this.state.selected_demo_player_white}
                                    onChange={this.update_selected_demo_player_white}
                                >
                                    {this.props.playersList.map((player, idx) => (
                                        <option key={idx} value={idx}>
                                            {player.name} [{rankString(player.rank)}]
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="checkbox">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={this.state.demo.white_name}
                                        onChange={this.update_demo_white_name}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    {(!this.props.playersList || null) && (
                        <div className="form-group">
                            <label className="control-label" htmlFor="demo-white-name">
                                {_("Rank")}
                            </label>
                            <div className="controls">
                                <div className="checkbox">
                                    <select
                                        value={this.state.demo.white_ranking}
                                        onChange={this.update_demo_white_ranking}
                                        className="challenge-dropdown form-control"
                                    >
                                        {demo_ranks.map((r, idx) => (
                                            <option key={idx} value={r.rank}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    advancedSettings = () => {
        const mode = this.props.mode;
        const challenge = this.state.challenge;
        const conf = this.state.conf;

        const forceSystem: boolean = challenge.game.rengo && challenge.game.rengo_casual_mode;

        return (
            <div
                id="challenge-advanced-fields"
                className="challenge-pane-container form-inline"
                style={{ marginTop: "1em" }}
            >
                <div className="left-pane pane form-horizontal">
                    {(mode !== "computer" || null) && (
                        <div>
                            <div className="form-group" id="challenge.game.rules-group">
                                <label className="control-label" htmlFor="rules">
                                    {_("Rules")}
                                </label>
                                <div className="controls">
                                    <div className="checkbox">
                                        <select
                                            value={this.state.challenge.game.rules}
                                            onChange={this.update_rules}
                                            id="challenge.game.rules"
                                            className="challenge-dropdown form-control"
                                        >
                                            <option value="aga">{_("AGA")}</option>
                                            <option value="chinese">{_("Chinese")}</option>
                                            <option value="ing">{_("Ing SST")}</option>
                                            <option value="japanese">{_("Japanese")}</option>
                                            <option value="korean">{_("Korean")}</option>
                                            <option value="nz">{_("New Zealand")}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <TimeControlPicker
                        timeControl={this.state.time_control}
                        onChange={(tc) => {
                            // console.log("Time control changed to ", tc);
                            this.setState({
                                time_control: tc,
                            });
                        }}
                        boardWidth={challenge.game.width}
                        boardHeight={challenge.game.height}
                        forceSystem={forceSystem}
                    />
                </div>

                <div className="right-pane pane form-horizontal">
                    {!this.state.forking_game && (
                        <div className="form-group" id="challenge.game.handicap-group">
                            <label className="control-label">{_("Handicap")}</label>
                            <div className="controls">
                                <div className="checkbox">
                                    <select
                                        value={this.state.challenge.game.handicap}
                                        onChange={this.update_handicap}
                                        className="challenge-dropdown form-control"
                                    >
                                        <option
                                            value="-1"
                                            /*{disabled={!this.state.conf.handicap_enabled}}*/
                                        >
                                            {_("Automatic")}
                                        </option>
                                        <option value="0">{_("None")}</option>
                                        {handicapRanges.map((n, idx) => (
                                            <option
                                                key={idx}
                                                value={n}
                                                disabled={n > 9 && challenge.game.ranked}
                                            >
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="control-label">{_("Komi")}</label>
                        <div className="controls">
                            <div className="checkbox">
                                <select
                                    value={this.state.challenge.game.komi_auto}
                                    onChange={this.update_komi_auto}
                                    className="challenge-dropdown form-control"
                                >
                                    <option value="automatic">{_("Automatic")}</option>
                                    <option
                                        value="custom"
                                        disabled={this.state.challenge.game.ranked}
                                    >
                                        {_("Custom")}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {(challenge.game.komi_auto === "custom" || null) && (
                        <div className="form-group">
                            <label className="control-label"></label>
                            <div className="controls">
                                <div className="checkbox">
                                    <input
                                        type="number"
                                        value={this.state.challenge.game.komi || 0}
                                        onChange={this.update_komi}
                                        className="form-control"
                                        style={{ width: "4em" }}
                                        step="0.5"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="control-label" htmlFor="color">
                            {_("Your Color")}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <select
                                    value={this.state.challenge.challenger_color}
                                    onChange={this.update_challenge_color}
                                    id="challenge-color"
                                    className="challenge-dropdown form-control"
                                >
                                    <option value="automatic">{_("Automatic")}</option>
                                    <option value="black">{_("Black")}</option>
                                    <option value="white">{_("White")}</option>
                                    <option value="random">{_("Random")}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="form-group" style={{ position: "relative" }}>
                            <label className="control-label" htmlFor="challenge-disable-analysis">
                                {_("Disable Analysis")}
                            </label>
                            <div className="controls">
                                <div className="checkbox">
                                    <input
                                        checked={this.state.challenge.game.disable_analysis}
                                        onChange={this.update_disable_analysis}
                                        id="challenge-disable-analysis"
                                        type="checkbox"
                                    />{" "}
                                    *
                                </div>
                            </div>
                        </div>

                        {(mode === "open" || null) && (
                            <div>
                                <div className="form-group" id="challenge-restrict-rank-group">
                                    <label
                                        className="control-label"
                                        htmlFor="challenge-restrict-rank"
                                    >
                                        {_("Restrict Rank")}
                                    </label>
                                    <div className="controls">
                                        <div className="checkbox">
                                            <input
                                                checked={this.state.conf.restrict_rank}
                                                onChange={this.update_restrict_rank}
                                                id="challenge-restrict-rank"
                                                type="checkbox"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {(conf.restrict_rank || null) && (
                                    <div>
                                        <div className="form-group" id="challenge-min-rank-group">
                                            <label
                                                className="control-label"
                                                htmlFor="minimum_ranking"
                                            >
                                                {_("Minimum Ranking")}
                                            </label>
                                            <div className="controls">
                                                <div className="checkbox">
                                                    <select
                                                        value={this.state.challenge.min_ranking}
                                                        onChange={this.update_min_rank}
                                                        id="challenge-min-rank"
                                                        className="challenge-dropdown form-control"
                                                    >
                                                        {(challenge.game.ranked
                                                            ? ranked_ranks
                                                            : ranks
                                                        ).map((r, idx) => (
                                                            <option key={idx} value={r.rank}>
                                                                {r.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-group" id="challenge-max-rank-group">
                                            <label
                                                className="control-label"
                                                htmlFor="maximum_ranking"
                                            >
                                                {_("Maximum Ranking")}
                                            </label>
                                            <div className="controls">
                                                <div className="checkbox">
                                                    <select
                                                        value={this.state.challenge.max_ranking}
                                                        onChange={this.update_max_rank}
                                                        id="challenge-max-rank"
                                                        className="challenge-dropdown form-control"
                                                    >
                                                        {(challenge.game.ranked
                                                            ? ranked_ranks
                                                            : ranks
                                                        ).map((r, idx) => (
                                                            <option key={idx} value={r.rank}>
                                                                {r.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div style={{ marginTop: "1.0em", textAlign: "right", fontSize: "0.8em" }}>
                            * {_("Also disables conditional moves")}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    togglePreferredSettings = () => {
        if (this.state.view_mode === "portrait") {
            this.setState({
                hide_preferred_settings_on_portrait:
                    !this.state.hide_preferred_settings_on_portrait,
            });
        }
    };

    preferredGameSettings = () => {
        return (
            <div style={{ padding: "0.5em" }} ref={this.ref}>
                <OgsResizeDetector onResize={this.onResize} targetRef={this.ref} />
                <hr />
                <div>
                    <span onClick={this.togglePreferredSettings}>
                        <strong>
                            {interpolate(_("Preferred settings ({{preferred_settings_count}})"), {
                                preferred_settings_count: this.state.preferred_settings.length,
                            })}
                        </strong>
                        {(this.state.view_mode === "portrait" || null) && (
                            <i className="fa fa-caret-down" style={{ marginLeft: "0.5em" }} />
                        )}
                    </span>
                    <button onClick={this.addToPreferredSettings} className="pull-right sm success">
                        {_("Add current setting")}
                    </button>
                </div>
                {(this.state.view_mode !== "portrait" ||
                    !this.state.hide_preferred_settings_on_portrait ||
                    null) && (
                    <div style={{ padding: "0.5em", marginTop: "0.1em" }}>
                        {this.state.preferred_settings.map(
                            (setting: ChallengeDetails, index: number) => {
                                return (
                                    <div key={index} style={{ marginBottom: "0.5em" }}>
                                        <button
                                            onClick={this.usePreferredSetting.bind(this, index)}
                                            className="xs primary"
                                        >
                                            {_("Use")}
                                        </button>
                                        <button
                                            onClick={this.deletePreferredSetting.bind(this, index)}
                                            className="xs reject"
                                        >
                                            {_("Delete")}
                                        </button>
                                        <span style={{ marginLeft: "0.5em" }}>
                                            {challenge_text_description(setting)}
                                        </span>
                                    </div>
                                );
                            },
                        )}
                    </div>
                )}
            </div>
        );
    };

    render() {
        const mode = this.props.mode;
        const player_id = this.props.playerId;
        const player = player_id && player_cache.lookup(player_id);
        const player_username = player ? player.username : "...";

        // const speed_warning = getTimeControlSpeedWarning(
        //     this.state.time_control,
        //     this.state.challenge.game.width,
        //     this.state.challenge.game.height,
        // );

        if (player_id && !player) {
            player_cache
                .fetch(player_id)
                .then(() => this.setState({ player_username_resolved: true }))
                .catch(errorLogger);
        }

        return (
            <div className="Modal ChallengeModal">
                <div className="header">
                    <h2>
                        {(mode === "open" || null) && <span>{_("Custom Game")}</span>}
                        {(mode === "demo" || null) && <span>{_("Demo Board")}</span>}
                        {(mode === "player" || null) && (
                            <span className="header-with-icon">
                                <PlayerIcon id={player_id} size={32} />
                                &nbsp; {player_username}
                            </span>
                        )}
                        {(mode === "computer" || null) && <span>{_("Computer")}</span>}
                    </h2>
                </div>
                <div className="body">
                    <div className="challenge  form-inline">
                        <div className="challenge-pane-container">
                            {this.basicSettings()}
                            {(!this.state.initial_state || null) && this.additionalSettings()}
                        </div>

                        <hr />
                        {(mode !== "demo" || null) && this.advancedSettings()}
                        {(mode === "demo" || null) && this.advancedDemoSettings()}
                    </div>
                </div>
                {/* {speed_warning && (
                    <div className="speed-warning">
                        <span>
                            <i className="fa fa-w fa-exclamation-triangle"></i>
                            {speed_warning}
                        </span>
                    </div>
                )} */}
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                    {(mode === "demo" || null) && (
                        <button onClick={this.createDemo} className="primary">
                            {_("Create Demo")}
                        </button>
                    )}
                    {(mode === "computer" || null) && (
                        <button onClick={this.createChallenge} className="primary">
                            {_("Play")}
                        </button>
                    )}
                    {(mode === "player" || null) && (
                        <button onClick={this.createChallenge} className="primary">
                            {_("Send Challenge")}
                        </button>
                    )}
                    {(mode === "open" || null) && (
                        <button
                            onClick={this.createChallenge}
                            className="primary"
                            disabled={this.state.input_value_warning}
                        >
                            {_("Create Challenge")}
                        </button>
                    )}
                </div>
                {(mode !== "demo" || null) && this.preferredGameSettings()}
            </div>
        );
    }

    /********************/
    /*** State update ***/
    /********************/
    /* TODO: This state update system is something I did when I was just getting
     * started with React, it sucks. It's mostly been removed, but is currently
     * still used by the ChallengeModal. Refactors to remove this are welcome.
     */
    upstate_object: any = null;

    nextState(): any {
        if (this.upstate_object == null) {
            this.upstate_object = dup(this.state);
        }
        return this.upstate_object;
    }
    next(): any {
        return this.nextState();
    }
    componentDidUpdate() {
        this.upstate_object = null;
    }
    bulkUpstate(arr: Array<Array<any>>) {
        const next_state: any = this.nextState();
        const state_update: any = {};

        for (const elt of arr) {
            const key = elt[0];
            const event_or_value = elt[1];

            let value = null;
            if (typeof event_or_value === "object" && "target" in event_or_value) {
                const target = event_or_value.target;
                value = target.type === "checkbox" ? target.checked : target.value;
            } else {
                value = event_or_value;
            }
            const components = key.split(".");
            const primary_key = components[0];
            let cur = next_state;
            while (components.length > 1) {
                cur = cur[components[0]];
                components.shift();
            }
            cur[components[0]] = value;
            state_update[primary_key] = next_state[primary_key];
        }
        this.setState(state_update);
    }
    upstate(key: string | Array<Array<any>>, event_or_value?: any) {
        if (!event_or_value && Array.isArray(key)) {
            return this.bulkUpstate(key);
        }
        return this.bulkUpstate([[key, event_or_value]]);
    }
}

export function challenge(
    player_id?: number,
    initial_state?: any,
    computer?: boolean,
    config?: ChallengeModalConfig,
    created?: (c: CreatedChallengeInfo) => void,
) {
    // TODO: Support challenge by player, w/ initial state, or computer

    if (player_id && typeof player_id !== "number") {
        console.log("Invalid player id: ", player_id);
        throw Error("Invalid player id");
    }

    let mode: ChallengeModes = "open";
    if (player_id) {
        mode = "player";
    }
    if (computer) {
        mode = "computer";
    }

    return openModal(
        <ChallengeModal
            playerId={player_id}
            initialState={initial_state}
            config={config}
            mode={mode}
            created={created}
        />,
    );
}
export function createDemoBoard(
    players_list?: Array<{ name: string; rank: number }>,
    tournament_record_id?: number,
    tournament_record_round_id?: number,
) {
    const mode: ChallengeModes = "demo";
    return openModal(
        <ChallengeModal
            mode={mode}
            playersList={players_list}
            tournamentRecordId={tournament_record_id}
            tournamentRecordRoundId={tournament_record_round_id}
        />,
    );
}
export function challengeComputer() {
    return challenge(undefined, null, true);
}
export function challengeRematch(
    goban: Goban,
    opponent: GoEnginePlayerEntry,
    original_game_meta: GoEngineConfig & { pause_on_weekends?: boolean },
) {
    /* TODO: Fix up challengeRematch time control stuff */
    const conf = goban.engine;

    const board_size = `${conf.width}x${conf.height}`;

    console.log(original_game_meta);

    //config.syncBoardSize();
    //config.syncTimeControl();

    const config: ChallengeModalConfig = {
        conf: {
            selected_board_size: isStandardBoardSize(board_size) ? board_size : "custom",
            restrict_rank: false,
        },
        challenge: {
            challenger_color:
                conf.players.black.id === opponent.id ? ("white" as const) : ("black" as const),
            game: {
                handicap: conf.handicap,
                time_control: conf.time_control,
                rules: conf.rules,
                ranked: !!conf.config.ranked,
                width: conf.width,
                height: conf.height,
                komi_auto: "custom",
                komi: conf.komi,
                disable_analysis: conf.disable_analysis,
                pause_on_weekends: original_game_meta.pause_on_weekends ?? false,
                initial_state: null,
                private: (conf as any)["private"], // this is either missing from the type def or invalid
            },
            invite_only: false, // maybe one day we will support challenge-links on the rematch dialog!
        },
        time_control: dup(conf.time_control),
    };

    challenge(opponent.id, null, false, config);
}
export function challenge_text_description(challenge: ChallengeDetails) {
    const c = challenge;
    const g = "game" in challenge ? challenge.game : challenge;
    let details_html = g.ranked ? _("Ranked") : _("Unranked");

    if (g.rengo) {
        details_html += " " + (g.rengo_casual_mode ? _("casual rengo") : _("strict rengo"));
        if (c.rengo_auto_start > 0) {
            details_html +=
                ", " +
                interpolate(_("auto-starting at {{auto_start}} players"), {
                    auto_start: c.rengo_auto_start,
                });
        }
    }

    details_html +=
        ", " + g.width + "x" + g.height + ", " + interpolate(_("%s rules"), [rulesText(g.rules)]);

    const time_control =
        typeof g.time_control !== "object" && "time_control_parameters" in g
            ? g.time_control_parameters
            : g.time_control;

    if (typeof time_control === "object") {
        if (time_control.system !== "none") {
            // This is gross and still needs refactoring, but preserves the old behavior
            const time_control_system = time_control.system;
            details_html +=
                ", " +
                interpolate(_("%s clock: %s"), [
                    timeControlSystemText(time_control_system).toLocaleLowerCase(),
                    shortShortTimeControl(time_control),
                ]);
        } else {
            details_html += ", " + _("no time limits");
        }

        if (time_control.pause_on_weekends) {
            details_html += ", " + _("pause on weekends");
        }
    }

    details_html +=
        ", " +
        interpolate(_("%s handicap"), [g.handicap < 0 ? _("auto") : g.handicap]) +
        (g.komi == null || typeof g.komi === "object"
            ? ""
            : ", " + interpolate(_("{{komi}} komi"), { komi: g.komi })) +
        (g.disable_analysis ? ", " + _("analysis disabled") : "");
    if (c.challenger_color !== "automatic") {
        let your_color = "";

        if (
            data.get("user") &&
            ((c as any)?.challenger?.id !== data.get("user").id ||
                (c as any)?.user?.id !== data.get("user").id)
        ) {
            if (c.challenger_color === "black") {
                your_color = _("white");
            } else if (c.challenger_color === "white") {
                your_color = _("black");
            } else {
                your_color = _(c.challenger_color);
            }
        } else {
            your_color = _(c.challenger_color);
        }

        details_html += ", " + interpolate(pgettext("color", "you play as %s"), [your_color]);
    }

    return details_html;
}

function isStandardBoardSize(board_size: string): boolean {
    return board_size in standard_board_sizes;
}

interface ChallengeModalConfig {
    challenge: {
        min_ranking?: number;
        max_ranking?: number;
        challenger_color: rest_api.ColorSelectionOptions;
        invite_only: boolean;

        game: {
            name?: string;
            rules: RuleSet;
            ranked: boolean;
            handicap: number;
            komi_auto: string;
            disable_analysis: boolean;
            initial_state: GoEngineInitialState | null;
            private: boolean;
            time_control?: JGOFTimeControl;
            width?: number;
            height?: number;
            komi?: number;
            pause_on_weekends?: boolean;
        };
    };
    conf: {
        restrict_rank: boolean;
        selected_board_size?: string;
    };
    time_control: TimeControlConfig;
}

interface TimeControlConfig {
    system: JGOFTimeControlSystem;
    speed: JGOFTimeControlSpeed;
    initial_time?: number;
    main_time?: number;
    time_increment?: number;
    max_time?: number;
    period_time?: number;
    periods?: number;
    pause_on_weekends: boolean;
}

/* This function provides translations for rejection reasons coming gtp2ogs bot interface scripts. */
function rejectionDetailsToMessage(details: RejectionDetails): string | undefined {
    switch (details.rejection_code) {
        case "blacklisted":
            return pgettext(
                "The user has been blocked by the operator of the bot from playing against the bot.",
                "The operator of this bot will not let you play against it.",
            );

        case "board_size_not_square":
            return _("This bot only plays on square boards");

        case "board_size_not_allowed":
            return _("The selected board size is not supported by this bot");

        case "handicap_not_allowed":
            return _("Handicap games are not allowed against this bot");

        case "unranked_not_allowed":
            return _("Unranked games are not allowed against this bot");

        case "ranked_not_allowed":
            return _("Ranked games are not allowed against this bot");

        case "blitz_not_allowed":
            return _("Blitz games are not allowed against this bot");

        case "too_many_blitz_games":
            return _(
                "Too many blitz games are being played by this bot right now, please try again later.",
            );

        case "live_not_allowed":
            return _("Live games are not allowed against this bot");

        case "too_many_live_games":
            return _(
                "Too many live games are being played by this bot right now, please try again later.",
            );

        case "correspondence_not_allowed":
            return _("Correspondence games are not allowed against this bot");

        case "too_many_correspondence_games":
            return _(
                "Too many correspondence games are being played by this bot right now, please try again later.",
            );

        case "time_control_system_not_allowed":
            return _("The provided time control system is not supported by this bot");

        case "time_increment_out_of_range":
            return _("The time increment is out of the acceptable range allowed by this bot");

        case "period_time_out_of_range":
            return _("The period time is out of the acceptable range allowed by this bot");

        case "periods_out_of_range":
            return _("The number of periods is out of the acceptable range allowed by this bot");

        case "main_time_out_of_range":
            return _("The main time is out of the acceptable range allowed by this bot");

        case "max_time_out_of_range":
            return _("The max time is out of the acceptable range allowed by this bot");

        case "per_move_time_out_of_range":
            return _("The per move time is out the acceptable range allowed by this bot");

        case "player_rank_out_of_range":
            return _("Your rank is too high or low to play against this bot");

        case "not_accepting_new_challenges":
            return _("This bot is not accepting new games at this time");

        case "too_many_games_for_player":
            return _(
                "You are already playing against this bot, please end your other game before starting a new one",
            );

        case "komi_out_of_range":
            return _("Komi is out of the acceptable range allowed by this bot");

        default:
            return undefined;
    }
}
