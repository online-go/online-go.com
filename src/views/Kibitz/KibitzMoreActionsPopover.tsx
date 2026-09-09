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
import { _, interpolate, pgettext } from "@/lib/translate";
import { rulesText } from "@/lib/misc";
import { shortDurationString, shortShortTimeControl } from "@/components/TimeControl/util";
import type { JGOFTimeControl } from "goban";
import { api1 } from "@/lib/requests";
import { popover, PopOver } from "@/lib/popover";
import { GobanController } from "@/lib/GobanController";
import { useUser } from "@/lib/hooks";
import { openReport } from "@/components/Report";
import { openGameInfoModal } from "@/views/Game/GameInfoModal";
import { openGameLinkModal } from "@/views/Game/GameLinkModal";
import "@/views/Game/GameSidebarPanels.css";
import "./KibitzMoreActionsPopover.css";

/** The room-management entries this menu offers, gated the same way the
 *  settings menu gated them. `onRoomInformation` is the entry for a viewer
 *  who manages nothing: it still names the room's owner. */
/** The time control as this menu shows it. Fischer drops the maximum that
 *  `shortShortTimeControl` spells out — "5m+7s" is what a spectator needs,
 *  and the exact cap is still in Game information. */
function timeControlText(time_control: JGOFTimeControl | undefined): string {
    if (!time_control) {
        return "";
    }
    if (time_control.system === "fischer") {
        return interpolate(pgettext("Fischer time, without the maximum", "%s+%s"), [
            shortDurationString(time_control.initial_time),
            shortDurationString(time_control.time_increment),
        ]);
    }
    return shortShortTimeControl(time_control);
}

export interface KibitzMoreActionsRoomActions {
    canEditRoom: boolean;
    canChangeBoard: boolean;
    canDeleteRoom: boolean;
    onEditDetails: () => void;
    onChangeBoard: () => void;
    onRoomInformation: () => void;
}

interface KibitzMoreActionsPopoverProps {
    /** Null while the room has no live game; the game entries are then
     *  left out and only the room entries remain. */
    controller: GobanController | null;
    roomActions?: KibitzMoreActionsRoomActions;
    onClose: () => void;
}

export function KibitzMoreActionsPopover({
    controller,
    roomActions,
    onClose,
}: KibitzMoreActionsPopoverProps): React.ReactElement {
    const user = useUser();
    const goban = controller?.goban ?? null;
    const engine = goban?.engine ?? null;
    const game_id = goban ? Number(goban.config.game_id) : 0;
    const sgf_url = api1(`games/${game_id}/sgf`);
    let analysis_disabled = false;
    try {
        analysis_disabled = goban?.isAnalysisDisabled(true) ?? false;
    } catch {
        analysis_disabled = false;
    }
    // Same rule as the Game page's actions panel: the server refuses the
    // SGF of a game in progress to anonymous users and to its players.
    const sgf_disabled =
        analysis_disabled ||
        !engine ||
        (engine.phase !== "finished" &&
            (user.anonymous ||
                user.id === engine.config.black_player_id ||
                user.id === engine.config.white_player_id));
    const report_disabled = user.anonymous;

    const wrap = (fn: () => void) => () => {
        fn();
        onClose();
    };

    const manages_room =
        !!roomActions &&
        (roomActions.canEditRoom || roomActions.canChangeBoard || roomActions.canDeleteRoom);

    // The game's fixed settings head the menu: they are reference, not
    // actions, and the room title only has room for the time control.
    const settings: string[] = [];
    if (engine) {
        settings.push(rulesText(engine.rules));
        if (engine.handicap) {
            settings.push(
                interpolate(
                    pgettext(
                        "Handicap shown in the Kibitz More actions menu",
                        "Handicap {{count}}",
                    ),
                    { count: engine.handicap },
                ),
            );
        }
        const time_control = timeControlText(goban?.config?.time_control);
        if (time_control) {
            settings.push(time_control);
        }
    }

    return (
        <div className="GamePopover KibitzMoreActionsPopover">
            <div className="GameSidebarPanel">
                {settings.length > 0 && (
                    <div className="KibitzMoreActionsPopover-settings">
                        {settings.map((setting) => setting.trim()).join(" \u00b7 ")}
                    </div>
                )}
                {goban && engine && controller && (
                    <>
                        <button
                            type="button"
                            className="GameSidebarPanel-item"
                            onClick={wrap(() =>
                                openGameInfoModal(
                                    goban.config,
                                    engine.players.black,
                                    engine.players.white,
                                    controller.annulled,
                                    controller.creator_id || goban.review_owner_id || 0,
                                ),
                            )}
                        >
                            <i className="fa fa-info-circle" />
                            <span>{_("Game information")}</span>
                        </button>
                        <button
                            type="button"
                            className="GameSidebarPanel-item"
                            onClick={wrap(() => openGameLinkModal(goban))}
                        >
                            <i className="fa fa-share-alt" />
                            <span>{_("Link to game")}</span>
                        </button>
                        <a
                            className={"GameSidebarPanel-item" + (sgf_disabled ? " disabled" : "")}
                            href={sgf_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(ev) => {
                                if (sgf_disabled) {
                                    ev.preventDefault();
                                    return;
                                }
                                onClose();
                            }}
                        >
                            <i className="fa fa-download" />
                            <span>{_("Download SGF")}</span>
                        </a>
                        <button
                            type="button"
                            className="GameSidebarPanel-item"
                            disabled={report_disabled}
                            onClick={wrap(() => openReport({ reported_game_id: game_id }))}
                        >
                            <i className="fa fa-exclamation-triangle" />
                            <span>{_("Call moderator")}</span>
                        </button>
                    </>
                )}
                {roomActions && (
                    <>
                        {roomActions.canEditRoom || roomActions.canDeleteRoom ? (
                            <button
                                type="button"
                                className="GameSidebarPanel-item"
                                onClick={wrap(roomActions.onEditDetails)}
                            >
                                <i className="fa fa-pencil" />
                                <span>
                                    {pgettext(
                                        "Button label for editing Kibitz room details",
                                        "Edit room details",
                                    )}
                                </span>
                            </button>
                        ) : null}
                        {roomActions.canChangeBoard ? (
                            <button
                                type="button"
                                className="GameSidebarPanel-item"
                                onClick={wrap(roomActions.onChangeBoard)}
                            >
                                <i className="fa fa-exchange" />
                                <span>
                                    {pgettext(
                                        "Button label for changing the live Kibitz game",
                                        "Change live game",
                                    )}
                                </span>
                            </button>
                        ) : null}
                        {!manages_room ? (
                            <button
                                type="button"
                                className="GameSidebarPanel-item"
                                onClick={wrap(roomActions.onRoomInformation)}
                            >
                                <i className="fa fa-users" />
                                <span>
                                    {pgettext(
                                        "Button that shows who owns a Kibitz room, for a viewer who cannot manage it",
                                        "Room information",
                                    )}
                                </span>
                            </button>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}

/** Opens the popover under `button`, right edge aligned to the button. */
export function openKibitzMoreActions(
    button: HTMLElement,
    controller: GobanController | null,
    roomActions?: KibitzMoreActionsRoomActions,
): PopOver {
    let instance: PopOver | null = null;
    const close = () => instance?.close();
    instance = popover({
        elt: (
            <KibitzMoreActionsPopover
                controller={controller}
                roomActions={roomActions}
                onClose={close}
            />
        ),
        below: button,
        minWidth: 220,
    });
    const rect = button.getBoundingClientRect();
    instance.container.style.left = "auto";
    instance.container.style.right = `${Math.max(0, window.innerWidth - rect.right)}px`;
    return instance;
}
