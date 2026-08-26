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

import { browserHistory } from "@/lib/ogsHistory";
import { _, pgettext } from "@/lib/translate";
import { post, del } from "@/lib/requests";
import { Modal } from "@/components/Modal";
import { socket } from "@/lib/sockets";
import { amateurRanks } from "@/lib/rank_utils";
import { CreatedChallengeInfo } from "@/lib/types";
import { errorLogger, errorAlerter, dup } from "@/lib/misc";
import { PlayerIcon } from "@/components/PlayerIcon";
import { isLiveGame, TimeControl } from "@/components/TimeControl";
import { sfx } from "@/lib/sfx";
import {
    notification_manager,
    NotificationManagerEvents,
} from "@/components/Notifications/NotificationManager";
import { one_bot, bot_count, bots_list } from "@/lib/bots";
import { goban_view_mode } from "@/views/Game/util";

import { copyChallengeLinkURL } from "@/components/ChallengeLinkButton";

import { alert } from "@/lib/swal_config";
import {
    recallTimeControlSettings,
    saveTimeControlSettings,
    updateSystem,
} from "@/components/TimeControl/TimeControlUpdates";
import {
    rejectionDetailsToMessage,
    sanitizeChallengeDetails,
    getPreferredSettings,
    getDefaultKomi,
    isKomiOption,
    isRuleSet,
    isColorSelectionOption,
} from "@/components/ChallengeModal/ChallengeModal.utils";
import {
    ChallengeDetails,
    ChallengeInput,
    ChallengeModalConf,
    GameInput,
    ChallengeModalInput,
    ChallengeModalProperties,
    ChallengeModalState,
    RejectionDetails,
    UpdateFn,
} from "@/components/ChallengeModal/ChallengeModal.types";
import "./ChallengeModal.css";
import { ChallengeModalComputerOpponents } from "./ChallengeModalComputerOpponents";
import { ChallengeModalAdditionalSettings } from "./ChallengeModalAdditionalSettings";
import { ChallengeModalAdvancedSettings } from "./ChallengeModalAdvancedSettings";
import { ChallengeModalPreferredGameSettings } from "./ChallengeModalPreferredGameSettings";
import { State } from "./type";
import { ChallengeModalBasicSettings } from "./ChallengeModalBasicSettings";

/* Constants  */

const handicapRanges: number[] = [];
for (let i = 1; i <= 36; ++i) {
    handicapRanges.push(i);
}

const ranks = amateurRanks();

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

function isRankedBotBoardSize(width: number | null, height: number | null): boolean {
    return (
        (width === 19 && height === 19) ||
        (width === 13 && height === 13) ||
        (width === 9 && height === 9)
    );
}

function computeBotRanked(
    game: Pick<GameInput, "private" | "width" | "height" | "handicap" | "komi_auto">,
): boolean {
    return (
        !game.private &&
        isRankedBotBoardSize(game.width, game.height) &&
        game.handicap <= 9 &&
        game.komi_auto === "automatic"
    );
}

// Auto-sets `ranked` for bot challenges based on whether the game looks like
// a normal ranked game. User-controlled fields (handicap, komi, etc.) are
// left alone - picking unusual values just flips `ranked` to false.
function applyBotRanked(game: GameInput): GameInput {
    return { ...game, ranked: computeBotRanked(game) };
}

// The backend's handicap calculator ignores requested_komi when the handicap
// is automatic (<0), so in the UI we keep komi in lockstep: auto handicap =>
// auto komi.
function coerceKomiForAutoHandicap(game: GameInput): GameInput {
    if (game.handicap < 0) {
        return { ...game, komi_auto: "automatic", komi: undefined };
    }
    return game;
}

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

        const game_settings = challenge.game;

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
            forking_game: !!this.props.initialState,

            preferred_settings: getPreferredSettings(),
            view_mode: goban_view_mode(),
            hide_preferred_settings_on_portrait: true,
            time_control: this.loadLastTimeControlSettings(),
        };

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

            // Update selected_board_size to match the potentially updated width/height
            if (this.props.config.challenge?.game) {
                const width = state.challenge.game.width;
                const height = state.challenge.game.height;
                state.conf.selected_board_size =
                    standard_board_sizes[`${width}x${height}`] || "custom";
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

        state.challenge.game = coerceKomiForAutoHandicap(state.challenge.game);
        if (this.props.mode === "computer") {
            state.challenge.game = applyBotRanked(state.challenge.game);
            state.challenge.game.disable_analysis = false;
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

    gameStateOf(state: ChallengeModalState): any {
        return state.challenge.game;
    }

    gameState() {
        return this.gameStateOf(this.state);
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

        let challenge_to_save = next.challenge;
        if (this.props.mode === "computer") {
            // ranked and disable_analysis are forced in bot mode, so don't let
            // them overwrite the user's persisted preference used by other modes.
            const persisted: any = data.get(`challenge.challenge.${speed}`);
            challenge_to_save = {
                ...next.challenge,
                game: {
                    ...next.challenge.game,
                    ranked: persisted?.game?.ranked ?? next.challenge.game.ranked,
                    disable_analysis:
                        persisted?.game?.disable_analysis ?? next.challenge.game.disable_analysis,
                },
            };
        }

        data.set(`challenge.challenge.${speed}`, challenge_to_save);
        data.set("challenge.bot", next.conf.bot_id);
        data.set("challenge.restrict_rank", next.conf.restrict_rank);
    }

    addToPreferredSettings = () => {
        const preferred_settings = getPreferredSettings();
        const challenge = dup(this.getChallenge());
        challenge.game.name = (this.gameState().name ?? "").trim();
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

    selectPreferredSetting = (index: number) => {
        const preferred_settings = getPreferredSettings();
        const setting: ChallengeDetails = dup(preferred_settings[index]);
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

        if (challenge.game.ranked) {
            challenge.game.komi_auto = "automatic";
        }
        if (challenge.game.komi_auto === "automatic") {
            challenge.game.komi = undefined;
        }

        return challenge;
    }

    createChallenge = () => {
        const next = this.next();

        if (!this.validateBoardSize()) {
            void alert.fire(_("Invalid board size, please correct and try again"));
            return;
        }

        const conf = next.conf;

        if (this.gameStateOf(next).komi_auto === "custom" && this.gameStateOf(next).komi === null) {
            void alert.fire(_("Invalid custom komi, please correct and try again"));
            return;
        }

        let player_id: number | undefined = 0;
        if (this.props.mode === "player") {
            player_id = this.props.playerId;
            if (!player_id || player_id === data.get("user").id) {
                return;
            }
        }

        if (this.props.mode === "computer") {
            player_id = conf.bot_id;

            if (!player_id) {
                player_id = bot_count() === 0 ? 0 : (one_bot()?.id ?? 0);
            }

            console.log("Bot set to ", player_id);
            preferences.set("automatch.bot-ranked", next.challenge.game.ranked);
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
                         * so it needs a dialog to let them know that we made the challenge.
                         *
                         * This doesn't _have to be_ a modal, but currently is a modal pending a different design.
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
    update_game_settings = (update_fn: UpdateFn<GameInput>): void =>
        this.update_challenge_settings((prev) => ({ ...prev, game: update_fn(prev.game) }));

    /* direct fn updates */
    update_bot_id = (id: number) => this.update_conf((prev) => ({ ...prev, bot_id: id }));

    update_game_name = (name: string): void =>
        this.update_game_settings((prev) => ({ ...prev, name: name }));

    update_private = (isPrivate: boolean) =>
        this.update_game_settings((prev) => {
            const next = { ...prev, private: isPrivate };
            if (this.props.mode === "computer") {
                return applyBotRanked(next);
            }
            return { ...next, ranked: false };
        });

    update_invite_only = (invite_only: boolean) => {
        this.update_challenge_settings((prev) => ({ ...prev, invite_only: invite_only }));
        // If we're in open mode and invite_only is being turned off, also turn off private
        if (this.props.mode === "open" && !invite_only && this.state.challenge.game.private) {
            this.update_private(false);
        }
    };

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
    update_board_size = (selection: string) => {
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
        this.update_game_settings((prev) => {
            const next = { ...prev, width: width };
            if (this.props.mode === "computer") {
                return applyBotRanked(next);
            }
            return next;
        });

    update_board_height = (height: number | null) =>
        this.update_game_settings((prev) => {
            const next = { ...prev, height: height };
            if (this.props.mode === "computer") {
                return applyBotRanked(next);
            }
            return next;
        });

    update_rules = (rules: string) => {
        if (!isRuleSet(rules)) {
            return;
        }
        this.update_game_settings((prev) => ({ ...prev, rules: rules }));
    };
    update_handicap = (handicap: number) =>
        this.update_game_settings((prev) => {
            const next = coerceKomiForAutoHandicap({ ...prev, handicap: handicap });
            if (this.props.mode === "computer") {
                return applyBotRanked(next);
            }
            return next;
        });

    update_komi_option = (komi_option: string) => {
        if (!isKomiOption(komi_option)) {
            console.error(`invalid komi option: ${komi_option}`);
            return;
        }
        this.setState((prev) => {
            const changedToCustom =
                komi_option === "custom" && prev.challenge.game.komi_auto !== "custom";

            const nextGame = {
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
            };

            return {
                challenge: {
                    ...prev.challenge,
                    game: this.props.mode === "computer" ? applyBotRanked(nextGame) : nextGame,
                },
            };
        });
    };

    update_komi = (komi: number | null) =>
        this.update_game_settings((prev) => ({ ...prev, komi: komi }));
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

    render() {
        const user = data.get("user");
        const mode = this.props.mode;
        const player_id = this.props.playerId;
        const player = player_id && player_cache.lookup(player_id);
        const player_username = player ? player.username : "...";

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
                            <div>
                                <ChallengeModalComputerOpponents
                                    width={this.state.challenge.game.width}
                                    height={this.state.challenge.game.height}
                                    handicap={this.state.challenge.game.handicap}
                                    speed={this.state.time_control.speed}
                                    system={this.state.time_control.system}
                                    botId={this.state.conf.bot_id}
                                    updateBotId={this.update_bot_id}
                                />
                            </div>
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
                                <ChallengeModalBasicSettings
                                    state={this.state as any as State}
                                    mode={mode}
                                    updateGameName={this.update_game_name}
                                    updateInviteOnly={this.update_invite_only}
                                    updatePrivate={this.update_private}
                                    updateRengo={this.update_rengo}
                                    updateRengoCasual={this.update_rengo_casual}
                                    updateRengoAutoStart={this.update_rengo_auto_start}
                                    rengoAutoStartInputWarning={this.rengo_auto_start_input_warning}
                                />
                                {!this.state.initial_state && (
                                    <ChallengeModalAdditionalSettings
                                        forkingGame={this.state.forking_game}
                                        mode={mode}
                                        game={this.state.challenge.game}
                                        conf={this.state.conf}
                                        updateRanked={this.update_ranked}
                                        updateBoardSize={this.update_board_size}
                                        updateBoardWidth={this.update_board_width}
                                        updateBoardHeight={this.update_board_height}
                                    />
                                )}
                            </div>

                            <hr />
                            <ChallengeModalAdvancedSettings
                                mode={mode}
                                challenge={this.state.challenge}
                                game={this.gameState()}
                                conf={this.state.conf}
                                timeControl={this.state.time_control}
                                forkingGame={this.state.forking_game}
                                handicapRanges={handicapRanges}
                                ranks={ranks}
                                onTimeControlChange={(tc) => {
                                    this.setState({
                                        time_control: tc,
                                    });
                                }}
                                updateRules={this.update_rules}
                                updateHandicap={this.update_handicap}
                                updateKomiOption={this.update_komi_option}
                                updateKomi={this.update_komi}
                                updateChallengeColor={this.update_challenge_color}
                                updateDisableAnalysis={this.update_disable_analysis}
                                updateRestrictRank={this.update_restrict_rank}
                                updateMinRank={this.update_min_rank}
                                updateMaxRank={this.update_max_rank}
                            />
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
                {mode !== "computer" && (
                    <ChallengeModalPreferredGameSettings
                        preferredSettings={this.state.preferred_settings}
                        challenge={this.state.challenge}
                        conf={this.state.conf}
                        timeControl={this.state.time_control}
                        containerRef={this.ref}
                        onResize={this.onResize}
                        selectPreferredSetting={this.selectPreferredSetting}
                        deletePreferredSetting={this.deletePreferredSetting}
                        addToPreferredSettings={this.addToPreferredSettings}
                    />
                )}
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
        this.upstate_object = dup(this.state);
        return this.upstate_object;
    }
    next(): any {
        return this.nextState();
    }

    toggleComputerSettings = () =>
        this.setState((state) => ({
            show_computer_settings: !state.show_computer_settings,
        }));
}

export function isStandardBoardSize(board_size: string): boolean {
    return board_size in standard_board_sizes;
}
