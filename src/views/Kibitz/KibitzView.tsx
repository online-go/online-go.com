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
import { openKibitzMoreActions } from "./KibitzMoreActionsPopover";
import { useKibitzHelpTarget } from "./HelpFlows/useKibitzHelpTarget";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import "./KibitzView.css";

export interface KibitzViewProps {
    room: KibitzRoomSummary;
    gobans: KibitzGobans;
    isPortrait: boolean;
    streamerMode: boolean;
    onStreamerModeChange: (enabled: boolean) => void;
    leftAside: KibitzLeftAsideProps;
    chat: Omit<KibitzChatPanelProps, "gameController">;
    proposals: KibitzProposalPanelProps;
    onPostVariation: (controller: GobanController) => void;
    onExitVariation: () => void;
    onReturnToLive: () => void;
    roomSettings: {
        canEditRoom: boolean;
        canDeleteRoom: boolean;
        onChangeBoard?: () => void;
        onSaveRoomDetails: (title: string, description: string) => Promise<boolean>;
        onDeleteRoom: () => Promise<boolean>;
    };
    /** Rendered above the sidebar panels, e.g. the preset change banner. */
    banner?: React.ReactNode;
    /** Non-tab children passed through to GobanView (overlays, debug panel). */
    children?: React.ReactNode;
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
    const { room, gobans, isPortrait, streamerMode } = props;
    const gobanViewRef = React.useRef<GobanViewRef>(null);
    const settingsPopoverRef = React.useRef<PopOver | null>(null);
    const roomTitleTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopRoomTitle);
    const behindLive = useBehindLive(
        gobans.centerMode === "main" ? (gobans.main?.goban ?? null) : null,
    );

    if (!gobans.center) {
        return null;
    }

    const viewingOther = gobans.centerMode !== "main";
    const miniBoardController = viewingOther ? gobans.main : null;

    const openSettings = (event?: React.MouseEvent<HTMLButtonElement>) => {
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
                    canEditRoom={props.roomSettings.canEditRoom}
                    canDeleteRoom={props.roomSettings.canDeleteRoom}
                    canChangeBoard={!!props.roomSettings.onChangeBoard}
                    isMobileLayout={isPortrait}
                    streamerMode={streamerMode}
                    onStreamerModeChange={props.onStreamerModeChange}
                    onClose={close}
                    onRequestChangeBoard={() => {
                        close();
                        props.roomSettings.onChangeBoard?.();
                    }}
                    onDeleteRoom={props.roomSettings.onDeleteRoom}
                    onSaveRoomDetails={props.roomSettings.onSaveRoomDetails}
                />
            ),
            below: event.currentTarget,
            minWidth: 280,
        });
    };

    const closeTakeovers = () => gobanViewRef.current?.setActiveTakeover(null);
    const exitVariation = () => {
        closeTakeovers();
        props.onExitVariation();
    };

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
            className={"Kibitz" + (streamerMode ? " is-streamer-mode" : "")}
            header={<span ref={roomTitleTarget?.ref}>{room.title}</span>}
            leftAside={!isPortrait && !streamerMode ? leftAside : undefined}
            playerBars
        >
            {viewingOther && <KBShortcut shortcut="esc" action={exitVariation} />}

            <GobanView.Tab id="kibitz-main" type="always">
                {props.banner}
                <KibitzProposalPanel {...props.proposals} />
                {viewingOther && gobans.secondary && gobans.centerMode !== "preview" && (
                    <KibitzVariationPanel
                        controller={gobans.secondary}
                        mode={gobans.centerMode === "draft" ? "draft" : "variation"}
                        onPost={props.onPostVariation}
                        onDiscard={exitVariation}
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
                onClick={openSettings}
            />

            {isPortrait && (
                <GobanView.Tab
                    id="kibitz-rooms"
                    type="takeover"
                    align="left"
                    icon="list"
                    title={pgettext("Tab that lists Kibitz rooms", "Rooms")}
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
                        openKibitzMoreActions(event.currentTarget, gobans.main);
                    }
                }}
            />

            {props.children}
        </GobanView>
    );
}
