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

import * as preferences from "@/lib/preferences";
import * as data from "@/lib/data";
import * as Sentry from "@sentry/browser";
import * as React from "react";
import { _ } from "@/lib/translate";
import { get_clock_drift, get_network_latency, socket } from "@/lib/sockets";
import { current_language } from "@/lib/translate";
import { Goban, GobanBase, GobanEngine, setGobanRenderer } from "goban";
import { sfx } from "@/lib/sfx";
import { toast } from "@/lib/toast";

window.GobanThemes = Goban.THEMES;
window.GobanEngine = GobanEngine;

let previous_toast: any = null;

export function configure_goban() {
    function syncGobanRenderer(v?: string) {
        if (v === "enabled") {
            setGobanRenderer("canvas");
        } else {
            setGobanRenderer("svg");
        }
    }

    syncGobanRenderer(data.get("experiments.canvas"));
    data.watch("experiments.canvas", syncGobanRenderer);

    GobanBase.setCallbacks({
        defaultConfig: () => {
            return {
                server_socket: socket,
                player_id: data.get("user").anonymous ? 0 : data.get("user").id,
            };
        },

        getCoordinateDisplaySystem: (): "A1" | "1-1" => {
            switch (preferences.get("board-labeling")) {
                case "A1":
                    return "A1";
                case "1-1":
                    return "1-1";
                default:
                    // auto
                    switch (current_language) {
                        case "ko":
                        case "ja":
                        case "zh-cn":
                        case "zh-hk":
                        case "zh-tw":
                            return "1-1";
                        default:
                            return "A1";
                    }
            }
        },

        isAnalysisDisabled: (
            goban: GobanBase,
            perGameSettingAppliesToNonPlayers = false,
        ): boolean => {
            if (goban.engine.phase === "finished") {
                return false;
            }

            // The player's preference setting to always disable analysis overrides the per-game setting for
            // their own games.
            if (
                preferences.get("always-disable-analysis") &&
                goban.engine.isParticipant(data.get("user")?.id || 0)
            ) {
                return true;
            }

            // If the user hasn't enabled the always-disable-analysis option (or they do not participate in this game),
            // we check the per-game setting.
            if (perGameSettingAppliesToNonPlayers) {
                // This is used for the SGF download which is disabled even for users that are not
                // participating in the game (or not signed in)
                return !!goban.engine.config.original_disable_analysis;
            } else {
                return !!goban.engine.config.disable_analysis;
            }
        },

        getClockDrift: (): number => get_clock_drift(),
        getNetworkLatency: (): number => get_network_latency(),
        getLocation: (): string => window.location.pathname,
        //getShowMoveNumbers: (): boolean => !!preferences.get("show-move-numbers"),
        getShowVariationMoveNumbers: (): boolean => preferences.get("show-variation-move-numbers"),
        getMoveTreeNumbering: (): "none" | "move-number" | "move-coordinates" =>
            preferences.get("move-tree-numbering"),
        getStoneFontScale: (): number => preferences.get("stone-font-scale"),
        getCDNReleaseBase: (): string => data.get("config.cdn_release", ""),
        getSoundEnabled: (): boolean => sfx.getVolume("master") > 0,
        getSoundVolume: (): number => sfx.getVolume("master"),

        watchSelectedThemes: (cb) => preferences.watchSelectedThemes(cb),
        getSelectedThemes: () => preferences.getSelectedThemes(),

        getShowUndoRequestIndicator: (): boolean =>
            preferences.get("visual-undo-request-indicator"),

        customBlackStoneColor: (): string =>
            preferences.get("goban-theme-custom-black-stone-color"),
        customBlackTextColor: (): string => preferences.get("goban-theme-custom-white-stone-color"),
        customWhiteStoneColor: (): string =>
            preferences.get("goban-theme-custom-white-stone-color"),
        customWhiteTextColor: (): string => preferences.get("goban-theme-custom-black-stone-color"),
        customBoardColor: (): string => preferences.get("goban-theme-custom-board-background"),
        customBoardLineColor: (): string => preferences.get("goban-theme-custom-board-line"),
        customBoardUrl: (): string => preferences.get("goban-theme-custom-board-url"),
        customBlackStoneUrl: (): string => preferences.get("goban-theme-custom-black-url"),
        customWhiteStoneUrl: (): string => preferences.get("goban-theme-custom-white-url"),
        addCoordinatesToChatInput: (coordinates: string): void => {
            const chat_input = document.querySelector(".chat-input") as HTMLInputElement;

            if (chat_input && !chat_input.disabled) {
                const txt = (chat_input.value.trim() + " " + coordinates).trim();
                chat_input.value = txt;
            }
        },

        canvasAllocationErrorHandler: (
            note: string | null,
            error: Error,
            extra: {
                total_allocations_made: number;
                total_pixels_allocated: number;
                width?: number | string;
                height?: number | string;
            },
        ) => {
            const canvas_ct = document.querySelectorAll("canvas").length;

            Sentry.captureException(new Error("Canvas allocation failed"), {
                extra: {
                    ...extra,
                    note,
                    canvas_ct,
                    uptime: performance.now(),
                    black_theme: preferences.get("goban-theme-black"),
                    white_theme: preferences.get("goban-theme-white"),
                },
            });
            preferences.setWithoutEmit("goban-theme-black", "Plain");
            preferences.setWithoutEmit("goban-theme-white", "Plain");
            if (performance.now() > 10000) {
                alert(
                    "A canvas allocation device limit has been reached, we are changing " +
                        "the stone theme to be plain stones and reloading the page now " +
                        "to help prevent visual glitches.",
                );
                window.location.reload();
                return;
            }
            throw new Error(
                "Oops, an error has occurred creating a canvas element. " +
                    "The team has been made aware of this issue. You can try " +
                    "reloading a page, or try a different browser or device.",
            );
        },

        toast: (message_id: string, duration: number) => {
            let message: React.ReactElement | null = null;
            switch (message_id) {
                case "refusing_to_remove_group_is_alive":
                    message = (
                        <div>
                            {_(
                                "This group appears alive. Long press or shift+click to forcibly removal it.",
                            )}
                        </div>
                    );
                    break;
                default:
                    message = <div>{message_id}</div>;
            }
            if (message) {
                if (previous_toast) {
                    previous_toast.close();
                }
                previous_toast = toast(message, duration);
            }
        },
    });
}
