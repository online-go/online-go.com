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
import type { GobanRendererConfig, MoveTree } from "goban";
import { GobanController, getMoveTreeTrunkTail } from "@/lib/GobanController";
import * as preferences from "@/lib/preferences";
import type {
    KibitzSecondaryPaneState,
    KibitzVariationSummary,
    KibitzWatchedGame,
} from "@/models/kibitz";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";
import {
    captureCurrentGameBaseSnapshotFromController,
    restoreMainBoardToOfficialTail,
} from "./kibitzCurrentGameBaseSnapshot";
import { applyKibitzVariationToController } from "./kibitzVariationTree";

export type KibitzCenterMode = "main" | "draft" | "variation" | "preview";

export interface KibitzGobans {
    /** The live game controller. The consumer is responsible for keeping
     *  its board div mounted in the DOM; this hook does not mount it. */
    main: GobanController | null;
    /** Draft, posted variation, or preview controller. Null when the center
     *  shows the main game. */
    secondary: GobanController | null;
    /** Whichever controller GobanView should render in the center. */
    center: GobanController | null;
    centerMode: KibitzCenterMode;
    /** The game whose players and clocks the player bars show: the live
     *  game while the center shows a draft or variation of it, the center
     *  board otherwise (a preview or a variation of another game). */
    playerBars: GobanController | null;
    /** True while the draft in the center has moves that have not been
     *  posted yet. Always false outside draft mode. */
    isDraftDirty: () => boolean;
}

export interface UseKibitzGobansOptions {
    roomId: string | null;
    currentGame: KibitzWatchedGame | null | undefined;
    secondaryPane: KibitzSecondaryPaneState;
    variations: readonly KibitzVariationSummary[];
    visibleVariationIds: readonly string[];
    variationColorIndexes: Record<string, number>;
    variationGameById: ReadonlyMap<number, KibitzWatchedGame>;
    onMainSnapshot?: (snapshot: KibitzCurrentGameBaseSnapshot) => void;
}

export function deriveKibitzCenterMode(pane: KibitzSecondaryPaneState): KibitzCenterMode {
    if (pane.collapsed) {
        return "main";
    }
    if (pane.variation_source_game_id != null) {
        return "draft";
    }
    if (pane.variation_id) {
        return "variation";
    }
    if (pane.preview_game_id != null) {
        return "preview";
    }
    return "main";
}

export function parseKibitzBoardDimensions(game: KibitzWatchedGame | null | undefined): {
    width: number;
    height: number;
} {
    const boardSize = game?.board_size;
    if (!boardSize) {
        return { width: 19, height: 19 };
    }
    const [width, height] = boardSize.split("x").map(Number);
    if (Number.isFinite(width) && Number.isFinite(height)) {
        return { width, height };
    }
    return { width: 19, height: 19 };
}

function labelConfig(): Pick<
    GobanRendererConfig,
    "draw_top_labels" | "draw_left_labels" | "draw_right_labels" | "draw_bottom_labels"
> {
    const position = preferences.get("label-positioning");
    return {
        draw_top_labels: position === "all" || position.indexOf("top") >= 0,
        draw_left_labels: position === "all" || position.indexOf("left") >= 0,
        draw_right_labels: position === "all" || position.indexOf("right") >= 0,
        draw_bottom_labels: position === "all" || position.indexOf("bottom") >= 0,
    };
}

function baseConfig(game: KibitzWatchedGame | null | undefined): GobanRendererConfig {
    const { width, height } = parseKibitzBoardDimensions(game);
    return {
        square_size: "auto",
        width,
        height,
        variation_stone_opacity: preferences.get("variation-stone-opacity"),
        last_move_opacity: preferences.get("last-move-opacity"),
        stone_font_scale: preferences.get("stone-font-scale"),
        ...labelConfig(),
    };
}

/** The game id the secondary board should show, given the center mode and
 *  the pane state that selects it. `null` when nothing is selected yet. */
function computeSecondaryTargetGameId(
    mode: KibitzCenterMode,
    pane: KibitzSecondaryPaneState,
    variations: readonly KibitzVariationSummary[],
): number | null {
    if (mode === "preview") {
        return pane.preview_game_id ?? null;
    }
    if (mode === "variation") {
        return variations.find((v) => v.id === pane.variation_id)?.game_id ?? null;
    }
    if (mode === "draft") {
        return pane.variation_source_game_id ?? null;
    }
    return null;
}

function countMoveTreeNodes(root: MoveTree | null | undefined): number {
    let count = 0;
    const stack: MoveTree[] = root ? [root] : [];
    while (stack.length > 0) {
        const node = stack.pop() as MoveTree;
        count += 1;
        if (node.trunk_next) {
            stack.push(node.trunk_next);
        }
        for (const branch of node.branches ?? []) {
            stack.push(branch);
        }
    }
    return count;
}

/** Re-anchor the engine's last official move at the trunk tail without
 *  moving the current position. Needed before composing a variation onto a
 *  freshly loaded tree. */
function refreshLastOfficialMoveFromTrunk(controller: GobanController): MoveTree | null {
    const { engine } = controller.goban;
    const tail = getMoveTreeTrunkTail(engine.move_tree);
    if (!tail) {
        return null;
    }
    const current = engine.cur_move;
    engine.jumpTo(tail);
    engine.setLastOfficialMove();
    if (current.id !== tail.id) {
        engine.jumpTo(current);
    }
    return tail;
}

/**
 * Owns the Kibitz GobanControllers. The main controller connects to the
 * room's live game and lives as long as that game is the room's game. The
 * secondary controller is created on demand for a draft, a posted
 * variation, or a game preview, and destroyed when the pane closes.
 */
export function useKibitzGobans({
    roomId,
    currentGame,
    secondaryPane,
    variations,
    visibleVariationIds,
    variationColorIndexes,
    variationGameById,
    onMainSnapshot,
}: UseKibitzGobansOptions): KibitzGobans {
    const [main, setMain] = React.useState<GobanController | null>(null);
    const [secondary, setSecondary] = React.useState<GobanController | null>(null);
    const [mainReady, setMainReady] = React.useState(false);
    const centerMode = deriveKibitzCenterMode(secondaryPane);

    const onMainSnapshotRef = React.useRef(onMainSnapshot);
    onMainSnapshotRef.current = onMainSnapshot;
    const currentGameRef = React.useRef(currentGame);
    currentGameRef.current = currentGame;
    const roomIdRef = React.useRef(roomId);
    roomIdRef.current = roomId;

    const gameId = currentGame?.game_id ?? null;

    React.useEffect(() => {
        if (gameId == null) {
            setMain(null);
            return;
        }
        const controller = new GobanController({
            ...baseConfig(currentGameRef.current),
            board_div: document.createElement("div"),
            interactive: false,
            connect_to_chat: true,
            game_id: gameId,
        });
        const sync = () => {
            const snapshot = captureCurrentGameBaseSnapshotFromController(
                controller,
                currentGameRef.current,
                roomIdRef.current,
                "main-board",
            );
            if (snapshot) {
                setMainReady(true);
                onMainSnapshotRef.current?.(snapshot);
            }
        };
        controller.goban.on("load", sync);
        controller.goban.on("gamedata", sync);
        controller.goban.on("last_official_move", sync);
        controller.goban.on("move-made", sync);
        setMain(controller);
        setMainReady(false);
        return () => {
            controller.goban.off("load", sync);
            controller.goban.off("gamedata", sync);
            controller.goban.off("last_official_move", sync);
            controller.goban.off("move-made", sync);
            controller.destroy();
            setMain(null);
            setMainReady(false);
        };
    }, [gameId]);

    // Any change to what the secondary board shows rebuilds it from scratch.
    // In variation mode only the visible variations of the same game are
    // composed onto the board, so only those take part in the key.
    const selectedVariationGameId =
        centerMode === "variation"
            ? (variations.find((v) => v.id === secondaryPane.variation_id)?.game_id ?? null)
            : null;
    const composedVariationIds =
        centerMode === "variation"
            ? visibleVariationIds.filter(
                  (id) => variations.find((v) => v.id === id)?.game_id === selectedVariationGameId,
              )
            : [];
    const secondaryKey =
        centerMode === "main"
            ? null
            : [
                  centerMode,
                  secondaryPane.preview_game_id ?? "",
                  secondaryPane.variation_id ?? "",
                  secondaryPane.variation_source_game_id ?? "",
                  secondaryPane.variation_draft_base_id ?? "",
                  secondaryPane.variation_draft_nonce ?? "",
                  secondaryPane.variation_source_move_tree_id ?? "",
                  secondaryPane.variation_source_move_path ?? "",
                  composedVariationIds.join(","),
              ].join(":");

    // A same-game secondary board reuses the main controller's trunk, so it
    // must wait for `mainReady`. A board for a different game connects on
    // its own and never needs to wait -- gating the effect on `mainReady`
    // regardless would tear down and rebuild an already-connected board
    // (losing a socket connection or in-progress draft edits) every time
    // the main board's readiness flips.
    const secondaryTargetGameId = computeSecondaryTargetGameId(
        centerMode,
        secondaryPane,
        variations,
    );
    const secondaryUsesMainTrunk =
        centerMode !== "main" && centerMode !== "preview" && secondaryTargetGameId === gameId;
    const secondaryGate = secondaryUsesMainTrunk ? mainReady : true;

    const paneRef = React.useRef(secondaryPane);
    paneRef.current = secondaryPane;
    const variationsRef = React.useRef(variations);
    variationsRef.current = variations;
    const visibleIdsRef = React.useRef(visibleVariationIds);
    visibleIdsRef.current = visibleVariationIds;
    const colorsRef = React.useRef(variationColorIndexes);
    colorsRef.current = variationColorIndexes;
    const gameByIdRef = React.useRef(variationGameById);
    gameByIdRef.current = variationGameById;
    // Node count of a draft right after it was composed; more nodes than
    // this means the user has added moves that would be lost on exit.
    const draftBaselineRef = React.useRef<{
        controller: GobanController;
        nodeCount: number;
    } | null>(null);

    React.useEffect(() => {
        if (!secondaryKey || !main) {
            setSecondary(null);
            return;
        }
        const pane = paneRef.current;
        const mode = deriveKibitzCenterMode(pane);
        const currentGameId = currentGameRef.current?.game_id ?? null;

        const selectedVariation =
            mode === "variation"
                ? (variationsRef.current.find((v) => v.id === pane.variation_id) ?? null)
                : null;
        const draftBase =
            mode === "draft" && pane.variation_draft_base_id
                ? (variationsRef.current.find((v) => v.id === pane.variation_draft_base_id) ?? null)
                : null;

        const targetGameId = computeSecondaryTargetGameId(mode, pane, variationsRef.current);
        const targetGame =
            (targetGameId != null ? gameByIdRef.current.get(targetGameId) : undefined) ??
            pane.variation_source_game ??
            (targetGameId === currentGameId ? currentGameRef.current : undefined);

        // The current game's trunk comes from the main controller so the
        // secondary board never opens a second socket for the same game.
        // Other games connect read-only.
        const useMainTrunk = mode !== "preview" && targetGameId === currentGameId;
        const mainSnapshot = useMainTrunk
            ? captureCurrentGameBaseSnapshotFromController(
                  main,
                  currentGameRef.current,
                  roomIdRef.current,
              )
            : null;

        if (useMainTrunk && !mainSnapshot) {
            // The main board hasn't produced a usable trunk snapshot yet
            // (its div isn't in the DOM, or the engine has no move tree).
            // Drop `mainReady` so the next snapshot the main board
            // produces re-runs this effect.
            setMainReady(false);
            setSecondary(null);
            return;
        }

        const controller = new GobanController({
            ...baseConfig(targetGame),
            ...(useMainTrunk && mainSnapshot
                ? (mainSnapshot.config as Partial<GobanRendererConfig>)
                : {}),
            // The trunk snapshot carries the live game's gamedata. A draft or
            // variation is a plain analysis board, so it must not inherit the
            // live phase (stone removal or finished blocks analysis) or the
            // removed-stone and score state that goes with it.
            ...(useMainTrunk
                ? { phase: "play" as const, removed: undefined, score: undefined }
                : {}),
            board_div: document.createElement("div"),
            interactive: mode === "draft",
            connect_to_chat: false,
            game_id: useMainTrunk ? undefined : (targetGameId ?? undefined),
            move_tree:
                mode === "draft" && pane.variation_source_move_tree
                    ? pane.variation_source_move_tree
                    : mainSnapshot?.config.move_tree,
        });

        let composed = false;
        const compose = () => {
            if (composed) {
                return;
            }
            composed = true;
            refreshLastOfficialMoveFromTrunk(controller);
            if (mode === "variation" && selectedVariation) {
                for (const v of variationsRef.current) {
                    if (
                        v.id !== selectedVariation.id &&
                        v.game_id === selectedVariation.game_id &&
                        visibleIdsRef.current.includes(v.id)
                    ) {
                        applyKibitzVariationToController(
                            controller,
                            v,
                            colorsRef.current[v.id] ?? 0,
                            false,
                        );
                    }
                }
                const applied = applyKibitzVariationToController(
                    controller,
                    selectedVariation,
                    colorsRef.current[selectedVariation.id] ?? 0,
                    true,
                );
                if (applied.endpoint) {
                    controller.goban.engine.jumpTo(applied.endpoint);
                }
            } else if (mode === "draft" && draftBase) {
                const applied = applyKibitzVariationToController(
                    controller,
                    draftBase,
                    colorsRef.current[draftBase.id] ?? 0,
                    true,
                );
                if (applied.endpoint) {
                    controller.goban.engine.jumpTo(applied.endpoint);
                }
            } else if (mode === "draft" && pane.variation_source_move_path) {
                controller.goban.engine.followPath(0, pane.variation_source_move_path);
            }
            if (mode === "draft") {
                controller.setAnalyzeTool("stone", "alternate");
                draftBaselineRef.current = {
                    controller,
                    nodeCount: countMoveTreeNodes(controller.goban.engine.move_tree),
                };
            }
            controller.goban.redraw(true);
        };

        const connected = !useMainTrunk && targetGameId != null;
        if (connected) {
            // Connected boards compose once the server has sent the game.
            controller.goban.on("load", compose);
        } else {
            compose();
        }

        restoreMainBoardToOfficialTail(main);
        setSecondary(controller);
        return () => {
            controller.goban.off("load", compose);
            if (draftBaselineRef.current?.controller === controller) {
                draftBaselineRef.current = null;
            }
            controller.destroy();
            setSecondary(null);
        };
    }, [secondaryKey, main, secondaryGate]);

    const isDraftDirty = React.useCallback(() => {
        const baseline = draftBaselineRef.current;
        if (!baseline || baseline.controller !== secondary) {
            return false;
        }
        return countMoveTreeNodes(baseline.controller.goban.engine.move_tree) > baseline.nodeCount;
    }, [secondary]);

    const center = centerMode === "main" ? main : (secondary ?? main);
    const playerBars = secondary && center === secondary && secondaryUsesMainTrunk ? main : center;

    return { main, secondary, center, centerMode, playerBars, isDraftDirty };
}
