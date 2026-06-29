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
import { flushSync } from "react-dom";
import { get } from "@/lib/requests";
import { interpolate, pgettext } from "@/lib/translate";
import { Player } from "@/components/Player";
import { ObserveGamesComponent } from "@/components/ObserveGamesComponent";
import type { KibitzRoomSummary, KibitzRoomUser, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzBoard } from "./KibitzBoard";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
import { getKibitzAccessPolicyForUser } from "./kibitzAnalysisPolicy";
import {
    getKibitzAccessBlockedMessage,
    getKibitzAnalysisDisabledSpectatorMessage,
    getKibitzPickerFailedChangeMessage,
    getKibitzPickerFailedCreateMessage,
} from "./kibitzAnalysisPolicyText";
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
    canOpenCreateRoomFlow: boolean;
    signInHref: string;
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

function buildDefaultRoomName(username?: string | null): string {
    const resolvedUsername = username?.trim();

    return resolvedUsername
        ? interpolate(pgettext("Default room name for a Kibitz room", "{{username}}'s Room"), {
              username: resolvedUsername,
          })
        : pgettext("Fallback room name for a Kibitz room", "Room");
}

function buildDefaultRoomDescription(game: KibitzWatchedGame): string {
    return interpolate(
        pgettext(
            "Default room description for a Kibitz room",
            "{{game}} - {{black}} vs. {{white}}",
        ),
        {
            game: game.title,
            black: game.black.username,
            white: game.white.username,
        },
    );
}

function findExistingRoom(rooms: KibitzRoomSummary[], gameId: number): KibitzRoomSummary | null {
    return rooms.find((room) => room.current_game?.game_id === gameId) ?? null;
}

function waitForNextFrame(): Promise<void> {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        if (typeof window.requestAnimationFrame === "function") {
            window.requestAnimationFrame(() => resolve());
            return;
        }

        window.setTimeout(resolve, 0);
    });
}

async function waitForPickerPreviewTeardown(): Promise<void> {
    await waitForNextFrame();
    await waitForNextFrame();
}

export function KibitzGamePickerOverlay({
    mode,
    rooms,
    currentRoom,
    canOpenCreateRoomFlow,
    signInHref,
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
    const [descriptionTouched, setDescriptionTouched] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [sourceMode, setSourceMode] = React.useState<PickerSourceMode>("ongoing");
    const [mobileStep, setMobileStep] = React.useState<MobilePickerStep>("select");
    const [suppressGamePreviews, setSuppressGamePreviews] = React.useState(false);
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
    const loadingGameDetailsLabel = pgettext(
        "Loading note for the Kibitz game picker",
        "Loading game details...",
    );

    const selectionIsSameAsCurrent = Boolean(
        mode === "change-board" && selectedGame && currentGameId === selectedGame.game.game_id,
    );
    const accessPolicy = selectedGame
        ? getKibitzAccessPolicyForUser(currentUser, selectedGame.details)
        : { allowed: true as const };
    const blockedMessage =
        !accessPolicy.allowed && accessPolicy.reason === "own-active-game"
            ? getKibitzAccessBlockedMessage()
            : null;
    const selectionErrorMessage = errorMessage ?? blockedMessage;
    const selectionInfoMessage =
        accessPolicy.allowed && accessPolicy.reason === "analysis-disabled-spectator"
            ? getKibitzAnalysisDisabledSpectatorMessage()
            : null;
    const hidePickerGamePreviews = suppressGamePreviews;
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
    const createRoomLoginRequired = mode === "create-room" && !canOpenCreateRoomFlow;

    React.useEffect(() => {
        if (!selectedGame || mode !== "create-room") {
            return;
        }

        if (!nameTouched) {
            setRoomName(buildDefaultRoomName(currentUser?.username));
        }

        if (!descriptionTouched) {
            setRoomDescription(buildDefaultRoomDescription(selectedGame.game));
        }
    }, [descriptionTouched, mode, nameTouched, selectedGame, currentUser]);

    React.useEffect(() => {
        if (mode !== "create-room" && mobileStep === "details") {
            setMobileStep("preview");
        }
    }, [mobileStep, mode]);

    React.useEffect(() => {
        if (mode !== "change-board") {
            setSuppressGamePreviews(false);
        }
    }, [mode]);

    React.useEffect(() => {
        setSuppressGamePreviews(false);
    }, [selectedGame?.game.game_id, sourceMode]);

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
                setDescriptionTouched(false);
                if (mode === "create-room") {
                    setRoomName(buildDefaultRoomName(currentUser?.username));
                    setRoomDescription(buildDefaultRoomDescription(game));
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
        [currentUser, isMobileLayout, mode],
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

        setLoading(true);
        setErrorMessage(null);
        void Promise.resolve(
            onCreateRoom(selectedGame.game, roomName.trim(), roomDescription.trim()),
        )
            .then((nextRoomId) => {
                if (nextRoomId) {
                    onClose();
                    return;
                }

                setErrorMessage(getKibitzPickerFailedCreateMessage());
            })
            .catch(() => {
                setErrorMessage(getKibitzPickerFailedCreateMessage());
            })
            .finally(() => {
                setLoading(false);
            });
    }, [canCreateRoom, onClose, onCreateRoom, roomDescription, roomName, selectedGame]);

    const onSubmitChangeBoard = React.useCallback(() => {
        if (!selectedGame || !canChangeBoard) {
            return;
        }

        const gameToChangeTo = selectedGame.game;

        flushSync(() => {
            setLoading(true);
            setErrorMessage(null);
            setSuppressGamePreviews(true);
        });

        void waitForPickerPreviewTeardown()
            .then(() => Promise.resolve(onChangeBoard(gameToChangeTo)))
            .then((success) => {
                if (success) {
                    onClose();
                    return;
                }

                setSuppressGamePreviews(false);
                setErrorMessage(getKibitzPickerFailedChangeMessage());
                setLoading(false);
            })
            .catch(() => {
                setSuppressGamePreviews(false);
                setErrorMessage(getKibitzPickerFailedChangeMessage());
                setLoading(false);
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

    if (createRoomLoginRequired) {
        return (
            <div className="KibitzGamePickerOverlay" role="dialog" aria-modal="true">
                <div className="KibitzGamePickerOverlay-shell">
                    <div className="KibitzGamePickerOverlay-header">
                        <div className="KibitzGamePickerOverlay-headerMain">
                            <div className="KibitzGamePickerOverlay-titleBlock">
                                <div className="KibitzGamePickerOverlay-title">
                                    {pgettext(
                                        "Title for Kibitz create room login-required state",
                                        "Sign in to create a room",
                                    )}
                                </div>
                                <div className="KibitzGamePickerOverlay-subtitle">
                                    {pgettext(
                                        "Subtitle for the Kibitz create room login-required state",
                                        "You need to be signed in before you can create a Kibitz room.",
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="KibitzGamePickerOverlay-headerControls" />
                        <button
                            type="button"
                            className="xs KibitzGamePickerOverlay-closeButton KibitzGamePickerOverlay-dangerButton"
                            onClick={onClose}
                            aria-label={pgettext(
                                "Aria label for closing the Kibitz create room login-required state",
                                "Close",
                            )}
                        >
                            {pgettext(
                                "Button label for closing the Kibitz create room login-required state",
                                "Close",
                            )}
                        </button>
                    </div>

                    <div className="KibitzGamePickerOverlay-body">
                        <div className="KibitzGamePickerOverlay-observePane">
                            <div className="KibitzGamePickerOverlay-emptyState">
                                {pgettext(
                                    "Empty state for anonymous users trying to create a Kibitz room",
                                    "Sign in to create room.",
                                )}
                            </div>
                        </div>

                        <div className="KibitzGamePickerOverlay-detailsPane">
                            <div className="KibitzGamePickerOverlay-selectionCard">
                                <div className="KibitzGamePickerOverlay-note">
                                    {pgettext(
                                        "Login required notice for Kibitz create room",
                                        "Create room is available to signed-in users only.",
                                    )}
                                </div>
                                <a
                                    className="xs primary KibitzGamePickerOverlay-actionButton"
                                    href={signInHref}
                                >
                                    {pgettext("Login action for Kibitz create room", "Sign in")}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
        const loadingPlayerStack = (
            <div className="KibitzGamePickerOverlay-playerStack KibitzGamePickerOverlay-playerStackLoading">
                {loadingGameDetailsLabel}
            </div>
        );

        if (loading && !selectedGameSummary) {
            return loadingPlayerStack;
        }

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
                {loading ? (
                    loadingPlayerStack
                ) : (
                    <div className="KibitzGamePickerOverlay-playerStack">
                        <div className="KibitzGamePickerOverlay-playerRow">
                            <KibitzUserAvatar
                                user={selectedGameSummary.black}
                                size={16}
                                className="KibitzGamePickerOverlay-playerAvatar inline"
                                iconClassName="KibitzGamePickerOverlay-playerAvatarIcon"
                            />
                            <Player user={selectedGameSummary.black} flag rank noextracontrols />
                        </div>
                        <span
                            className="KibitzGamePickerOverlay-playerSeparator"
                            aria-hidden="true"
                        >
                            -
                        </span>
                        <div className="KibitzGamePickerOverlay-playerRow">
                            <KibitzUserAvatar
                                user={selectedGameSummary.white}
                                size={16}
                                className="KibitzGamePickerOverlay-playerAvatar inline"
                                iconClassName="KibitzGamePickerOverlay-playerAvatarIcon"
                            />
                            <Player user={selectedGameSummary.white} flag rank noextracontrols />
                        </div>
                    </div>
                )}
                {showBoardPreview && !hidePickerGamePreviews ? (
                    <div
                        className={
                            "KibitzGamePickerOverlay-boardWrap" +
                            (mobile ? " KibitzGamePickerOverlay-boardWrap-mobile" : "")
                        }
                    >
                        <KibitzBoard
                            role="preview"
                            gameId={selectedGameSummary.game_id}
                            className="KibitzGamePickerOverlay-board"
                        />
                    </div>
                ) : null}
                {hidePickerGamePreviews && showBoardPreview ? (
                    <div className="KibitzGamePickerOverlay-note">
                        {pgettext(
                            "Status message shown while changing the Kibitz room board",
                            "Switching board...",
                        )}
                    </div>
                ) : null}
                {mobile && mode === "create-room" && selectedGameSummary ? (
                    <div className="KibitzGamePickerOverlay-mobileGameNameRow">
                        <div className="KibitzGamePickerOverlay-fieldLabel">
                            {pgettext("Label for the Kibitz game name field", "Game Name")}
                        </div>
                        <div className="KibitzGamePickerOverlay-mobileGameNameValue">
                            {selectedGameSummary.title}
                        </div>
                    </div>
                ) : null}
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
                        {hidePickerGamePreviews ? (
                            <div className="KibitzGamePickerOverlay-note">
                                {pgettext(
                                    "Status message shown while changing the Kibitz room board",
                                    "Switching board...",
                                )}
                            </div>
                        ) : (
                            <ObserveGamesComponent
                                announcements={false}
                                updateTitle={false}
                                channel=""
                                initialMiniGoban={true}
                                onSelectGameId={onSelectGameId}
                            />
                        )}
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
                                        setDescriptionTouched(true);
                                        setRoomDescription(event.target.value);
                                    }}
                                    disabled={!selectedGameSummary}
                                    rows={4}
                                />
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
                                    disabled={!canCreateRoom || loading}
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
                                    disabled={!canChangeBoard || loading}
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
        mobileStep === "preview" && mode === "create-room" && selectedGameSummary
            ? interpolate(
                  pgettext(
                      "Title for Kibitz create room preview overlay with selected game",
                      "Create room with game: {{game}}",
                  ),
                  { game: selectedGameSummary.title },
              )
            : mode === "create-room"
              ? pgettext("Title for Kibitz create room overlay", "Create room")
              : pgettext("Title for Kibitz change board overlay", "Change board");

    const mobileHeaderTitleContent = mobileHeaderTitle;

    const mobileHeaderStateBadge =
        mobileStep === "preview" && selectedGameStateLabel ? (
            <div
                className={
                    selectedGameStateClassName + " KibitzGamePickerOverlay-mobileHeaderStateBadge"
                }
            >
                {selectedGameStateLabel}
            </div>
        ) : null;

    const mobileHeaderSubtitle =
        mobileStep === "preview"
            ? null
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
                    {suppressGamePreviews ? (
                        <div className="KibitzGamePickerOverlay-note">
                            {pgettext(
                                "Status message shown while changing the Kibitz room board",
                                "Switching board...",
                            )}
                        </div>
                    ) : (
                        <ObserveGamesComponent
                            announcements={false}
                            updateTitle={false}
                            channel=""
                            initialMiniGoban={true}
                            onSelectGameId={onSelectGameId}
                        />
                    )}
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
                            <div className="KibitzGamePickerOverlay-mobileRoomNameRow">
                                <label
                                    className="KibitzGamePickerOverlay-fieldLabel"
                                    htmlFor="kibitz-room-name-mobile"
                                >
                                    {pgettext("Label for the Kibitz room name field", "ROOM NAME")}
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
                            </div>
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
                                    setDescriptionTouched(true);
                                    setRoomDescription(event.target.value);
                                }}
                                disabled={!selectedGameSummary}
                                rows={5}
                            />
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );

    const renderMobile = () => (
        <div className="KibitzGamePickerOverlay-shell KibitzGamePickerOverlay-shell-mobile">
            <div className="KibitzGamePickerOverlay-mobileHeader">
                {mobileStep !== "preview" ? (
                    <div className="KibitzGamePickerOverlay-mobileHeaderTop">
                        <div className="KibitzGamePickerOverlay-mobileHeaderTitle">
                            {mobileHeaderTitleContent}
                        </div>
                        {mobileHeaderSubtitle ? (
                            <div className="KibitzGamePickerOverlay-mobileHeaderSubtitle">
                                {mobileHeaderSubtitle}
                            </div>
                        ) : null}
                    </div>
                ) : null}
                <div
                    className={
                        "KibitzGamePickerOverlay-mobileHeaderActions" +
                        (mobileStep === "preview"
                            ? " KibitzGamePickerOverlay-mobileHeaderActions-preview"
                            : "")
                    }
                >
                    {mobileStep === "preview" ? (
                        <>
                            <button
                                type="button"
                                className="xs KibitzGamePickerOverlay-mobileBackButton KibitzGamePickerOverlay-mobileBackButtonInline"
                                onClick={onBackMobile}
                                aria-label={pgettext(
                                    "Aria label for going back in the mobile kibitz picker",
                                    "Go back",
                                )}
                            >
                                <i className="fa fa-arrow-left" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className="xs primary KibitzGamePickerOverlay-actionButton KibitzGamePickerOverlay-mobileCreateButton"
                                onClick={
                                    mode === "create-room"
                                        ? onSubmitCreateRoom
                                        : onSubmitChangeBoard
                                }
                                disabled={
                                    mode === "create-room"
                                        ? !canCreateRoom || loading
                                        : !canChangeBoard || loading
                                }
                            >
                                {mode === "create-room"
                                    ? pgettext(
                                          "Button label for creating a Kibitz room",
                                          "Create room",
                                      )
                                    : pgettext(
                                          "Button label for confirming a Kibitz board change",
                                          "Change board",
                                      )}
                            </button>
                            {mobileHeaderStateBadge}
                        </>
                    ) : (
                        <>
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
