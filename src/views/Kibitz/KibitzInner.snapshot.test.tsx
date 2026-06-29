/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* cspell:ignore refetches */

import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { KibitzController } from "./KibitzController";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";
import type { KibitzRoom, KibitzRoomSummary, KibitzWatchedGame } from "@/models/kibitz";
import {
    GobanController as GobanControllerClass,
    getMoveTreeTrunkTail,
    type GobanController as GobanBoardController,
} from "@/lib/GobanController";
import {
    applyVisibleMainBoardHydrationReport,
    createVisibleMainBoardHydrationState,
    fetchCurrentGameBaseSnapshot,
    isCurrentGameBaseSnapshotUsable,
    isVisibleMainBoardMounted,
    KibitzInner,
} from "./KibitzInner";
import { captureCurrentGameBaseSnapshotFromController } from "./kibitzCurrentGameBaseSnapshot";
import { logKibitzVariationDebug } from "./kibitzVariationDebug";
import { get } from "@/lib/requests";

const mockedUseNavigate = jest.fn();
const mockedUseParams = jest.fn(() => ({ roomId: "room-1" }));
let kibitzRoomStageMode: "none" | "main" | "compare" = "none";

const mobileMainBoardController = {
    goban: {
        parent: document.body,
        chat_log: [],
        game_id: 1,
        engine: {
            move_tree: {
                move_number: 12,
            },
            config: {},
            playerToMove: () => 1,
            computeScore: () => ({
                black: { prisoners: 24 },
                white: { prisoners: 26 },
            }),
            phase: "play",
            outcome: "",
            winner: "black",
        },
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
    },
} as unknown as GobanBoardController;

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: () => null,
}));

jest.mock("@/components/Player/PlayerDetails", () => ({
    __esModule: true,
    PlayerDetails: () => null,
}));

jest.mock("./KibitzProposalBar", () => ({
    __esModule: true,
    KibitzProposalBar: () => null,
}));

jest.mock("./KibitzProposalQueue", () => ({
    __esModule: true,
    KibitzProposalQueue: () => null,
}));

jest.mock("./KibitzDebugPanel", () => ({
    __esModule: true,
    KibitzDebugPanel: () => null,
}));

jest.mock("./KibitzRoomList", () => ({
    __esModule: true,
    KibitzRoomList: () => null,
}));

jest.mock("./KibitzRoomStage", () => ({
    __esModule: true,
    KibitzRoomStage: (props: {
        room: KibitzRoomSummary;
        onMainBoardControllerChange?: (controller: GobanBoardController | null) => void;
        onMainBoardHydrationChange?: (state: {
            roomId: string;
            gameId: number | null;
            officialTailMoveNumber: number;
            expectedMoveNumber: number;
            hasMoveTree: boolean;
            hydrated: boolean;
        }) => void;
        onSelectMobileCompanionPanel?: (panel: "chat" | "vote" | "compare") => void;
    }) => {
        React.useEffect(() => {
            const currentGame = props.room.current_game;
            if (!currentGame) {
                return;
            }
            const moveNumber = currentGame.move_number ?? 0;

            if (kibitzRoomStageMode === "main") {
                props.onMainBoardControllerChange?.(mobileMainBoardController);
                props.onMainBoardHydrationChange?.({
                    roomId: props.room.id,
                    gameId: currentGame.game_id,
                    officialTailMoveNumber: moveNumber,
                    expectedMoveNumber: moveNumber,
                    hasMoveTree: true,
                    hydrated: true,
                });
                return;
            }

            if (kibitzRoomStageMode === "compare") {
                props.onMainBoardControllerChange?.(mobileMainBoardController);
                props.onMainBoardHydrationChange?.({
                    roomId: props.room.id,
                    gameId: currentGame.game_id,
                    officialTailMoveNumber: moveNumber,
                    expectedMoveNumber: moveNumber,
                    hasMoveTree: true,
                    hydrated: true,
                });
                props.onSelectMobileCompanionPanel?.("compare");
            }
        }, [props]);

        return null;
    },
}));

jest.mock("./KibitzMobileMainGameScoreboard", () => ({
    __esModule: true,
    KibitzMobileMainGameScoreboard: ({ isMainBoardVisible }: { isMainBoardVisible: boolean }) =>
        isMainBoardVisible ? <div data-testid="mobile-scoreboard" /> : null,
}));

jest.mock("./KibitzSharedStreamPanel", () => ({
    __esModule: true,
    KibitzSharedStreamPanel: () => null,
}));

jest.mock("./KibitzPresence", () => ({
    __esModule: true,
    KibitzPresence: () => null,
}));

jest.mock("./KibitzPresencePanel", () => ({
    __esModule: true,
    KibitzPresencePanel: () => null,
}));

jest.mock("./KibitzPresetChangePendingBanner", () => ({
    __esModule: true,
    KibitzPresetChangePendingBanner: () => null,
}));

jest.mock("./KibitzVariationList", () => ({
    __esModule: true,
    KibitzVariationList: () => null,
}));

jest.mock("./KibitzMobileComparePanel", () => ({
    __esModule: true,
    KibitzMobileComparePanel: () => null,
}));

jest.mock("./KibitzGamePickerOverlay", () => ({
    __esModule: true,
    KibitzGamePickerOverlay: () => null,
}));

jest.mock("./KibitzMobileGamePicker", () => ({
    __esModule: true,
    KibitzMobileGamePicker: () => null,
}));

jest.mock("./KibitzRoomSettingsPopover", () => ({
    __esModule: true,
    KibitzRoomSettingsPopover: () => null,
}));

jest.mock("./KibitzUserAvatar", () => ({
    __esModule: true,
    KibitzUserAvatar: () => null,
}));

jest.mock("./useCurrentKibitzUser", () => ({
    __esModule: true,
    useCurrentKibitzUser: () => ({
        id: 1,
        username: "tester",
        ranking: 0,
        professional: false,
        ui_class: "",
    }),
}));

jest.mock("./useKibitzCurrentGameConnectionKeeper", () => ({
    __esModule: true,
    useKibitzCurrentGameConnectionKeeper: () => undefined,
}));

jest.mock("./useKibitzCurrentGameBaseBroker", () => ({
    __esModule: true,
    useKibitzCurrentGameBaseBroker: () => undefined,
}));

jest.mock("./HelpFlows/useKibitzHelpTriggers", () => ({
    __esModule: true,
    useKibitzHelpTriggers: () => ({
        noteDesktopVariationMadeVisible: jest.fn(),
        noteDraftStartedFromPostedVariation: jest.fn(),
        noteMobileVariationsPanelOpened: jest.fn(),
        notePostedVariationOpened: jest.fn(),
    }),
}));

jest.mock("./HelpFlows/useKibitzHelpTarget", () => ({
    __esModule: true,
    useKibitzHelpTarget: () => null,
}));

jest.mock("./kibitzAnalysisPolicy", () => ({
    __esModule: true,
    getKibitzAccessPolicyForUser: () => ({ allowed: true as const }),
    isKibitzAccessBlockedForUser: () => false,
    isLoggedInKibitzUser: () => true,
}));

jest.mock("./kibitzAnalysisPolicyText", () => ({
    __esModule: true,
    getKibitzBlockedRoomFollowupMessage: () => "followup",
    getKibitzBlockedRoomMessage: () => "blocked",
}));

jest.mock("./kibitzVariationQuickList", () => ({
    __esModule: true,
    getVisiblePostedVariations: () => [],
}));

jest.mock("./kibitzVariationDebug", () => ({
    __esModule: true,
    isKibitzVariationDebugEnabled: () => false,
    logKibitzVariationDebug: jest.fn(),
    summarizeKibitzMoveTreeNode: () => "",
}));

jest.mock("@/lib/requests", () => ({
    __esModule: true,
    get: jest.fn(),
}));

jest.mock("@/lib/GobanController", () => ({
    __esModule: true,
    GobanController: jest.fn((config: { board_div?: HTMLElement }) => ({
        destroy: jest.fn(),
        goban: {
            parent: config.board_div ?? document.createElement("div"),
            engine: {
                move_tree: {
                    move_number: 0,
                },
                config: {},
            },
        },
    })),
    getMoveTreeTrunkTail: jest.fn(() => ({ move_number: 0 })),
}));

jest.mock("./kibitzCurrentGameBaseSnapshot", () => ({
    __esModule: true,
    captureCurrentGameBaseSnapshotFromController: jest.fn(
        (
            _controller: unknown,
            game: KibitzWatchedGame,
            roomId: string | null | undefined,
            source: KibitzCurrentGameBaseSnapshot["source"],
            expectedMoveNumber?: number,
        ): KibitzCurrentGameBaseSnapshot => {
            const tailMoveNumber = expectedMoveNumber ?? game.move_number ?? 0;

            return {
                gameId: game.game_id,
                roomId: roomId ?? null,
                trunkTailMoveNumber: tailMoveNumber,
                moveTreeId: 1,
                movePath: "aa",
                source,
                config: {
                    game_id: game.game_id,
                    moves: [],
                    move_tree: undefined,
                },
            };
        },
    ),
    chooseFresherCurrentGameBaseSnapshot: (
        previous: KibitzCurrentGameBaseSnapshot | null,
        next: KibitzCurrentGameBaseSnapshot,
    ) => {
        if (!previous) {
            return next;
        }

        return previous.gameId === next.gameId &&
            previous.trunkTailMoveNumber >= next.trunkTailMoveNumber
            ? previous
            : next;
    },
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    _: (text: string) => text,
    interpolate: (template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
    pgettext: (_context: string, text: string) => text,
    current_language: "en",
    moment: {
        duration: (_value: number, _unit: string) => ({
            humanize: () => "time",
        }),
    },
}));

jest.mock("@/lib/popover", () => ({
    __esModule: true,
    popover: jest.fn(),
}));

jest.mock("@/lib/toast", () => ({
    __esModule: true,
    toast: {
        error: jest.fn(),
    },
}));

jest.mock("react-router-dom", () => ({
    __esModule: true,
    useLocation: () => ({
        pathname: "/kibitz/room-1",
        search: "",
        hash: "",
        state: null,
        key: "test",
    }),
    useNavigate: () => mockedUseNavigate,
    useParams: () => mockedUseParams(),
}));

const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedGobanController = GobanControllerClass as jest.MockedClass<typeof GobanControllerClass>;
const mockedCaptureCurrentGameBaseSnapshotFromController =
    captureCurrentGameBaseSnapshotFromController as jest.MockedFunction<
        typeof captureCurrentGameBaseSnapshotFromController
    >;
const mockedLogKibitzVariationDebug = logKibitzVariationDebug as jest.MockedFunction<
    typeof logKibitzVariationDebug
>;

function installMatchMedia(matches = false): void {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation(() => ({
            matches,
            media: "",
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
}

function getTemporaryBoardCount(): number {
    return document.body.querySelectorAll('div[aria-hidden="true"]').length;
}

function makeUser(id: number, username: string) {
    return {
        id,
        username,
        ranking: 0,
        professional: false,
        ui_class: "",
    };
}

function makeGame(gameId: number, moveNumber: number): KibitzWatchedGame {
    return {
        game_id: gameId,
        board_size: "19x19",
        title: `Game ${gameId}`,
        move_number: moveNumber,
        live: true,
        analysis_disabled: false,
        black: makeUser(gameId * 10 + 1, "black"),
        white: makeUser(gameId * 10 + 2, "white"),
    };
}

function makeRoom(
    overrides: Partial<KibitzRoomSummary> & { current_game: KibitzWatchedGame },
): KibitzRoom {
    return {
        id: "room-1",
        channel: "channel-1",
        title: "Room 1",
        kind: "preset",
        viewer_count: 1,
        creator_id: 1,
        users: [],
        active_chatters: [],
        friends_in_room: [],
        active_variation_ids: [],
        ...overrides,
    };
}

function makeController(initialRoom: KibitzRoomSummary): KibitzController {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    const controller = {
        rooms: [initialRoom],
        active_room: initialRoom,
        stream: [],
        proposals: [],
        variations: [],
        secondary_pane: {
            collapsed: true,
            size: "small",
        },
        debug: {},
        permissions: {
            can_edit_room: false,
        },
        access_blocked: null,
        goban: {
            parent: document.createElement("div"),
            engine: {
                move_tree: null,
                config: {},
            },
        },
        on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
            const current = listeners.get(event) ?? new Set<(...args: unknown[]) => void>();
            current.add(handler);
            listeners.set(event, current);
        }),
        off: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
            listeners.get(event)?.delete(handler);
        }),
        refreshRoomDirectory: jest.fn(),
        setAccessBlocked: jest.fn(),
        selectRoom: jest.fn(),
        getRoomUsers: jest.fn(() => []),
        ensureGamesCached: jest.fn(),
        getCachedGame: jest.fn(),
        openVariation: jest.fn(),
        clearPreviewGame: jest.fn(),
        startVariationFromCurrentBoard: jest.fn(),
        startVariationFromPostedVariation: jest.fn(),
        postVariation: jest.fn(),
        deleteRoom: jest.fn(),
        changeBoard: jest.fn(),
        createRoom: jest.fn(),
        updateRoomDetails: jest.fn(),
        voteOnProposal: jest.fn(),
        setSecondaryPaneMode: jest.fn(),
    } as unknown as KibitzController;

    return Object.assign(controller, {
        emit(event: string, ...args: unknown[]) {
            for (const handler of listeners.get(event) ?? []) {
                handler(...args);
            }
        },
    }) as KibitzController & {
        emit: (event: string, ...args: unknown[]) => void;
    };
}

function makeSnapshotController(destroy: () => void = jest.fn()): GobanBoardController {
    return {
        destroy,
        goban: {
            parent: document.createElement("div"),
            engine: {
                move_tree: {
                    move_number: 0,
                },
                config: {},
            },
        },
    } as unknown as GobanBoardController;
}

describe("KibitzInner current-game base snapshot fetch", () => {
    describe("isCurrentGameBaseSnapshotUsable", () => {
        it("rejects snapshots from a different room even when the game matches", () => {
            const snapshot = {
                gameId: 1,
                roomId: "room-1",
                trunkTailMoveNumber: 10,
                moveTreeId: 1,
                movePath: "aa",
                source: "game-details",
                config: {
                    game_id: 1,
                    moves: [],
                    move_tree: undefined,
                },
            } as KibitzCurrentGameBaseSnapshot;

            expect(isCurrentGameBaseSnapshotUsable(snapshot, makeGame(1, 10), "room-1")).toBe(true);
            expect(isCurrentGameBaseSnapshotUsable(snapshot, makeGame(1, 10), "room-2")).toBe(
                false,
            );
        });
    });

    beforeEach(() => {
        mockedGet.mockReset();
        mockedGobanController.mockClear();
        mockedCaptureCurrentGameBaseSnapshotFromController.mockClear();
        mockedLogKibitzVariationDebug.mockClear();
        installMatchMedia(false);
    });

    it("removes the temporary board div if the controller constructor throws", async () => {
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: Array.from({ length: 10 }, () => ({ x: 0, y: 0 })),
                private: false,
                disable_analysis: false,
            },
        });

        const constructorError = new Error("constructor failed");
        mockedGobanController.mockImplementationOnce(() => {
            throw constructorError;
        });

        await expect(fetchCurrentGameBaseSnapshot(makeGame(1, 10), "room-1")).rejects.toBe(
            constructorError,
        );

        expect(getTemporaryBoardCount()).toBe(0);
    });

    it("destroys the temporary controller and removes the board div on success", async () => {
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: Array.from({ length: 10 }, () => ({ x: 0, y: 0 })),
                private: false,
                disable_analysis: false,
            },
        });

        const destroy = jest.fn();
        mockedGobanController.mockImplementationOnce(() => makeSnapshotController(destroy));

        const snapshot = await fetchCurrentGameBaseSnapshot(makeGame(1, 10), "room-1");

        expect(snapshot).toEqual(
            expect.objectContaining({
                gameId: 1,
                roomId: "room-1",
                trunkTailMoveNumber: 10,
                source: "game-details",
                fetchedMoveCount: 10,
            }),
        );
        expect(destroy).toHaveBeenCalledTimes(1);
        expect(getTemporaryBoardCount()).toBe(0);
    });

    it("removes the temporary board div if snapshot extraction throws", async () => {
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: Array.from({ length: 10 }, () => ({ x: 0, y: 0 })),
                private: false,
                disable_analysis: false,
            },
        });

        const extractionError = new Error("snapshot extraction failed");
        mockedCaptureCurrentGameBaseSnapshotFromController.mockImplementationOnce(() => {
            throw extractionError;
        });

        const destroy = jest.fn();
        mockedGobanController.mockImplementationOnce(() => makeSnapshotController(destroy));

        await expect(fetchCurrentGameBaseSnapshot(makeGame(1, 10), "room-1")).rejects.toBe(
            extractionError,
        );

        expect(destroy).toHaveBeenCalledTimes(1);
        expect(getTemporaryBoardCount()).toBe(0);
    });

    it("logs cleanup failures without masking a successful snapshot fetch", async () => {
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: Array.from({ length: 10 }, () => ({ x: 0, y: 0 })),
                private: false,
                disable_analysis: false,
            },
        });

        const cleanupError = new Error("destroy failed");
        mockedGobanController.mockImplementationOnce(() =>
            makeSnapshotController(() => {
                throw cleanupError;
            }),
        );

        const snapshot = await fetchCurrentGameBaseSnapshot(makeGame(1, 10), "room-1");

        expect(snapshot).toEqual(
            expect.objectContaining({
                gameId: 1,
                roomId: "room-1",
                trunkTailMoveNumber: 10,
                source: "game-details",
                fetchedMoveCount: 10,
            }),
        );
        expect(mockedLogKibitzVariationDebug).toHaveBeenCalledWith(
            "current-game-base-snapshot:cleanup-error",
            expect.objectContaining({
                gameId: 1,
                roomId: "room-1",
                error: cleanupError,
            }),
        );
        expect(getTemporaryBoardCount()).toBe(0);
    });

    it("does not refetch when only viewer count changes", async () => {
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: Array.from({ length: 10 }, () => ({ x: 0, y: 0 })),
                private: false,
                disable_analysis: false,
            },
        });

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));

        render(<KibitzInner controller={controller} />);

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalledTimes(1);
            expect(mockedGet).toHaveBeenCalledWith("games/1");
        });

        act(() => {
            const mutableController = controller as unknown as {
                active_room: KibitzRoom;
            };
            mutableController.active_room = makeRoom({
                viewer_count: 2,
                current_game: makeGame(1, 10),
            });
            controller.emit("room-changed", mutableController.active_room);
        });

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalledTimes(1);
        });
    });

    it("refetches when the room changes but the watched game stays the same", async () => {
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: Array.from({ length: 10 }, () => ({ x: 0, y: 0 })),
                private: false,
                disable_analysis: false,
            },
        });

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));

        render(<KibitzInner controller={controller} />);

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalledTimes(1);
            expect(mockedGet).toHaveBeenCalledWith("games/1");
        });

        act(() => {
            const mutableController = controller as unknown as {
                active_room: KibitzRoom;
            };
            mutableController.active_room = makeRoom({
                id: "room-2",
                channel: "channel-2",
                current_game: makeGame(1, 10),
            });
            controller.emit("room-changed", mutableController.active_room);
        });

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalledTimes(2);
            expect(mockedGet).toHaveBeenNthCalledWith(2, "games/1");
        });
    });

    it("skips refetch when the existing current-game snapshot is already fresh enough", async () => {
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: Array.from({ length: 121 }, () => ({ x: 0, y: 0 })),
                private: false,
                disable_analysis: false,
            },
        });

        const controller = makeController(makeRoom({ current_game: makeGame(1, 120) }));

        render(<KibitzInner controller={controller} />);

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalledTimes(1);
            expect(mockedGet).toHaveBeenCalledWith("games/1");
        });

        act(() => {
            const mutableController = controller as unknown as {
                active_room: KibitzRoom;
            };
            mutableController.active_room = makeRoom({
                current_game: makeGame(1, 121),
            });
            controller.emit("room-changed", mutableController.active_room);
        });

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalledTimes(1);
        });
    });

    it("refetches when the watched game changes", async () => {
        mockedGet.mockImplementation(async (path: string) => {
            const gameId = Number(path.split("/")[1]);

            return {
                id: gameId,
                width: 19,
                height: 19,
                name: `Game ${gameId}`,
                ended: false,
                players: {
                    black: makeUser(gameId * 10 + 1, "black"),
                    white: makeUser(gameId * 10 + 2, "white"),
                },
                gamedata: {
                    moves: Array.from({ length: 10 }, () => ({ x: 0, y: 0 })),
                    private: false,
                    disable_analysis: false,
                },
            };
        });

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));

        render(<KibitzInner controller={controller} />);

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalledTimes(1);
            expect(mockedGet).toHaveBeenCalledWith("games/1");
        });

        act(() => {
            const mutableController = controller as unknown as {
                active_room: KibitzRoom;
            };
            mutableController.active_room = makeRoom({
                viewer_count: 2,
                current_game: makeGame(2, 10),
            });
            controller.emit("room-changed", mutableController.active_room);
        });

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalledTimes(2);
            expect(mockedGet).toHaveBeenNthCalledWith(2, "games/2");
        });
    });
});

describe("KibitzInner mobile scoreboard integration", () => {
    beforeEach(() => {
        mockedGet.mockReset();
        mockedUseNavigate.mockReset();
        mockedUseParams.mockReturnValue({ roomId: "room-1" });
        installMatchMedia(true);
        kibitzRoomStageMode = "none";
    });

    function mockResolvedGame(): void {
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: Array.from({ length: 10 }, () => ({ x: 0, y: 0 })),
                private: false,
                disable_analysis: false,
            },
        });
    }

    it("renders the mobile scoreboard when the main board is visible", async () => {
        kibitzRoomStageMode = "main";
        mockResolvedGame();

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));
        render(<KibitzInner controller={controller} />);

        await waitFor(() => {
            expect(screen.getByTestId("mobile-scoreboard")).toBeInTheDocument();
        });
    });

    it("does not render the mobile scoreboard for variation, preview, or draft states", async () => {
        kibitzRoomStageMode = "compare";
        mockResolvedGame();

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));
        render(<KibitzInner controller={controller} />);

        await waitFor(() => {
            expect(screen.queryByTestId("mobile-scoreboard")).toBeNull();
        });
    });

    it("does not render the mobile scoreboard on desktop", async () => {
        installMatchMedia(false);
        kibitzRoomStageMode = "main";
        mockResolvedGame();

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));
        render(<KibitzInner controller={controller} />);

        await waitFor(() => {
            expect(screen.queryByTestId("mobile-scoreboard")).toBeNull();
        });
    });
});

describe("KibitzInner streamer mode", () => {
    const STREAMER_MODE_STORAGE_KEY = "kibitz.desktop.streamer_mode";
    const DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY = "kibitz.desktop.sidebar_width_px";

    beforeEach(() => {
        mockedGet.mockReset();
        mockedUseNavigate.mockReset();
        mockedUseParams.mockReturnValue({ roomId: "room-1" });
        installMatchMedia(false);
        window.sessionStorage.clear();
        window.localStorage.removeItem(DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY);
        document.body.classList.remove("kibitz-streamer-mode");
    });

    afterEach(() => {
        document.body.classList.remove("kibitz-streamer-mode");
        window.sessionStorage.clear();
        window.localStorage.removeItem(DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY);
        mockedUseParams.mockReturnValue({ roomId: "room-1" });
    });

    it("applies the streamer class on desktop when a room is resolved", async () => {
        window.sessionStorage.setItem(STREAMER_MODE_STORAGE_KEY, "true");
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: [],
                private: false,
                disable_analysis: false,
            },
        });

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));
        const { container, unmount } = render(<KibitzInner controller={controller} />);

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalledWith("games/1");
        });

        expect(container.querySelector(".Kibitz")).toHaveClass("is-streamer-mode");
        expect(document.body).toHaveClass("kibitz-streamer-mode");

        unmount();

        expect(document.body).not.toHaveClass("kibitz-streamer-mode");
    });

    it("turns streamer mode off on mobile", async () => {
        installMatchMedia(true);
        window.sessionStorage.setItem(STREAMER_MODE_STORAGE_KEY, "true");
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: [],
                private: false,
                disable_analysis: false,
            },
        });

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));
        const { container } = render(<KibitzInner controller={controller} />);

        await waitFor(() => {
            expect(window.sessionStorage.getItem(STREAMER_MODE_STORAGE_KEY)).toBe("false");
        });

        expect(container.querySelector(".Kibitz")).not.toHaveClass("is-streamer-mode");
        expect(document.body).not.toHaveClass("kibitz-streamer-mode");
    });

    it("does not apply streamer mode when no room is resolved", () => {
        mockedUseParams.mockReturnValue({} as never);
        window.sessionStorage.setItem(STREAMER_MODE_STORAGE_KEY, "true");

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));
        const mutableController = controller as unknown as {
            rooms: KibitzRoom[];
            active_room: KibitzRoom | null;
        };
        mutableController.rooms = [];
        mutableController.active_room = null;

        const { container } = render(<KibitzInner controller={controller} />);

        expect(container.querySelector(".Kibitz")).not.toHaveClass("is-streamer-mode");
        expect(document.body).not.toHaveClass("kibitz-streamer-mode");
    });

    it("does not apply streamer mode on blocked rooms", () => {
        window.sessionStorage.setItem(STREAMER_MODE_STORAGE_KEY, "true");

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));
        const mutableController = controller as unknown as {
            access_blocked: { room_id: string; room_title: string } | null;
        };
        mutableController.access_blocked = {
            room_id: "room-1",
            room_title: "Room 1",
        };

        const { container } = render(<KibitzInner controller={controller} />);

        expect(container.querySelector(".Kibitz")).not.toHaveClass("is-streamer-mode");
        expect(document.body).not.toHaveClass("kibitz-streamer-mode");
    });

    it("preserves the saved desktop sidebar width while streamer mode is enabled", async () => {
        window.sessionStorage.setItem(STREAMER_MODE_STORAGE_KEY, "true");
        window.localStorage.setItem(DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY, "420");
        mockedGet.mockResolvedValue({
            id: 1,
            width: 19,
            height: 19,
            name: "Game 1",
            ended: false,
            players: {
                black: makeUser(11, "black"),
                white: makeUser(12, "white"),
            },
            gamedata: {
                moves: [],
                private: false,
                disable_analysis: false,
            },
        });

        const controller = makeController(makeRoom({ current_game: makeGame(1, 10) }));
        const { unmount } = render(<KibitzInner controller={controller} />);

        await waitFor(() => {
            expect(mockedGet).toHaveBeenCalledWith("games/1");
        });

        expect(window.localStorage.getItem(DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY)).toBe("420");

        unmount();

        expect(window.localStorage.getItem(DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY)).toBe("420");
    });
});

describe("visible main board hydration", () => {
    beforeEach(() => {
        (getMoveTreeTrunkTail as jest.MockedFunction<typeof getMoveTreeTrunkTail>).mockClear();
    });

    it("uses cached hydration without walking the move tree", () => {
        const getMoveTreeTrunkTailMock = getMoveTreeTrunkTail as jest.MockedFunction<
            typeof getMoveTreeTrunkTail
        >;
        const visibleMainBoardHydration = applyVisibleMainBoardHydrationReport(
            createVisibleMainBoardHydrationState({
                roomId: "room-1",
                gameId: 1,
                expectedMoveNumber: 126,
            }),
            {
                roomId: "room-1",
                gameId: 1,
                officialTailMoveNumber: 126,
                expectedMoveNumber: 126,
                hasMoveTree: true,
                hydrated: true,
            },
            "room-1",
            1,
        );

        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController: {} as unknown as GobanBoardController,
                isCurrentMainBoardController: true,
                visibleMainBoardHydration,
                roomId: "room-1",
                gameId: 1,
                currentExpectedMoveNumber: 126,
                isCurrentGameLive: false,
            }),
        ).toBe(true);
        expect(getMoveTreeTrunkTailMock).not.toHaveBeenCalled();
    });

    it("keeps the broker active until the main board hydrates", () => {
        const visibleMainBoardHydration = createVisibleMainBoardHydrationState({
            roomId: "room-1",
            gameId: 1,
            expectedMoveNumber: 126,
        });

        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController: {} as unknown as GobanBoardController,
                isCurrentMainBoardController: true,
                visibleMainBoardHydration,
                roomId: "room-1",
                gameId: 1,
                currentExpectedMoveNumber: 126,
                isCurrentGameLive: false,
            }),
        ).toBe(false);
    });

    it("marks the board hydrated when the official tail reaches the expected move", () => {
        const initial = createVisibleMainBoardHydrationState({
            roomId: "room-1",
            gameId: 1,
            expectedMoveNumber: 126,
        });
        const hydrated = applyVisibleMainBoardHydrationReport(
            initial,
            {
                roomId: "room-1",
                gameId: 1,
                officialTailMoveNumber: 126,
                expectedMoveNumber: 126,
                hasMoveTree: true,
                hydrated: true,
            },
            "room-1",
            1,
        );

        expect(hydrated.hydrated).toBe(true);
        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController: {} as unknown as GobanBoardController,
                isCurrentMainBoardController: true,
                visibleMainBoardHydration: hydrated,
                roomId: "room-1",
                gameId: 1,
                currentExpectedMoveNumber: 126,
                isCurrentGameLive: false,
            }),
        ).toBe(true);
    });

    it("ignores stale hydration reports for another room or game", () => {
        const previous = createVisibleMainBoardHydrationState({
            roomId: "room-2",
            gameId: 2,
            expectedMoveNumber: 126,
        });
        const next = applyVisibleMainBoardHydrationReport(
            previous,
            {
                roomId: "room-1",
                gameId: 1,
                officialTailMoveNumber: 126,
                expectedMoveNumber: 126,
                hasMoveTree: true,
                hydrated: true,
            },
            "room-2",
            2,
        );

        expect(next).toBe(previous);
        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController: {} as unknown as GobanBoardController,
                isCurrentMainBoardController: true,
                visibleMainBoardHydration: next,
                roomId: "room-2",
                gameId: 2,
                currentExpectedMoveNumber: 126,
                isCurrentGameLive: false,
            }),
        ).toBe(false);
    });

    it("hydrates move-0 games when a move tree exists", () => {
        const initial = createVisibleMainBoardHydrationState({
            roomId: "room-1",
            gameId: 1,
            expectedMoveNumber: 0,
        });
        const hydrated = applyVisibleMainBoardHydrationReport(
            initial,
            {
                roomId: "room-1",
                gameId: 1,
                officialTailMoveNumber: 0,
                expectedMoveNumber: 0,
                hasMoveTree: true,
                hydrated: true,
            },
            "room-1",
            1,
        );

        expect(hydrated.hydrated).toBe(true);
        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController: {} as unknown as GobanBoardController,
                isCurrentMainBoardController: true,
                visibleMainBoardHydration: hydrated,
                roomId: "room-1",
                gameId: 1,
                currentExpectedMoveNumber: 0,
                isCurrentGameLive: false,
            }),
        ).toBe(true);
    });

    it("does not treat stale same-game hydration as mounted after the room move advances", () => {
        const hydration = {
            ...createVisibleMainBoardHydrationState({
                roomId: "room-1",
                gameId: 1,
                expectedMoveNumber: 120,
            }),
            officialTailMoveNumber: 120,
            hasMoveTree: true,
            hydrated: true,
        };

        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController: {} as unknown as GobanBoardController,
                isCurrentMainBoardController: true,
                visibleMainBoardHydration: hydration,
                roomId: "room-1",
                gameId: 1,
                currentExpectedMoveNumber: 121,
                isCurrentGameLive: false,
            }),
        ).toBe(false);
    });

    it("resets hydration state when the controller is cleared", () => {
        const hydrated = {
            ...createVisibleMainBoardHydrationState({
                roomId: "room-1",
                gameId: 1,
                expectedMoveNumber: 126,
            }),
            officialTailMoveNumber: 126,
            hasMoveTree: true,
            hydrated: true,
        };
        const reset = createVisibleMainBoardHydrationState({
            roomId: "room-1",
            gameId: 1,
            expectedMoveNumber: 126,
        });

        expect(hydrated.hydrated).toBe(true);
        expect(reset.hydrated).toBe(false);
        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController: null,
                isCurrentMainBoardController: false,
                visibleMainBoardHydration: reset,
                roomId: "room-1",
                gameId: 1,
                currentExpectedMoveNumber: 126,
                isCurrentGameLive: false,
            }),
        ).toBe(false);
    });
});
