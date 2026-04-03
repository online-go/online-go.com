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
import type { KibitzRoomSummary, KibitzSecondaryPaneState } from "@/models/kibitz";
import "./KibitzRoomStage.css";

interface KibitzRoomStageProps {
    room: KibitzRoomSummary;
    secondaryPane: KibitzSecondaryPaneState;
}

export function KibitzRoomStage({ room, secondaryPane }: KibitzRoomStageProps): React.ReactElement {
    return (
        <div className="KibitzRoomStage">
            <div className="KibitzRoomStage-header">
                <div className="room-title">{room.title}</div>
                <div className="room-subtitle">
                    {room.current_game?.title ??
                        pgettext(
                            "Placeholder when no main game is loaded in a kibitz room",
                            "No main board selected yet",
                        )}
                </div>
            </div>
            <div className="KibitzRoomStage-boards">
                <div className="board-panel main-board">
                    <div className="panel-title">
                        {pgettext("Label for the shared board in kibitz", "Main board")}
                    </div>
                    <div className="panel-body">
                        {pgettext(
                            "Placeholder for the primary kibitz goban area before the board is wired up",
                            "Shared board will render here",
                        )}
                    </div>
                </div>
                <div
                    className={
                        "board-panel secondary-board" +
                        (secondaryPane.collapsed ? " collapsed" : "")
                    }
                >
                    <div className="panel-title">
                        {pgettext(
                            "Label for the personal secondary board in kibitz",
                            "Secondary board",
                        )}
                    </div>
                    <div className="panel-body">
                        {secondaryPane.collapsed
                            ? pgettext(
                                  "Placeholder when the secondary board is collapsed in kibitz",
                                  "Secondary pane is collapsed",
                              )
                            : pgettext(
                                  "Placeholder for the secondary kibitz goban area before the board is wired up",
                                  "Preview or variation board will render here",
                              )}
                    </div>
                </div>
            </div>
        </div>
    );
}
