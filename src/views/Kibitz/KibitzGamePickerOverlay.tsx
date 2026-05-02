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
import { getKibitzAccessPolicyForUser } from "./kibitzAnalysisPolicy";
import {
    getKibitzAccessBlockedMessage,
    getKibitzAnalysisDisabledSpectatorMessage,
    getKibitzPickerFailedChangeMessage,
    getKibitzPickerFailedCreateMessage,
} from "./kibitzAnalysisPolicyCopy";
import { parseGameId } from "./parseGameId";
import { useCurrentKibitzUser } from "./useCurrentKibitzUser";
import "./KibitzGamePickerOverlay.css";

type KibitzGamePickerOverlayMode = "create-room" | "change-board";
type PickerSourceMode = "ongoing" | "game-id";
type MobilePickerStep = "select" | "preview" | "details";
const MOBILE_LAYOUT_MEDIA_QUERY = "(max-width: 1000px)";

interface KibitzGamePickerOverlayProps {
    mode: KibitzGamePickerOverlayMode;
    rooms: KibitzRoomSummary[];
    currentRoom?: KibitzRoomSummary | null;
    onClose: () => void;
    onCreateRoom: (
        game: KibitzWatchedGame,
        roomName: string,
        description: string,
    ) => Promise<string | null> | string | null;
    onChangeBoard: (game: KibitzWatchedGame) => Promise<boolean> | boolean;
    onJoinRoom: (roomId: string) => void;
}

interface SelectedGameState {
    details: rest_api.GameDetails;
    game: KibitzWatchedGame;
    isFinished: boolean;
    isPublic: boolean;
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
        analysis_disabled: Boolean(
            (details as { analysis_disabled?: boolean | null }).analysis_disabled ||
            details.disable_analysis ||
            details.gamedata.disable_analysis,
        ),
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
    const resolveGameRequestIdRef = React.useRef(0);
    const [selectedGame, setSelectedGame] = React.useState<SelectedGameState | null>(null);
    const [manualInput, setManualInput] = React.useState("");
    const [roomName, setRoomName] = React.useState("");
    const [roomDescription, setRoomDescription] = React.useState("");
    const [nameTouched, setNameTouched] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [sourceMode, setSourceMode] = React.useState<PickerSourceMode>("ongoing");
    const [mobileStep, setMobileStep] = React.useState<MobilePickerStep>("select");
    const currentUser = useCurrentKibitzUser();
    const [isMobileLayout, setIsMobileLayout] = React.useState(
        () => window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches,
    );

    React.useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY);
        const sync = (event?: MediaQueryListEvent) => {
            setIsMobileLayout(event?.matches ?? mediaQuery.matches);
        };

        sync();
        mediaQuery.addEventListener("change", sync);

        return () => {
            mediaQuery.removeEventListener("change", sync);
        };
    }, []);

    const currentGameId = currentRoom?.current_game?.game_id ?? null;
    const existingRoom = React.useMemo(() => {
        if (!selectedGame) {
            return null;
        }

        const existing = findExistingRoom(rooms, selectedGame.game.game_id);

        if (mode === "change-board" && existing?.id === currentRoom?.id) {
            return null;
        }

        return existing;
    }, [currentRoom?.id, mode, rooms, selectedGame]);

    const manualEntryLabel = pgettext("Label for the Kibitz game ID input", "Game ID");
    const manualPlaceholder = pgettext(
        "Placeholder for the Kibitz game ID input",
        "Paste a game ID or OGS game URL",
    );

    const selectionIsSameAsCurrent = Boolean(
        mode === "change-board" && selectedGame && currentGameId === selectedGame.game.game_id,
    );
    const accessPolicy = selectedGame
        ? getKibitzAccessPolicyForUser(currentUser, selectedGame.details)
        : { allowed: true as const };
    const blockedMessage =
        !accessPolicy.allowed && accessPolicy.reason === "own-active-analysis-disabled-game"
            ? getKibitzAccessBlockedMessage()
            : null;
    const selectionErrorMessage = errorMessage ?? blockedMessage;
    const selectionInfoMessage =
        accessPolicy.allowed && accessPolicy.reason === "analysis-disabled-spectator"
            ? getKibitzAnalysisDisabledSpectatorMessage()
            : null;
    const selectionIsEligible =
        Boolean(selectedGame) && Boolean(selectedGame?.isPublic) && !selectionErrorMessage;
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

    React.useEffect(() => {
        if (mode !== "create-room" && mobileStep === "details") {
            setMobileStep("preview");
        }
    }, [mobileStep, mode]);

    const resolveGame = React.useCallback(
        async (gameId: number) => {
            const requestId = ++resolveGameRequestIdRef.current;
            setLoading(true);
            setErrorMessage(null);

            try {
                const details = (await get(`games/${gameId}`)) as rest_api.GameDetails;
                if (requestId !== resolveGameRequestIdRef.current) {
                    return;
                }
                const game = mapGameDetailsToWatchedGame(details);
                const isFinished = Boolean(details.ended);
                const isPublic = !details.gamedata.private;

                setSelectedGame({
                    details,
                    game,
                    isFinished,
                    isPublic,
                });
                setNameTouched(false);
                if (mode === "create-room") {
                    setRoomName(buildDefaultRoomName(game));
                }
                if (!isPublic) {
                    setErrorMessage(
                        pgettext(
                            "Error shown when a Kibitz game is private",
                            "Only public games can be used for Kibitz rooms.",
                        ),
                    );
                } else if (isMobileLayout) {
                    setMobileStep("preview");
                }
            } catch {
                if (requestId !== resolveGameRequestIdRef.current) {
                    return;
                }
                setSelectedGame(null);
                setErrorMessage(
                    pgettext(
                        "Error shown when a Kibitz game cannot be resolved",
                        "Game not found.",
                    ),
                );
            } finally {
                if (requestId === resolveGameRequestIdRef.current) {
                    setLoading(false);
                }
            }
        },
        [isMobileLayout, mode],
    );

    const onSelectGameId = React.useCallback(
        (gameId: number) => {
            setManualInput(String(gameId));
            setSourceMode("ongoing");
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

        setSourceMode("game-id");
        void resolveGame(gameId);
    }, [manualInput, resolveGame]);

    const onSubmitCreateRoom = React.useCallback(() => {
        if (!selectedGame || !canCreateRoom) {
            return;
        }

        void Promise.resolve(
            onCreateRoom(selectedGame.game, roomName.trim(), roomDescription.trim()),
        ).then((nextRoomId) => {
            if (nextRoomId) {
                onClose();
                return;
            }

            setErrorMessage(getKibitzPickerFailedCreateMessage());
        });
    }, [canCreateRoom, onClose, onCreateRoom, roomDescription, roomName, selectedGame]);

    const onSubmitChangeBoard = React.useCallback(() => {
        if (!selectedGame || !canChangeBoard) {
            return;
        }

        void Promise.resolve(onChangeBoard(selectedGame.game)).then((success) => {
            if (success) {
                onClose();
                return;
            }

            setErrorMessage(getKibitzPickerFailedChangeMessage());
        });
    }, [canChangeBoard, onChangeBoard, onClose, selectedGame]);

    const onBackMobile = React.useCallback(() => {
        if (mobileStep === "details") {
            setMobileStep("preview");
            return;
        }

        if (mobileStep === "preview") {
            setMobileStep("select");
        }
    }, [mobileStep]);

    const selectedGameSummary = selectedGame?.game;
    const selectedGameStateLabel = selectedGame
        ? selectedGame.isFinished
            ? pgettext("Label for a finished Kibitz game", "Finished")
            : pgettext("Label for a live Kibitz game", "Live")
        : null;
    const selectedGameStateClassName = selectedGame
        ? selectedGame.isFinished
            ? "KibitzGamePickerOverlay-stateText KibitzGamePickerOverlay-stateFinished"
            : "KibitzGamePickerOverlay-stateText KibitzGamePickerOverlay-stateLive"
        : undefined;

    const renderSelectedGameCard = (options: { mobile: boolean; showBoardPreview: boolean }) => {
        const { mobile, showBoardPreview } = options;
        if (!selectedGameSummary) {
            return (
                <div className="KibitzGamePickerOverlay-emptyState">
                    {pgettext(
                        "Empty state for the Kibitz picker selection",
                        "Pick a game to continue.",
                    )}
                </div>
            );
        }

        return (
            <>
                <div className="KibitzGamePickerOverlay-selectionHeader">
                    <div className="KibitzGamePickerOverlay-selectionTitle">
                        {selectedGameSummary.title}
                    </div>
                    {selectedGameStateLabel ? (
                        <div className={selectedGameStateClassName}>{selectedGameStateLabel}</div>
                    ) : null}
                </div>
                <div className="KibitzGamePickerOverlay-previewMeta">
                    <span>
                        {interpolate(
                            pgettext("Game size label in the Kibitz picker", "{{size}} board"),
                            {
                                size: selectedGameSummary.board_size,
                            },
                        )}
                    </span>
                    <span>
                        {interpolate(
                            pgettext("Move count label in the Kibitz picker", "{{count}} moves"),
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
                {showBoardPreview ? (
                    <div
                        className={
                            "KibitzGamePickerOverlay-boardWrap" +
                            (mobile ? " KibitzGamePickerOverlay-boardWrap-mobile" : "")
                        }
                    >
                        <KibitzBoard
                            gameId={selectedGameSummary.game_id}
                            className="KibitzGamePickerOverlay-board"
                        />
                    </div>
                ) : (
                    <div className="KibitzGamePickerOverlay-note">
                        {pgettext(
                            "Note shown when the Kibitz picker selection uses an Observe preview",
                            "Board preview is already shown in Observe.",
                        )}
                    </div>
                )}
                {selectionErrorMessage ? (
                    <div className="KibitzGamePickerOverlay-error">{selectionErrorMessage}</div>
                ) : null}
                {selectionInfoMessage ? (
                    <div className="KibitzGamePickerOverlay-note">{selectionInfoMessage}</div>
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
                        {blockedMessage ? (
                            <div className="KibitzGamePickerOverlay-note">{blockedMessage}</div>
                        ) : (
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
                        )}
                    </div>
                ) : null}
                {mode === "change-board" ? (
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
                ) : null}
            </>
        );
    };

    const renderDesktop = () => (
        <>
            <div className="KibitzGamePickerOverlay-shell">
                <div className="KibitzGamePickerOverlay-header">
                    <div className="KibitzGamePickerOverlay-headerMain">
                        <div className="KibitzGamePickerOverlay-titleBlock">
                            <div className="KibitzGamePickerOverlay-title">
                                {mode === "create-room"
                                    ? pgettext(
                                          "Title for Kibitz create room overlay",
                                          "Create room",
                                      )
                                    : pgettext(
                                          "Title for Kibitz change board overlay",
                                          "Change board",
                                      )}
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
                    </div>
                    <div className="KibitzGamePickerOverlay-headerControls">
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
                                className="xs primary KibitzGamePickerOverlay-actionButton"
                                onClick={onResolveManualGame}
                            >
                                {pgettext("Button label for loading a Kibitz game by ID", "Load")}
                            </button>
                        </div>
                        {selectionErrorMessage ? (
                            <div className="KibitzGamePickerOverlay-error">
                                {selectionErrorMessage}
                            </div>
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
                    <button
                        type="button"
                        className="xs KibitzGamePickerOverlay-closeButton KibitzGamePickerOverlay-dangerButton"
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
                            initialMiniGoban={true}
                            onSelectGameId={onSelectGameId}
                        />
                    </div>

                    <div className="KibitzGamePickerOverlay-detailsPane">
                        <div className="KibitzGamePickerOverlay-selectionCard">
                            {renderSelectedGameCard({
                                mobile: false,
                                showBoardPreview: sourceMode === "game-id",
                            })}
                        </div>

                        {mode === "create-room" ? (
                            <div className="KibitzGamePickerOverlay-roomFields">
                                <label
                                    className="KibitzGamePickerOverlay-fieldLabel"
                                    htmlFor="kibitz-room-name"
                                >
                                    {pgettext("Label for the Kibitz room name field", "Room name")}
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
                        ) : null}

                        {mode === "create-room" ? (
                            <div className="KibitzGamePickerOverlay-note">
                                {pgettext(
                                    "Note shown when room details are edited inline in the Kibitz picker",
                                    "Room details are edited inline here.",
                                )}
                            </div>
                        ) : null}

                        <div className="KibitzGamePickerOverlay-footer">
                            <button
                                type="button"
                                className="xs KibitzGamePickerOverlay-cancelButton"
                                onClick={onClose}
                            >
                                {pgettext("Button label for canceling the Kibitz picker", "Cancel")}
                            </button>
                            {mode === "create-room" ? (
                                <button
                                    type="button"
                                    className="xs primary KibitzGamePickerOverlay-actionButton"
                                    onClick={onSubmitCreateRoom}
                                    disabled={!canCreateRoom}
                                >
                                    {pgettext(
                                        "Button label for creating a Kibitz room",
                                        "Create room",
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="xs primary KibitzGamePickerOverlay-actionButton"
                                    onClick={onSubmitChangeBoard}
                                    disabled={!canChangeBoard}
                                >
                                    {pgettext(
                                        "Button label for confirming a Kibitz board change",
                                        "Change board",
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    const mobileHeaderTitle =
        mode === "create-room"
            ? pgettext("Title for Kibitz create room overlay", "Create room")
            : pgettext("Title for Kibitz change board overlay", "Change board");

    const mobileHeaderSubtitle =
        mobileStep === "preview"
            ? mode === "create-room"
                ? pgettext(
                      "Subtitle for the mobile create room preview step",
                      "Review the selected game before creating the room.",
                  )
                : pgettext(
                      "Subtitle for the mobile change board preview step",
                      "Review the selected game and confirm the switch.",
                  )
            : mode === "create-room"
              ? pgettext(
                    "Subtitle for the mobile create room selection step",
                    "Choose a game from Observe or load a game by ID.",
                )
              : pgettext(
                    "Subtitle for the mobile change board selection step",
                    "Choose a new game for this room.",
                );

    const renderMobileSelectStep = () => (
        <>
            {sourceMode === "ongoing" ? (
                <div className="KibitzGamePickerOverlay-mobileSelectBody KibitzGamePickerOverlay-mobileObservePane">
                    <ObserveGamesComponent
                        announcements={false}
                        updateTitle={false}
                        channel=""
                        initialMiniGoban={true}
                        onSelectGameId={onSelectGameId}
                    />
                </div>
            ) : (
                <div className="KibitzGamePickerOverlay-mobileSelectBody KibitzGamePickerOverlay-mobileManualPane">
                    <label
                        className="KibitzGamePickerOverlay-fieldLabel"
                        htmlFor="kibitz-game-picker-input-mobile"
                    >
                        {manualEntryLabel}
                    </label>
                    <input
                        id="kibitz-game-picker-input-mobile"
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
                        className="xs primary KibitzGamePickerOverlay-actionButton KibitzGamePickerOverlay-mobilePrimaryButton"
                        onClick={onResolveManualGame}
                    >
                        {pgettext("Button label for loading a Kibitz game by ID", "Load")}
                    </button>
                    {selectionErrorMessage ? (
                        <div className="KibitzGamePickerOverlay-error">{selectionErrorMessage}</div>
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
            )}
        </>
    );

    const renderMobilePreviewStep = () => (
        <div className="KibitzGamePickerOverlay-mobileStepBody KibitzGamePickerOverlay-mobilePreviewStep">
            <div className="KibitzGamePickerOverlay-mobilePreviewContent">
                <div className="KibitzGamePickerOverlay-selectionCard KibitzGamePickerOverlay-selectionCard-mobile">
                    {renderSelectedGameCard({ mobile: true, showBoardPreview: true })}
                </div>
                {mode === "create-room" ? (
                    <>
                        <div className="KibitzGamePickerOverlay-mobileRoomFields">
                            <label
                                className="KibitzGamePickerOverlay-fieldLabel"
                                htmlFor="kibitz-room-name-mobile"
                            >
                                {pgettext("Label for the Kibitz room name field", "Room name")}
                            </label>
                            <input
                                id="kibitz-room-name-mobile"
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
                                htmlFor="kibitz-room-description-mobile"
                            >
                                {pgettext(
                                    "Label for the Kibitz room description field",
                                    "Description",
                                )}
                            </label>
                            <textarea
                                id="kibitz-room-description-mobile"
                                value={roomDescription}
                                onChange={(event) => {
                                    setRoomDescription(event.target.value);
                                }}
                                disabled={!selectedGameSummary}
                                rows={5}
                            />
                        </div>
                        <button
                            type="button"
                            className="xs primary KibitzGamePickerOverlay-actionButton KibitzGamePickerOverlay-mobileCreateButton"
                            onClick={onSubmitCreateRoom}
                            disabled={!canCreateRoom}
                        >
                            {pgettext("Button label for creating a Kibitz room", "Create room")}
                        </button>
                    </>
                ) : null}
            </div>
            <div className="KibitzGamePickerOverlay-mobileFooter">
                <button
                    type="button"
                    className="xs KibitzGamePickerOverlay-cancelButton"
                    onClick={onBackMobile}
                >
                    {pgettext("Button label for going back in the mobile kibitz picker", "Back")}
                </button>
                {mode !== "create-room" ? (
                    <button
                        type="button"
                        className="xs primary KibitzGamePickerOverlay-actionButton"
                        onClick={onSubmitChangeBoard}
                        disabled={!canChangeBoard}
                    >
                        {pgettext(
                            "Button label for confirming a Kibitz board change",
                            "Change board",
                        )}
                    </button>
                ) : null}
            </div>
        </div>
    );

    const renderMobile = () => (
        <div className="KibitzGamePickerOverlay-shell KibitzGamePickerOverlay-shell-mobile">
            <div className="KibitzGamePickerOverlay-mobileHeader">
                <div className="KibitzGamePickerOverlay-mobileHeaderTop">
                    <div className="KibitzGamePickerOverlay-mobileHeaderTitle">
                        {mobileHeaderTitle}
                    </div>
                    <div className="KibitzGamePickerOverlay-mobileHeaderSubtitle">
                        {mobileHeaderSubtitle}
                    </div>
                </div>
                <div className="KibitzGamePickerOverlay-mobileHeaderActions">
                    {mobileStep === "select" ? (
                        <div
                            className="KibitzGamePickerOverlay-mobileSourceSwitcher"
                            role="tablist"
                        >
                            <button
                                type="button"
                                className={
                                    "KibitzGamePickerOverlay-mobileSourceButton" +
                                    (sourceMode === "ongoing" ? " active" : "")
                                }
                                aria-pressed={sourceMode === "ongoing"}
                                onClick={() => setSourceMode("ongoing")}
                            >
                                {pgettext(
                                    "Mobile source switch label in kibitz game picker",
                                    "Ongoing",
                                )}
                            </button>
                            <button
                                type="button"
                                className={
                                    "KibitzGamePickerOverlay-mobileSourceButton" +
                                    (sourceMode === "game-id" ? " active" : "")
                                }
                                aria-pressed={sourceMode === "game-id"}
                                onClick={() => setSourceMode("game-id")}
                            >
                                {pgettext(
                                    "Mobile source switch label in kibitz game picker",
                                    "Game ID",
                                )}
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="xs KibitzGamePickerOverlay-mobileBackButton"
                            onClick={onBackMobile}
                        >
                            {pgettext(
                                "Button label for going back in the mobile kibitz picker",
                                "Back",
                            )}
                        </button>
                    )}
                </div>
            </div>
            <div className="KibitzGamePickerOverlay-mobileBody">
                {mobileStep === "select" ? renderMobileSelectStep() : renderMobilePreviewStep()}
            </div>
        </div>
    );

    return (
        <div className="KibitzGamePickerOverlay" role="dialog" aria-modal="true">
            {isMobileLayout ? renderMobile() : renderDesktop()}
        </div>
    );
}
