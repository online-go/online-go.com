/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of the
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
import { get } from "@/lib/requests";
import { interpolate, pgettext } from "@/lib/translate";
import { ObserveGamesComponent } from "@/components/ObserveGamesComponent";
import type { KibitzRoomSummary, KibitzRoomUser, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzBoard } from "./KibitzBoard";
import "./KibitzGamePickerOverlay.css";

type KibitzGamePickerOverlayMode = "create-room" | "change-board";

interface KibitzGamePickerOverlayProps {
    mode: KibitzGamePickerOverlayMode;
    rooms: KibitzRoomSummary[];
    currentRoom?: KibitzRoomSummary | null;
    onClose: () => void;
    onCreateRoom: (game: KibitzWatchedGame, roomName: string, description: string) => void;
    onChangeBoard: (game: KibitzWatchedGame) => void;
    onJoinRoom: (roomId: string) => void;
}

interface SelectedGameState {
    details: rest_api.GameDetails;
    game: KibitzWatchedGame;
    isFinished: boolean;
    analysisDisabled: boolean;
}

function parseGameId(input: string): number | null {
    const trimmed = input.trim();

    if (/^\d+$/.test(trimmed)) {
        return Number(trimmed);
    }

    const match =
        trimmed.match(/\/game(?:\/view)?\/(\d+)(?:\/|$|\?)/i) ??
        trimmed.match(/\/game\/(\d+)(?:\/|$|\?)/i);
    if (match) {
        return Number(match[1]);
    }

    return null;
}

function toRoomUser(player: rest_api.games.Player): KibitzRoomUser {
    return {
        id: player.id,
        username: player.username,
        ranking: player.ranking,
        professional: player.professional,
        ui_class: player.ui_class,
        country: player.country,
        icon: player.icon,
    };
}

function mapGameDetailsToWatchedGame(details: rest_api.GameDetails): KibitzWatchedGame {
    return {
        game_id: details.id,
        board_size: `${details.width}x${details.height}` as KibitzWatchedGame["board_size"],
        title: details.name,
        black: toRoomUser(details.players.black),
        white: toRoomUser(details.players.white),
        move_number: details.gamedata.moves.length,
        live: !details.ended,
    };
}

function buildDefaultRoomName(game: KibitzWatchedGame): string {
    return interpolate(pgettext("Default room name for a Kibitz room", "{{black}} vs {{white}}"), {
        black: game.black.username,
        white: game.white.username,
    });
}

function findExistingRoom(rooms: KibitzRoomSummary[], gameId: number): KibitzRoomSummary | null {
    return rooms.find((room) => room.current_game?.game_id === gameId) ?? null;
}

export function KibitzGamePickerOverlay({
    mode,
    rooms,
    currentRoom,
    onClose,
    onCreateRoom,
    onChangeBoard,
    onJoinRoom,
}: KibitzGamePickerOverlayProps): React.ReactElement {
    const [selectedGame, setSelectedGame] = React.useState<SelectedGameState | null>(null);
    const [manualInput, setManualInput] = React.useState("");
    const [roomName, setRoomName] = React.useState("");
    const [roomDescription, setRoomDescription] = React.useState("");
    const [nameTouched, setNameTouched] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [showChangeConfirm, setShowChangeConfirm] = React.useState(false);

    const currentGameId = currentRoom?.current_game?.game_id ?? null;
    const existingRoom = React.useMemo(() => {
        if (!selectedGame) {
            return null;
        }

        return findExistingRoom(rooms, selectedGame.game.game_id);
    }, [rooms, selectedGame]);

    const manualEntryLabel = pgettext("Label for the Kibitz game ID input", "Game ID");
    const manualPlaceholder = pgettext(
        "Placeholder for the Kibitz game ID input",
        "Paste a game ID or OGS game URL",
    );

    const selectionIsSameAsCurrent = Boolean(
        mode === "change-board" && selectedGame && currentGameId === selectedGame.game.game_id,
    );
    const selectionIsEligible =
        Boolean(selectedGame) &&
        !errorMessage &&
        !(selectedGame?.analysisDisabled && !selectedGame.isFinished);
    const canCreateRoom =
        mode === "create-room" &&
        Boolean(selectedGame) &&
        selectionIsEligible &&
        roomName.trim().length > 0 &&
        !loading;
    const canChangeBoard =
        mode === "change-board" &&
        Boolean(selectedGame) &&
        selectionIsEligible &&
        !selectionIsSameAsCurrent &&
        !loading;

    React.useEffect(() => {
        if (!selectedGame || mode !== "create-room") {
            return;
        }

        if (!nameTouched) {
            setRoomName(buildDefaultRoomName(selectedGame.game));
        }
    }, [mode, nameTouched, selectedGame]);

    const resolveGame = React.useCallback(
        async (gameId: number) => {
            setLoading(true);
            setErrorMessage(null);
            setShowChangeConfirm(false);

            try {
                const details = (await get(`games/${gameId}`)) as rest_api.GameDetails;
                const game = mapGameDetailsToWatchedGame(details);
                const isFinished = Boolean(details.ended);
                const analysisDisabled = Boolean(
                    details.disable_analysis || details.gamedata.disable_analysis,
                );

                setSelectedGame({
                    details,
                    game,
                    isFinished,
                    analysisDisabled,
                });
                setNameTouched(false);
                if (mode === "create-room") {
                    setRoomName(buildDefaultRoomName(game));
                }
            } catch {
                setSelectedGame(null);
                setErrorMessage(
                    pgettext(
                        "Error shown when a Kibitz game cannot be resolved",
                        "Game not found.",
                    ),
                );
            } finally {
                setLoading(false);
            }
        },
        [mode],
    );

    const onSelectGameId = React.useCallback(
        (gameId: number) => {
            setManualInput(String(gameId));
            void resolveGame(gameId);
        },
        [resolveGame],
    );

    const onResolveManualGame = React.useCallback(() => {
        const gameId = parseGameId(manualInput);
        if (!gameId) {
            setSelectedGame(null);
            setErrorMessage(
                pgettext(
                    "Error shown when the Kibitz game ID input is invalid",
                    "Enter a valid game ID or OGS game URL.",
                ),
            );
            return;
        }

        void resolveGame(gameId);
    }, [manualInput, resolveGame]);

    const onSubmitCreateRoom = React.useCallback(() => {
        if (!selectedGame || !canCreateRoom) {
            return;
        }

        onCreateRoom(selectedGame.game, roomName.trim(), roomDescription.trim());
    }, [canCreateRoom, onCreateRoom, roomDescription, roomName, selectedGame]);

    const onSubmitChangeBoard = React.useCallback(() => {
        if (!selectedGame || !canChangeBoard) {
            return;
        }

        if (!showChangeConfirm) {
            setShowChangeConfirm(true);
            return;
        }

        onChangeBoard(selectedGame.game);
    }, [canChangeBoard, onChangeBoard, selectedGame, showChangeConfirm]);

    const selectedGameSummary = selectedGame?.game;
    const selectedGameStateLabel = selectedGame
        ? selectedGame.isFinished
            ? pgettext("Label for a finished Kibitz game", "Finished")
            : pgettext("Label for a live Kibitz game", "Live")
        : null;

    return (
        <div className="KibitzGamePickerOverlay" role="dialog" aria-modal="true">
            <div className="KibitzGamePickerOverlay-shell">
                <div className="KibitzGamePickerOverlay-header">
                    <div className="KibitzGamePickerOverlay-titleBlock">
                        <div className="KibitzGamePickerOverlay-title">
                            {mode === "create-room"
                                ? pgettext("Title for Kibitz create room overlay", "Create room")
                                : pgettext("Title for Kibitz change board overlay", "Change board")}
                        </div>
                        <div className="KibitzGamePickerOverlay-subtitle">
                            {mode === "create-room"
                                ? pgettext(
                                      "Subtitle for the Kibitz create room overlay",
                                      "Pick a game in Observe or enter a game ID.",
                                  )
                                : pgettext(
                                      "Subtitle for the Kibitz change board overlay",
                                      "Switch this room to a different game.",
                                  )}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="xs"
                        onClick={onClose}
                        aria-label={pgettext(
                            "Aria label for closing the Kibitz game picker overlay",
                            "Close",
                        )}
                    >
                        {pgettext(
                            "Button label for closing the Kibitz game picker overlay",
                            "Close",
                        )}
                    </button>
                </div>

                <div className="KibitzGamePickerOverlay-body">
                    <div className="KibitzGamePickerOverlay-observePane">
                        <ObserveGamesComponent
                            announcements={false}
                            updateTitle={false}
                            channel=""
                            forceList={true}
                            onSelectGameId={onSelectGameId}
                        />
                    </div>

                    <div className="KibitzGamePickerOverlay-detailsPane">
                        <div className="KibitzGamePickerOverlay-manualEntry">
                            <label
                                className="KibitzGamePickerOverlay-fieldLabel"
                                htmlFor="kibitz-game-picker-input"
                            >
                                {manualEntryLabel}
                            </label>
                            <div className="KibitzGamePickerOverlay-manualRow">
                                <input
                                    id="kibitz-game-picker-input"
                                    type="text"
                                    value={manualInput}
                                    onChange={(event) => {
                                        setManualInput(event.target.value);
                                        setErrorMessage(null);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            onResolveManualGame();
                                        }
                                    }}
                                    placeholder={manualPlaceholder}
                                />
                                <button
                                    type="button"
                                    className="xs primary"
                                    onClick={onResolveManualGame}
                                >
                                    {pgettext(
                                        "Button label for loading a Kibitz game by ID",
                                        "Load",
                                    )}
                                </button>
                            </div>
                            {errorMessage ? (
                                <div className="KibitzGamePickerOverlay-error">{errorMessage}</div>
                            ) : null}
                            {loading ? (
                                <div className="KibitzGamePickerOverlay-note">
                                    {pgettext(
                                        "Loading note for the Kibitz game picker",
                                        "Loading game details...",
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div className="KibitzGamePickerOverlay-previewCard">
                            {selectedGameSummary ? (
                                <>
                                    <div className="KibitzGamePickerOverlay-previewHeader">
                                        <div className="KibitzGamePickerOverlay-previewTitle">
                                            {selectedGameSummary.title}
                                        </div>
                                        {selectedGameStateLabel ? (
                                            <div className="KibitzGamePickerOverlay-stateBadge">
                                                {selectedGameStateLabel}
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="KibitzGamePickerOverlay-previewMeta">
                                        <span>
                                            {interpolate(
                                                pgettext(
                                                    "Game size label in the Kibitz picker",
                                                    "{{size}} board",
                                                ),
                                                {
                                                    size: selectedGameSummary.board_size,
                                                },
                                            )}
                                        </span>
                                        <span>
                                            {interpolate(
                                                pgettext(
                                                    "Move count label in the Kibitz picker",
                                                    "{{count}} moves",
                                                ),
                                                {
                                                    count: selectedGameSummary.move_number ?? 0,
                                                },
                                            )}
                                        </span>
                                    </div>
                                    <div className="KibitzGamePickerOverlay-playerRow">
                                        <span className="KibitzGamePickerOverlay-playerName">
                                            {selectedGameSummary.black.username}
                                        </span>
                                        <span className="KibitzGamePickerOverlay-versus">
                                            {pgettext("Versus label in the Kibitz picker", "vs")}
                                        </span>
                                        <span className="KibitzGamePickerOverlay-playerName">
                                            {selectedGameSummary.white.username}
                                        </span>
                                    </div>
                                    <div className="KibitzGamePickerOverlay-boardWrap">
                                        <KibitzBoard
                                            gameId={selectedGameSummary.game_id}
                                            className="KibitzGamePickerOverlay-board"
                                        />
                                    </div>
                                    {selectedGame?.analysisDisabled && !selectedGame.isFinished ? (
                                        <div className="KibitzGamePickerOverlay-error">
                                            {pgettext(
                                                "Error shown when a live Kibitz game cannot be used",
                                                "This live game cannot be used because analysis is disabled.",
                                            )}
                                        </div>
                                    ) : null}
                                    {existingRoom ? (
                                        <div className="KibitzGamePickerOverlay-suggestion">
                                            <div className="KibitzGamePickerOverlay-suggestionText">
                                                {interpolate(
                                                    pgettext(
                                                        "Existing room hint in the Kibitz picker",
                                                        "A Kibitz room for this game already exists: {{room}}.",
                                                    ),
                                                    {
                                                        room: existingRoom.title,
                                                    },
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="xs"
                                                onClick={() => {
                                                    onClose();
                                                    onJoinRoom(existingRoom.id);
                                                }}
                                            >
                                                {pgettext(
                                                    "Button label for joining an existing Kibitz room",
                                                    "Join existing room",
                                                )}
                                            </button>
                                        </div>
                                    ) : null}
                                    {mode === "create-room" ? (
                                        <div className="KibitzGamePickerOverlay-roomFields">
                                            <label
                                                className="KibitzGamePickerOverlay-fieldLabel"
                                                htmlFor="kibitz-room-name"
                                            >
                                                {pgettext(
                                                    "Label for the Kibitz room name field",
                                                    "Room name",
                                                )}
                                            </label>
                                            <input
                                                id="kibitz-room-name"
                                                type="text"
                                                value={roomName}
                                                onChange={(event) => {
                                                    setNameTouched(true);
                                                    setRoomName(event.target.value);
                                                }}
                                                disabled={!selectedGameSummary}
                                            />
                                            <label
                                                className="KibitzGamePickerOverlay-fieldLabel"
                                                htmlFor="kibitz-room-description"
                                            >
                                                {pgettext(
                                                    "Label for the Kibitz room description field",
                                                    "Description",
                                                )}
                                            </label>
                                            <textarea
                                                id="kibitz-room-description"
                                                value={roomDescription}
                                                onChange={(event) => {
                                                    setRoomDescription(event.target.value);
                                                }}
                                                disabled={!selectedGameSummary}
                                                rows={4}
                                            />
                                        </div>
                                    ) : (
                                        <div className="KibitzGamePickerOverlay-confirmation">
                                            <div className="KibitzGamePickerOverlay-confirmationCopy">
                                                <strong>
                                                    {pgettext(
                                                        "Confirmation title for changing the Kibitz board",
                                                        "Switch this room to a different game?",
                                                    )}
                                                </strong>
                                                <span>
                                                    {pgettext(
                                                        "Confirmation body for changing the Kibitz board",
                                                        "The room will keep its chat, history, and variations.",
                                                    )}
                                                </span>
                                            </div>
                                            {selectionIsSameAsCurrent ? (
                                                <div className="KibitzGamePickerOverlay-note">
                                                    {pgettext(
                                                        "Note shown when the selected game matches the current Kibitz room game",
                                                        "This room is already watching this game.",
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="KibitzGamePickerOverlay-emptyState">
                                    {pgettext(
                                        "Empty state for the Kibitz picker preview",
                                        "Pick a game to preview it here.",
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="KibitzGamePickerOverlay-footer">
                            <button type="button" className="xs" onClick={onClose}>
                                {pgettext("Button label for canceling the Kibitz picker", "Cancel")}
                            </button>
                            {mode === "create-room" ? (
                                <button
                                    type="button"
                                    className="xs primary"
                                    onClick={onSubmitCreateRoom}
                                    disabled={!canCreateRoom}
                                >
                                    {pgettext(
                                        "Button label for creating a Kibitz room",
                                        "Create room",
                                    )}
                                </button>
                            ) : showChangeConfirm ? (
                                <button
                                    type="button"
                                    className="xs primary"
                                    onClick={onSubmitChangeBoard}
                                    disabled={!canChangeBoard}
                                >
                                    {pgettext(
                                        "Button label for confirming a Kibitz board change",
                                        "Change board",
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="xs primary"
                                    onClick={onSubmitChangeBoard}
                                    disabled={!canChangeBoard}
                                >
                                    {pgettext(
                                        "Button label for advancing to Kibitz board change confirmation",
                                        "Continue",
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
