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
import * as data from "@/lib/data";
import { pgettext } from "@/lib/translate";
import { GobanController } from "@/lib/GobanController";
import type { KibitzRoomSummary, KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzVariationList } from "./KibitzVariationList";
import { KibitzMiniMainBoard } from "./KibitzMiniMainBoard";
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
    blockedVariationFlashId: string | null;
    onRecallVariation: (variationId: string) => void;
    onHideVariation: (variationId: string) => void;
    onCreateVariation?: () => void;
    /** True while there is no game to make a variation of. */
    createVariationDisabled?: boolean;
    onClearVariations?: () => void;
    /** Move-tree line colour of each variation that is on the board, by id. */
    variationColorIndexes: Record<string, number>;
    /** The live game controller, shown as a thumbnail only while the
     *  center displays something else. Pass null to hide it. */
    miniBoardController: GobanController | null;
    onExitVariation: () => void;
}

type SectionId = "rooms" | "variations";

const DEFAULT_COLLAPSED: Record<SectionId, boolean> = { rooms: false, variations: false };

export function KibitzLeftAside(props: KibitzLeftAsideProps): React.ReactElement {
    const [collapsed, setCollapsed] = React.useState<Record<SectionId, boolean>>(() => ({
        ...DEFAULT_COLLAPSED,
        ...data.get("kibitz.left_aside.collapsed", DEFAULT_COLLAPSED),
    }));

    const toggle = (section: SectionId) => {
        setCollapsed((previous) => {
            const next = { ...previous, [section]: !previous[section] };
            data.set("kibitz.left_aside.collapsed", next);
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
                            blockedVariationFlashId={props.blockedVariationFlashId}
                            onRecallVariation={props.onRecallVariation}
                            onHideVariation={props.onHideVariation}
                            onCreateVariation={props.onCreateVariation}
                            createVariationDisabled={props.createVariationDisabled}
                            onClearAll={props.onClearVariations}
                            colorIndexes={props.variationColorIndexes}
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
