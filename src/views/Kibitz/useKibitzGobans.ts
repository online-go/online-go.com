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
import type { GobanRendererConfig, LabelPosition, MoveTree } from "goban";
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
import {
    applyKibitzVariationToController,
    type AppliedKibitzVariation,
} from "./kibitzVariationTree";

export type KibitzCenterMode = "main" | "draft" | "variation";

export interface KibitzGobans {
    /** The live game controller. The consumer is responsible for keeping
     *  its board div mounted in the DOM; this hook does not mount it. */
    main: GobanController | null;
    /** Draft or posted variation controller. Null when the center shows the
     *  main game. */
    secondary: GobanController | null;
    /** Whichever controller GobanView should render in the center. */
    center: GobanController | null;
    centerMode: KibitzCenterMode;
    /** The game whose players and clocks the player bars show: the live
     *  game while the center shows a draft or variation of it, the center
     *  board for a variation of another game. */
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

type LabelConfig = Pick<
    GobanRendererConfig,
    "draw_top_labels" | "draw_left_labels" | "draw_right_labels" | "draw_bottom_labels"
>;

/** Which board edges get coordinates, from the label-positioning preference. */
export function labelConfig(enabled: boolean = true): LabelConfig {
    const position = preferences.get("label-positioning");
    const draw = (edge: string) => enabled && (position === "all" || position.includes(edge));
    return {
        draw_top_labels: draw("top"),
        draw_left_labels: draw("left"),
        draw_right_labels: draw("right"),
        draw_bottom_labels: draw("bottom"),
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
    if (mode === "variation") {
        return variations.find((v) => v.id === pane.variation_id)?.game_id ?? null;
    }
    if (mode === "draft") {
        return pane.variation_source_game_id ?? null;
    }
    return null;
}

/** Number of nodes off the official trunk. Only these are the user's own
 *  content: on a connected board the trunk keeps growing with the live
 *  game, and those moves are not a draft. */
function countBranchNodes(root: MoveTree | null | undefined): number {
    let count = 0;
    const stack: MoveTree[] = root ? [root] : [];
    while (stack.length > 0) {
        const node = stack.pop() as MoveTree;
        if (!node.trunk) {
            count += 1;
        }
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
function refreshLastOfficialMoveFromTrunk(controller: GobanController): void {
    const { engine } = controller.goban;
    const tail = getMoveTreeTrunkTail(engine.move_tree);
    if (!tail) {
        return;
    }
    const current = engine.cur_move;
    engine.jumpTo(tail);
    engine.setLastOfficialMove();
    if (current.id !== tail.id) {
        engine.jumpTo(current);
    }
}

/**
 * Owns the Kibitz GobanControllers. The main controller connects to the
 * room's live game and lives as long as that game is the room's game. The
 * secondary controller is created on demand for a draft or a posted
 * variation and destroyed when the pane closes.
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

    // The effects below are keyed on what the board shows, not on every value
    // they read, so they read the rest through this.
    const latest = React.useRef({
        onMainSnapshot,
        currentGame,
        roomId,
        secondaryPane,
        variations,
        visibleVariationIds,
        variationColorIndexes,
        variationGameById,
        main,
    });
    latest.current = {
        onMainSnapshot,
        currentGame,
        roomId,
        secondaryPane,
        variations,
        visibleVariationIds,
        variationColorIndexes,
        variationGameById,
        main,
    };

    const gameId = currentGame?.game_id ?? null;

    React.useEffect(() => {
        if (gameId == null) {
            setMain(null);
            return;
        }
        const controller = new GobanController({
            ...baseConfig(latest.current.currentGame),
            board_div: document.createElement("div"),
            interactive: false,
            connect_to_chat: true,
            game_id: gameId,
        });
        // A snapshot clones the whole trunk, so only take one when the trunk
        // has actually moved on since the last one that was accepted.
        let lastSnapshotKey: string | null = null;
        const sync = () => {
            const engine = controller.goban.engine;
            const tail = getMoveTreeTrunkTail(engine.move_tree);
            const key = `${engine.move_tree?.id ?? ""}:${tail?.move_number ?? -1}`;
            if (key === lastSnapshotKey) {
                return;
            }
            const snapshot = captureCurrentGameBaseSnapshotFromController(
                controller,
                latest.current.currentGame,
                latest.current.roomId,
                "main-board",
            );
            if (snapshot) {
                lastSnapshotKey = key;
                setMainReady(true);
                latest.current.onMainSnapshot?.(snapshot);
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

    const secondaryTargetGameId = computeSecondaryTargetGameId(
        centerMode,
        secondaryPane,
        variations,
    );

    // Any change to what the secondary board shows rebuilds it from scratch.
    // In variation mode only the visible variations of the same game are
    // composed onto the board, so only those take part in the key.
    const composedVariationIds =
        centerMode === "variation"
            ? visibleVariationIds.filter(
                  (id) => variations.find((v) => v.id === id)?.game_id === secondaryTargetGameId,
              )
            : [];
    const secondaryKey =
        centerMode === "main"
            ? null
            : [
                  centerMode,
                  secondaryPane.variation_id ?? "",
                  secondaryPane.variation_source_game_id ?? "",
                  secondaryPane.variation_draft_base_id ?? "",
                  secondaryPane.variation_draft_nonce ?? "",
                  secondaryPane.variation_source_move_tree_id ?? "",
                  secondaryPane.variation_source_move_path ?? "",
                  composedVariationIds.join(","),
              ].join(":");

    // A same-game board copies the main trunk, so it waits for `mainReady`. A
    // board for another game connects on its own; gating it on `mainReady`
    // too would rebuild it, and lose its socket, whenever readiness flips.
    const secondaryUsesMainTrunk = centerMode !== "main" && secondaryTargetGameId === gameId;
    const secondaryGate = secondaryUsesMainTrunk ? mainReady : true;

    // Branch node count of a draft right after it was composed; more nodes
    // than this means the user has added moves that would be lost on exit.
    const draftBaselineRef = React.useRef<{
        controller: GobanController;
        nodeCount: number;
    } | null>(null);

    // Keyed on `hasMain`, not on `main`: the secondary board only needs the
    // main controller while it is being built, and a draft must survive the
    // room moving to another game so it can still be posted or discarded.
    const hasMain = main !== null;

    React.useEffect(() => {
        const { main, currentGame, roomId, secondaryPane: pane, variations } = latest.current;
        if (!secondaryKey || !main) {
            setSecondary(null);
            return;
        }
        const mode = deriveKibitzCenterMode(pane);
        const currentGameId = currentGame?.game_id ?? null;

        const selectedVariation =
            mode === "variation"
                ? (variations.find((v) => v.id === pane.variation_id) ?? null)
                : null;
        const draftBase =
            mode === "draft" && pane.variation_draft_base_id
                ? (variations.find((v) => v.id === pane.variation_draft_base_id) ?? null)
                : null;

        const targetGameId = computeSecondaryTargetGameId(mode, pane, variations);
        const targetGame =
            (targetGameId != null
                ? latest.current.variationGameById.get(targetGameId)
                : undefined) ??
            pane.variation_source_game ??
            (targetGameId === currentGameId ? currentGame : undefined);

        // The current game's trunk comes from the main controller so the
        // secondary board never opens a second socket for the same game.
        // Other games connect read-only.
        const useMainTrunk = targetGameId === currentGameId;
        const mainSnapshot = useMainTrunk
            ? captureCurrentGameBaseSnapshotFromController(main, currentGame, roomId)
            : null;

        if (useMainTrunk && !mainSnapshot) {
            // No usable trunk yet. Drop `mainReady` so the main board's next
            // snapshot re-runs this effect.
            setMainReady(false);
            setSecondary(null);
            return;
        }

        const controller = new GobanController({
            ...baseConfig(targetGame),
            ...(useMainTrunk && mainSnapshot
                ? (mainSnapshot.config as Partial<GobanRendererConfig>)
                : {}),
            // The snapshot carries the live game's gamedata, but an analysis
            // board must not inherit a phase that blocks analysis, nor the
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

        // Runs once for a copied trunk, and on every `load` of a connected
        // board: a reconnect replaces the engine, so the variation has to be
        // laid onto the fresh tree again.
        const apply = (variation: KibitzVariationSummary, selected: boolean) =>
            applyKibitzVariationToController(
                controller,
                variation,
                latest.current.variationColorIndexes[variation.id] ?? 0,
                selected,
            );

        const compose = () => {
            refreshLastOfficialMoveFromTrunk(controller);
            const focus = mode === "variation" ? selectedVariation : draftBase;
            if (focus) {
                // Compose in the order the variations appear in the list, whatever is
                // selected. Applying the selected one last made the order that nodes
                // enter parent.branches depend on the selection, so the move tree
                // re-ordered its branches as the user clicked between variations.
                let focusEndpoint: AppliedKibitzVariation["endpoint"] = null;
                if (mode === "variation") {
                    for (const v of variations) {
                        if (v.game_id !== focus.game_id) {
                            continue;
                        }
                        if (
                            v.id !== focus.id &&
                            !latest.current.visibleVariationIds.includes(v.id)
                        ) {
                            continue;
                        }
                        const applied = apply(v, v.id === focus.id);
                        if (v.id === focus.id) {
                            focusEndpoint = applied.endpoint;
                        }
                    }
                } else {
                    focusEndpoint = apply(focus, true).endpoint;
                }
                // A draft branched from a posted variation opens where the
                // reader was standing in it, which is only the end of the
                // line when they never stepped back.
                if (mode === "draft" && pane.variation_draft_base_path) {
                    controller.goban.engine.followPath(0, pane.variation_draft_base_path);
                } else if (focusEndpoint) {
                    controller.goban.engine.jumpTo(focusEndpoint);
                }
            } else if (mode === "draft" && pane.variation_source_move_path) {
                controller.goban.engine.followPath(0, pane.variation_source_move_path);
            }
            if (mode === "draft") {
                controller.setAnalyzeTool("stone", "alternate");
                draftBaselineRef.current = {
                    controller,
                    nodeCount: countBranchNodes(controller.goban.engine.move_tree),
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
    }, [secondaryKey, hasMain, secondaryGate]);

    // Board preferences changed while the page is up apply to the boards
    // here the way Game.tsx applies them to its goban.
    React.useEffect(() => {
        const gobans = () =>
            [main, secondary].filter((c): c is GobanController => c !== null).map((c) => c.goban);
        const onLastMoveOpacity = (v: number) => {
            for (const g of gobans()) {
                g.setLastMoveOpacity(v);
                g.redraw(true);
            }
        };
        const onVariationStoneOpacity = (v: number) => {
            for (const g of gobans()) {
                g.variation_stone_opacity = v;
                g.redraw(true);
            }
        };
        const onLabelPosition = (v: LabelPosition) => {
            for (const g of gobans()) {
                g.setLabelPosition(v);
            }
        };
        const refresh = () => {
            for (const g of gobans()) {
                g.refreshVisualPreferences();
            }
        };
        preferences.watch("last-move-opacity", onLastMoveOpacity, false, true);
        preferences.watch("variation-stone-opacity", onVariationStoneOpacity, false, true);
        preferences.watch("label-positioning", onLabelPosition, false, true);
        preferences.watch("stone-font-scale", refresh, false, true);
        return () => {
            preferences.unwatch("last-move-opacity", onLastMoveOpacity);
            preferences.unwatch("variation-stone-opacity", onVariationStoneOpacity);
            preferences.unwatch("label-positioning", onLabelPosition);
            preferences.unwatch("stone-font-scale", refresh);
        };
    }, [main, secondary]);

    const isDraftDirty = React.useCallback(() => {
        const baseline = draftBaselineRef.current;
        if (!baseline || baseline.controller !== secondary) {
            return false;
        }
        return countBranchNodes(baseline.controller.goban.engine.move_tree) > baseline.nodeCount;
    }, [secondary]);

    const center = centerMode === "main" ? main : (secondary ?? main);
    const playerBars = secondary && center === secondary && secondaryUsesMainTrunk ? main : center;

    return { main, secondary, center, centerMode, playerBars, isDraftDirty };
}
