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

import * as preferences from "preferences";
import * as data from "data";
import {get_clock_drift, get_network_latency, termination_socket} from 'sockets';
import {_, interpolate, pgettext, current_language} from "translate";
import {Goban, GoEngine, GoThemes} from 'goban';
import {sfx} from "sfx";


window['Goban'] = Goban;
window['GoThemes'] = GoThemes;
window['GoEngine'] = GoEngine;

data.setDefault("custom.black", "#000000");
data.setDefault("custom.white", "#FFFFFF");
data.setDefault("custom.board", "#DCB35C");
data.setDefault("custom.line", "#000000");
data.setDefault("custom.url", "");

export function configure_goban() {
    Goban.setHooks({
        defaultConfig: () => {
            return {
                server_socket : termination_socket,
                player_id     : (data.get("user").anonymous ? 0 : data.get("user").id),
            };
        },

        getCoordinateDisplaySystem: (): 'A1'|'1-1' => {
            switch (preferences.get('board-labeling')) {
                case 'A1':
                    return 'A1';
                case '1-1':
                    return '1-1';
                default: // auto
                    switch (current_language) {
                        case 'ko':
                        case 'ja':
                        case 'zh-cn':
                        case 'zh-hk':
                        case 'zh-tw':
                            return '1-1';
                        default:
                            return 'A1';
                    }
            }
        },

        isAnalysisDisabled: (goban: Goban, perGameSettingAppliesToNonPlayers = false): boolean => {
            // The player's preference setting to always disable analysis overrides the per-game setting for
            // their own games.
            if (preferences.get("always-disable-analysis") && goban.isParticipatingPlayer()) {
                return true;
            }

            // If the user hasn't enabled the always-disable-analysis option (or they do not participate in this game),
            // we check the per-game setting.
            if (perGameSettingAppliesToNonPlayers) {
                // This is used for the SGF download which is disabled even for users that are not
                // participating in the game (or not signed in)
                return goban.engine.config.original_disable_analysis;
            } else {
                return goban.engine.config.disable_analysis;
            }
        },

        getClockDrift: (): number => get_clock_drift(),
        getNetworkLatency: (): number => get_network_latency(),
        getLocation: (): string => window.location.pathname,
        getShowMoveNumbers: (): boolean => !!preferences.get("show-move-numbers"),
        getShowVariationMoveNumbers: (): boolean => preferences.get("show-variation-move-numbers"),
        getMoveTreeNumbering: (): "none" | "move-number" | "move-coordinates" => preferences.get("move-tree-numbering"),
        getCDNReleaseBase: (): string => data.get('config.cdn_release'),
        getSoundEnabled: (): boolean => sfx.getVolume('master') > 0,
        getSoundVolume: (): number => sfx.getVolume('master'),

        watchSelectedThemes: (cb) => preferences.watchSelectedThemes(cb),
        getSelectedThemes: () => preferences.getSelectedThemes(),

        discBlackStoneColor: (): string => data.get("custom.black"),
        discBlackTextColor: (): string => data.get("custom.white"),
        discWhiteStoneColor: (): string => data.get("custom.white"),
        discWhiteTextColor: (): string => data.get("custom.black"),
        plainBoardColor: (): string => data.get("custom.board"),
        plainBoardLineColor: (): string => data.get("custom.line"),
        plainBoardUrl: (): string => data.get("custom.url"),

        addCoordinatesToChatInput: (coordinates: string): void => {
            const chat_input = $(".chat-input");

            if (!chat_input.attr("disabled")) {
                const txt = (chat_input.val().trim() + " " + coordinates).trim();
                chat_input.val(txt);
            }
        },

        /*
        updateScoreEstimation: (est_winning_color:"black"|"white", number_of_points:number):void => {
            let color = est_winning_color === "black" ? _("Black") : _("White");
            $("#score-estimation").text(interpolate(pgettext("Score estimation result", "Estimation: %s by %s"), [color, number_of_points.toFixed(1)]));
        },
        */
    });
}
