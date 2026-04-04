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
import type {
    KibitzMode,
    KibitzProposal,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzVariationSummary,
} from "@/models/kibitz";
import "./KibitzRoomStage.css";

interface KibitzRoomStageProps {
    mode: KibitzMode;
    room: KibitzRoomSummary;
    rooms: KibitzRoomSummary[];
    proposals: KibitzProposal[];
    variations: KibitzVariationSummary[];
    secondaryPane: KibitzSecondaryPaneState;
    onPreviewGame: (gameId: number) => void;
    onClearPreview: () => void;
    onProposePreview: () => void;
}

export function KibitzRoomStage({
    mode,
    room,
    rooms,
    proposals,
    variations,
    secondaryPane,
    onPreviewGame,
    onClearPreview,
    onProposePreview,
}: KibitzRoomStageProps): React.ReactElement {
    const mainGame = room.current_game;
    const secondaryGameId = secondaryPane.preview_game_id;
    const selectedVariation = variations.find(
        (variation) => variation.id === secondaryPane.variation_id,
    );
    const [mainGameDetails, setMainGameDetails] = React.useState<rest_api.GameDetails | null>(null);
    const previewCandidates = rooms.filter(
        (candidate) => candidate.id !== room.id && candidate.current_game?.game_id,
    );
    const previewGame =
        rooms.find((candidate) => candidate.current_game?.game_id === secondaryGameId)
            ?.current_game ??
        proposals.find((proposal) => proposal.proposed_game.game_id === secondaryGameId)
            ?.proposed_game;
    const previewDisplayedMoveNumber = previewGame?.move_number;

    React.useEffect(() => {
        if (!mainGame?.game_id || mainGame.mock_game_data || mode === "demo") {
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
    }, [mainGame?.game_id, mainGame?.mock_game_data, mode]);

    const displayedTitle = mainGameDetails?.name || mainGame?.title;
    const displayedBlack = mainGameDetails?.players?.black?.username || mainGame?.black.username;
    const displayedWhite = mainGameDetails?.players?.white?.username || mainGame?.white.username;
    const displayedBoardSize =
        mainGameDetails && mainGameDetails.width && mainGameDetails.height
            ? `${mainGameDetails.width}x${mainGameDetails.height}`
            : mainGame?.board_size;
    const displayedMoveNumber =
        mainGameDetails?.gamedata?.moves?.length ??
        mainGameDetails?.gamedata?.clock?.last_move ??
        mainGame?.move_number;
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
                                        {displayedMoveNumber
                                            ? ` - ${interpolate(
                                                  pgettext(
                                                      "Move number label shown in the kibitz stage",
                                                      "Move {{move_number}}",
                                                  ),
                                                  { move_number: displayedMoveNumber },
                                              )}`
                                            : ""}
                                        {displayedTournament ? ` - ${displayedTournament}` : ""}
                                    </div>
                                </div>
                                <MiniGoban
                                    game_id={mainGame.mock_game_data ? undefined : mainGame.game_id}
                                    json={mainGame.mock_game_data}
                                    width={mainGame.mock_game_data?.width}
                                    height={mainGame.mock_game_data?.height}
                                    black={mainGame.black}
                                    white={mainGame.white}
                                    noLink={true}
                                    noText={true}
                                    title={false}
                                    displayWidth={300}
                                    className="KibitzMiniGoban"
                                />
                                <div className="board-actions">
                                    {!mainGame.mock_game_data ? (
                                        <Link
                                            to={`/game/${mainGame.game_id}`}
                                            className="view-game-link"
                                        >
                                            {pgettext(
                                                "Link text for opening the current game from the kibitz stage",
                                                "Open game page",
                                            )}
                                        </Link>
                                    ) : null}
                                    {previewCandidates.length > 0 ? (
                                        <div className="preview-actions">
                                            <div className="preview-actions-title">
                                                {pgettext(
                                                    "Heading for a list of games that can be previewed in kibitz",
                                                    "Preview another room",
                                                )}
                                            </div>
                                            <div className="preview-actions-list">
                                                {previewCandidates.map((candidate) => (
                                                    <button
                                                        key={candidate.id}
                                                        type="button"
                                                        className="preview-action-button"
                                                        onClick={() =>
                                                            onPreviewGame(
                                                                candidate.current_game
                                                                    ?.game_id as number,
                                                            )
                                                        }
                                                    >
                                                        {candidate.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
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
                                <div className="board-meta">
                                    <div className="players">
                                        {interpolate(
                                            pgettext(
                                                "Player names shown above the secondary board in kibitz",
                                                "{{black}} vs {{white}}",
                                            ),
                                            {
                                                black: previewGame?.black.username ?? "",
                                                white: previewGame?.white.username ?? "",
                                            },
                                        )}
                                    </div>
                                    <div className="game-details">
                                        {previewGame?.title ?? ""}
                                        {previewGame?.board_size
                                            ? ` - ${interpolate(
                                                  pgettext(
                                                      "Board size label shown in the kibitz secondary pane",
                                                      "Board {{size}}",
                                                  ),
                                                  { size: previewGame.board_size },
                                              )}`
                                            : ""}
                                        {previewDisplayedMoveNumber
                                            ? ` - ${interpolate(
                                                  pgettext(
                                                      "Move number label shown in the kibitz secondary pane",
                                                      "Move {{move_number}}",
                                                  ),
                                                  { move_number: previewDisplayedMoveNumber },
                                              )}`
                                            : ""}
                                    </div>
                                </div>
                                <MiniGoban
                                    game_id={
                                        previewGame?.mock_game_data ? undefined : secondaryGameId
                                    }
                                    json={previewGame?.mock_game_data}
                                    width={previewGame?.mock_game_data?.width}
                                    height={previewGame?.mock_game_data?.height}
                                    black={previewGame?.black}
                                    white={previewGame?.white}
                                    noLink={true}
                                    noText={true}
                                    title={false}
                                    displayWidth={180}
                                    className="KibitzMiniGoban secondary"
                                />
                                <div className="board-actions">
                                    <button
                                        type="button"
                                        className="preview-action-button"
                                        onClick={onProposePreview}
                                    >
                                        {pgettext(
                                            "Button label for proposing the current previewed game in kibitz",
                                            "Propose this board",
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="preview-action-button clear-preview"
                                        onClick={onClearPreview}
                                    >
                                        {pgettext(
                                            "Button label for closing the preview game in the secondary kibitz pane",
                                            "Clear preview",
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : selectedVariation ? (
                            <div className="board-content">
                                <div className="board-meta">
                                    <div className="players">
                                        {selectedVariation.creator.username}
                                    </div>
                                    <div className="game-details">
                                        {selectedVariation.title ??
                                            pgettext(
                                                "Fallback title for an untitled kibitz variation",
                                                "Variation preview",
                                            )}
                                    </div>
                                </div>
                                <MiniGoban
                                    json={selectedVariation.mock_game_data}
                                    width={selectedVariation.mock_game_data?.width}
                                    height={selectedVariation.mock_game_data?.height}
                                    black={selectedVariation.mock_game_data?.players.black}
                                    white={selectedVariation.mock_game_data?.players.white}
                                    noLink={true}
                                    noText={true}
                                    title={false}
                                    displayWidth={180}
                                    className="KibitzMiniGoban secondary"
                                />
                                <div className="board-actions">
                                    <button
                                        type="button"
                                        className="preview-action-button clear-preview"
                                        onClick={onClearPreview}
                                    >
                                        {pgettext(
                                            "Button label for closing a variation preview in the secondary kibitz pane",
                                            "Clear variation",
                                        )}
                                    </button>
                                </div>
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
