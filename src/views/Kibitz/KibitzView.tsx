/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
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
import { _, pgettext } from "@/lib/translate";
import { GobanController } from "@/lib/GobanController";
import { popover, PopOver } from "@/lib/popover";
import { GobanView, GobanViewRef, generateGobanHook } from "@/components/GobanView";
import { KBShortcut } from "@/components/KBShortcut";
import type { KibitzRoomSummary } from "@/models/kibitz";
import type { KibitzGobans } from "./useKibitzGobans";
import { KibitzLeftAside, KibitzLeftAsideProps } from "./KibitzLeftAside";
import { KibitzChatPanel, KibitzChatPanelProps } from "./KibitzChatPanel";
import { KibitzVariationPanel } from "./KibitzVariationPanel";
import { KibitzProposalPanel, KibitzProposalPanelProps } from "./KibitzProposalPanel";
import { KibitzRoomSettingsPopover } from "./KibitzRoomSettingsPopover";
import { KibitzKeyboardShortcuts } from "./KibitzKeyboardShortcuts";
import { openKibitzMoreActions } from "./KibitzMoreActionsPopover";
import { useKibitzHelpTarget } from "./HelpFlows/useKibitzHelpTarget";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import "./KibitzView.css";

export interface KibitzViewProps {
    room: KibitzRoomSummary;
    gobans: KibitzGobans;
    isPortrait: boolean;
    leftAside: Omit<KibitzLeftAsideProps, "miniBoardController" | "onExitVariation">;
    chat: Omit<KibitzChatPanelProps, "gameController">;
    proposals: KibitzProposalPanelProps;
    onPostVariation: (controller: GobanController) => void;
    /** Starts a new draft from the live board; renders as the analysis
     *  action in the tab bar, as on the Game page. */
    onCreateVariation?: () => void;
    /** Starts a draft from the posted variation in the center. */
    onBranchFromVariation?: () => void;
    onExitVariation: () => void;
    onReturnToLive: () => void;
    /** Portrait only: the Rooms takeover was opened. */
    onRoomsOpened?: () => void;
    roomSettings: {
        /** False while the room's details and permissions are still
         *  loading; the settings gear waits for them. */
        ready: boolean;
        canEditRoom: boolean;
        canDeleteRoom: boolean;
        onChangeBoard?: () => void;
        onSaveRoomDetails: (title: string, description: string) => Promise<boolean>;
        onDeleteRoom: () => Promise<boolean>;
    };
    /** Rendered above the sidebar panels, e.g. the preset change banner. */
    banner?: React.ReactNode;
}

const useBehindLive = generateGobanHook(
    (goban: GobanController["goban"] | null) =>
        !!goban && goban.engine.cur_move.move_number < goban.engine.last_official_move.move_number,
    ["cur_move", "last_official_move"],
);

/**
 * The Kibitz page laid out on GobanView: rooms and variations on the left,
 * the board with player bars in the center, proposals, variation controls
 * and chat on the right.
 */
export function KibitzView(props: KibitzViewProps): React.ReactElement | null {
    const { room, gobans, isPortrait } = props;
    const gobanViewRef = React.useRef<GobanViewRef>(null);
    const settingsPopoverRef = React.useRef<PopOver | null>(null);
    const moreActionsPopoverRef = React.useRef<PopOver | null>(null);
    const roomTitleTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopRoomTitle);
    const behindLive = useBehindLive(
        gobans.centerMode === "main" ? (gobans.main?.goban ?? null) : null,
    );

    const { onExitVariation, roomSettings } = props;

    React.useEffect(
        () => () => {
            settingsPopoverRef.current?.close();
            settingsPopoverRef.current = null;
            moreActionsPopoverRef.current?.close();
            moreActionsPopoverRef.current = null;
        },
        [],
    );

    const openSettings = React.useCallback(
        (event?: React.MouseEvent<HTMLButtonElement>) => {
            if (!event) {
                return;
            }
            settingsPopoverRef.current?.close();
            const close = () => {
                settingsPopoverRef.current?.close();
                settingsPopoverRef.current = null;
            };
            settingsPopoverRef.current = popover({
                elt: (
                    <KibitzRoomSettingsPopover
                        room={room}
                        canEditRoom={roomSettings.canEditRoom}
                        canDeleteRoom={roomSettings.canDeleteRoom}
                        canChangeBoard={!!roomSettings.onChangeBoard}
                        onClose={close}
                        onRequestChangeBoard={() => {
                            close();
                            roomSettings.onChangeBoard?.();
                        }}
                        onDeleteRoom={roomSettings.onDeleteRoom}
                        onSaveRoomDetails={roomSettings.onSaveRoomDetails}
                    />
                ),
                below: event.currentTarget,
                minWidth: 280,
            });
        },
        [room, roomSettings],
    );

    const exitVariation = React.useCallback(() => {
        gobanViewRef.current?.setActiveTakeover(null);
        onExitVariation();
    }, [onExitVariation]);

    // KBShortcut lets Escape through from inputs so dialogs can close; here
    // Escape in the chat or the variation name field must not close the
    // variation under the user.
    const onEscape = React.useCallback(() => {
        const active = document.activeElement as HTMLElement | null;
        if (
            active &&
            (active.tagName === "INPUT" ||
                active.tagName === "TEXTAREA" ||
                active.isContentEditable)
        ) {
            return;
        }
        exitVariation();
    }, [exitVariation]);

    if (!gobans.center) {
        if (room.current_game?.game_id) {
            // The live controller is created after the first commit. Render
            // nothing for that one commit rather than the waiting layout, so
            // the chat and panels mount once, inside GobanView.
            return null;
        }
        // The room has no live game, usually a preset room between games.
        // Keep the room's people and chat reachable while it waits.
        const waitingAside = (
            <KibitzLeftAside
                {...props.leftAside}
                miniBoardController={null}
                onExitVariation={exitVariation}
            />
        );
        const waitingMessage = (
            <div className="KibitzView-waiting-message">
                {pgettext(
                    "Shown in a kibitz preset room when no eligible live game is currently being watched",
                    "Looking for a suitable live game.",
                )}
            </div>
        );
        const waitingSidebar = (
            <div className="KibitzView-waiting-sidebar">
                <div className="KibitzView-waiting-header">
                    <span className="KibitzView-waiting-title" ref={roomTitleTarget?.ref}>
                        {room.title}
                    </span>
                    <button
                        type="button"
                        className="KibitzView-waiting-settings"
                        title={_("Settings")}
                        disabled={!roomSettings.ready}
                        onClick={openSettings}
                    >
                        <i className="fa fa-gear" />
                    </button>
                </div>
                {props.banner}
                <KibitzProposalPanel {...props.proposals} />
                <KibitzChatPanel {...props.chat} gameController={null} />
            </div>
        );

        // Portrait stacks these in CSS, with the message moved to the top.
        return (
            <div className={"KibitzView-waiting" + (isPortrait ? " is-portrait" : "")}>
                <div className="KibitzView-waiting-aside">{waitingAside}</div>
                <div className="KibitzView-waiting-center">{waitingMessage}</div>
                {waitingSidebar}
            </div>
        );
    }

    const viewingOther = gobans.centerMode !== "main";
    // By identity, not mode: as a variation opens there is one commit where
    // the mode has changed but the secondary controller does not exist yet.
    // Mounting one board div in both places breaks the next unmount.
    const miniBoardController = gobans.center !== gobans.main ? gobans.main : null;

    const leftAside = (
        <KibitzLeftAside
            {...props.leftAside}
            miniBoardController={miniBoardController}
            onExitVariation={exitVariation}
        />
    );

    return (
        <GobanView
            ref={gobanViewRef}
            controller={gobans.center}
            className="Kibitz"
            header={
                <span
                    className="Kibitz-room-title"
                    data-game-id={room.current_game?.game_id}
                    ref={roomTitleTarget?.ref}
                >
                    {room.title}
                </span>
            }
            leftAside={leftAside}
            playerBars={gobans.playerBars ?? true}
        >
            <KibitzKeyboardShortcuts />
            {viewingOther && <KBShortcut shortcut="esc" action={onEscape} />}

            <GobanView.Tab id="kibitz-main" type="always">
                {props.banner}
                <KibitzProposalPanel {...props.proposals} />
                {viewingOther && gobans.secondary && (
                    <KibitzVariationPanel
                        controller={gobans.secondary}
                        mode={gobans.centerMode === "draft" ? "draft" : "variation"}
                        onPost={props.onPostVariation}
                        onBackToGame={exitVariation}
                        onBranch={
                            gobans.centerMode === "variation"
                                ? props.onBranchFromVariation
                                : undefined
                        }
                    />
                )}
                <KibitzChatPanel {...props.chat} gameController={gobans.main} />
            </GobanView.Tab>

            <GobanView.Tab
                id="kibitz-settings"
                type="action"
                align="left"
                icon="gear"
                title={_("Settings")}
                disabled={!roomSettings.ready}
                onClick={openSettings}
            />

            {props.onCreateVariation && (
                <GobanView.Tab
                    id="kibitz-new-variation"
                    type="action"
                    align="left"
                    icon="sitemap"
                    title={pgettext("Action that starts a new Kibitz variation", "New variation")}
                    active={gobans.centerMode === "draft"}
                    disabled={!gobans.main}
                    onClick={props.onCreateVariation}
                />
            )}

            {isPortrait && (
                <GobanView.Tab
                    id="kibitz-rooms"
                    type="takeover"
                    align="left"
                    icon="list"
                    title={pgettext("Tab that lists Kibitz rooms", "Rooms")}
                    onToggle={(active) => {
                        if (active) {
                            props.onRoomsOpened?.();
                        }
                    }}
                >
                    {leftAside}
                </GobanView.Tab>
            )}

            {viewingOther && (
                <GobanView.Tab
                    id="kibitz-return-to-game"
                    type="action"
                    align="center"
                    icon="arrow-left"
                    title={pgettext(
                        "Action that leaves a Kibitz variation and shows the live game",
                        "Return to game",
                    )}
                    onClick={exitVariation}
                />
            )}

            {!viewingOther && behindLive && (
                <GobanView.Tab
                    id="kibitz-return-to-live"
                    type="action"
                    align="center"
                    icon="forward"
                    title={pgettext(
                        "Action that jumps a Kibitz board to the latest move",
                        "Return to live",
                    )}
                    onClick={props.onReturnToLive}
                />
            )}

            <GobanView.Tab
                id="kibitz-more"
                type="action"
                align="right"
                icon="ellipsis-h"
                title={_("More actions")}
                onClick={(event) => {
                    if (event && gobans.main) {
                        moreActionsPopoverRef.current?.close();
                        moreActionsPopoverRef.current = openKibitzMoreActions(
                            event.currentTarget,
                            gobans.main,
                        );
                    }
                }}
            />
        </GobanView>
    );
}
