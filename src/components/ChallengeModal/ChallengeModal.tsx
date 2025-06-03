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

import * as data from "@/lib/data";
import * as player_cache from "@/lib/player_cache";
import * as preferences from "@/lib/preferences";

import { OgsResizeDetector } from "@/components/OgsResizeDetector";
import { browserHistory } from "@/lib/ogsHistory";
import { _, pgettext, interpolate, llm_pgettext } from "@/lib/translate";
import { post, del } from "@/lib/requests";
import { Modal } from "@/components/Modal";
import { socket } from "@/lib/sockets";
import { rankString, amateurRanks, allRanks } from "@/lib/rank_utils";
import { CreatedChallengeInfo } from "@/lib/types";
import { errorLogger, errorAlerter, dup } from "@/lib/misc";
import { PlayerIcon } from "@/components/PlayerIcon";
import { isLiveGame, TimeControlPicker, TimeControl } from "@/components/TimeControl";
import { sfx } from "@/lib/sfx";
import {
    notification_manager,
    NotificationManagerEvents,
} from "@/components/Notifications/NotificationManager";
import { one_bot, bot_count, bots_list, getAcceptableTimeSetting, Bot } from "@/lib/bots";
import { goban_view_mode } from "@/views/Game/util";

import { copyChallengeLinkURL } from "@/components/ChallengeLinkButton";

import { alert } from "@/lib/swal_config";
import {
    recallTimeControlSettings,
    saveTimeControlSettings,
    updateSystem,
} from "@/components/TimeControl/TimeControlUpdates";
import { SPEED_OPTIONS } from "@/views/Play/SPEED_OPTIONS";
import Select from "react-select";
import {
    rejectionDetailsToMessage,
    challenge_text_description,
    sanitizeChallengeDetails,
    getPreferredSettings,
    getDefaultKomi,
    isKomiOption,
    sanitizeDemoSettings,
    parseNumberInput,
    isRuleSet,
    isColorSelectionOption,
} from "@/components/ChallengeModal/ChallengeModal.utils";
import {
    ChallengeDetails,
    ChallengeInput,
    ChallengeModalConf,
    DemoSettings,
    GameInput,
    ChallengeModalInput,
    ChallengeModalProperties,
    ChallengeModalState,
    PreferredSettingOption,
    RejectionDetails,
    UpdateFn,
} from "@/components/ChallengeModal/ChallengeModal.types";

/* Constants  */

const handicapRanges: number[] = [];
for (let i = 1; i <= 36; ++i) {
    handicapRanges.push(i);
}

const ranks = amateurRanks();
const demo_ranks = allRanks();

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

export class ChallengeModal extends Modal<{}, ChallengeModalProperties, ChallengeModalState> {
    constructor(props: ChallengeModalProperties) {
        super(props);
    }

    render() {
        return <ChallengeModalBody {...this.props} modal={this} />;
    }
}

export class ChallengeModalBody extends React.Component<ChallengeModalInput, ChallengeModalState> {
    ref: React.RefObject<HTMLDivElement | null> = React.createRef();

    constructor(props: ChallengeModalInput) {
        super(props);

        const speed = data.get("challenge.speed", "live");

        const challenge: ChallengeDetails = sanitizeChallengeDetails(
            data.get(`challenge.challenge.${speed}`, {
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
            }),
        );

        const demo = sanitizeDemoSettings(
            data.get("demo.settings", {
                name: "",
                rules: "japanese",
                width: 19,
                height: 19,
                komi_auto: "automatic",
                black_name: _("Black"),
                black_ranking: 1039,
                white_name: _("White"),
                white_ranking: 1039,
                private: false,
            }),
        );

        const game_settings = this.props.mode === "demo" ? demo : challenge.game;

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
                    standard_board_sizes[`${game_settings.width}x${game_settings.height}`] ||
                    "custom",
                restrict_rank: data.get("challenge.restrict_rank", false),
            },
            challenge: challenge,
            demo: demo,
            forking_game: !!this.props.initialState,
            selected_demo_player_black: 0,
            selected_demo_player_white: this.props.playersList
                ? this.props.playersList.length - 1
                : 0,

            preferred_settings: getPreferredSettings(),
            view_mode: goban_view_mode(),
            hide_preferred_settings_on_portrait: true,
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
                this.props.modal.close?.();
            }, 1);
        }

        this.props.modal.on("open", () => {
            data.watch("preferred-game-settings", this.preferredSettingsUpdated);
        });
        this.props.modal.on("close", () => {
            data.unwatch("preferred-game-settings", this.preferredSettingsUpdated);
        });
    }

    rengo_auto_start_input_warning(): boolean {
        return (
            this.state.challenge.rengo_auto_start === 1 ||
            this.state.challenge.rengo_auto_start === 2
        );
    }

    gameStateOf(state: any) {
        return this.props.mode === "demo" ? state.demo : state.challenge.game;
    }

    gameState() {
        return this.gameStateOf(this.state);
    }

    gameStateName(name: string) {
        const prefix = this.props.mode === "demo" ? "demo" : "challenge.game";
        return `${prefix}.${name}`;
    }

    onResize = () => {
        this.setState({ view_mode: goban_view_mode() });
    };

    preferredSettingsUpdated = (preferred_settings?: ChallengeDetails[]) => {
        if (!preferred_settings) {
            return;
        }
        this.setState({ preferred_settings: preferred_settings.map(sanitizeChallengeDetails) });
    };

    setRanked(tf: boolean) {
        const next = this.nextState();

        this.gameStateOf(next).ranked = tf;
        if (tf && this.state.challenge && data.get("user")) {
            this.gameStateOf(next).handicap = Math.min(9, this.gameStateOf(next).handicap);
            this.gameStateOf(next).komi_auto = "automatic";
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
                this.gameStateOf(next).width = 19;
                this.gameStateOf(next).height = 19;
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
        const preferred_settings = getPreferredSettings();
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
        const preferred_settings = getPreferredSettings();
        preferred_settings.splice(index, 1);
        data.set(
            "preferred-game-settings",
            [...preferred_settings],
            data.Replication.REMOTE_OVERWRITES_LOCAL,
        );
    };

    usePreferredSetting = (index: number) => {
        const preferred_settings = getPreferredSettings();
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

        this.setState({
            demo: next.demo,
        });

        const settings: any = {};
        for (const k in next.demo) {
            settings[k] = next.demo[k];
        }

        // Ignore komi value if komi is automatic.
        if (settings.komi_auto !== "custom") {
            delete settings.komi;
        }

        settings.black_pro = settings.black_ranking > 1000 ? 1 : 0;
        if (settings.black_pro) {
            settings.black_ranking -= 1000;
        }
        settings.white_pro = settings.white_ranking > 1000 ? 1 : 0;
        if (settings.white_pro) {
            settings.white_ranking -= 1000;
        }

        settings.tournament_record_id = this.props.tournamentRecordId;
        settings.tournament_record_round_id = this.props.tournamentRecordRoundId;

        if (!settings.name) {
            settings.name = this.props.game_record_mode
                ? pgettext("Game record from real life game", "Game Record")
                : _("Demo Board");
        }

        console.log("Sending", settings);
        this.saveSettings();
        this.props.modal.close?.();

        if (this.props.game_record_mode) {
            settings.library_collection_id = this.props.libraryCollectionId;

            post("game_records/", settings)
                .then((res) => {
                    console.log("Game record create response: ", res);
                    browserHistory.push(`/game/${res.id}`);
                })
                .catch(errorAlerter);
        } else {
            // Review board demo
            post("demos", settings)
                .then((res) => {
                    console.log("Demo create response: ", res);
                    browserHistory.push(`/demo/${res.id}`);
                })
                .catch(errorAlerter);
        }
    };
    validateBoardSize() {
        const next = this.next();

        try {
            if (
                !parseInt(this.gameStateOf(next).width) ||
                this.gameStateOf(next).width < 1 ||
                this.gameStateOf(next).width > 25
            ) {
                document.getElementById("challenge-goban-width")?.focus();
                return false;
            }
            if (
                !parseInt(this.gameStateOf(next).height) ||
                this.gameStateOf(next).height < 1 ||
                this.gameStateOf(next).height > 25
            ) {
                document.getElementById("challenge-goban-height")?.focus();
                return false;
            }
        } catch {
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

        if (this.gameStateOf(next).komi_auto === "custom" && this.gameStateOf(next).komi === null) {
            void alert.fire(_("Invalid custom komi, please correct and try again"));
            return;
        }

        if (this.gameStateOf(next).ranked) {
            this.gameStateOf(next).komi_auto = "automatic";
        }
        if (this.gameStateOf(next).komi_auto === "automatic") {
            this.gameStateOf(next).komi = null;
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
        this.props.modal.close?.();

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

    /* nested fn updates */
    update_conf = (update_fn: UpdateFn<ChallengeModalConf>): void =>
        this.setState((prev) => ({ conf: update_fn(prev.conf) }));
    update_challenge_settings = (update_fn: UpdateFn<ChallengeInput>): void =>
        this.setState((prev) => ({ challenge: update_fn(prev.challenge) }));
    update_demo_settings = (update_fn: UpdateFn<DemoSettings>): void =>
        this.setState((prev) => ({ demo: update_fn(prev.demo) }));
    update_game_settings = (update_fn: UpdateFn<GameInput>): void =>
        this.update_challenge_settings((prev) => ({ ...prev, game: update_fn(prev.game) }));

    /* direct fn updates */
    update_bot_id = (id: number) => this.update_conf((prev) => ({ ...prev, bot_id: id }));

    update_demo_name = (name: string): void =>
        this.update_demo_settings((prev) => ({ ...prev, name: name }));
    update_game_name = (name: string): void =>
        this.update_game_settings((prev) => ({ ...prev, name: name }));
    update_challenge_game_name: (name: string) => void =
        this.props.mode === "demo" ? this.update_demo_name : this.update_game_name;

    update_private_game = (isPrivate: boolean) =>
        this.update_game_settings((prev) => ({ ...prev, private: isPrivate, ranked: false }));
    update_private_demo = (isPrivate: boolean) =>
        this.update_demo_settings((prev): DemoSettings => ({ ...prev, private: isPrivate }));
    update_private =
        this.props.mode === "demo" ? this.update_private_demo : this.update_private_game;

    update_invite_only = (invite_only: boolean) =>
        this.update_challenge_settings((prev) => ({ ...prev, invite_only: invite_only }));

    update_rengo = (isRengo: boolean) => {
        this.forceTimeControlSystemIfNecessary(
            isRengo,
            this.state.challenge.game.rengo_casual_mode,
        );
        this.update_game_settings((prev) => ({
            ...prev,
            rengo: isRengo,
            ranked: false,
            handicap: 0,
        }));
    };
    update_rengo_casual = (isRengoCasual: boolean) => {
        this.forceTimeControlSystemIfNecessary(this.state.challenge.game.rengo, isRengoCasual);
        this.update_game_settings((prev) => ({ ...prev, rengo_casual_mode: isRengoCasual }));
    };

    update_rengo_auto_start = (auto_start_threshold: number) => {
        const new_val = isNaN(auto_start_threshold) ? 0 : auto_start_threshold;

        if (new_val >= 0) {
            this.update_challenge_settings((prev) => ({
                ...prev,
                rengo_auto_start: new_val,
            }));
        }
    };

    update_ranked = (ev: React.ChangeEvent<HTMLInputElement>) => this.setRanked(ev.target.checked);
    update_board_size = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        const selection = ev.target.value;
        this.update_conf((prev) => ({ ...prev, selected_board_size: selection }));

        if (selection === "custom") {
            return;
        }

        const sizes = selection.split("x");
        const width = parseInt(sizes[0]);
        const height = parseInt(sizes[1]);

        this.update_board_width(width);
        this.update_board_height(height);
    };

    update_board_width = (width: number | null) =>
        this.props.mode === "demo"
            ? this.update_demo_settings((prev) => ({ ...prev, width: width }))
            : this.update_game_settings((prev) => ({ ...prev, width: width }));

    update_board_height = (height: number | null) =>
        this.props.mode === "demo"
            ? this.update_demo_settings((prev) => ({ ...prev, height: height }))
            : this.update_game_settings((prev) => ({ ...prev, height: height }));

    update_rules = (rules: string) => {
        if (!isRuleSet(rules)) {
            return;
        }
        if (this.props.mode === "demo") {
            // Note: I wasn't able to see a rules input in the challenge computer modal
            this.update_demo_settings((prev) => ({ ...prev, rules: rules }));
        } else {
            this.update_game_settings((prev) => ({ ...prev, rules: rules }));
        }
    };
    update_handicap = (handicap: number) =>
        this.update_game_settings((prev) => ({ ...prev, handicap: handicap }));

    update_komi_option_demo = (komi_option: string) => {
        if (!isKomiOption(komi_option)) {
            console.error(`invalid komi option: ${komi_option}`);
            return;
        }
        this.setState((prev) => {
            const changedToCustom = komi_option === "custom" && prev.demo.komi_auto !== "custom";

            return {
                demo: {
                    ...prev.demo,
                    komi_auto: komi_option,
                    // If we just switched to custom komi, set it to the default for the current
                    // rules.
                    ...(changedToCustom && {
                        komi: getDefaultKomi(prev.demo.rules, false),
                    }),
                },
            };
        });
    };

    update_komi_option_game = (komi_option: string) => {
        if (!isKomiOption(komi_option)) {
            console.error(`invalid komi option: ${komi_option}`);
            return;
        }
        this.setState((prev) => {
            const changedToCustom =
                komi_option === "custom" && prev.challenge.game.komi_auto !== "custom";

            return {
                challenge: {
                    ...prev.challenge,
                    game: {
                        ...prev.challenge.game,
                        komi_auto: komi_option,
                        // If we just switched to custom komi, set it to the default for the current
                        // rules.
                        ...(changedToCustom && {
                            komi: getDefaultKomi(
                                prev.challenge.game.rules,
                                prev.challenge.game.handicap > 0,
                            ),
                        }),
                    },
                },
            };
        });
    };

    update_komi_auto =
        this.props.mode === "demo" ? this.update_komi_option_demo : this.update_komi_option_game;

    update_komi = (komi: number | null) =>
        this.props.mode === "demo"
            ? this.update_demo_settings((prev) => ({ ...prev, komi: komi }))
            : this.update_game_settings((prev) => ({ ...prev, komi: komi }));
    update_challenge_color = (color_selection: string) => {
        if (!isColorSelectionOption(color_selection)) {
            return;
        }
        this.update_challenge_settings((prev) => ({ ...prev, challenger_color: color_selection }));
    };
    update_disable_analysis = (disable_analysis: boolean) =>
        this.update_game_settings((prev) => ({ ...prev, disable_analysis: disable_analysis }));
    update_restrict_rank = (restrict_rank: boolean) =>
        this.update_conf((prev) => ({ ...prev, restrict_rank: restrict_rank }));
    update_min_rank = (min_rank: number) =>
        this.setState((state) => ({
            challenge: {
                ...state.challenge,
                min_ranking: min_rank,
                max_ranking: Math.max(state.challenge.max_ranking, min_rank),
            },
        }));
    update_max_rank = (max_rank: number) =>
        this.setState((state) => ({
            challenge: {
                ...state.challenge,
                min_ranking: Math.min(state.challenge.min_ranking, max_rank),
                max_ranking: max_rank,
            },
        }));
    update_demo_black_name = (name: string) =>
        this.update_demo_settings((prev) => ({ ...prev, black_name: name }));
    update_demo_white_name = (name: string) =>
        this.update_demo_settings((prev) => ({ ...prev, white_name: name }));
    update_demo_black_ranking = (rank: number) =>
        this.update_demo_settings((prev) => ({ ...prev, black_ranking: rank }));
    update_demo_white_ranking = (rank: number) =>
        this.update_demo_settings((prev) => ({ ...prev, white_ranking: rank }));

    update_selected_demo_player_black = (
        idx: number,
        players: { name: string; rank: number }[],
    ) => {
        const player = players[idx];
        this.update_demo_settings((prev) => ({
            ...prev,
            black_name: player.name,
            black_ranking: player.rank,
        }));
        this.setState({
            selected_demo_player_black: idx,
        });
    };
    update_selected_demo_player_white = (
        idx: number,
        players: { name: string; rank: number }[],
    ) => {
        const player = players[idx];
        this.update_demo_settings((prev) => ({
            ...prev,
            white_name: player.name,
            white_ranking: player.rank,
        }));
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
        const bots = bots_list();
        const selected_bot = bots.find((bot) => bot.id === this.state.conf.bot_id);

        return (
            <div
                id="challenge-basic-settings"
                className="left-pane pane form-horizontal"
                role="form"
            >
                {mode === "computer" && (
                    <div className="form-group">
                        <label className="control-label" htmlFor="engine">
                            {pgettext("Computer opponent", "AI Player")}
                        </label>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                width: "10rem",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    width: "8rem",
                                    overflow: "hidden",
                                }}
                            >
                                {selected_bot ? selected_bot.username : ""}
                            </span>
                            {selected_bot && (
                                <a href={`/player/${selected_bot?.id}`}>
                                    <i className="fa fa-external-link"></i>
                                </a>
                            )}
                        </div>
                    </div>
                )}
                {mode !== "computer" && (
                    <div className="form-group">
                        <label className="control-label" htmlFor="challenge_game_name">
                            {_("Game Name")}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="text"
                                    value={this.gameState().name}
                                    onChange={(ev) =>
                                        this.update_challenge_game_name(ev.target.value)
                                    }
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
                        <div className="checkbox">
                            <input
                                type="checkbox"
                                id="challenge-private"
                                disabled={this.state.challenge.game.rengo}
                                checked={this.gameState().private}
                                onChange={(ev) => this.update_private(ev.target.checked)}
                            />
                        </div>
                    </div>
                </div>
                {!(this.props.playerId || null) && mode === "open" && (
                    <div className="form-group">
                        <label className="control-label" htmlFor="challenge-invite-only">
                            {pgettext(
                                "A checkbox to make a challenge open only to invited people who have the link to it",
                                "Invite-only",
                            )}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="challenge-invite-only"
                                    checked={this.state.challenge.invite_only}
                                    onChange={(ev) => this.update_invite_only(ev.target.checked)}
                                />
                            </div>
                        </div>
                    </div>
                )}
                {mode === "open" && (
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
                                    onChange={(ev) => this.update_rengo(ev.target.checked)}
                                />
                            </div>
                        </div>
                    </div>
                )}
                {mode === "open" && (
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
                                        onChange={(ev) =>
                                            this.update_rengo_casual(ev.target.checked)
                                        }
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
                {mode === "open" && (
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
                                        // It's clearer to display blank ("") if there is no auto-start.  Blank means no autostart, the same as zero.
                                        value={
                                            !this.state.challenge.rengo_auto_start
                                                ? ""
                                                : this.state.challenge.rengo_auto_start
                                        }
                                        onChange={(ev) =>
                                            this.update_rengo_auto_start(parseInt(ev.target.value))
                                        }
                                        id="rengo-auto-start"
                                        className="form-control"
                                        style={{ width: "3em" }}
                                        min="0"
                                        max=""
                                    />

                                    <i
                                        className={
                                            "fa fa-exclamation-circle " +
                                            (this.rengo_auto_start_input_warning()
                                                ? "value-warning"
                                                : "")
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

    rulesSettings = () => {
        return (
            <div>
                <div className="form-group" id="challenge.game.rules-group">
                    <label className="control-label" htmlFor="rules">
                        {_("Rules")}
                    </label>
                    <div className="controls">
                        <div className="checkbox">
                            <select
                                id="challenge-rules"
                                value={this.gameState().rules}
                                onChange={(ev) => this.update_rules(ev.target.value)}
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
        );
    };

    handicapSettings = () => {
        const game = this.gameState();
        return (
            <div className="form-group" id="challenge.game.handicap-group">
                <label className="control-label">{_("Handicap")}</label>
                <div className="controls">
                    <div className="checkbox">
                        <select
                            value={game.handicap}
                            onChange={(ev) => this.update_handicap(parseInt(ev.target.value))}
                            className="challenge-dropdown form-control"
                            id="challenge-handicap"
                        >
                            <option
                                value="-1"
                                /*{disabled={!this.state.conf.handicap_enabled}}*/
                            >
                                {_("Automatic")}
                            </option>
                            <option value="0">{_("None")}</option>
                            {handicapRanges.map((n, idx) => (
                                <option key={idx} value={n} disabled={n > 9 && game.ranked}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    komiSettings = () => {
        const game = this.gameState();
        return (
            <>
                <div className="form-group">
                    <label className="control-label">{_("Komi")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <select
                                value={game.komi_auto}
                                onChange={(ev) => this.update_komi_auto(ev.target.value)}
                                className="challenge-dropdown form-control"
                                id="challenge-komi"
                            >
                                <option value="automatic">{_("Automatic")}</option>
                                <option value="custom" disabled={game.ranked}>
                                    {_("Custom")}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
                {game.komi_auto === "custom" && (
                    <div className="form-group">
                        <label className="control-label"></label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="number"
                                    value={game.komi ?? ""}
                                    onChange={(ev) =>
                                        this.update_komi(parseNumberInput(ev.target.value))
                                    }
                                    className="form-control"
                                    style={{ width: "4em" }}
                                    step="0.5"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    // board size and 'Ranked' checkbox
    additionalSettings = () => {
        const mode = this.props.mode;

        return (
            <div
                id="challenge-basic-settings"
                className="right-pane pane form-horizontal"
                role="form"
            >
                {!this.state.forking_game && mode !== "demo" && this.rankedSettings()}
                {mode === "demo" && this.rulesSettings()}
                {!this.state.forking_game && this.boardSizeSettings()}
                {mode === "demo" && this.komiSettings()}
            </div>
        );
    };

    boardSizeSettings = () => {
        const mode = this.props.mode;
        const conf = this.state.conf;
        const enable_custom_board_sizes = mode === "demo" || !this.state.challenge.game.ranked;

        return (
            <>
                <div className="form-group" id="challenge-board-size-group">
                    <label className="control-label" htmlFor="challenge-board-size">
                        {_("Board Size")}
                    </label>
                    <div className="controls">
                        <div className="checkbox">
                            <select
                                id="challenge-board-size"
                                value={conf.selected_board_size}
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
                                    <option disabled={!enable_custom_board_sizes} value="custom">
                                        {_("Custom Size")}
                                    </option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                </div>
                {conf.selected_board_size === "custom" && (
                    <div className="form-group">
                        <label
                            className="control-label"
                            htmlFor="challenge-board-size-custom"
                        ></label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="number"
                                    value={this.gameState().width ?? ""}
                                    onChange={(ev) =>
                                        this.update_board_width(parseNumberInput(ev.target.value))
                                    }
                                    id="challenge-goban-width"
                                    className="form-control"
                                    style={{ width: "3em" }}
                                    min="1"
                                    max="25"
                                />
                                x
                                <input
                                    type="number"
                                    value={this.gameState().height ?? ""}
                                    onChange={(ev) =>
                                        this.update_board_height(parseNumberInput(ev.target.value))
                                    }
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
            </>
        );
    };

    rankedSettings = () => {
        return (
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
                                    onChange={(ev) =>
                                        this.update_selected_demo_player_black(
                                            parseInt(ev.target.value),
                                            this.props.playersList!,
                                        )
                                    }
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
                                        onChange={(ev) =>
                                            this.update_demo_black_name(ev.target.value)
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    {!this.props.playersList && (
                        <div className="form-group">
                            <label className="control-label" htmlFor="demo-black-name">
                                {_("Rank")}
                            </label>
                            <div className="controls">
                                <div className="checkbox">
                                    <select
                                        value={this.state.demo.black_ranking}
                                        onChange={(ev) =>
                                            this.update_demo_black_ranking(
                                                parseInt(ev.target.value),
                                            )
                                        }
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
                                    onChange={(ev) =>
                                        this.update_selected_demo_player_white(
                                            parseInt(ev.target.value),
                                            this.props.playersList!,
                                        )
                                    }
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
                                        onChange={(ev) =>
                                            this.update_demo_white_name(ev.target.value)
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    {!this.props.playersList && (
                        <div className="form-group">
                            <label className="control-label" htmlFor="demo-white-name">
                                {_("Rank")}
                            </label>
                            <div className="controls">
                                <div className="checkbox">
                                    <select
                                        value={this.state.demo.white_ranking}
                                        onChange={(ev) =>
                                            this.update_demo_white_ranking(
                                                parseInt(ev.target.value),
                                            )
                                        }
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
        const game = this.gameState();
        const conf = this.state.conf;

        const forceSystem: boolean = challenge.game.rengo && challenge.game.rengo_casual_mode;

        return (
            <div
                id="challenge-advanced-fields"
                className="challenge-pane-container form-inline"
                style={{ marginTop: "1em" }}
            >
                <div className="left-pane pane form-horizontal">
                    {mode !== "computer" && this.rulesSettings()}
                    <TimeControlPicker
                        timeControl={this.state.time_control}
                        onChange={(tc) => {
                            // console.log("Time control changed to ", tc);
                            this.setState({
                                time_control: tc,
                            });
                        }}
                        boardWidth={game.width}
                        boardHeight={game.height}
                        forceSystem={forceSystem}
                    />
                </div>

                <div className="right-pane pane form-horizontal">
                    {!this.state.forking_game && this.handicapSettings()}
                    {this.komiSettings()}

                    <div className="form-group">
                        <label className="control-label" htmlFor="challenge-color">
                            {_("Your Color")}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <select
                                    value={this.state.challenge.challenger_color}
                                    onChange={(ev) => this.update_challenge_color(ev.target.value)}
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
                                        checked={game.disable_analysis}
                                        onChange={(ev) =>
                                            this.update_disable_analysis(ev.target.checked)
                                        }
                                        id="challenge-disable-analysis"
                                        type="checkbox"
                                    />{" "}
                                    *
                                </div>
                            </div>
                        </div>

                        {mode === "open" && (
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
                                                onChange={(ev) =>
                                                    this.update_restrict_rank(ev.target.checked)
                                                }
                                                id="challenge-restrict-rank"
                                                type="checkbox"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {conf.restrict_rank && (
                                    <div>
                                        <div className="form-group" id="challenge-min-rank-group">
                                            <label
                                                className="control-label"
                                                htmlFor="challenge-min-rank"
                                            >
                                                {_("Minimum Ranking")}
                                            </label>
                                            <div className="controls">
                                                <div className="checkbox">
                                                    <select
                                                        value={this.state.challenge.min_ranking}
                                                        onChange={(ev) =>
                                                            this.update_min_rank(
                                                                parseInt(ev.target.value),
                                                            )
                                                        }
                                                        id="challenge-min-rank"
                                                        className="challenge-dropdown form-control"
                                                    >
                                                        {ranks.map((r, idx) => (
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
                                                htmlFor="challenge-max-rank"
                                            >
                                                {_("Maximum Ranking")}
                                            </label>
                                            <div className="controls">
                                                <div className="checkbox">
                                                    <select
                                                        value={this.state.challenge.max_ranking}
                                                        onChange={(ev) =>
                                                            this.update_max_rank(
                                                                parseInt(ev.target.value),
                                                            )
                                                        }
                                                        id="challenge-max-rank"
                                                        className="challenge-dropdown form-control"
                                                    >
                                                        {ranks.map((r, idx) => (
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

    handlePreferredSettingChange = (option: PreferredSettingOption | null) => {
        if (option) {
            this.usePreferredSetting(option.value);
        }
    };

    preferredGameSettings = () => {
        const options: PreferredSettingOption[] = this.state.preferred_settings.map(
            (setting: ChallengeDetails, index: number) => ({
                value: index,
                label: challenge_text_description(setting),
                setting: setting,
            }),
        );

        const handicap = this.state.challenge.game.handicap;

        // see usePreferredSetting
        const rank_min = this.state.conf.restrict_rank ? this.state.challenge.min_ranking : -1000;
        const rank_max = this.state.challenge.max_ranking;

        const selected =
            options.find((opt: PreferredSettingOption) => {
                // note that for some reason this.state.conf.restrict_rank is not stored with prefs
                const opt_restrict_rank =
                    opt.setting.min_ranking > -1000 && opt.setting.max_ranking < 1000;

                const rank_choice_match =
                    (!opt_restrict_rank && !this.state.conf.restrict_rank) ||
                    (opt_restrict_rank &&
                        this.state.conf.restrict_rank &&
                        opt.setting.min_ranking === rank_min &&
                        opt.setting.max_ranking === rank_max);

                const selected =
                    (opt.setting.game.rules === this.state.challenge.game.rules &&
                        opt.setting.game.width === this.state.challenge.game.width &&
                        opt.setting.game.height === this.state.challenge.game.height &&
                        opt.setting.game.handicap === handicap &&
                        rank_choice_match &&
                        JSON.stringify(opt.setting.game.time_control_parameters) ===
                            JSON.stringify(this.state.time_control)) ||
                    null;

                return selected;
            }) || null;

        return (
            <div
                className="preferred-settings-container"
                style={{ padding: "0.5em" }}
                ref={this.ref}
            >
                <OgsResizeDetector onResize={this.onResize} targetRef={this.ref} />
                <hr />
                <div className="preferred-settings-container">
                    <div style={{ display: "flex", gap: "1em", alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                            <Select
                                classNamePrefix="ogs-react-select"
                                value={selected}
                                onChange={this.handlePreferredSettingChange}
                                options={options}
                                isClearable={false}
                                isSearchable={false}
                                menuPlacement="auto"
                                placeholder={interpolate(
                                    _("Preferred settings ({{preferred_settings_count}})"),
                                    {
                                        preferred_settings_count:
                                            this.state.preferred_settings.length,
                                    },
                                )}
                            />
                        </div>
                        {selected ? (
                            <button
                                onClick={() => this.deletePreferredSetting(selected.value)}
                                className="xs reject"
                                style={{ flexShrink: 0 }}
                            >
                                {_("Delete")}
                            </button>
                        ) : (
                            <button onClick={this.addToPreferredSettings} className="sm success">
                                {_("Add current setting")}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    renderComputerOpponents() {
        interface Category {
            sort_index: number;
            label: string;
            lower_bound: number;
            upper_bound: number;
        }

        const user = data.get("user");
        let available_bots: (Bot & { category?: Category })[] = bots_list().filter((b) => b.id > 0);
        const board_size = `${this.state.challenge.game.width}x${this.state.challenge.game.height}`;
        console.log(board_size, this.state.challenge.game.speed, this.state.time_control.system);
        console.log(this.state.challenge.game.speed);

        const categories = [
            {
                sort_index: 1,
                label: pgettext("Bot strength category", "Beginner"),
                lower_bound: -99,
                upper_bound: 10,
            },
            {
                sort_index: 2,
                label: pgettext("Bot strength category", "Intermediate"),
                lower_bound: 11,
                upper_bound: 25,
            },
            {
                sort_index: 2,
                label: pgettext("Bot strength category", "Advanced"),
                lower_bound: 26,
                upper_bound: 99,
            },
        ];
        available_bots = available_bots.filter((b) => {
            const speed_settings = (SPEED_OPTIONS as any)?.[board_size]?.[
                this.state.time_control.speed
            ]?.[this.state.time_control.system];
            if (!speed_settings) {
                return false;
            }

            const settings = {
                rank: user.ranking,
                width: this.state.challenge.game.width ?? -1,
                height: this.state.challenge.game.height ?? -1,
                ranked: true,
                handicap: this.state.challenge.game.handicap !== 0,
                system: this.state.time_control.system,
                speed: this.state.time_control.speed,
                [this.state.time_control.system]: speed_settings,
            };
            const [options, message] = getAcceptableTimeSetting(b, settings);
            if (!options) {
                b.disabled = message || undefined;
            } else if (options && options._config_version && options._config_version === 0) {
                b.disabled = llm_pgettext(
                    "Bot is not configured correctly",
                    "Bot is not configured correctly",
                );
            } else {
                b.disabled = undefined;
            }

            b.category = categories[0];
            for (const category of categories) {
                if (
                    b.ranking &&
                    b.ranking >= category.lower_bound &&
                    b.ranking <= category.upper_bound
                ) {
                    b.category = category;
                    break;
                }
            }

            return true;
        });

        // testing
        //available_bots = [...available_bots, ...available_bots];
        //available_bots = [...available_bots, ...available_bots];
        //available_bots = [...available_bots, ...available_bots];

        available_bots.sort((a, b) => {
            if (a.category!.sort_index !== b.category!.sort_index) {
                return a.category!.sort_index - b.category!.sort_index;
            }

            if (a.disabled && !b.disabled) {
                return 1;
            }
            if (b.disabled && !a.disabled) {
                return -1;
            }

            return (a.ranking || 0) - (b.ranking || 0);
        });

        const selected_bot_value = available_bots.find((b) => b.id === this.state.conf.bot_id);
        if (selected_bot_value?.disabled) {
            this.update_bot_id(0);
        }

        return available_bots.length <= 0 ? (
            <div className="no-available-bots">
                {_("No bots available that can play with the selected settings")}
            </div>
        ) : (
            <div className="bot-categories">
                {categories.map((category) => {
                    return (
                        <div key={category.upper_bound} className="bot-category">
                            <h1>{category.label}</h1>

                            <div key={category.upper_bound} className="bot-options">
                                {available_bots
                                    //.filter((bot) => !bot.disabled)
                                    .filter(
                                        (bot) => bot.ranking && bot.ranking >= category.lower_bound,
                                    )
                                    .filter(
                                        (bot) => bot.ranking && bot.ranking <= category.upper_bound,
                                    )
                                    .map((bot) => {
                                        return (
                                            <div
                                                key={bot.id}
                                                className={
                                                    "bot-option" +
                                                    (bot.id === selected_bot_value?.id
                                                        ? " selected"
                                                        : "") +
                                                    (bot.disabled ? " disabled" : "")
                                                }
                                                onClick={() => {
                                                    if (!bot.disabled) {
                                                        this.update_bot_id(bot.id);
                                                    }
                                                }}
                                            >
                                                <PlayerIcon
                                                    user={bot}
                                                    size={64}
                                                    style={{ width: "48px", height: "48px" }}
                                                />
                                                <span className="username-rank">
                                                    <span className="username">{bot.username}</span>
                                                    {!preferences.get("hide-ranks") && (
                                                        <span className="rank">
                                                            ({rankString(bot.ranking || 0)})
                                                        </span>
                                                    )}
                                                </span>

                                                {bot.disabled && (
                                                    <span className="disabled-reason">
                                                        {bot.disabled}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    render() {
        const user = data.get("user");
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
                <div
                    className={
                        "header" +
                        (mode === "computer" && this.state.show_computer_settings
                            ? " computer-settings-expanded"
                            : "")
                    }
                >
                    {mode !== "computer" ? (
                        <h2>
                            {mode === "open" && <span>{_("Custom Game")}</span>}
                            {mode === "demo" && (
                                <span>
                                    {this.props.game_record_mode
                                        ? pgettext("Game record from real life game", "Game Record")
                                        : _("Demo Board")}
                                    ?
                                </span>
                            )}
                            {mode === "player" && (
                                <span className="header-with-icon">
                                    <PlayerIcon id={player_id} size={32} />
                                    &nbsp; {player_username}
                                </span>
                            )}
                        </h2>
                    ) : (
                        <div className="computer-opponents">
                            <h2>{_("Pick your computer opponent")}:</h2>
                            <div>{this.renderComputerOpponents()}</div>
                        </div>
                    )}
                </div>
                {(mode !== "computer" || this.state.show_computer_settings) && (
                    <div
                        className={
                            "body" +
                            (this.state.show_computer_settings ? " computer-settings-expanded" : "")
                        }
                    >
                        <div className="challenge  form-inline">
                            <div className="challenge-pane-container">
                                {this.basicSettings()}
                                {!this.state.initial_state && this.additionalSettings()}
                            </div>

                            <hr />
                            {mode !== "demo" && this.advancedSettings()}
                            {mode === "demo" && this.advancedDemoSettings()}
                        </div>
                    </div>
                )}
                <div className="buttons">
                    {this.props.modal.close ? (
                        <button onClick={this.props.modal.close}>{_("Close")}</button>
                    ) : (
                        <span />
                    )}

                    {user?.anonymous && (
                        <div className="anonymous-container">
                            {_("Please sign in to play")}
                            <div>
                                <a href="/register#/play">{_("Register for Free")}</a>
                                {" | "}
                                <a href="/sign-in#/play">{_("Sign in")}</a>
                            </div>
                        </div>
                    )}

                    {!user?.anonymous && mode === "demo" && (
                        <button onClick={this.createDemo} className="primary">
                            {this.props.game_record_mode
                                ? _("Create Game Record")
                                : _("Create Demo")}
                        </button>
                    )}

                    {mode === "computer" && (
                        <button onClick={this.toggleComputerSettings}>
                            {this.state.show_computer_settings
                                ? _("Hide Custom Settings")
                                : _("Show Custom Settings")}
                        </button>
                    )}

                    {!user?.anonymous && mode === "computer" && (
                        <button
                            onClick={this.createChallenge}
                            className={"primary"}
                            disabled={!this.state.conf.bot_id}
                        >
                            {_("Play")}
                        </button>
                    )}
                    {!user?.anonymous && mode === "player" && (
                        <button onClick={this.createChallenge} className="primary">
                            {_("Send Challenge")}
                        </button>
                    )}
                    {!user?.anonymous && mode === "open" && (
                        <button
                            onClick={this.createChallenge}
                            className="primary"
                            disabled={this.rengo_auto_start_input_warning()}
                        >
                            {pgettext("Create a game anyone can join", "Create Game")}
                        </button>
                    )}
                </div>
                {(mode !== "computer" || this.state.show_computer_settings) &&
                    mode !== "demo" &&
                    this.preferredGameSettings()}
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

    toggleComputerSettings = () => {
        this.setState({
            show_computer_settings: !this.state.show_computer_settings,
        });
    };
}

export function isStandardBoardSize(board_size: string): boolean {
    return board_size in standard_board_sizes;
}
