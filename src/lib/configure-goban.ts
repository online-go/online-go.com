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

import * as preferences from "preferences";
import * as data from "data";
import * as Sentry from "@sentry/browser";
import { get_clock_drift, get_network_latency, socket } from "sockets";
import { current_language } from "translate";
import { Goban, GobanCore, GoEngine, GoThemes } from "goban";
import { sfx } from "sfx";

(window as any)["Goban"] = Goban;
(window as any)["GoThemes"] = GoThemes;
(window as any)["GoEngine"] = GoEngine;

data.setDefault("custom.black", "#000000");
data.setDefault("custom.white", "#FFFFFF");
data.setDefault("custom.board", "#DCB35C");
data.setDefault("custom.line", "#000000");
data.setDefault("custom.url", "");

export function configure_goban() {
    Goban.setHooks({
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
            goban: GobanCore,
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
        getShowMoveNumbers: (): boolean => !!preferences.get("show-move-numbers"),
        getShowVariationMoveNumbers: (): boolean => preferences.get("show-variation-move-numbers"),
        getMoveTreeNumbering: (): "none" | "move-number" | "move-coordinates" =>
            preferences.get("move-tree-numbering"),
        getCDNReleaseBase: (): string => data.get("config.cdn_release", ""),
        getSoundEnabled: (): boolean => sfx.getVolume("master") > 0,
        getSoundVolume: (): number => sfx.getVolume("master"),

        watchSelectedThemes: (cb) => preferences.watchSelectedThemes(cb),
        getSelectedThemes: () => preferences.getSelectedThemes(),

        discBlackStoneColor: (): string => data.get("custom.black", ""),
        discBlackTextColor: (): string => data.get("custom.white", ""),
        discWhiteStoneColor: (): string => data.get("custom.white", ""),
        discWhiteTextColor: (): string => data.get("custom.black", ""),
        plainBoardColor: (): string => data.get("custom.board", ""),
        plainBoardLineColor: (): string => data.get("custom.line", ""),
        plainBoardUrl: (): string => data.get("custom.url", ""),

        addCoordinatesToChatInput: (coordinates: string): void => {
            const chat_input = $(".chat-input");

            if (!chat_input.attr("disabled")) {
                const txt = (chat_input.val().trim() + " " + coordinates).trim();
                chat_input.val(txt);
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
    });
}
