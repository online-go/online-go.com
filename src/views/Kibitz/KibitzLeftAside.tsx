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
import { pgettext } from "@/lib/translate";
import { GobanController } from "@/lib/GobanController";
import type { KibitzRoomSummary, KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzVariationList } from "./KibitzVariationList";
import { KibitzMiniMainBoard } from "./KibitzMiniMainBoard";
import type { KibitzHelpTargetId } from "./HelpFlows/KibitzHelpTargets";
import "./KibitzLeftAside.css";

export interface KibitzLeftAsideProps {
    rooms: KibitzRoomSummary[];
    activeRoomId: string;
    blockedRoomIds: Set<string>;
    onSelectRoom: (roomId: string) => void;
    onCreateRoom?: () => void;
    canOpenCreateRoomFlow: boolean;
    signInHref: string;
    variations: KibitzVariationSummary[];
    currentGameId: number | null;
    variationGameById: ReadonlyMap<number, KibitzWatchedGame>;
    selectedVariationId: string | null;
    variationFocusRequestId: number;
    variationColorIndexes: Record<string, number>;
    blockedVariationFlashId: string | null;
    onRecallVariation: (variationId: string) => void;
    onHideVariation: (variationId: string) => void;
    onCreateVariation?: () => void;
    onClearVariations?: () => void;
    /** The live game controller, shown as a thumbnail only while the
     *  center displays something else. Pass null to hide it. */
    miniBoardController: GobanController | null;
    onExitVariation: () => void;
    roomListHelpTargetId?: KibitzHelpTargetId;
    variationListHelpTargetId?: KibitzHelpTargetId;
}

const COLLAPSE_STORAGE_KEY = "kibitz.left_aside.collapsed";

type SectionId = "rooms" | "variations";

function readCollapsed(): Record<SectionId, boolean> {
    try {
        const raw = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as Partial<Record<SectionId, boolean>>) : {};
        return { rooms: !!parsed.rooms, variations: !!parsed.variations };
    } catch {
        return { rooms: false, variations: false };
    }
}

export function KibitzLeftAside(props: KibitzLeftAsideProps): React.ReactElement {
    const [collapsed, setCollapsed] = React.useState<Record<SectionId, boolean>>(readCollapsed);

    const toggle = (section: SectionId) => {
        setCollapsed((previous) => {
            const next = { ...previous, [section]: !previous[section] };
            try {
                window.localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(next));
            } catch {
                // Storage may be unavailable; the toggle still works for this page.
            }
            return next;
        });
    };

    const renderHeader = (section: SectionId, label: string) => (
        <div
            className="KibitzLeftAside-sectionHeader"
            role="button"
            tabIndex={0}
            aria-expanded={!collapsed[section]}
            onClick={() => toggle(section)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggle(section);
                }
            }}
        >
            <i
                className={
                    "KibitzLeftAside-sectionToggle fa " +
                    (collapsed[section] ? "fa-chevron-right" : "fa-chevron-down")
                }
                aria-hidden="true"
            />
            <span>{label}</span>
        </div>
    );

    return (
        <div className="KibitzLeftAside">
            <div className="KibitzLeftAside-scroll">
                <div className="KibitzLeftAside-section">
                    {renderHeader(
                        "rooms",
                        pgettext("Heading of the room list in the Kibitz left aside", "Rooms"),
                    )}
                    {!collapsed.rooms && (
                        <KibitzRoomList
                            rooms={props.rooms}
                            activeRoomId={props.activeRoomId}
                            onSelectRoom={props.onSelectRoom}
                            onCreateRoom={props.onCreateRoom}
                            canOpenCreateRoomFlow={props.canOpenCreateRoomFlow}
                            signInHref={props.signInHref}
                            blockedRoomIds={props.blockedRoomIds}
                            helpTargetId={props.roomListHelpTargetId}
                        />
                    )}
                </div>
                <div className="KibitzLeftAside-section">
                    {renderHeader(
                        "variations",
                        pgettext("Heading for the Kibitz variation list", "Variations"),
                    )}
                    {!collapsed.variations && (
                        <KibitzVariationList
                            variations={props.variations}
                            currentGameId={props.currentGameId}
                            gameById={props.variationGameById}
                            selectedVariationId={props.selectedVariationId}
                            variationFocusRequestId={props.variationFocusRequestId}
                            variationColorIndexes={props.variationColorIndexes}
                            blockedVariationFlashId={props.blockedVariationFlashId}
                            onRecallVariation={props.onRecallVariation}
                            onHideVariation={props.onHideVariation}
                            onCreateVariation={props.onCreateVariation}
                            onClearAll={props.onClearVariations}
                            helpTargetId={props.variationListHelpTargetId}
                        />
                    )}
                </div>
            </div>
            {props.miniBoardController && (
                <div className="KibitzLeftAside-miniBoard">
                    <div className="KibitzLeftAside-miniBoardTitle Kibitz-section-header">
                        {pgettext(
                            "Heading above the small live game board in the Kibitz left aside",
                            "Main board",
                        )}
                    </div>
                    <KibitzMiniMainBoard
                        controller={props.miniBoardController}
                        onClick={props.onExitVariation}
                    />
                </div>
            )}
        </div>
    );
}
