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
import { Link, useParams, useSearchParams } from "react-router-dom";
import { browserHistory } from "@/lib/ogsHistory";
import { _, pgettext, interpolate } from "@/lib/translate";
import { get, post, put, del } from "@/lib/requests";
import { KBShortcut } from "@/components/KBShortcut";
import { errorAlerter, errorLogger, ignore } from "@/lib/misc";
import { rankList } from "@/lib/rank_utils";
import { GobanRendererConfig, GobanRenderer, PuzzleConfig, PuzzlePlacementSetting } from "goban";
import type { PlayerCacheEntry } from "@/lib/player_cache";
import { GobanController } from "@/lib/GobanController";
import { GobanView, GobanViewRef } from "@/components/GobanView";
import { Markdown } from "@/components/Markdown";
import { StarRating } from "@/components/StarRating";
import { Resizable } from "@/components/Resizable";
import * as preferences from "@/lib/preferences";
import * as data from "@/lib/data";
import { sfx } from "@/lib/sfx";
import { TransformSettings, PuzzleTransform } from "./PuzzleTransform";
import { PuzzleNavigation } from "./PuzzleNavigation";
import { PuzzleEditor, getAllPuzzleCollections } from "./PuzzleEditing";
import { alert } from "@/lib/swal_config";
import { PuzzleInfo } from "./PuzzleInfo";
import { PuzzleLibrary } from "./PuzzleLibrary";
import { PuzzleSettings } from "./PuzzleSettings";
import "./Puzzle.css";

type TransformationOptions = "x" | "h" | "v" | "color" | "zoom";

interface PuzzleCollectionInfo {
    id: number;
    name: string;
    position_transform_enabled?: boolean;
    color_transform_enabled?: boolean;
    private?: boolean;
}

type CollectionFlag = "private" | "position_transform_enabled" | "color_transform_enabled";

interface PuzzleSummaryEntry {
    id: number;
    name: string;
    rank?: number;
    type?: string;
    has_solution?: boolean;
    order?: number;
}

interface PuzzleState {
    puzzle?: PuzzleConfig;
    show_wrong?: boolean;
    show_correct?: boolean;
    show_warning?: boolean;
    owner?: PlayerCacheEntry;
    name?: string;
    rank?: number;
    id?: number;
    rating?: number;
    editing?: boolean;
    zoomable?: boolean;

    loaded: boolean;
    edit_step: string;
    setup_color: string;
    puzzle_collection_summary: PuzzleSummaryEntry[];
    puzzle_collections?: PuzzleCollectionInfo[];
    hintsOn: boolean;

    analyze_tool?: string;
    analyze_subtool?: string;
    analyze_pencil_color?: string;
    move_text?: string;

    my_rating: number;
    rated: boolean;
    zoom: boolean;
    collection: PuzzleCollectionInfo | null;
    transform_color: boolean;
    transform_h: boolean;
    transform_v: boolean;
    transform_x: boolean;
    label_positioning: string;
}

const ranks = rankList(0, 38, false);

function createInitialState(): PuzzleState {
    return {
        loaded: false,
        edit_step: "setup",
        setup_color: "black",
        puzzle_collection_summary: [],
        hintsOn: false,
        analyze_tool: "",
        analyze_subtool: "",
        move_text: "",

        my_rating: 0,
        rated: false,
        zoom: false,
        collection: null,
        transform_color: false,
        transform_h: false,
        transform_v: false,
        transform_x: false,
        label_positioning: preferences.get("label-positioning-puzzles"),
    };
}

function mergeState(prev: PuzzleState, next: Partial<PuzzleState>): PuzzleState {
    return { ...prev, ...next };
}

function incrementReducer(x: number): number {
    return x + 1;
}

function createGobanDiv(): HTMLDivElement {
    const div = document.createElement("div");
    div.className = "Goban";
    return div;
}

function findSiblingPuzzleId(
    summary: PuzzleSummaryEntry[],
    current_id: number | undefined,
    direction: 1 | -1,
): number {
    if (!summary || current_id === undefined) {
        return 0;
    }
    for (let i = 0; i < summary.length; ++i) {
        if (summary[i].id === current_id) {
            const j = i + direction;
            return j >= 0 && j < summary.length ? summary[j].id : 0;
        }
    }
    return 0;
}

export function Puzzle(): React.ReactElement {
    const { puzzle_id } = useParams<{ puzzle_id: string }>();
    const [searchParams] = useSearchParams();
    const view_collection_param = searchParams.get("view-collection") === "1";
    const gobanViewRef = React.useRef<GobanViewRef>(null);
    const [state, setState] = React.useReducer(mergeState, null, createInitialState);
    const [, forceRender] = React.useReducer(incrementReducer, 0);
    // True while a collection-mutating request (rename/reorder/flag toggle) is
    // in flight. The prefetch effect bails on this so a mid-flight prefetch
    // can't cache pre-PUT server state and revert our optimistic update.
    const [mutationInFlight, setMutationInFlight] = React.useState(false);

    // Mutable instance refs (created once, persist across renders)
    const transformRef = React.useRef<PuzzleTransform>(null);
    const navigationRef = React.useRef<PuzzleNavigation>(null);
    const editorRef = React.useRef<PuzzleEditor>(null);
    const gobanDivRef = React.useRef<HTMLDivElement>(null);
    const gobanRef = React.useRef<GobanRenderer | null>(null);
    const controllerRef = React.useRef<GobanController | null>(null);
    const gobanOptsRef = React.useRef<Partial<GobanRendererConfig>>({});
    const solveTimeStartRef = React.useRef(Date.now());
    const attemptsRef = React.useRef(1);
    const moveTreeContainerRef = React.useRef<HTMLElement | undefined>(undefined);

    // Lazy initialization of mutable instances
    if (!transformRef.current) {
        transformRef.current = new PuzzleTransform(new TransformSettings());
    }
    if (!navigationRef.current) {
        navigationRef.current = new PuzzleNavigation();
    }
    if (!editorRef.current) {
        editorRef.current = new PuzzleEditor(transformRef.current);
    }
    if (!gobanDivRef.current) {
        gobanDivRef.current = createGobanDiv();
    }

    const transform = transformRef.current;
    const navigation = navigationRef.current;
    const editor = editorRef.current;
    const gobanDiv = gobanDivRef.current;

    // Element refs
    const ref_collection = React.useRef<HTMLSelectElement>(null);
    const ref_name = React.useRef<HTMLInputElement>(null);
    const ref_puzzle_type = React.useRef<HTMLSelectElement>(null);
    const next_link = React.useRef<HTMLAnchorElement>(null);

    // Refs for values needed inside goban callbacks (avoid stale closures)
    const stateRef = React.useRef(state);
    stateRef.current = state;
    const puzzleIdRef = React.useRef(puzzle_id);
    puzzleIdRef.current = puzzle_id;

    // --- Core functions ---

    const removeHints = React.useCallback(() => {
        const goban = gobanRef.current;
        if (goban) {
            const move = goban.engine.cur_move;
            move.branches.forEach((item) => goban.deleteCustomMark(item.x, item.y, "hint", true));
        }
        setState({ hintsOn: false });
    }, []);

    const syncState = React.useCallback(() => {
        const goban = gobanRef.current;
        if (!goban) {
            return;
        }
        setState({
            analyze_tool: goban.analyze_tool,
            analyze_subtool: goban.analyze_subtool,
            move_text:
                goban.engine.cur_move && goban.engine.cur_move.text
                    ? goban.engine.cur_move.text
                    : "",
        });
    }, []);

    const onUpdate = React.useCallback(() => {
        removeHints();
        syncState();
        forceRender();
    }, [removeHints, syncState]);

    const onWrongAnswer = React.useCallback(() => {
        if (preferences.get("puzzle.sound")) {
            sfx.play("tutorial-fail");
        }
        setState({
            show_correct: false,
            show_wrong: true,
        });
        attemptsRef.current++;
    }, []);

    const onCorrectAnswer = React.useCallback(() => {
        const pid = puzzleIdRef.current;
        const goban = gobanRef.current;
        if (!goban || !pid) {
            return;
        }

        if (preferences.get("puzzle.sound")) {
            sfx.play("tutorial-pass");
        }

        post(`puzzles/${pid}/solutions`, {
            time_elapsed: Date.now() - solveTimeStartRef.current,
            flipped_horizontally: transform.settings.transform_h,
            flipped_vertically: transform.settings.transform_v,
            transposed: transform.settings.transform_x,
            colors_swapped: transform.settings.transform_color,
            attempts: attemptsRef.current,
            solution: goban.engine.cur_move.getMoveStringToThisPoint(),
        })
            .then((response) => console.log(response))
            .catch(errorLogger);

        setState({
            show_correct: true,
            show_wrong: false,
        });
        setTimeout(() => {
            const position = window.pageYOffset;
            (next_link.current as HTMLElement)?.focus();
            window.scrollTo(0, position);
        }, 1);
    }, [transform]);

    const replacementSettingFunction = React.useCallback((): PuzzlePlacementSetting => {
        const s = stateRef.current;
        if (s.edit_step === "setup") {
            return {
                mode: "setup",
                color: s.setup_color === "black" ? 1 : 2,
            };
        }
        if (s.edit_step === "moves") {
            setState({ show_warning: true });
            return {
                mode: "place",
                color: 0,
            };
        }
        throw new Error("Invalid edit step");
    }, []);

    const reset = React.useCallback(
        (editing?: boolean) => {
            // Tear down the previous controller synchronously before building
            // the new one. editor.reset() (below) clears gobanDiv's children,
            // and the new goban is constructed in the same JS tick, so the
            // browser never paints an empty board between old and new.
            if (controllerRef.current) {
                controllerRef.current.goban.destroy();
                controllerRef.current = null;
                gobanRef.current = null;
            }

            const opts: GobanRendererConfig = editor.reset(
                gobanDiv,
                !!editing,
                replacementSettingFunction,
            );

            opts.move_tree_container = moveTreeContainerRef.current;
            gobanOptsRef.current = opts;

            const controller = new GobanController(opts);
            controllerRef.current = controller;
            const goban = controller.goban;
            gobanRef.current = goban;
            goban.setMode("puzzle");
            window.global_goban = goban;
            goban.on("update", onUpdate);
            goban.on("puzzle-wrong-answer", onWrongAnswer);
            goban.on("puzzle-correct-answer", onCorrectAnswer);
            navigation.goban = goban;
        },
        [
            editor,
            gobanDiv,
            navigation,
            onUpdate,
            onWrongAnswer,
            onCorrectAnswer,
            replacementSettingFunction,
        ],
    );

    const fetchPuzzle = React.useCallback(
        (puzzleId: number) => {
            editor.fetchPuzzle(puzzleId, (newState, editing) => {
                // Guard against out-of-order completions: if the user has
                // already navigated past this puzzle, drop the stale result.
                const current = parseInt(puzzleIdRef.current!);
                if (!isNaN(current) && current !== puzzleId) {
                    return;
                }
                reset(editing);
                // Batch everything — new puzzle data plus the per-navigation
                // UI resets — so the transition from the previous puzzle's
                // state to this one is a single React commit with no
                // intermediate render that mixes old and new. The resets go
                // before the spread so any newState override (e.g. `editing`
                // for the /puzzle/new path) wins.
                setState({
                    show_correct: false,
                    show_wrong: false,
                    hintsOn: false,
                    editing: false,
                    puzzle_collections: undefined,
                    ...newState,
                });
                window.document.title = newState.collection.name + ": " + newState.name;
                data.set(`puzzle.collection.${newState.collection.id}.last-visited`, newState.id);
                solveTimeStartRef.current = Date.now();
                attemptsRef.current = 1;
            });
        },
        [editor, reset],
    );

    const doReset = React.useCallback(() => {
        reset();
        setState({
            show_correct: false,
            show_wrong: false,
        });
    }, [reset]);

    // --- Effect: fetch puzzle on puzzle_id change ---
    //
    // We deliberately leave the current goban/controller mounted — plus all
    // the state from the previous puzzle — while the new puzzle is fetching.
    // reset() inside the fetch callback swaps the controller atomically, and
    // fetchPuzzle's single setState carries every transitional reset
    // (show_correct, show_wrong, hintsOn) along with the new data, so there
    // is never an intermediate render that mixes old and new values. Reset /
    // Escape still work during the fetch window because the previous
    // puzzle's orig_puzzle_config stays in place until new data arrives.
    React.useEffect(() => {
        // Any in-flight enter-edit-mode load belongs to the previous puzzle;
        // invalidate it so its `.then` can't poison the new one.
        editLoadTagRef.current = undefined;
        window.document.title = _("Puzzle");
        fetchPuzzle(parseInt(puzzle_id!));
    }, [puzzle_id, fetchPuzzle]);

    // Destroy the goban once when the component unmounts. Puzzle navigation
    // does not rely on this — reset() owns the mid-lifetime swap.
    React.useEffect(() => {
        return () => {
            if (controllerRef.current) {
                controllerRef.current.goban.destroy();
                controllerRef.current = null;
                gobanRef.current = null;
                // navigationRef is lazily initialized at the top of this
                // component, so .current is always non-null by unmount.
                navigationRef.current!.goban = null as unknown as GobanRenderer;
            }
        };
    }, []);

    // Open the library takeover once when the URL carries `?view-collection=1`
    // and we're past the initial load. Handles both the initial mount (in
    // tandem with `defaultActiveTakeover` below, which avoids a one-paint
    // flash) and later in-app navigations that swap to a URL carrying the
    // param while the Puzzle component is already mounted — e.g. saving a new
    // puzzle and redirecting to /puzzle/:id?view-collection=1.
    //
    // The ref prevents re-opening on every unrelated state change (e.g. the
    // user leaving edit mode with the param still in the URL); it resets
    // whenever the param goes away so a later navigation back into a
    // param-carrying URL can open the library again.
    const lastOpenedForParamRef = React.useRef(false);
    React.useEffect(() => {
        if (!view_collection_param) {
            lastOpenedForParamRef.current = false;
            return;
        }
        if (!state.loaded || state.editing) {
            return;
        }
        if (lastOpenedForParamRef.current) {
            return;
        }
        lastOpenedForParamRef.current = true;
        gobanViewRef.current?.setActiveTakeover("puzzle-library");
    }, [view_collection_param, state.loaded, state.editing]);

    // Prefetch the next puzzle in the background so navigating forward is
    // instant. Fires once the current puzzle is loaded and we know the next
    // id from the collection summary. Skipped while a collection mutation is
    // in flight — the server would return pre-mutation data and we'd cache
    // it, reverting our optimistic state on the next navigation.
    React.useEffect(() => {
        if (!state.loaded || state.editing || mutationInFlight) {
            return;
        }
        const next_id = findSiblingPuzzleId(state.puzzle_collection_summary, state.id, 1);
        if (next_id) {
            editor.prefetchPuzzle(next_id);
        }
    }, [
        state.loaded,
        state.editing,
        state.id,
        state.puzzle_collection_summary,
        editor,
        mutationInFlight,
    ]);

    // --- Event handlers ---

    const setAnalyzeTool = React.useCallback(
        (tool: string, subtool: string | null | undefined) => {
            if (navigation.checkAndEnterAnalysis()) {
                document
                    .querySelector("#game-analyze-button-bar .active")
                    ?.classList.remove("active");
                document.querySelector(`#game-analyze-${tool}-tool`)?.classList.add("active");
                const goban = gobanRef.current;
                if (goban) {
                    switch (tool) {
                        case "draw":
                            goban.setAnalyzeTool(
                                tool,
                                stateRef.current.analyze_pencil_color as string,
                            );
                            break;
                        case "erase":
                            console.log("Erase not supported yet");
                            break;
                        case "label":
                            goban.setAnalyzeTool(tool, subtool);
                            break;
                        case "stone":
                            if (subtool == null) {
                                subtool = "alternate";
                            }
                            goban.setAnalyzeTool(tool, subtool);
                            break;
                    }
                }
            }
            syncState();
            return false;
        },
        [navigation, syncState],
    );

    const set_analyze_tool = React.useMemo(
        () => ({
            stone_null: () => setAnalyzeTool("stone", null),
            stone_alternate: () => setAnalyzeTool("stone", "alternate"),
            stone_black: () => setAnalyzeTool("stone", "black"),
            stone_white: () => setAnalyzeTool("stone", "white"),
            label_triangle: () => setAnalyzeTool("label", "triangle"),
            label_square: () => setAnalyzeTool("label", "square"),
            label_circle: () => setAnalyzeTool("label", "circle"),
            label_cross: () => setAnalyzeTool("label", "cross"),
            label_letters: () => setAnalyzeTool("label", "letters"),
            label_numbers: () => setAnalyzeTool("label", "numbers"),
            draw: () => setAnalyzeTool("draw", stateRef.current.analyze_pencil_color),
            clear_and_sync: () => {
                const goban = gobanRef.current;
                if (goban) {
                    goban.syncReviewMove({ clearpen: true });
                    goban.clearAnalysisDrawing();
                }
            },
            delete_branch: () => {
                gobanRef.current?.deleteBranch();
            },
        }),
        [setAnalyzeTool],
    );

    const undo = React.useCallback(() => {
        setState({
            show_correct: false,
            show_wrong: false,
        });
        gobanRef.current?.showPrevious();
    }, []);

    const ratePuzzle = React.useCallback(
        (value: number) => {
            put(`puzzles/${puzzle_id}/rate`, { rating: value }).then(ignore).catch(errorAlerter);
            setState({
                rated: true,
                my_rating: value,
            });
            // The cached /rate response is now stale. Drop it so a later
            // revisit fetches the server's updated rating.
            const pid = parseInt(puzzle_id!);
            if (!isNaN(pid)) {
                editor.invalidatePuzzle(pid);
            }
        },
        [puzzle_id, editor],
    );

    const setTransformation = React.useCallback(
        (what: TransformationOptions) => {
            const transformState = transform.stateForTransformation(what);
            if (transformState) {
                setState(transformState as Partial<PuzzleState>);
                if (transformState.zoom) {
                    preferences.set("puzzle.zoom", transform.settings.zoom);
                }
            }
            doReset();
        },
        [transform, doReset],
    );

    const toggle_transform_x = React.useCallback(() => setTransformation("x"), [setTransformation]);
    const toggle_transform_h = React.useCallback(() => setTransformation("h"), [setTransformation]);
    const toggle_transform_v = React.useCallback(() => setTransformation("v"), [setTransformation]);
    const toggle_transform_color = React.useCallback(
        () => setTransformation("color"),
        [setTransformation],
    );
    const toggle_transform_zoom = React.useCallback(
        () => setTransformation("zoom"),
        [setTransformation],
    );

    const save = React.useCallback(() => {
        const goban = gobanRef.current;
        const s = stateRef.current;
        const pid = puzzleIdRef.current;
        if (!goban || !s.puzzle) {
            return;
        }

        const puzzle = goban.engine.exportAsPuzzle();
        puzzle.name = s.name;
        puzzle.puzzle_description = s.puzzle.puzzle_description;
        puzzle.puzzle_collection = s.puzzle.puzzle_collection;
        puzzle.puzzle_type = s.puzzle.puzzle_type;
        puzzle.puzzle_rank = s.puzzle.puzzle_rank;
        puzzle.puzzle_opponent_move_mode = s.puzzle.puzzle_opponent_move_mode;
        puzzle.puzzle_player_move_mode = s.puzzle.puzzle_player_move_mode;

        if (parseInt(pid!)) {
            put(`puzzles/${pid}`, { puzzle: puzzle })
                .then(() => {
                    window.location.reload();
                })
                .catch(errorAlerter);
        } else {
            post("puzzles/", { puzzle: puzzle })
                .then((response: { id?: number }) => {
                    // Go straight to the created puzzle with the library
                    // open, rather than bouncing through the legacy
                    // /puzzle-collection redirect (which does an extra GET).
                    if (response?.id) {
                        browserHistory.push(`/puzzle/${response.id}?view-collection=1`);
                    } else {
                        browserHistory.push("/puzzles/");
                    }
                })
                .catch(errorAlerter);
        }
    }, []);

    // Tracks an in-flight "enter edit mode" collections load. We stash the
    // puzzle id we started loading for; a later click (closing the takeover,
    // or navigating to a different puzzle) nulls this ref, and the `.then`
    // bails if the tag no longer matches.
    const editLoadTagRef = React.useRef<string | undefined>(undefined);

    const handleEditToggle = React.useCallback(
        (active: boolean) => {
            // Invoked for any click-driven activation/deactivation of the
            // edit takeover — including when another takeover (Settings,
            // Library, …) displaces it. Opening edit initializes from
            // scratch each time; any other takeover being opened tears
            // edit mode down and returns the goban to play mode.
            if (active && !stateRef.current.editing) {
                const tag = puzzleIdRef.current;
                editLoadTagRef.current = tag;
                getAllPuzzleCollections(data.get("user").id)
                    .then((collections) => {
                        // Bail if navigation, re-click, or unmount has made
                        // this result stale. controllerRef.current is nulled
                        // by the unmount cleanup — use it as a liveness
                        // check to avoid resetting a destroyed controller.
                        if (
                            editLoadTagRef.current !== tag ||
                            puzzleIdRef.current !== tag ||
                            !controllerRef.current
                        ) {
                            return;
                        }
                        editLoadTagRef.current = undefined;
                        setState({
                            editing: true,
                            puzzle_collections: collections,
                        });
                        reset(true);
                    })
                    .catch(errorAlerter);
            } else if (!active) {
                // Cancel any pending enter-edit-mode load, and exit edit
                // mode if we were in it.
                editLoadTagRef.current = undefined;
                if (stateRef.current.editing) {
                    setState({ editing: false });
                    reset(false);
                }
            }
        },
        [reset],
    );

    const onRandomizeChange = React.useCallback(() => {
        fetchPuzzle(parseInt(puzzleIdRef.current!));
    }, [fetchPuzzle]);

    const skipPuzzle = React.useCallback(() => {
        const s = stateRef.current;
        const next_id = findSiblingPuzzleId(s.puzzle_collection_summary, s.id, 1);
        if (next_id) {
            browserHistory.push(`/puzzle/${next_id}`);
        }
    }, []);

    const previousPuzzle = React.useCallback(() => {
        const s = stateRef.current;
        const prev_id = findSiblingPuzzleId(s.puzzle_collection_summary, s.id, -1);
        if (prev_id) {
            browserHistory.push(`/puzzle/${prev_id}`);
        }
    }, []);

    const refreshCollectionSummary = React.useCallback(() => {
        const s = stateRef.current;
        if (!s.collection?.id) {
            return;
        }
        get(`puzzles/${puzzleIdRef.current}/collection_summary`)
            .then((summary: PuzzleSummaryEntry[]) => {
                setState({ puzzle_collection_summary: summary });
            })
            .catch(errorAlerter);
    }, []);

    // Wraps a mutation request, tracking in-flight state and invalidating the
    // prefetch cache on success. Prefetching is gated on mutationInFlight so
    // optimistic state can't be reverted by a cache entry populated against
    // pre-PUT server state. On failure the cache is left intact — the caller
    // reverts its optimistic update and unrelated cache entries stay warm.
    const withMutation = React.useCallback(
        <T,>(p: Promise<T>): Promise<T> => {
            setMutationInFlight(true);
            return p.then(
                (value) => {
                    editor.invalidateAll();
                    setMutationInFlight(false);
                    return value;
                },
                (err) => {
                    setMutationInFlight(false);
                    throw err;
                },
            );
        },
        [editor],
    );

    const renameCollection = React.useCallback(
        (new_name: string) => {
            const s = stateRef.current;
            if (!s.collection?.id) {
                return;
            }
            const collection_id = s.collection.id;
            const prev_name = s.collection.name;
            // Optimistic update; server PUT fails → revert.
            setState({ collection: { ...s.collection, name: new_name } });
            withMutation(put(`puzzles/collections/${collection_id}`, { name: new_name })).catch(
                (err) => {
                    setState({
                        collection: stateRef.current.collection
                            ? { ...stateRef.current.collection, name: prev_name }
                            : stateRef.current.collection,
                    });
                    errorAlerter(err);
                },
            );
        },
        [withMutation],
    );

    // PuzzleLibrary emits a single-item move with the id of the puzzle that
    // should precede the moved one (after_id === 0 → move to the top).
    const reorderPuzzle = React.useCallback(
        (moved_id: number, after_id: number) => {
            const s = stateRef.current;
            const moved = s.puzzle_collection_summary.find((p) => p.id === moved_id);
            if (!moved) {
                return;
            }
            const remaining = s.puzzle_collection_summary.filter((p) => p.id !== moved_id);
            const insert_at =
                after_id === 0 ? 0 : remaining.findIndex((p) => p.id === after_id) + 1;
            const new_order = [...remaining];
            new_order.splice(insert_at, 0, moved);
            // Optimistic update; single PUT because the backend only needs to
            // know where this one puzzle should sit.
            setState({ puzzle_collection_summary: new_order });
            withMutation(put(`puzzles/${moved_id}/order`, { after: after_id })).catch((err) => {
                errorAlerter(err);
                refreshCollectionSummary();
            });
        },
        [withMutation, refreshCollectionSummary],
    );

    const deletePuzzleFromCollection = React.useCallback(
        (puzzle_id: number) => {
            void alert
                .fire({
                    text: _("Are you sure you want to delete this puzzle?"),
                    showCancelButton: true,
                })
                .then(({ value: accept }) => {
                    if (!accept) {
                        return;
                    }
                    withMutation(del(`puzzles/${puzzle_id}`))
                        .then(() => {
                            const s = stateRef.current;
                            const remaining = s.puzzle_collection_summary.filter(
                                (p) => p.id !== puzzle_id,
                            );
                            setState({ puzzle_collection_summary: remaining });
                            // If the user just deleted the current puzzle,
                            // navigate somewhere sensible.
                            if (puzzle_id === s.id) {
                                const next = remaining[0]?.id;
                                if (next) {
                                    browserHistory.push(`/puzzle/${next}`);
                                } else {
                                    browserHistory.push("/puzzles/");
                                }
                            }
                        })
                        .catch(errorAlerter);
                });
        },
        [withMutation],
    );

    // ACLs persist server-side even when `private` is flipped off; they're
    // re-activated automatically if the collection is made private again.
    const toggleCollectionFlag = React.useCallback(
        (flag: CollectionFlag, value: boolean) => {
            const s = stateRef.current;
            if (!s.collection?.id) {
                return;
            }
            const collection_id = s.collection.id;
            const prev_value = !!s.collection[flag];
            // Optimistic update
            setState({ collection: { ...s.collection, [flag]: value } });
            withMutation(put(`puzzles/collections/${collection_id}`, { [flag]: value })).catch(
                (err) => {
                    setState({
                        collection: stateRef.current.collection
                            ? { ...stateRef.current.collection, [flag]: prev_value }
                            : stateRef.current.collection,
                    });
                    errorAlerter(err);
                },
            );
        },
        [withMutation],
    );

    const setPuzzleCollection = React.useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
        if (parseInt(ev.target.value) > 0) {
            setState({
                puzzle: Object.assign({}, stateRef.current.puzzle, {
                    puzzle_collection: parseInt(ev.target.value),
                }),
            });
        } else if (ev.target.value === "new") {
            void alert
                .fire({
                    text: _("Collection name"),
                    input: "text",
                    showCancelButton: true,
                    inputValidator: (name): string | void => {
                        if (!name || name.length < 5) {
                            return _("Please provide a longer name for your new puzzle collection");
                        }
                    },
                })
                .then(({ value: name, isConfirmed }) => {
                    if (isConfirmed) {
                        editorRef
                            .current!.createPuzzleCollection(stateRef.current.puzzle, name)
                            .then((newState) => setState(newState))
                            .catch(errorAlerter);
                    }
                });
        }
    }, []);

    const validateSetup = React.useCallback((): boolean => {
        const s = stateRef.current;
        if (!s.puzzle || !((s.puzzle.puzzle_collection ?? 0) > 0)) {
            ref_collection.current?.focus();
            return false;
        }
        if ((s.name?.length ?? 0) < 5) {
            ref_name.current?.focus();
            return false;
        }
        if (!s.puzzle.puzzle_type) {
            ref_puzzle_type.current?.focus();
            return false;
        }
        return true;
    }, []);

    const setSetupStep = React.useCallback(() => {
        setState({ edit_step: "setup" });
    }, []);

    const setMovesStep = React.useCallback(() => {
        if (!validateSetup()) {
            setState({ edit_step: "setup" });
            return;
        }
        setState({ edit_step: "moves" });
        setTimeout(() => {
            gobanRef.current?.move_tree_redraw();
        }, 1);
    }, [validateSetup]);

    const setName = React.useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
        setState({ name: ev.target.value });
    }, []);

    const setPuzzleType = React.useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
        setState({
            puzzle: Object.assign({}, stateRef.current.puzzle, { puzzle_type: ev.target.value }),
        });
    }, []);

    const setDescription = React.useCallback((ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        setState({
            puzzle: Object.assign({}, stateRef.current.puzzle, {
                puzzle_description: ev.target.value,
            }),
        });
    }, []);

    const setSetupColor = React.useCallback(
        (color: string) => {
            navigation.checkAndEnterPuzzleMode();
            setState({ setup_color: color });
        },
        [navigation],
    );

    const setPuzzleSize = React.useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
        const size = parseInt(ev.target.value);
        setState({
            puzzle: Object.assign({}, stateRef.current.puzzle, { width: size, height: size }),
        });
        gobanOptsRef.current.width = size;
        gobanOptsRef.current.height = size;
        gobanRef.current?.load(gobanOptsRef.current);
        gobanRef.current?.redraw(true);
    }, []);

    const setPuzzleRank = React.useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
        setState({
            puzzle: Object.assign({}, stateRef.current.puzzle, {
                puzzle_rank: parseInt(ev.target.value),
            }),
        });
    }, []);

    const setInitialPlayer = React.useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
        const color = ev.target.value;
        const goban = gobanRef.current;
        if (goban) {
            goban.engine.jumpTo(goban.engine.move_tree);
            goban.engine.config.initial_player = color === "black" ? "black" : "white";
            goban.engine.player = color === "white" ? 2 : 1;
            goban.engine.resetMoveTree();
        }
        setState({
            puzzle: Object.assign({}, stateRef.current.puzzle, { initial_player: color }),
        });
    }, []);

    const setOpponentMoveMode = React.useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
        setState({
            puzzle: Object.assign({}, stateRef.current.puzzle, {
                puzzle_opponent_move_mode: ev.target.value,
            }),
        });
    }, []);

    const setPlayerMoveMode = React.useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
        setState({
            puzzle: Object.assign({}, stateRef.current.puzzle, {
                puzzle_player_move_mode: ev.target.value,
            }),
        });
    }, []);

    const deleteBranch = React.useCallback(() => {
        gobanRef.current?.deleteBranch();
    }, []);

    const updateMoveText = React.useCallback((ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        setState({ move_text: ev.target.value });
        const goban = gobanRef.current;
        if (goban) {
            goban.engine.cur_move.text = ev.target.value;
            goban.move_tree_redraw();
        }
    }, []);

    const setCorrectAnswer = React.useCallback(() => {
        const goban = gobanRef.current;
        if (goban) {
            goban.engine.cur_move.wrong_answer = false;
            goban.engine.cur_move.correct_answer = !goban.engine.cur_move.correct_answer;
            goban.move_tree_redraw();
        }
        forceRender();
    }, []);

    const setIncorrectAnswer = React.useCallback(() => {
        const goban = gobanRef.current;
        if (goban) {
            goban.engine.cur_move.correct_answer = false;
            goban.engine.cur_move.wrong_answer = !goban.engine.cur_move.wrong_answer;
            goban.move_tree_redraw();
        }
        forceRender();
    }, []);

    const deletePuzzle = React.useCallback(() => {
        void alert
            .fire({
                text: _("Are you sure you want to delete this puzzle?"),
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    del(`puzzles/${puzzleIdRef.current}`)
                        .then(() => {
                            // Jump to the next remaining puzzle in the
                            // collection if there is one, otherwise the
                            // user's puzzle list.
                            const s = stateRef.current;
                            const remaining = s.puzzle_collection_summary.filter(
                                (p) => p.id !== s.id,
                            );
                            if (remaining[0]?.id) {
                                browserHistory.push(`/puzzle/${remaining[0].id}?view-collection=1`);
                            } else {
                                browserHistory.push("/puzzles/");
                            }
                        })
                        .catch(errorAlerter);
                }
            });
    }, []);

    const showHint = React.useCallback(() => {
        const goban = gobanRef.current;
        if (!goban) {
            return;
        }

        if (stateRef.current.hintsOn) {
            removeHints();
        } else if (!goban.engine.cur_move.correct_answer) {
            const branches = goban.engine.cur_move.findBranchesWithCorrectAnswer();
            branches.forEach((branch) => {
                goban.setCustomMark(branch.x, branch.y, "hint", true);
            });
            setState({ hintsOn: true });
        }
    }, [removeHints]);

    const setMoveTreeContainer = React.useCallback((resizable: Resizable): void => {
        moveTreeContainerRef.current = resizable?.div ? resizable.div : undefined;
        const goban = gobanRef.current;
        if (goban && moveTreeContainerRef.current) {
            (goban as GobanRenderer).setMoveTreeContainer(moveTreeContainerRef.current);
        }
    }, []);

    const toggleCoordinates = React.useCallback(() => {
        const goban = gobanRef.current;
        if (!goban) {
            return;
        }

        let label_position = preferences.get("label-positioning-puzzles");
        switch (label_position) {
            case "all":
                label_position = "none";
                break;
            default:
                label_position = "all";
        }
        preferences.set("label-positioning-puzzles", label_position);
        goban.setLabelPosition(label_position);
        setState({ label_positioning: label_position });
    }, []);

    const setSetupColorBlack = React.useCallback(() => setSetupColor("black"), [setSetupColor]);
    const setSetupColorWhite = React.useCallback(() => setSetupColor("white"), [setSetupColor]);

    // --- Render helpers ---

    const goban = gobanRef.current;
    const controller = controllerRef.current;

    if (!state.loaded || !goban || !controller || !state.owner || !state.puzzle) {
        return <div />;
    }

    // Narrow owner/puzzle for both render paths. `collection` is only a full
    // record in play mode — the editor's new-puzzle path leaves it as `{}` —
    // so the stronger narrowing lives inside renderPlay below.
    const loadedState = state as PuzzleState & {
        owner: PlayerCacheEntry;
        puzzle: PuzzleConfig;
    };

    // The /puzzle/new flow has no saved collection yet, so several play-mode
    // tabs (library, settings, hint, back/skip) are meaningless. Show a
    // stripped-down GobanView with just the editor always visible.
    if (!state.collection?.id) {
        if (state.editing) {
            return renderNewPuzzle();
        }
        return <div />;
    }
    const playState = loadedState as typeof loadedState & { collection: PuzzleCollectionInfo };
    return renderPlay();

    function renderPlay(): React.ReactElement {
        let show_correct = state.show_correct;
        if (goban!.engine.move_tree.findBranchesWithCorrectAnswer().length === 0) {
            show_correct = true;
        }
        const turn_text =
            goban!.engine.colorToMove() === "black" ? _("Black to move") : _("White to move");

        const have_content: boolean =
            show_correct ||
            state.show_wrong ||
            !!goban!.engine.cur_move.text ||
            (!goban!.engine.cur_move.parent && !!goban!.engine.puzzle_description);

        const user = data.get("user");
        const is_owner = loadedState.owner.id === user.id;
        const is_owner_or_mod = is_owner || !!user?.is_moderator;
        const has_prev = findSiblingPuzzleId(state.puzzle_collection_summary, state.id, -1) !== 0;
        const has_next = findSiblingPuzzleId(state.puzzle_collection_summary, state.id, 1) !== 0;
        const at_start = !goban!.engine.cur_move.parent;

        return (
            <GobanView
                ref={gobanViewRef}
                controller={controller!}
                className="Puzzle"
                defaultActiveTakeover={view_collection_param ? "puzzle-library" : undefined}
            >
                {state.editing ? (
                    renderEditKBShortcuts()
                ) : (
                    <>
                        <KBShortcut shortcut="escape" action={doReset} />
                        <KBShortcut shortcut="left" action={undo} />
                    </>
                )}

                <GobanView.Tab
                    id="puzzle-settings"
                    icon="gear"
                    type="takeover"
                    title={_("Puzzle settings")}
                >
                    <PuzzleSettings
                        transform_x={state.transform_x}
                        transform_h={state.transform_h}
                        transform_v={state.transform_v}
                        transform_color={state.transform_color}
                        zoom={state.zoom}
                        zoomable={!!state.zoomable}
                        position_transform_enabled={
                            !!playState.collection.position_transform_enabled
                        }
                        color_transform_enabled={!!playState.collection.color_transform_enabled}
                        label_positioning={state.label_positioning}
                        owner_id={loadedState.owner.id}
                        collection_id={playState.collection.id}
                        collection_private={!!playState.collection.private}
                        onToggleTransformX={toggle_transform_x}
                        onToggleTransformH={toggle_transform_h}
                        onToggleTransformV={toggle_transform_v}
                        onToggleTransformColor={toggle_transform_color}
                        onToggleZoom={toggle_transform_zoom}
                        onToggleCoordinates={toggleCoordinates}
                        onRandomizeChange={onRandomizeChange}
                        onToggleCollectionFlag={toggleCollectionFlag}
                    />
                </GobanView.Tab>

                <GobanView.Tab
                    id="puzzle-library"
                    icon="book"
                    type="takeover"
                    title={_("Puzzle collection")}
                >
                    <PuzzleLibrary
                        collection_id={playState.collection.id}
                        collection_name={playState.collection.name}
                        current_id={state.id}
                        items={state.puzzle_collection_summary}
                        can_edit={is_owner_or_mod}
                        onRenameCollection={renameCollection}
                        onDeletePuzzle={deletePuzzleFromCollection}
                        onReorderPuzzle={reorderPuzzle}
                    />
                </GobanView.Tab>

                {is_owner_or_mod && (
                    <GobanView.Tab
                        id="puzzle-edit"
                        icon="pencil"
                        type="takeover"
                        title={_("Edit puzzle")}
                        onToggle={handleEditToggle}
                    >
                        {renderEditPanel()}
                    </GobanView.Tab>
                )}

                <GobanView.Tab id="puzzle-controls" type="always">
                    <div className="puzzle-controls-top">
                        {!show_correct && !state.show_wrong && (
                            <div className="game-state">{turn_text}</div>
                        )}
                        {(have_content || null) && renderPuzzleContent(show_correct)}
                    </div>
                    <div className="puzzle-controls-bottom">
                        {state.rated && (
                            <div className="rate-puzzle rate-puzzle-compact">
                                <StarRating
                                    value={state.my_rating}
                                    rated={state.rated}
                                    onChange={ratePuzzle}
                                />
                            </div>
                        )}
                        <PuzzleInfo
                            name={state.name}
                            collection_name={playState.collection.name}
                            owner={loadedState.owner}
                            rank={state.rank || 0}
                        />
                    </div>
                </GobanView.Tab>

                <GobanView.Tab
                    id="puzzle-hint"
                    icon="lightbulb-o"
                    type="action"
                    align="center"
                    title={pgettext("Receive a puzzle hint", "Hint")}
                    active={state.hintsOn}
                    onClick={showHint}
                />

                {at_start ? (
                    <GobanView.Tab
                        id="puzzle-back"
                        icon="step-backward"
                        type="action"
                        align="right"
                        title={pgettext("Go to the previous puzzle", "Previous puzzle")}
                        disabled={!has_prev}
                        onClick={previousPuzzle}
                    />
                ) : (
                    <GobanView.Tab
                        id="puzzle-reset"
                        icon="refresh"
                        type="action"
                        align="right"
                        title={pgettext("Reset the puzzle to its starting position", "Reset")}
                        onClick={doReset}
                    />
                )}

                <GobanView.Tab
                    id="puzzle-skip"
                    icon="step-forward"
                    type="action"
                    align="right"
                    title={pgettext("Skip to the next puzzle", "Skip")}
                    disabled={!has_next}
                    onClick={skipPuzzle}
                />
            </GobanView>
        );
    }

    function renderPuzzleContent(show_correct: boolean | undefined): React.ReactElement {
        if (!goban) {
            return <div />;
        }

        const next_id = findSiblingPuzzleId(state.puzzle_collection_summary, state.id, 1);

        return (
            <div className="puzzle-node-content">
                {(show_correct || null) && (
                    <Link to={next_id ? `/puzzle/${next_id}` : `#`} className="success">
                        <i className="fa fa-check-circle-o"></i> {_("Correct!")}
                    </Link>
                )}

                {(state.show_wrong || null) && (
                    <>
                        <div className="incorrect">
                            <i className="fa fa-times-circle-o reject-text"></i> {_("Incorrect")}
                        </div>
                        <div className="try-again">
                            <button className="try-again-button" onClick={doReset}>
                                <i className="fa fa-refresh"></i> {_("Try again")}
                            </button>
                        </div>
                    </>
                )}

                <div className="content">
                    {(goban.engine.cur_move.parent == null || null) && (
                        <Markdown source={goban.engine.puzzle_description} />
                    )}
                    {(goban.engine.cur_move.text || null) && (
                        <Markdown source={goban.engine.cur_move.text} />
                    )}
                </div>

                {(show_correct || null) && (
                    <>
                        <div className="rate-puzzle">
                            <div className="rate-puzzle-label">{_("Rate puzzle")}</div>
                            <StarRating
                                value={state.rated ? state.my_rating : (state.rating ?? 0)}
                                rated={state.rated}
                                onChange={ratePuzzle}
                            />
                        </div>
                        <div className="actions">
                            {((next_id !== 0 && next_id !== state.id) || null) && (
                                <Link
                                    ref={next_link}
                                    to={`/puzzle/${next_id}`}
                                    className="btn primary"
                                >
                                    {_("Next")}
                                </Link>
                            )}
                            {(next_id === 0 || null) && (
                                <div>
                                    <h3>{_("You have reached the end of this collection")}</h3>
                                    <Link to="/puzzles/" className="primary">
                                        {_("Back to Puzzle List")}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    function renderNewPuzzle(): React.ReactElement {
        return (
            <GobanView controller={controller!} className="Puzzle">
                {renderEditKBShortcuts()}
                <GobanView.Tab id="puzzle-edit" type="always">
                    {renderEditPanel()}
                </GobanView.Tab>
            </GobanView>
        );
    }

    function renderEditKBShortcuts(): React.ReactElement {
        return (
            <>
                <KBShortcut shortcut="up" action={navigation.nav_up} />
                <KBShortcut shortcut="down" action={navigation.nav_down} />
                <KBShortcut shortcut="left" action={navigation.nav_prev} />
                <KBShortcut shortcut="right" action={navigation.nav_next} />
                <KBShortcut shortcut="page-up" action={navigation.nav_prev_10} />
                <KBShortcut shortcut="page-down" action={navigation.nav_next_10} />
                <KBShortcut shortcut="home" action={navigation.nav_first} />
                <KBShortcut shortcut="end" action={navigation.nav_last} />
                <KBShortcut shortcut="del" action={set_analyze_tool.delete_branch} />
            </>
        );
    }

    function renderEditPanel(): React.ReactElement {
        return (
            <>
                <div className="btn-group">
                    <button
                        className={state.edit_step === "setup" ? "active" : ""}
                        onClick={setSetupStep}
                    >
                        {_("Setup")}
                    </button>
                    <button
                        className={state.edit_step === "moves" ? "active" : ""}
                        onClick={setMovesStep}
                    >
                        {_("Moves")}
                    </button>
                </div>

                {(state.edit_step === "setup" || null) && (
                    <div>
                        <div className="space-around padded">
                            <select
                                ref={ref_collection}
                                value={loadedState.puzzle.puzzle_collection}
                                onChange={setPuzzleCollection}
                            >
                                <option value={0}> -- {_("Select collection")} -- </option>
                                {state.puzzle_collections?.map((e, idx) => (
                                    <option key={idx} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                                <option value={"new"}> -- {_("Create collection")} -- </option>
                            </select>
                        </div>

                        <div className="padded">
                            <input
                                ref={ref_name}
                                type="text"
                                value={state.name}
                                onChange={setName}
                                placeholder={_("Puzzle name")}
                            ></input>
                        </div>

                        <div className="padded">
                            <div className="space-around">
                                <select
                                    ref={ref_puzzle_type}
                                    value={loadedState.puzzle.puzzle_type}
                                    onChange={setPuzzleType}
                                >
                                    <option value="">-- {_("Type")} --</option>
                                    <option value="life_and_death">{_("Life and Death")}</option>
                                    <option value="joseki">{_("Joseki")}</option>
                                    <option value="fuseki">{_("Fuseki")}</option>
                                    <option value="tesuji">{_("Tesuji")}</option>
                                    <option value="best_move">{_("Best Move")}</option>
                                    <option value="endgame">{_("End Game")}</option>
                                    <option value="elementary">{_("Elementary")}</option>
                                </select>

                                <select value={loadedState.puzzle.width} onChange={setPuzzleSize}>
                                    <option value={19}>{_("19x19")}</option>
                                    <option value={17}>{_("17x17")}</option>
                                    <option value={15}>{_("15x15")}</option>
                                    <option value={13}>{_("13x13")}</option>
                                    <option value={11}>{_("11x11")}</option>
                                    <option value={9}>{_("9x9")}</option>
                                    <option value={7}>{_("7x7")}</option>
                                    <option value={5}>{_("5x5")}</option>
                                    <option value={4}>{_("4x4")}</option>
                                </select>

                                <select
                                    value={loadedState.puzzle.puzzle_rank}
                                    onChange={setPuzzleRank}
                                >
                                    {ranks.map((e, idx) => (
                                        <option key={idx} value={e.rank}>
                                            {e.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="padded">
                            <textarea
                                rows={7}
                                value={loadedState.puzzle.puzzle_description}
                                onChange={setDescription}
                                placeholder={_("Describe the objective of this problem")}
                            ></textarea>
                        </div>

                        <dl className="horizontal">
                            <dt>{_("Place stones")}</dt>
                            <dd>
                                <div className="btn-group">
                                    <button
                                        onClick={setSetupColorBlack}
                                        className={state.setup_color === "black" ? "active" : ""}
                                    >
                                        <img
                                            width="16px"
                                            height="16px"
                                            alt="black"
                                            src={data.get("config.cdn_release") + "/img/black.png"}
                                        />
                                    </button>
                                    <button
                                        onClick={setSetupColorWhite}
                                        className={state.setup_color === "white" ? "active" : ""}
                                    >
                                        <img
                                            width="16px"
                                            height="16px"
                                            alt="white"
                                            src={data.get("config.cdn_release") + "/img/white.png"}
                                        />
                                    </button>
                                </div>
                            </dd>

                            <dt>{_("Player color")}</dt>
                            <dd>
                                <select
                                    value={loadedState.puzzle.initial_player}
                                    onChange={setInitialPlayer}
                                >
                                    <option value="black">{_("Black")}</option>
                                    <option value="white">{_("White")}</option>
                                </select>
                            </dd>

                            <dt>
                                {interpolate(
                                    pgettext(
                                        "Puzzle move mode for specified color",
                                        "{{color}} move mode",
                                    ),
                                    {
                                        color:
                                            loadedState.puzzle.initial_player === "black"
                                                ? _("Black")
                                                : _("White"),
                                    },
                                )}
                            </dt>
                            <dd>
                                <select
                                    value={loadedState.puzzle.puzzle_player_move_mode}
                                    onChange={setPlayerMoveMode}
                                >
                                    <option value="free">{_("Free placement")}</option>
                                    <option value="fixed">
                                        {_("Only allow on specified paths")}
                                    </option>
                                </select>
                            </dd>

                            <dt>
                                {interpolate(
                                    pgettext(
                                        "Puzzle move mode for specified color",
                                        "{{color}} move mode",
                                    ),
                                    {
                                        color:
                                            loadedState.puzzle.initial_player === "black"
                                                ? _("White")
                                                : _("Black"),
                                    },
                                )}
                            </dt>
                            <dd>
                                <select
                                    value={loadedState.puzzle.puzzle_opponent_move_mode}
                                    onChange={setOpponentMoveMode}
                                >
                                    <option value="automatic">{_("Automatic")}</option>
                                    <option value="manual">{_("Player controlled")}</option>
                                </select>
                            </dd>
                        </dl>

                        <div className="space-around">
                            {(puzzle_id !== "new" || null) && (
                                <button className="reject" onClick={deletePuzzle}>
                                    {_("Remove puzzle")}
                                </button>
                            )}
                            <button className="primary" onClick={setMovesStep}>
                                {_("Next")} &rarr;
                            </button>
                        </div>
                    </div>
                )}
                {(state.edit_step === "moves" || null) && (
                    <div>
                        <div className="padded space-between">
                            <button
                                onClick={set_analyze_tool.stone_alternate}
                                className={
                                    "stone-button " +
                                    (state.analyze_tool === "stone" &&
                                    state.analyze_subtool !== "black" &&
                                    state.analyze_subtool !== "white"
                                        ? "active"
                                        : "")
                                }
                            >
                                <img
                                    alt="alternate"
                                    width="16px"
                                    height="16px"
                                    src={data.get("config.cdn_release") + "/img/black-white.png"}
                                />
                            </button>

                            <div className="btn-group">
                                <button
                                    onClick={set_analyze_tool.label_letters}
                                    className={
                                        state.analyze_tool === "label" &&
                                        state.analyze_subtool === "letters"
                                            ? "active"
                                            : ""
                                    }
                                >
                                    <i className="fa fa-font"></i>
                                </button>
                                <button
                                    onClick={set_analyze_tool.label_numbers}
                                    className={
                                        state.analyze_tool === "label" &&
                                        state.analyze_subtool === "numbers"
                                            ? "active"
                                            : ""
                                    }
                                >
                                    <i className="ogs-label-number"></i>
                                </button>
                                <button
                                    onClick={set_analyze_tool.label_triangle}
                                    className={
                                        state.analyze_tool === "label" &&
                                        state.analyze_subtool === "triangle"
                                            ? "active"
                                            : ""
                                    }
                                >
                                    <i className="ogs-label-triangle"></i>
                                </button>
                                <button
                                    onClick={set_analyze_tool.label_square}
                                    className={
                                        state.analyze_tool === "label" &&
                                        state.analyze_subtool === "square"
                                            ? "active"
                                            : ""
                                    }
                                >
                                    <i className="ogs-label-square"></i>
                                </button>
                                <button
                                    onClick={set_analyze_tool.label_circle}
                                    className={
                                        state.analyze_tool === "label" &&
                                        state.analyze_subtool === "circle"
                                            ? "active"
                                            : ""
                                    }
                                >
                                    <i className="ogs-label-circle"></i>
                                </button>
                                <button
                                    onClick={set_analyze_tool.label_cross}
                                    className={
                                        state.analyze_tool === "label" &&
                                        state.analyze_subtool === "cross"
                                            ? "active"
                                            : ""
                                    }
                                >
                                    <i className="ogs-label-x"></i>
                                </button>
                            </div>

                            <button onClick={deleteBranch}>
                                <i className="fa fa-trash"></i>
                            </button>
                        </div>

                        <Resizable
                            id="move-tree-container"
                            className="vertically-resizable"
                            ref={setMoveTreeContainer}
                        />

                        <textarea
                            id="game-move-node-text"
                            placeholder={_("Move notes")}
                            rows={5}
                            value={state.move_text}
                            onChange={updateMoveText}
                        ></textarea>

                        <div className="space-around padded">
                            <button
                                className={goban!.engine.cur_move.correct_answer ? " success" : ""}
                                onClick={setCorrectAnswer}
                            >
                                {_("Correct answer") /* translators: Correct puzzle move */}
                            </button>

                            <button
                                className={goban!.engine.cur_move.wrong_answer ? " reject" : ""}
                                onClick={setIncorrectAnswer}
                            >
                                {_("Wrong answer") /* translators: Correct puzzle move */}
                            </button>
                        </div>

                        <div className="space-around">
                            <button onClick={setSetupStep}>&larr; {_("Setup")}</button>
                            <button className="primary" onClick={save}>
                                {_("Save")}
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    }
}
