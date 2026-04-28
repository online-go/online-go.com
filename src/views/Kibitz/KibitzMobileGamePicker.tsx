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
import { get } from "@/lib/requests";
import { interpolate, pgettext } from "@/lib/translate";
import { ObserveGamesComponent } from "@/components/ObserveGamesComponent";
import type { KibitzRoomSummary, KibitzRoomUser, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzBoard } from "./KibitzBoard";
import { parseGameId } from "./parseGameId";

type KibitzGamePickerMode = "create-room" | "change-board";
type PickerSourceMode = "ongoing" | "game-id";
type MobilePickerStep = "select" | "preview" | "details";
const MOBILE_LAYOUT_MEDIA_QUERY = "(max-width: 1000px)";

interface KibitzMobileGamePickerProps {
    mode: KibitzGamePickerMode;
    rooms: KibitzRoomSummary[];
    currentRoom?: KibitzRoomSummary | null;
    onClose: () => void;
    onCreateRoom: (game: KibitzWatchedGame, roomName: string, description: string) => void;
    onChangeBoard: (game: KibitzWatchedGame) => void;
    onJoinRoom: (roomId: string) => void;
    onBackToMenu?: () => void;
}

interface SelectedGameState {
    details: rest_api.GameDetails;
    game: KibitzWatchedGame;
    isFinished: boolean;
    analysisDisabled: boolean;
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

export function KibitzMobileGamePicker({
    mode,
    rooms,
    currentRoom,
    onClose,
    onCreateRoom,
    onChangeBoard,
    onJoinRoom,
    onBackToMenu,
}: KibitzMobileGamePickerProps): React.ReactElement {
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
    const selectionIsEligible =
        Boolean(selectedGame) &&
        Boolean(selectedGame?.isPublic) &&
        !errorMessage &&
        !(selectedGame?.analysisDisabled && !selectedGame.isFinished);
    const canOpenRoomDetailsPopup =
        mode === "create-room" && Boolean(selectedGame) && selectionIsEligible && !loading;
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
                const analysisDisabled = Boolean(
                    details.disable_analysis || details.gamedata.disable_analysis,
                );
                const isPublic = !details.gamedata.private;

                setSelectedGame({
                    details,
                    game,
                    isFinished,
                    analysisDisabled,
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

    const onOpenRoomDetailsPopup = React.useCallback(() => {
        if (!canOpenRoomDetailsPopup) {
            return;
        }

        if (isMobileLayout) {
            setMobileStep("details");
            return;
        }
    }, [canOpenRoomDetailsPopup, isMobileLayout]);

    const onSubmitChangeBoard = React.useCallback(() => {
        if (!selectedGame || !canChangeBoard) {
            return;
        }

        onChangeBoard(selectedGame.game);
    }, [canChangeBoard, onChangeBoard, selectedGame]);

    const onBackMobile = React.useCallback(() => {
        if (mobileStep === "details") {
            setMobileStep("preview");
            return;
        }

        if (mobileStep === "preview") {
            setMobileStep("select");
            return;
        }

        onBackToMenu?.();
    }, [mobileStep, onBackToMenu]);

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

    const renderSelectedGameCard = (mobile: boolean) => {
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
                    <div className="KibitzGamePickerOverlay-note">
                        {pgettext(
                            "Note explaining that room name and description open in a popup",
                            "Room name and description are set in the next step.",
                        )}
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
        );
    };

    const mobileHeaderTitle =
        mobileStep === "details"
            ? pgettext("Title for the mobile room details step in kibitz", "Room details")
            : mode === "create-room"
              ? pgettext("Title for Kibitz create room overlay", "Create room")
              : pgettext("Title for Kibitz change board overlay", "Change board");

    const mobileHeaderSubtitle =
        mobileStep === "details"
            ? pgettext(
                  "Subtitle for the mobile room details step in kibitz",
                  "Set a room name and optional description.",
              )
            : mobileStep === "preview"
              ? mode === "create-room"
                  ? pgettext(
                        "Subtitle for the mobile create room preview step",
                        "Review the selected game before continuing.",
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
            )}
        </>
    );

    const renderMobilePreviewStep = () => (
        <div className="KibitzGamePickerOverlay-mobileStepBody KibitzGamePickerOverlay-mobilePreviewStep">
            <div className="KibitzGamePickerOverlay-mobilePreviewContent">
                <div className="KibitzGamePickerOverlay-selectionCard KibitzGamePickerOverlay-selectionCard-mobile">
                    {renderSelectedGameCard(true)}
                </div>
            </div>
            <div className="KibitzGamePickerOverlay-mobileFooter">
                <button
                    type="button"
                    className="xs primary KibitzGamePickerOverlay-cancelButton"
                    onClick={onBackMobile}
                    aria-label={pgettext(
                        "Aria label for going back in the mobile kibitz picker",
                        "Go back",
                    )}
                >
                    {pgettext("Button label for going back in the mobile kibitz picker", "Back")}
                </button>
                {mode === "create-room" ? (
                    <button
                        type="button"
                        className="xs primary KibitzGamePickerOverlay-actionButton"
                        onClick={onOpenRoomDetailsPopup}
                        disabled={!canOpenRoomDetailsPopup}
                    >
                        {pgettext(
                            "Button label for continuing to room details in the mobile kibitz picker",
                            "Continue",
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
    );

    const renderMobileDetailsStep = () => (
        <div className="KibitzGamePickerOverlay-mobileStepBody">
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
                    {pgettext("Label for the Kibitz room description field", "Description")}
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
            <div className="KibitzGamePickerOverlay-mobileFooter">
                <button
                    type="button"
                    className="xs primary KibitzGamePickerOverlay-cancelButton"
                    onClick={onBackMobile}
                    aria-label={pgettext(
                        "Aria label for going back in the mobile kibitz picker",
                        "Go back",
                    )}
                >
                    {pgettext("Back-arrow glyph for the mobile kibitz picker back button", "←")}
                </button>
                <button
                    type="button"
                    className="xs primary KibitzGamePickerOverlay-actionButton"
                    onClick={onSubmitCreateRoom}
                    disabled={!canCreateRoom}
                >
                    {pgettext("Button label for creating a Kibitz room", "Create room")}
                </button>
            </div>
        </div>
    );

    return (
        <div
            className={
                "KibitzGamePickerOverlay KibitzMobileGamePicker KibitzGamePickerOverlay-embedded" +
                (mobileStep === "preview" ? " KibitzGamePickerOverlay-hideMobileHeader" : "")
            }
        >
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
                            <>
                                {onBackToMenu ? (
                                    <button
                                        type="button"
                                        className="xs primary KibitzGamePickerOverlay-mobileBackButton"
                                        onClick={onBackMobile}
                                        aria-label={pgettext(
                                            "Aria label for going back to the mobile kibitz room list",
                                            "Go back to room list",
                                        )}
                                    >
                                        {pgettext(
                                            "Back-arrow glyph for the mobile kibitz picker back button",
                                            "←",
                                        )}
                                    </button>
                                ) : null}
                                <div
                                    className="KibitzGamePickerOverlay-mobileSourceSwitcher"
                                    role="tablist"
                                >
                                    <button
                                        type="button"
                                        className={
                                            "xs primary " +
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
                                            "xs primary " +
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
                            </>
                        ) : (
                            <button
                                type="button"
                                className="xs primary KibitzGamePickerOverlay-mobileBackButton"
                                onClick={onBackMobile}
                                aria-label={pgettext(
                                    "Aria label for going back in the mobile kibitz picker",
                                    "Go back",
                                )}
                            >
                                {pgettext(
                                    "Back-arrow glyph for the mobile kibitz picker back button",
                                    "←",
                                )}
                            </button>
                        )}
                        <button
                            type="button"
                            className="xs primary KibitzGamePickerOverlay-closeButton"
                            onClick={onClose}
                            aria-label={pgettext(
                                "Aria label for closing the Kibitz game picker overlay",
                                "Quit picker",
                            )}
                        >
                            {pgettext("Close-glyph for the mobile kibitz picker close button", "X")}
                        </button>
                    </div>
                </div>
                <div className="KibitzGamePickerOverlay-mobileBody">
                    {mobileStep === "select"
                        ? renderMobileSelectStep()
                        : mobileStep === "preview"
                          ? renderMobilePreviewStep()
                          : renderMobileDetailsStep()}
                </div>
            </div>
        </div>
    );
}
