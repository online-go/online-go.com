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
import { Link } from "react-router-dom";
import { MiniGoban } from "@/components/MiniGoban";
import { get } from "@/lib/requests";
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzRoomSummary, KibitzSecondaryPaneState } from "@/models/kibitz";
import "./KibitzRoomStage.css";

interface KibitzRoomStageProps {
    room: KibitzRoomSummary;
    secondaryPane: KibitzSecondaryPaneState;
}

export function KibitzRoomStage({ room, secondaryPane }: KibitzRoomStageProps): React.ReactElement {
    const mainGame = room.current_game;
    const secondaryGameId = secondaryPane.preview_game_id;
    const [mainGameDetails, setMainGameDetails] = React.useState<rest_api.GameDetails | null>(null);

    React.useEffect(() => {
        if (!mainGame?.game_id) {
            setMainGameDetails(null);
            return;
        }

        let canceled = false;

        get(`games/${mainGame.game_id}`)
            .then((details: rest_api.GameDetails) => {
                if (!canceled) {
                    setMainGameDetails(details);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setMainGameDetails(null);
                }
            });

        return () => {
            canceled = true;
        };
    }, [mainGame?.game_id]);

    const displayedTitle = mainGameDetails?.name || mainGame?.title;
    const displayedBlack = mainGameDetails?.players?.black?.username || mainGame?.black.username;
    const displayedWhite = mainGameDetails?.players?.white?.username || mainGame?.white.username;
    const displayedBoardSize =
        mainGameDetails && mainGameDetails.width && mainGameDetails.height
            ? `${mainGameDetails.width}x${mainGameDetails.height}`
            : mainGame?.board_size;
    const displayedTournament =
        typeof mainGameDetails?.tournament === "number" && mainGameDetails.tournament > 0
            ? interpolate(
                  pgettext(
                      "Fallback label when only a tournament id is known in the kibitz stage",
                      "Tournament {{tournament_id}}",
                  ),
                  { tournament_id: mainGameDetails.tournament },
              )
            : mainGame?.tournament_name;

    return (
        <div className="KibitzRoomStage">
            <div className="KibitzRoomStage-header">
                <div className="room-title">{room.title}</div>
                <div className="room-subtitle">
                    {displayedTitle ??
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
                        {mainGame ? (
                            <div className="board-content">
                                <div className="board-meta">
                                    <div className="players">
                                        {interpolate(
                                            pgettext(
                                                "Player names shown above the main board in kibitz",
                                                "{{black}} vs {{white}}",
                                            ),
                                            {
                                                black: displayedBlack,
                                                white: displayedWhite,
                                            },
                                        )}
                                    </div>
                                    <div className="game-details">
                                        {displayedBoardSize
                                            ? interpolate(
                                                  pgettext(
                                                      "Board size label shown in the kibitz stage",
                                                      "Board {{size}}",
                                                  ),
                                                  { size: displayedBoardSize },
                                              )
                                            : ""}
                                        {mainGame.move_number
                                            ? ` - ${interpolate(
                                                  pgettext(
                                                      "Move number label shown in the kibitz stage",
                                                      "Move {{move_number}}",
                                                  ),
                                                  { move_number: mainGame.move_number },
                                              )}`
                                            : ""}
                                        {displayedTournament ? ` - ${displayedTournament}` : ""}
                                    </div>
                                </div>
                                <MiniGoban
                                    game_id={mainGame.game_id}
                                    noLink={true}
                                    noText={true}
                                    title={false}
                                    displayWidth={300}
                                    className="KibitzMiniGoban"
                                />
                                <div className="board-actions">
                                    <Link
                                        to={`/game/${mainGame.game_id}`}
                                        className="view-game-link"
                                    >
                                        {pgettext(
                                            "Link text for opening the current game from the kibitz stage",
                                            "Open game page",
                                        )}
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            pgettext(
                                "Placeholder for the primary kibitz goban area before the board is wired up",
                                "Shared board will render here",
                            )
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
                        {secondaryPane.collapsed ? (
                            pgettext(
                                "Placeholder when the secondary board is collapsed in kibitz",
                                "Secondary pane is collapsed",
                            )
                        ) : secondaryGameId ? (
                            <div className="board-content">
                                <MiniGoban
                                    game_id={secondaryGameId}
                                    noLink={true}
                                    noText={true}
                                    title={false}
                                    displayWidth={180}
                                    className="KibitzMiniGoban secondary"
                                />
                            </div>
                        ) : (
                            pgettext(
                                "Placeholder for the secondary kibitz goban area before the board is wired up",
                                "Preview or variation board will render here",
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
