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
import { HelpFlow, HelpItem } from "react-dynamic-help";

import { pgettext } from "@/lib/translate";

import { KIBITZ_HELP_TARGETS } from "./KibitzHelpTargets";

export const KIBITZ_HELP_FLOW_IDS = {
    desktopFirstRun: "kibitz-desktop-first-run",
    desktopFirstVariations: "kibitz-desktop-first-variations",
    roomBoardChange: "kibitz-first-room-board-change",
    roomManagement: "kibitz-first-room-management",
} as const;

export function KibitzHelpFlows(): React.ReactElement {
    return (
        <>
            <HelpFlow
                id={KIBITZ_HELP_FLOW_IDS.desktopFirstRun}
                showInitially={false}
                description={pgettext(
                    "Name of a dynamic help flow for Kibitz desktop first-run onboarding",
                    "Kibitz desktop first run",
                )}
            >
                <HelpItem target={KIBITZ_HELP_TARGETS.desktopRoomList} position="bottom-right">
                    {pgettext(
                        "Kibitz desktop help bubble explaining the room list",
                        "Choose a room here. Each room has its own main board, chat, and variations.",
                    )}
                </HelpItem>
                <HelpItem target={KIBITZ_HELP_TARGETS.desktopVariationList} position="top-centre">
                    {pgettext(
                        "Kibitz desktop help bubble explaining the variations area",
                        "Variations appear here. Open one to view, or show several at once.",
                    )}
                </HelpItem>
                <HelpItem target={KIBITZ_HELP_TARGETS.desktopStream} position="center-left">
                    {pgettext(
                        "Kibitz desktop help bubble explaining the stream panel",
                        "Game chat shows what the players say in-game. Room chat is where you and other kibitzers talk.",
                    )}
                </HelpItem>
            </HelpFlow>

            <HelpFlow
                id={KIBITZ_HELP_FLOW_IDS.desktopFirstVariations}
                showInitially={false}
                description={pgettext(
                    "Name of a dynamic help flow for Kibitz desktop variations introduction",
                    "Kibitz desktop variations introduction",
                )}
            >
                <HelpItem target={KIBITZ_HELP_TARGETS.desktopVariationList} position="top-centre">
                    {pgettext(
                        "Kibitz desktop help bubble for the variations area",
                        "Variations are shared by Kibitz viewers. Opening one does not change the main board.",
                    )}
                </HelpItem>
            </HelpFlow>

            <HelpFlow
                id={KIBITZ_HELP_FLOW_IDS.roomBoardChange}
                showInitially={false}
                description={pgettext(
                    "Name of a dynamic help flow for Kibitz board changes",
                    "Kibitz room board change",
                )}
            >
                <HelpItem target={KIBITZ_HELP_TARGETS.desktopRoomTitle} position="bottom-centre">
                    {pgettext(
                        "Kibitz help bubble explaining that the room board changed",
                        "This room has a new main board. Chat and history stay with the room.",
                    )}
                </HelpItem>
            </HelpFlow>

            <HelpFlow
                id={KIBITZ_HELP_FLOW_IDS.roomManagement}
                showInitially={false}
                description={pgettext(
                    "Name of a dynamic help flow for Kibitz room management",
                    "Kibitz room management",
                )}
            >
                <HelpItem target={KIBITZ_HELP_TARGETS.desktopRoomSettings} position="bottom-centre">
                    {pgettext(
                        "Kibitz help bubble for room management",
                        "Room settings. Manage room details and the live game here.",
                    )}
                </HelpItem>
            </HelpFlow>
        </>
    );
}
