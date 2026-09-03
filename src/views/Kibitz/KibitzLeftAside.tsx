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
    /** The live game controller, shown as a thumbnail only while the
     *  center displays something else. Pass null to hide it. */
    miniBoardController: GobanController | null;
    onExitVariation: () => void;
    roomListHelpTargetId?: KibitzHelpTargetId;
    variationListHelpTargetId?: KibitzHelpTargetId;
}

export function KibitzLeftAside(props: KibitzLeftAsideProps): React.ReactElement {
    return (
        <div className="KibitzLeftAside">
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
            <KibitzVariationList
                title={pgettext("Heading for the Kibitz variation list", "Variations")}
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
                helpTargetId={props.variationListHelpTargetId}
            />
            {props.miniBoardController && (
                <div className="KibitzLeftAside-miniBoard">
                    <KibitzMiniMainBoard
                        controller={props.miniBoardController}
                        onClick={props.onExitVariation}
                    />
                </div>
            )}
        </div>
    );
}
