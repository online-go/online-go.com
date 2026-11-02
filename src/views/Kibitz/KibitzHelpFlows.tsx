/*
 * Copyright (C)  Online-Go.com
 * Licensed under the GNU Affero General Public License.
 */
import * as React from "react";
import { HelpFlow, HelpItem } from "react-dynamic-help";
import { pgettext } from "@/lib/translate";
import "./KibitzHelpFlows.css";

export const KIBITZ_INTRO_FLOW = "kibitz-room-intro";
export const KIBITZ_VARIATION_FLOW = "kibitz-variation-intro";
export const KIBITZ_ROOM_TARGET = "kibitz-room-header";
export const KIBITZ_VARIATION_TARGET = "kibitz-variation-header";

export function KibitzHelpFlows(): React.ReactElement {
    return (
        <>
            <HelpFlow
                id={KIBITZ_INTRO_FLOW}
                showInitially
                description={pgettext("Dynamic help topic", "Kibitz rooms")}
            >
                <HelpItem
                    id="help-for-kibitz-room"
                    target={KIBITZ_ROOM_TARGET}
                    position="bottom-left"
                >
                    {pgettext(
                        "Kibitz introduction",
                        "A Kibitz room lets you watch and discuss a game together. The conversation stays in the room when its game changes.",
                    )}
                </HelpItem>
                <HelpItem
                    id="help-for-kibitz-games"
                    target={KIBITZ_ROOM_TARGET}
                    position="bottom-left"
                >
                    {pgettext(
                        "Kibitz introduction",
                        "Kibitz chat stays with the room; Game chat belongs to the watched game. Shared variations let you explore moves without changing the room's game.",
                    )}
                </HelpItem>
            </HelpFlow>
            <HelpFlow
                id={KIBITZ_VARIATION_FLOW}
                description={pgettext("Dynamic help topic", "Kibitz variations")}
            >
                <HelpItem
                    id="help-for-kibitz-variation"
                    target={KIBITZ_VARIATION_TARGET}
                    position="bottom-left"
                >
                    {pgettext(
                        "Kibitz variation introduction",
                        "You are viewing a shared variation. Close it to return to the room's game.",
                    )}
                </HelpItem>
            </HelpFlow>
        </>
    );
}
