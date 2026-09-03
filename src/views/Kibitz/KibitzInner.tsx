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
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { GobanController, getMoveTreeTrunkTail } from "@/lib/GobanController";
import { toast } from "@/lib/toast";
import { get } from "@/lib/requests";
import { pgettext } from "@/lib/translate";
import { type GobanConfig, type GobanRendererConfig, protocol } from "goban";
import type {
    KibitzDebugState,
    KibitzProposal,
    KibitzRoom,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzStreamItem,
    KibitzVariationSummary,
    KibitzWatchedGame,
} from "@/models/kibitz";
import { KibitzDebugPanel } from "./KibitzDebugPanel";
import { KibitzRoomList } from "./KibitzRoomList";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";
import { KibitzPresetChangePendingBanner } from "./KibitzPresetChangePendingBanner";
import type { KibitzController } from "./KibitzController";
import { KibitzView } from "./KibitzView";
import { useKibitzGobans } from "./useKibitzGobans";
import { goban_view_mode } from "@/components/GobanView";
import { KIBITZ_VARIATION_COLORS } from "./kibitzVariationTree";
import { KIBITZ_HELP_FLOW_IDS } from "./HelpFlows/KibitzHelpFlows";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import { useKibitzHelpTriggers } from "./HelpFlows/useKibitzHelpTriggers";
import { KibitzGamePickerOverlay } from "./KibitzGamePickerOverlay";
import { useKibitzCurrentGameConnectionKeeper } from "./useKibitzCurrentGameConnectionKeeper";
import {
    getKibitzAccessPolicyForUser,
    isKibitzAccessBlockedForUser,
    isLoggedInKibitzUser,
} from "./kibitzAnalysisPolicy";
import { getVisiblePostedVariations } from "./kibitzVariationQuickList";
import {
    getKibitzBlockedRoomFollowupMessage,
    getKibitzBlockedRoomMessage,
} from "./kibitzAnalysisPolicyText";
import { isKibitzVariationDebugEnabled, logKibitzVariationDebug } from "./kibitzVariationDebug";
import { useCurrentKibitzUser } from "./useCurrentKibitzUser";
import {
    captureCurrentGameBaseSnapshotFromController,
    chooseFresherCurrentGameBaseSnapshot,
} from "./kibitzCurrentGameBaseSnapshot";
import "./KibitzInner.css";

type KibitzGamePickerMode = "create-room" | "change-board" | null;
interface PendingPostedVariation {
    pendingId: string;
    gameId: number;
    creatorId: number;
    from?: number;
    moves?: string;
    title?: string;
}

export function isMainBoardSafeForReconnect(params: {
    mainBoardController: GobanController | null;
    currentGame: KibitzWatchedGame | null | undefined;
    currentGameBaseSnapshotTailMoveNumber: number;
    mainBoardOfficialTailMoveNumber: number;
    mainBoardCurrentMoveNumber: number;
    mainBoardLastOfficialMoveNumber: number;
}): boolean {
    const requiredMoveNumber = Math.max(
        params.currentGame?.move_number ?? 0,
        params.currentGameBaseSnapshotTailMoveNumber,
    );

    if (params.currentGame?.live && requiredMoveNumber === 0) {
        return false;
    }

    return Boolean(
        !params.mainBoardController ||
        !params.currentGame?.live ||
        (params.mainBoardOfficialTailMoveNumber >= requiredMoveNumber &&
            params.mainBoardCurrentMoveNumber >= requiredMoveNumber &&
            params.mainBoardLastOfficialMoveNumber >= requiredMoveNumber),
    );
}

interface KibitzInnerProps {
    controller: KibitzController;
}

const STREAMER_MODE_STORAGE_KEY = "kibitz.desktop.streamer_mode";
const MAX_VISIBLE_VARIATIONS = KIBITZ_VARIATION_COLORS.length;
const VARIATION_LIMIT_TOAST_MS = 1800;
const VARIATION_LIMIT_FLASH_MS = 900;
const CURRENT_GAME_BASE_SNAPSHOT_TOAST_MS = 1800;

interface KibitzSnapshotGameDetails {
    id: number;
    width: number;
    height: number;
    name: string;
    gamedata: {
        moves: unknown[];
    };
}

function moveTreeIdAsNumber(moveTreeId: number | string | null): number | undefined {
    return typeof moveTreeId === "number" ? moveTreeId : undefined;
}

export function isLiveGameMoveNumberKnown(game: KibitzWatchedGame | null | undefined): boolean {
    return typeof game?.move_number === "number" && game.move_number > 0;
}

export function isLiveRootSnapshotAllowed(params: {
    game: KibitzWatchedGame | null | undefined;
    snapshotTailMoveNumber: number;
    source: "visible-main-board" | "game-details";
    fetchedMoveCount?: number | null;
}): boolean {
    const { game, snapshotTailMoveNumber, source, fetchedMoveCount } = params;

    if (!game?.live) {
        return true;
    }

    if (snapshotTailMoveNumber > 0) {
        return true;
    }

    if (source === "game-details" && fetchedMoveCount === 0) {
        return true;
    }

    return false;
}

export function isCurrentGameBaseSnapshotUsable(
    snapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
    game: KibitzWatchedGame | null | undefined,
    roomId: string | null | undefined,
): snapshot is KibitzCurrentGameBaseSnapshot {
    if (!snapshot || !game) {
        return false;
    }

    if (!roomId || snapshot.roomId !== roomId) {
        return false;
    }

    if (snapshot.gameId !== game.game_id) {
        return false;
    }

    const expectedMoveNumber = game.move_number ?? 0;

    if (
        game.live &&
        expectedMoveNumber === 0 &&
        !isLiveRootSnapshotAllowed({
            game,
            snapshotTailMoveNumber: snapshot.trunkTailMoveNumber,
            source: snapshot.source === "main-board" ? "visible-main-board" : "game-details",
            fetchedMoveCount: snapshot.fetchedMoveCount ?? null,
        })
    ) {
        return false;
    }

    return snapshot.trunkTailMoveNumber >= expectedMoveNumber;
}

function currentGameBoardDimensionsOf(game: KibitzWatchedGame | null | undefined): {
    width: number | null;
    height: number | null;
} {
    if (!game?.board_size) {
        return { width: null, height: null };
    }

    const [width, height] = game.board_size.split("x").map(Number);
    if (Number.isFinite(width) && Number.isFinite(height)) {
        return { width, height };
    }

    return { width: null, height: null };
}

export async function fetchCurrentGameBaseSnapshot(
    game: KibitzWatchedGame,
    roomId: string | null,
): Promise<KibitzCurrentGameBaseSnapshot | null> {
    const details = (await get(`games/${game.game_id}`)) as KibitzSnapshotGameDetails;
    if (!details?.gamedata?.moves) {
        return null;
    }

    const boardDiv = document.createElement("div");
    boardDiv.setAttribute("aria-hidden", "true");
    boardDiv.style.position = "absolute";
    boardDiv.style.width = "1px";
    boardDiv.style.height = "1px";
    boardDiv.style.overflow = "hidden";
    boardDiv.style.pointerEvents = "none";
    boardDiv.style.opacity = "0";
    boardDiv.style.left = "-10000px";
    boardDiv.style.top = "0";
    let snapshotController: GobanController | null = null;
    const config: GobanRendererConfig & { moves?: GobanConfig["moves"] } = {
        board_div: boardDiv,
        interactive: false,
        connect_to_chat: false,
        width: details.width,
        height: details.height,
        moves: details.gamedata.moves as GobanConfig["moves"],
    };

    try {
        // captureCurrentGameBaseSnapshotFromController rejects controllers whose
        // board element is not in the document, so the div must be attached for
        // the short lifetime of this controller.
        document.body.appendChild(boardDiv);
        snapshotController = new GobanController(config as GobanRendererConfig);
        const fetchedMoveCount = details.gamedata.moves.length;
        const expectedMoveNumber = Math.max(game.move_number ?? 0, details.gamedata.moves.length);
        const snapshot = captureCurrentGameBaseSnapshotFromController(
            snapshotController,
            game,
            roomId,
            "game-details",
            expectedMoveNumber,
        );

        if (!snapshot) {
            const officialTail = getMoveTreeTrunkTail(snapshotController.goban.engine.move_tree);
            logKibitzVariationDebug("current-game-base-snapshot:fetch-not-ready", {
                gameId: game.game_id,
                expectedMoveNumber,
                fetchedMoveCount,
                roomMoveNumber: game.move_number ?? 0,
                officialTailMoveNumber: officialTail?.move_number ?? null,
            });
            return null;
        }

        snapshot.fetchedMoveCount = fetchedMoveCount;
        logKibitzVariationDebug("current-game-base-snapshot:fetch-ready", {
            gameId: snapshot.gameId,
            trunkTailMoveNumber: snapshot.trunkTailMoveNumber,
            moveTreeId: snapshot.moveTreeId,
            fetchedMoveCount,
            roomMoveNumber: game.move_number ?? 0,
        });

        return snapshot;
    } finally {
        try {
            snapshotController?.destroy();
        } catch (error) {
            logKibitzVariationDebug("current-game-base-snapshot:cleanup-error", {
                gameId: game.game_id,
                roomId,
                error,
            });
        }
        boardDiv.remove();
    }
}

export function pruneVisibleVariationIdsForGame(
    variations: KibitzVariationSummary[],
    visibleVariationIds: string[],
    gameId: number | null,
): string[] {
    if (gameId == null) {
        return visibleVariationIds;
    }

    const variationGameIds = new Map(
        variations.map((variation) => [variation.id, variation.game_id]),
    );

    return visibleVariationIds.filter(
        (variationId) => variationGameIds.get(variationId) === gameId,
    );
}

function mapGameChatLineToVariation(
    roomId: string,
    line: protocol.GameChatLine,
    fallbackGameId: number | undefined,
): KibitzVariationSummary | null {
    if (typeof line.body !== "object" || line.body === null || line.body.type !== "analysis") {
        return null;
    }

    const analysisBody = line.body as {
        type: "analysis";
        name?: string;
        from?: number;
        moves?: string;
        marks?: Record<string, string>;
        pen_marks?: KibitzVariationSummary["analysis_pen_marks"];
        line_tree?: KibitzVariationSummary["analysis_line_tree"];
        game_id?: number;
    };

    const gameId =
        typeof analysisBody.game_id === "number" && Number.isFinite(analysisBody.game_id)
            ? analysisBody.game_id
            : typeof fallbackGameId === "number" && Number.isFinite(fallbackGameId)
              ? fallbackGameId
              : null;
    if (!gameId || gameId <= 0) {
        return null;
    }

    return {
        id: `game-chat:${roomId}:${gameId}:${line.channel ?? "game"}:${line.chat_id}`,
        room_id: roomId,
        source: "game-chat",
        game_id: gameId,
        creator: {
            id: line.player_id,
            username: line.username ?? "",
            ranking: 0,
            professional: false,
            ui_class: "",
        },
        created_at: line.date * 1000,
        viewer_count: 0,
        current_viewers: [],
        title: analysisBody.name,
        analysis_from: analysisBody.from,
        analysis_moves: analysisBody.moves,
        analysis_marks: analysisBody.marks,
        analysis_pen_marks: analysisBody.pen_marks,
        analysis_line_tree: analysisBody.line_tree,
    };
}

function assignVisibleVariationColorIndexes(
    previous: Record<string, number>,
    visibleVariationIds: string[],
): Record<string, number> {
    const next: Record<string, number> = {};
    const taken = new Set<number>();

    for (const variationId of visibleVariationIds) {
        const previousIndex = previous[variationId];
        if (
            typeof previousIndex === "number" &&
            previousIndex >= 0 &&
            previousIndex < MAX_VISIBLE_VARIATIONS &&
            !taken.has(previousIndex)
        ) {
            next[variationId] = previousIndex;
            taken.add(previousIndex);
            continue;
        }

        const freeIndex = KIBITZ_VARIATION_COLORS.findIndex((_, index) => !taken.has(index));
        const colorIndex = freeIndex >= 0 ? freeIndex : 0;
        next[variationId] = colorIndex;
        taken.add(colorIndex);
    }

    const previousKeys = Object.keys(previous);
    const nextKeys = Object.keys(next);
    if (
        previousKeys.length === nextKeys.length &&
        previousKeys.every((key) => next[key] === previous[key])
    ) {
        return previous;
    }

    return next;
}

export function KibitzInner({ controller }: KibitzInnerProps): React.ReactElement {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId } = useParams<"roomId">();
    const [rooms, setRooms] = React.useState<KibitzRoomSummary[]>(controller.rooms);
    const [activeRoom, setActiveRoom] = React.useState<KibitzRoom | null>(controller.active_room);
    const [stream, setStream] = React.useState<KibitzStreamItem[]>(controller.stream);
    const [proposals, setProposals] = React.useState<KibitzProposal[]>(controller.proposals);
    const [variations, setVariations] = React.useState(controller.variations);
    const [secondaryPane, setSecondaryPane] = React.useState<KibitzSecondaryPaneState>(
        controller.secondary_pane,
    );
    const [debug, setDebug] = React.useState<KibitzDebugState>(controller.debug);
    const [permissions, setPermissions] = React.useState(controller.permissions);
    const [accessBlocked, setAccessBlocked] = React.useState(controller.access_blocked);
    const currentUser = useCurrentKibitzUser();
    const canManageRoom = permissions.can_edit_room || Boolean(currentUser?.is_moderator);
    const isLoggedInUser = isLoggedInKibitzUser(currentUser);
    const canOpenCreateRoomFlow = isLoggedInUser;
    const createRoomSignInHref = `/sign-in#${location.pathname}${location.search}`;
    const currentRoomIdRef = React.useRef<string | null>(null);
    const currentRoomGameIdRef = React.useRef<number | null>(null);
    const [currentGameBaseSnapshot, setCurrentGameBaseSnapshot] =
        React.useState<KibitzCurrentGameBaseSnapshot | null>(null);
    const [currentGameBaseSnapshotLoadingGameId, setCurrentGameBaseSnapshotLoadingGameId] =
        React.useState<number | null>(null);
    const currentGameBaseSnapshotRef = React.useRef<KibitzCurrentGameBaseSnapshot | null>(null);
    const [gameVariations, setGameVariations] = React.useState<KibitzVariationSummary[]>([]);
    const [viewMode, setViewMode] = React.useState(() => goban_view_mode());
    const isPortrait = viewMode === "portrait";
    const [streamerMode, setStreamerMode] = React.useState(() => {
        if (goban_view_mode() === "portrait") {
            return false;
        }

        return window.sessionStorage.getItem(STREAMER_MODE_STORAGE_KEY) === "true";
    });
    const [visibleVariationIds, setVisibleVariationIds] = React.useState<string[]>([]);
    const [variationColorIndexes, setVariationColorIndexes] = React.useState<
        Record<string, number>
    >({});
    const [variationFocusRequestId, setVariationFocusRequestId] = React.useState(0);
    const [cachedGamesVersion, setCachedGamesVersion] = React.useState(0);
    const [blockedVariationFlashId, setBlockedVariationFlashId] = React.useState<string | null>(
        null,
    );
    const [pendingPostedVariation, setPendingPostedVariation] =
        React.useState<PendingPostedVariation | null>(null);
    const blockedVariationFlashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const showDebug = React.useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("debug-kibitz") === "1";
    }, [location.search]);
    const handleCachedGamesChanged = React.useCallback(() => {
        setCachedGamesVersion((previous) => previous + 1);
    }, []);
    const [pickerMode, setPickerMode] = React.useState<KibitzGamePickerMode>(null);

    React.useEffect(() => {
        const syncViewMode = () => {
            setViewMode(goban_view_mode());
        };

        window.addEventListener("resize", syncViewMode);
        syncViewMode();

        return () => {
            window.removeEventListener("resize", syncViewMode);
        };
    }, []);

    React.useEffect(() => {
        controller.on("rooms-changed", setRooms);
        controller.on("room-changed", setActiveRoom);
        controller.on("stream-changed", setStream);
        controller.on("proposals-changed", setProposals);
        controller.on("variations-changed", setVariations);
        controller.on("cached-games-changed", handleCachedGamesChanged);
        controller.on("secondary-pane-changed", setSecondaryPane);
        controller.on("debug-changed", setDebug);
        controller.on("permissions-changed", setPermissions);
        controller.on("access-changed", setAccessBlocked);

        setRooms(controller.rooms);
        setActiveRoom(controller.active_room);
        setStream(controller.stream);
        setProposals(controller.proposals);
        setVariations(controller.variations);
        setSecondaryPane(controller.secondary_pane);
        setDebug(controller.debug);
        setPermissions(controller.permissions);
        setAccessBlocked(controller.access_blocked);

        return () => {
            controller.off("rooms-changed", setRooms);
            controller.off("room-changed", setActiveRoom);
            controller.off("stream-changed", setStream);
            controller.off("proposals-changed", setProposals);
            controller.off("variations-changed", setVariations);
            controller.off("cached-games-changed", handleCachedGamesChanged);
            controller.off("secondary-pane-changed", setSecondaryPane);
            controller.off("debug-changed", setDebug);
            controller.off("permissions-changed", setPermissions);
            controller.off("access-changed", setAccessBlocked);
        };
    }, [controller, handleCachedGamesChanged]);

    const defaultRoomId = rooms[0]?.id ?? null;
    const blockedRoomIds = React.useMemo(() => {
        if (!currentUser) {
            return new Set<string>();
        }

        const blockedIds = new Set<string>();
        for (const room of rooms) {
            if (isKibitzAccessBlockedForUser(currentUser, room.current_game)) {
                blockedIds.add(room.id);
            }
        }
        return blockedIds;
    }, [currentUser, rooms]);
    const selectedRoom =
        activeRoom ??
        (roomId ? (rooms.find((room) => room.id === roomId) ?? null) : (rooms[0] ?? null));
    const selectedRoomPolicy = React.useMemo(
        () => getKibitzAccessPolicyForUser(currentUser, selectedRoom?.current_game),
        [currentUser, selectedRoom?.current_game],
    );
    const isSelectedRoomBlocked = !selectedRoomPolicy.allowed;
    const isBlockedRoom = Boolean(accessBlocked?.room_id === roomId || isSelectedRoomBlocked);
    const resolvedRoom = isBlockedRoom
        ? null
        : (activeRoom ??
          (roomId ? (rooms.find((room) => room.id === roomId) ?? null) : (rooms[0] ?? null)));

    React.useEffect(() => {
        if (roomId || !defaultRoomId) {
            return;
        }

        void navigate(`/kibitz/${defaultRoomId}`, { replace: true });
    }, [defaultRoomId, navigate, roomId]);

    React.useEffect(() => {
        if (!roomId) {
            return;
        }

        if (isSelectedRoomBlocked) {
            controller.setAccessBlocked({
                room_id: roomId,
                room_title: selectedRoom?.title ?? roomId,
            });
            return;
        }

        if (activeRoom?.id === roomId || accessBlocked?.room_id === roomId) {
            if (accessBlocked?.room_id === roomId) {
                controller.setAccessBlocked(null);
            }
            return;
        }

        void controller.selectRoom(roomId);
    }, [
        accessBlocked?.room_id,
        activeRoom?.id,
        controller,
        isSelectedRoomBlocked,
        roomId,
        selectedRoom?.title,
    ]);

    const onSelectRoom = React.useCallback(
        (nextRoomId: string) => {
            void navigate(`/kibitz/${nextRoomId}`);
        },
        [navigate],
    );

    const displayedVariations = React.useMemo(() => {
        const merged = [...variations, ...gameVariations];
        merged.sort((left, right) => {
            if (left.created_at === right.created_at) {
                return left.id.localeCompare(right.id);
            }
            return left.created_at - right.created_at;
        });

        const seen = new Set<string>();
        const next: KibitzVariationSummary[] = [];
        for (const variation of merged) {
            if (seen.has(variation.id)) {
                continue;
            }
            seen.add(variation.id);
            next.push(variation);
        }
        return next;
    }, [gameVariations, variations]);

    const currentGameId = resolvedRoom?.current_game?.game_id ?? null;
    const currentGameMoveNumber = resolvedRoom?.current_game?.move_number ?? 0;
    const currentGameBoardDimensions = React.useMemo(
        () => currentGameBoardDimensionsOf(resolvedRoom?.current_game),
        [resolvedRoom?.current_game?.board_size],
    );
    const currentGameWidth = currentGameBoardDimensions.width;
    const currentGameHeight = currentGameBoardDimensions.height;
    const currentGameSnapshotTarget = React.useMemo(() => {
        const game = resolvedRoom?.current_game;

        if (!resolvedRoom?.id || !game || currentGameId == null) {
            return null;
        }

        return {
            roomId: resolvedRoom.id,
            game,
            gameId: currentGameId,
            moveNumber: currentGameMoveNumber,
            width: currentGameWidth,
            height: currentGameHeight,
        };
    }, [
        currentGameHeight,
        currentGameId,
        currentGameMoveNumber,
        currentGameWidth,
        resolvedRoom?.id,
        resolvedRoom?.current_game?.board_size,
        resolvedRoom?.current_game?.game_id,
        resolvedRoom?.current_game?.move_number,
    ]);
    // Synced during render so the refs hold the live room and game before
    // any child effect fires. `acceptCurrentGameBaseSnapshot` reads them to
    // reject snapshots that arrive after a room or board change.
    currentRoomIdRef.current = resolvedRoom?.id ?? null;
    currentRoomGameIdRef.current = currentGameId;

    const activePostedVariations = React.useMemo(
        () => getVisiblePostedVariations(displayedVariations, visibleVariationIds),
        [displayedVariations, visibleVariationIds],
    );
    const activeVariationGameIds = React.useMemo(
        () => [...new Set(activePostedVariations.map((variation) => variation.game_id))],
        [activePostedVariations],
    );
    React.useEffect(() => {
        void controller.ensureGamesCached(activeVariationGameIds);
    }, [activeVariationGameIds, controller]);
    const variationGameById = React.useMemo(() => {
        const next = new Map<number, KibitzWatchedGame>();

        const addGame = (game: KibitzWatchedGame | undefined | null) => {
            if (game) {
                next.set(game.game_id, game);
            }
        };

        addGame(resolvedRoom?.current_game);

        for (const room of rooms) {
            addGame(room.current_game);
        }

        for (const proposal of proposals) {
            addGame(proposal.proposed_game);
        }

        for (const variation of activePostedVariations) {
            addGame(controller.getCachedGame(variation.game_id));
        }

        return next;
    }, [
        activePostedVariations,
        cachedGamesVersion,
        controller,
        proposals,
        resolvedRoom?.current_game,
        rooms,
    ]);
    const activePostedVariationIds = React.useMemo(
        () => new Set(activePostedVariations.map((variation) => variation.id)),
        [activePostedVariations],
    );
    const acceptCurrentGameBaseSnapshot = React.useCallback(
        (snapshot: KibitzCurrentGameBaseSnapshot) => {
            const currentRoomId = currentRoomIdRef.current;
            const currentRoomGameId = currentRoomGameIdRef.current;
            if (
                currentRoomId == null ||
                currentRoomGameId == null ||
                snapshot.roomId !== currentRoomId ||
                snapshot.gameId !== currentRoomGameId
            ) {
                logKibitzVariationDebug("current-game-base-snapshot:stale-rejected", {
                    snapshotGameId: snapshot.gameId,
                    snapshotSource: snapshot.source,
                    snapshotRoomId: snapshot.roomId ?? null,
                    currentRoomId,
                    currentRoomGameId,
                });
                return;
            }

            setCurrentGameBaseSnapshot((previous) =>
                chooseFresherCurrentGameBaseSnapshot(previous, snapshot),
            );
        },
        [],
    );
    const gobans = useKibitzGobans({
        roomId: resolvedRoom?.id ?? null,
        currentGame: resolvedRoom?.current_game,
        secondaryPane,
        variations: displayedVariations,
        visibleVariationIds,
        variationColorIndexes,
        variationGameById,
        onMainSnapshot: acceptCurrentGameBaseSnapshot,
    });

    const roomLiveMoveNumber = resolvedRoom?.current_game?.move_number ?? 0;
    const currentGameIsLive = Boolean(resolvedRoom?.current_game?.live);
    const pickerOpen = Boolean(pickerMode);
    const mainBoardOfficialTailMoveNumber = gobans.main
        ? (getMoveTreeTrunkTail(gobans.main.goban.engine.move_tree)?.move_number ?? 0)
        : 0;
    const mainBoardCurrentMoveNumber = gobans.main
        ? (gobans.main.goban.engine.cur_move?.move_number ?? 0)
        : 0;
    const mainBoardLastOfficialMoveNumber = gobans.main
        ? (gobans.main.goban.engine.last_official_move?.move_number ?? 0)
        : 0;
    const mainBoardSafeForReconnect = isMainBoardSafeForReconnect({
        mainBoardController: gobans.main,
        currentGame: resolvedRoom?.current_game,
        currentGameBaseSnapshotTailMoveNumber: currentGameBaseSnapshot?.trunkTailMoveNumber ?? 0,
        mainBoardOfficialTailMoveNumber,
        mainBoardCurrentMoveNumber,
        mainBoardLastOfficialMoveNumber,
    });

    useKibitzCurrentGameConnectionKeeper({
        roomId: resolvedRoom?.id ?? null,
        currentGameId,
        currentLiveTailMoveNumber: roomLiveMoveNumber,
        isLive: currentGameIsLive,
        pickerOpen,
        enabled: Boolean(resolvedRoom),
        debugSource: "KibitzInner",
        boardController: gobans.main,
        allowReconnect: mainBoardSafeForReconnect,
    });
    React.useEffect(() => {
        setCurrentGameBaseSnapshot((previous) =>
            previous?.gameId === currentGameId && previous?.roomId === resolvedRoom?.id
                ? previous
                : null,
        );
    }, [currentGameId, resolvedRoom?.id]);

    React.useEffect(() => {
        currentGameBaseSnapshotRef.current = currentGameBaseSnapshot;
    }, [currentGameBaseSnapshot]);

    React.useEffect(() => {
        const target = currentGameSnapshotTarget;
        const existingSnapshotForLog: KibitzCurrentGameBaseSnapshot | null =
            currentGameBaseSnapshotRef.current;

        if (!target) {
            setCurrentGameBaseSnapshotLoadingGameId(null);
            return;
        }

        const existingSnapshotTailMoveNumber = existingSnapshotForLog?.trunkTailMoveNumber ?? 0;
        const rootLiveSnapshotRejected =
            existingSnapshotForLog?.gameId === target.gameId &&
            target.game.live &&
            target.moveNumber === 0 &&
            existingSnapshotTailMoveNumber === 0;

        if (rootLiveSnapshotRejected) {
            logKibitzVariationDebug(
                "current-game-base-snapshot:fetch-root-live-main-snapshot-rejected",
                {
                    roomId: target.roomId,
                    gameId: target.gameId,
                    roomMoveNumber: target.moveNumber,
                    snapshotTailMoveNumber: existingSnapshotTailMoveNumber,
                    moveTreeId: existingSnapshotForLog?.moveTreeId ?? null,
                },
            );
        }

        const existingSnapshotUsable = isCurrentGameBaseSnapshotUsable(
            existingSnapshotForLog,
            target.game,
            target.roomId,
        );

        if (existingSnapshotUsable && existingSnapshotForLog) {
            logKibitzVariationDebug("current-game-base-snapshot:fetch-skip-already-fresh", {
                roomId: target.roomId,
                gameId: target.gameId,
                expectedMoveNumber: target.moveNumber,
                snapshotTailMoveNumber: existingSnapshotForLog.trunkTailMoveNumber,
                moveTreeId: existingSnapshotForLog.moveTreeId,
            });
            setCurrentGameBaseSnapshotLoadingGameId(null);
            return;
        }

        const game = target.game;
        if (!game) {
            setCurrentGameBaseSnapshotLoadingGameId(null);
            return;
        }

        let cancelled = false;
        const roomIdAtStart = target.roomId;
        setCurrentGameBaseSnapshotLoadingGameId(target.gameId);

        void fetchCurrentGameBaseSnapshot(game, target.roomId)
            .then((snapshot) => {
                if (cancelled || currentRoomIdRef.current !== roomIdAtStart) {
                    return;
                }

                if (snapshot) {
                    acceptCurrentGameBaseSnapshot(snapshot);
                }
            })
            .catch((error) => {
                if (!cancelled && currentRoomIdRef.current === roomIdAtStart) {
                    logKibitzVariationDebug("current-game-base-snapshot:fetch-failed", {
                        gameId: target.gameId,
                        error,
                    });
                }
            })
            .finally(() => {
                if (!cancelled && currentRoomIdRef.current === roomIdAtStart) {
                    setCurrentGameBaseSnapshotLoadingGameId((loadingGameId) =>
                        loadingGameId === target.gameId ? null : loadingGameId,
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [acceptCurrentGameBaseSnapshot, currentGameSnapshotTarget]);

    const getCurrentGameBaseSnapshotForVariation = React.useCallback(
        (reason: string): KibitzCurrentGameBaseSnapshot | null => {
            const game = resolvedRoom?.current_game;
            if (!game) {
                return null;
            }

            const cachedSnapshot = currentGameBaseSnapshot;
            const cachedSnapshotUsable = isCurrentGameBaseSnapshotUsable(
                cachedSnapshot,
                game,
                resolvedRoom.id,
            );

            const mainBoardSnapshot = gobans.main
                ? captureCurrentGameBaseSnapshotFromController(gobans.main, game, resolvedRoom.id)
                : null;

            if (mainBoardSnapshot) {
                if (
                    game.live &&
                    (game.move_number ?? 0) === 0 &&
                    mainBoardSnapshot.trunkTailMoveNumber === 0
                ) {
                    logKibitzVariationDebug("current-game-base-snapshot:main-root-live-rejected", {
                        reason,
                        gameId: game.game_id,
                        roomMoveNumber: game.move_number ?? 0,
                        snapshotTailMoveNumber: mainBoardSnapshot.trunkTailMoveNumber,
                        moveTreeId: mainBoardSnapshot.moveTreeId,
                    });
                    return cachedSnapshotUsable ? cachedSnapshot : null;
                }

                const acceptedSnapshot = chooseFresherCurrentGameBaseSnapshot(
                    cachedSnapshot,
                    mainBoardSnapshot,
                );
                acceptCurrentGameBaseSnapshot(mainBoardSnapshot);
                return acceptedSnapshot;
            }

            if (cachedSnapshotUsable) {
                return cachedSnapshot;
            }

            logKibitzVariationDebug("current-game-base-snapshot:not-ready-for-variation", {
                reason,
                gameId: game.game_id,
                expectedMoveNumber: game.move_number ?? 0,
                cachedSnapshot: currentGameBaseSnapshot
                    ? {
                          gameId: currentGameBaseSnapshot.gameId,
                          trunkTailMoveNumber: currentGameBaseSnapshot.trunkTailMoveNumber,
                          source: currentGameBaseSnapshot.source,
                      }
                    : null,
                loadingGameId: currentGameBaseSnapshotLoadingGameId,
            });
            return null;
        },
        [
            acceptCurrentGameBaseSnapshot,
            currentGameBaseSnapshot,
            currentGameBaseSnapshotLoadingGameId,
            gobans.main,
            resolvedRoom?.current_game,
            resolvedRoom?.id,
        ],
    );

    const showCurrentGameBaseNotReadyToast = React.useCallback(() => {
        toast(
            <div>
                {pgettext(
                    "Notice shown when Kibitz is still loading the base game before creating a variation",
                    "Preparing the board. Try again in a moment.",
                )}
            </div>,
            CURRENT_GAME_BASE_SNAPSHOT_TOAST_MS,
        );
    }, []);
    const helpTargetsReady = Boolean(gobans.center);
    const desktopHelpTargetsReady = helpTargetsReady && !isPortrait && !streamerMode;
    const kibitzHelpTriggers = useKibitzHelpTriggers({
        room: resolvedRoom,
        flowReadiness: {
            [KIBITZ_HELP_FLOW_IDS.desktopFirstRun]: desktopHelpTargetsReady,
            [KIBITZ_HELP_FLOW_IDS.desktopFirstVariations]: desktopHelpTargetsReady,
            [KIBITZ_HELP_FLOW_IDS.roomBoardChange]: helpTargetsReady,
            [KIBITZ_HELP_FLOW_IDS.draftFromPostedVariation]:
                gobans.centerMode === "variation" && Boolean(gobans.secondary),
        },
        pickerOpen: Boolean(pickerMode),
    });

    const onOpenVariation = React.useCallback(
        (variationId: string, focusVariation: boolean = false) => {
            const isAlreadyVisibleInState = visibleVariationIds.includes(variationId);
            const isAlreadyVisibleInQuickList = activePostedVariationIds.has(variationId);
            const shouldLimitOpening =
                !isAlreadyVisibleInQuickList &&
                activePostedVariations.length >= MAX_VISIBLE_VARIATIONS;

            if (shouldLimitOpening) {
                if (blockedVariationFlashTimerRef.current) {
                    clearTimeout(blockedVariationFlashTimerRef.current);
                }
                setBlockedVariationFlashId(variationId);
                blockedVariationFlashTimerRef.current = setTimeout(() => {
                    setBlockedVariationFlashId(null);
                    blockedVariationFlashTimerRef.current = null;
                }, VARIATION_LIMIT_FLASH_MS);
                toast(
                    <div>
                        {pgettext(
                            "Warning shown when too many Kibitz variations are already visible",
                            "Hide one variation before showing another.",
                        )}
                    </div>,
                    VARIATION_LIMIT_TOAST_MS,
                );
                return;
            }

            const nextVisibleVariationIds = isAlreadyVisibleInState
                ? visibleVariationIds
                : [...visibleVariationIds, variationId];

            if (nextVisibleVariationIds !== visibleVariationIds) {
                setVisibleVariationIds(nextVisibleVariationIds);
                setVariationColorIndexes((previous) =>
                    assignVisibleVariationColorIndexes(previous, nextVisibleVariationIds),
                );
            }
            if (focusVariation) {
                setVariationFocusRequestId((previous) => previous + 1);
            }
            controller.openVariation(variationId);
            if (!isAlreadyVisibleInState) {
                kibitzHelpTriggers.noteDesktopVariationMadeVisible();
            }
        },
        [
            activePostedVariations.length,
            activePostedVariationIds,
            controller,
            kibitzHelpTriggers,
            visibleVariationIds,
        ],
    );
    const onToggleVariation = React.useCallback(
        (variationId: string) => {
            const toggledVariation = displayedVariations.find(
                (variation) => variation.id === variationId,
            );
            if (!toggledVariation) {
                return;
            }

            const nextVisibleVariationIds = visibleVariationIds.filter((id) => id !== variationId);
            if (nextVisibleVariationIds.length === visibleVariationIds.length) {
                return;
            }

            setVisibleVariationIds(nextVisibleVariationIds);
            setVariationColorIndexes((previous) =>
                assignVisibleVariationColorIndexes(previous, nextVisibleVariationIds),
            );

            if (secondaryPane.variation_id === variationId) {
                const nextVisibleVariations = nextVisibleVariationIds
                    .map((id) => displayedVariations.find((variation) => variation.id === id))
                    .filter((variation): variation is KibitzVariationSummary => variation != null);
                const nextActiveVariation =
                    nextVisibleVariations.find(
                        (variation) => variation.game_id === toggledVariation.game_id,
                    ) ?? nextVisibleVariations[0];

                if (nextActiveVariation) {
                    setVariationFocusRequestId((previous) => previous + 1);
                    controller.openVariation(nextActiveVariation.id);
                } else {
                    controller.clearPreviewGame();
                }
            }
        },
        [controller, displayedVariations, secondaryPane.variation_id, visibleVariationIds],
    );

    React.useLayoutEffect(() => {
        setVariationColorIndexes((previous) => {
            return assignVisibleVariationColorIndexes(previous, visibleVariationIds);
        });
    }, [visibleVariationIds]);

    React.useEffect(() => {
        return () => {
            if (blockedVariationFlashTimerRef.current) {
                clearTimeout(blockedVariationFlashTimerRef.current);
                blockedVariationFlashTimerRef.current = null;
            }
        };
    }, []);
    const onCreateVariation = React.useCallback(() => {
        const snapshot = getCurrentGameBaseSnapshotForVariation("new-variation");
        if (!snapshot) {
            showCurrentGameBaseNotReadyToast();
            return;
        }

        controller.startVariationFromCurrentBoard(
            snapshot.config.move_tree,
            snapshot.movePath,
            moveTreeIdAsNumber(snapshot.moveTreeId),
        );
    }, [controller, getCurrentGameBaseSnapshotForVariation, showCurrentGameBaseNotReadyToast]);
    const onCreateVariationFromPostedVariation = React.useCallback(
        (variation: KibitzVariationSummary) => {
            const snapshot =
                variation.game_id === currentGameId
                    ? getCurrentGameBaseSnapshotForVariation("new-variation-from-posted")
                    : null;

            if (variation.game_id === currentGameId && !snapshot) {
                showCurrentGameBaseNotReadyToast();
                return;
            }

            controller.startVariationFromPostedVariation(
                variation,
                snapshot?.config.move_tree,
                snapshot?.movePath,
                moveTreeIdAsNumber(snapshot?.moveTreeId ?? null),
            );
            kibitzHelpTriggers.noteDraftStartedFromPostedVariation();
        },
        [
            controller,
            currentGameId,
            getCurrentGameBaseSnapshotForVariation,
            kibitzHelpTriggers,
            showCurrentGameBaseNotReadyToast,
        ],
    );
    const onBranchFromVariation = React.useCallback(() => {
        const variation = displayedVariations.find(
            (candidate) => candidate.id === secondaryPane.variation_id,
        );
        if (variation) {
            onCreateVariationFromPostedVariation(variation);
        }
    }, [displayedVariations, onCreateVariationFromPostedVariation, secondaryPane.variation_id]);

    React.useEffect(() => {
        window.sessionStorage.setItem(STREAMER_MODE_STORAGE_KEY, streamerMode ? "true" : "false");
    }, [streamerMode]);

    // NavBar, announcements, private chat and toasts all hide themselves for
    // streamer mode through this class.
    React.useEffect(() => {
        document.body.classList.toggle("kibitz-streamer-mode", streamerMode);

        return () => {
            document.body.classList.remove("kibitz-streamer-mode");
        };
    }, [streamerMode]);

    React.useEffect(() => {
        if (isPortrait && streamerMode) {
            setStreamerMode(false);
        }
    }, [isPortrait, streamerMode]);

    const onOpenCreateRoom = React.useCallback(() => {
        setPickerMode("create-room");
    }, []);

    const onOpenChangeBoard = React.useCallback(() => {
        setPickerMode("change-board");
    }, []);

    const handleOpenChangeBoard = permissions.can_change_board_directly
        ? onOpenChangeBoard
        : undefined;

    const onClosePicker = React.useCallback(() => {
        setPickerMode(null);
    }, []);

    const onVoteProposal = React.useCallback(
        (proposalId: string, choice: "change" | "keep") => {
            controller.voteOnProposal(proposalId, choice);
        },
        [controller],
    );

    const roomProposals = proposals.filter((proposal) => proposal.room_id === resolvedRoom?.id);
    const activeProposal = roomProposals.find((proposal) => proposal.status === "active");
    const queuedRoomProposals = roomProposals.filter((proposal) => proposal.status !== "active");
    React.useEffect(() => {
        const goban = gobans.main?.goban;
        if (!goban || !resolvedRoom) {
            setGameVariations([]);
            return;
        }

        // Full rebuild — used for the initial sync (chat_log may already be
        // populated from a prior subscriber) and for "chat-reset" (goban
        // emits this on bulk wipes). Per-message updates take the
        // incremental paths below to avoid scanning the whole log on every
        // chat event.
        const rebuildGameVariations = () => {
            const next: KibitzVariationSummary[] = [];
            for (const line of goban.chat_log) {
                const variation = mapGameChatLineToVariation(resolvedRoom.id, line, goban.game_id);
                if (variation) {
                    next.push(variation);
                }
            }
            setGameVariations(next);
        };

        const onGameChat = (line?: protocol.GameChatLine) => {
            if (!line) {
                return;
            }
            const variation = mapGameChatLineToVariation(resolvedRoom.id, line, goban.game_id);
            if (!variation) {
                return;
            }
            // Goban doesn't dedupe "chat" emissions itself (GameChat.tsx
            // maintains its own dedupe table for the same reason), so guard
            // against double-appending the same variation on replay edges.
            setGameVariations((current) =>
                current.some((v) => v.id === variation.id) ? current : [...current, variation],
            );
        };

        const onGameChatRemove = (obj?: { chat_ids?: string[] }) => {
            const ids = obj?.chat_ids;
            if (!ids || ids.length === 0) {
                return;
            }
            const removed = new Set(ids);
            setGameVariations((current) => {
                const next = current.filter((v) => !removed.has(v.id));
                return next.length === current.length ? current : next;
            });
        };

        goban.on("chat", onGameChat);
        goban.on("chat-remove", onGameChatRemove);
        goban.on("chat-reset", rebuildGameVariations);
        rebuildGameVariations();

        return () => {
            goban.off("chat", onGameChat);
            goban.off("chat-remove", onGameChatRemove);
            goban.off("chat-reset", rebuildGameVariations);
        };
    }, [gobans.main, resolvedRoom]);

    React.useEffect(() => {
        setVisibleVariationIds((previous) =>
            previous.filter((variationId) =>
                displayedVariations.some((variation) => variation.id === variationId),
            ),
        );
    }, [displayedVariations]);
    const onPostVariation = React.useCallback(
        (boardController: GobanController, sourceGameId: number | undefined) => {
            if (resolvedRoom) {
                const posted = controller.postVariation(
                    resolvedRoom.id,
                    boardController,
                    sourceGameId,
                );

                const creatorId =
                    typeof currentUser?.id === "number"
                        ? currentUser.id
                        : typeof currentUser?.id === "string"
                          ? Number(currentUser.id)
                          : NaN;

                if (posted && Number.isFinite(creatorId) && posted.game_id != null) {
                    if (isKibitzVariationDebugEnabled()) {
                        logKibitzVariationDebug("kibitz-post-variation:pending-local-state", {
                            pendingId: posted.kibitz_pending_id ?? "",
                            gameId: posted.game_id,
                            creatorId,
                            from: posted.from ?? null,
                            moveCount: posted.moves?.length ?? null,
                            title: posted.name ?? null,
                        });
                    }
                    setPendingPostedVariation({
                        pendingId: posted.kibitz_pending_id ?? "",
                        gameId: posted.game_id,
                        creatorId,
                        from: posted.from,
                        moves: posted.moves,
                        title: posted.name,
                    });
                }
            }
        },
        [controller, currentUser, resolvedRoom],
    );

    React.useEffect(() => {
        if (!pendingPostedVariation) {
            return;
        }

        const postedVariation = displayedVariations.find(
            (variation) => variation.client_pending_id === pendingPostedVariation.pendingId,
        );

        const fallbackVariation = displayedVariations.find(
            (variation) =>
                variation.game_id === pendingPostedVariation.gameId &&
                variation.creator.id === pendingPostedVariation.creatorId &&
                variation.analysis_from === pendingPostedVariation.from &&
                variation.analysis_moves === pendingPostedVariation.moves &&
                variation.title === pendingPostedVariation.title,
        );
        const matchedVariation = postedVariation ?? fallbackVariation;

        if (!matchedVariation) {
            return;
        }

        setPendingPostedVariation(null);
        onOpenVariation(matchedVariation.id, true);
    }, [displayedVariations, onOpenVariation, pendingPostedVariation]);

    const handleDeleteRoom = React.useCallback(async (): Promise<boolean> => {
        if (!resolvedRoom) {
            return false;
        }

        const deleted = await controller.deleteRoom(resolvedRoom.id);
        if (!deleted) {
            return false;
        }

        setPickerMode(null);
        void navigate("/kibitz");
        return true;
    }, [controller, navigate, resolvedRoom]);

    const pickerOverlay = pickerMode ? (
        <KibitzGamePickerOverlay
            mode={pickerMode}
            rooms={rooms}
            currentRoom={resolvedRoom}
            canOpenCreateRoomFlow={canOpenCreateRoomFlow}
            signInHref={createRoomSignInHref}
            onClose={onClosePicker}
            onCreateRoom={async (game, roomName, description) => {
                const nextRoomId = await controller.createRoom(game, roomName, description);
                if (nextRoomId) {
                    setPickerMode(null);
                    void navigate(`/kibitz/${nextRoomId}`);
                }
                return nextRoomId;
            }}
            onChangeBoard={(game) => {
                if (!resolvedRoom) {
                    return false;
                }

                return controller.changeBoard(resolvedRoom.id, game).then((success) => {
                    if (success) {
                        setPickerMode(null);
                    }

                    return success;
                });
            }}
            onJoinRoom={(nextRoomId) => {
                setPickerMode(null);
                void navigate(`/kibitz/${nextRoomId}`);
            }}
            currentGameBaseSnapshot={currentGameBaseSnapshot}
        />
    ) : null;

    const onExitVariation = React.useCallback(() => {
        controller.closeSecondaryPane();
    }, [controller]);

    const onReturnToLive = React.useCallback(() => {
        const main = gobans.main;
        if (!main) {
            return;
        }

        main.gotoLastMove();
        if (main.goban.mode === "analyze") {
            main.goban.setMode("play");
        }
    }, [gobans.main]);

    const roomList = (
        <KibitzRoomList
            rooms={rooms}
            activeRoomId={resolvedRoom?.id ?? ""}
            onSelectRoom={onSelectRoom}
            onCreateRoom={onOpenCreateRoom}
            canOpenCreateRoomFlow={canOpenCreateRoomFlow}
            signInHref={createRoomSignInHref}
            blockedRoomIds={blockedRoomIds}
        />
    );

    if (isBlockedRoom) {
        const blockedTitle = accessBlocked?.room_title ?? selectedRoom?.title ?? roomId ?? "";
        return (
            <div className="Kibitz-empty">
                {showDebug ? <KibitzDebugPanel debug={debug} /> : null}
                <div className="Kibitz-empty-message">
                    <p>{getKibitzBlockedRoomMessage(blockedTitle)}</p>
                    <p>{getKibitzBlockedRoomFollowupMessage()}</p>
                </div>
                <div className="Kibitz-empty-rooms">{roomList}</div>
                {pickerOverlay}
            </div>
        );
    }

    if (!resolvedRoom) {
        return (
            <div className="Kibitz-empty">
                {showDebug ? <KibitzDebugPanel debug={debug} /> : null}
                <div className="Kibitz-empty-message">
                    {rooms.length === 0
                        ? pgettext(
                              "Kibitz placeholder shown when no rooms exist",
                              "Create a Kibitz room to start watching a game with friends.",
                          )
                        : pgettext("Kibitz loading state", "Loading Kibitz...")}
                </div>
                <div className="Kibitz-empty-rooms">{roomList}</div>
                {pickerOverlay}
            </div>
        );
    }

    return (
        <KibitzView
            room={resolvedRoom}
            gobans={gobans}
            isPortrait={isPortrait}
            streamerMode={streamerMode}
            onStreamerModeChange={setStreamerMode}
            banner={
                resolvedRoom.preset?.selection_status === "change_pending" &&
                resolvedRoom.preset.change_effective_at ? (
                    <KibitzPresetChangePendingBanner
                        changeEffectiveAt={resolvedRoom.preset.change_effective_at}
                    />
                ) : undefined
            }
            leftAside={{
                rooms,
                activeRoomId: resolvedRoom.id,
                blockedRoomIds,
                onSelectRoom,
                onCreateRoom: onOpenCreateRoom,
                canOpenCreateRoomFlow,
                signInHref: createRoomSignInHref,
                variations: activePostedVariations,
                currentGameId: resolvedRoom.current_game?.game_id ?? null,
                variationGameById,
                selectedVariationId: secondaryPane.variation_id ?? null,
                variationFocusRequestId,
                variationColorIndexes,
                blockedVariationFlashId,
                onRecallVariation: (variationId) => onOpenVariation(variationId, true),
                onHideVariation: onToggleVariation,
                onCreateVariation,
                miniBoardController: null,
                onExitVariation,
                roomListHelpTargetId: KIBITZ_HELP_TARGETS.desktopRoomList,
                variationListHelpTargetId: KIBITZ_HELP_TARGETS.desktopVariationList,
            }}
            chat={{
                room: resolvedRoom,
                items: stream,
                variations: displayedVariations,
                onOpenVariation,
            }}
            proposals={{
                activeProposal,
                queuedProposals: queuedRoomProposals,
                onVote: onVoteProposal,
            }}
            onPostVariation={(boardController) =>
                onPostVariation(boardController, secondaryPane.variation_source_game_id)
            }
            onBranchFromVariation={onBranchFromVariation}
            onExitVariation={onExitVariation}
            onReturnToLive={onReturnToLive}
            roomSettings={{
                canEditRoom: canManageRoom,
                canDeleteRoom: permissions.can_delete_room,
                onChangeBoard: handleOpenChangeBoard,
                onSaveRoomDetails: async (title, description) =>
                    controller.updateRoomDetails(resolvedRoom.id, title, description),
                onDeleteRoom: handleDeleteRoom,
            }}
        >
            {showDebug ? <KibitzDebugPanel debug={debug} /> : null}
            {pickerOverlay}
        </KibitzView>
    );
}
