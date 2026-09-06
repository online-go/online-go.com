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
import { _ } from "@/lib/translate";
import { api1 } from "@/lib/requests";
import { popover, PopOver } from "@/lib/popover";
import { GobanController } from "@/lib/GobanController";
import { useUser } from "@/lib/hooks";
import { openReport } from "@/components/Report";
import { openGameInfoModal } from "@/views/Game/GameInfoModal";
import { openGameLinkModal } from "@/views/Game/GameLinkModal";
import "@/views/Game/GameSidebarPanels.css";
import "./KibitzMoreActionsPopover.css";

interface KibitzMoreActionsPopoverProps {
    controller: GobanController;
    onClose: () => void;
}

export function KibitzMoreActionsPopover({
    controller,
    onClose,
}: KibitzMoreActionsPopoverProps): React.ReactElement {
    const user = useUser();
    const goban = controller.goban;
    const engine = goban.engine;
    const game_id = Number(goban.config.game_id);
    const sgf_url = api1(`games/${game_id}/sgf`);
    let analysis_disabled = false;
    try {
        analysis_disabled = goban.isAnalysisDisabled(true);
    } catch {
        analysis_disabled = false;
    }
    // Same rule as the Game page's actions panel: the server refuses the
    // SGF of a game in progress to anonymous users and to its players.
    const sgf_disabled =
        analysis_disabled ||
        (engine.phase !== "finished" &&
            (user.anonymous ||
                user.id === engine.config.black_player_id ||
                user.id === engine.config.white_player_id));
    const report_disabled = user.anonymous;

    const wrap = (fn: () => void) => () => {
        fn();
        onClose();
    };

    return (
        <div className="GamePopover KibitzMoreActionsPopover">
            <div className="GameSidebarPanel">
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
            </div>
        </div>
    );
}

/** Opens the popover under `button`, right edge aligned to the button. */
export function openKibitzMoreActions(button: HTMLElement, controller: GobanController): PopOver {
    let instance: PopOver | null = null;
    const close = () => instance?.close();
    instance = popover({
        elt: <KibitzMoreActionsPopover controller={controller} onClose={close} />,
        below: button,
        minWidth: 220,
    });
    const rect = button.getBoundingClientRect();
    instance.container.style.left = "auto";
    instance.container.style.right = `${Math.max(0, window.innerWidth - rect.right)}px`;
    return instance;
}
