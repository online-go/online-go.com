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
import { Link, useParams } from "react-router-dom";
import { browserHistory } from "@/lib/ogsHistory";
import { _, pgettext, interpolate } from "@/lib/translate";
import { abort_requests_in_flight, post, put, del } from "@/lib/requests";
import { KBShortcut } from "@/components/KBShortcut";
import { goban_view_mode, goban_view_squashed } from "@/views/Game";
import { errorAlerter, errorLogger, ignore } from "@/lib/misc";
import { longRankString, rankList } from "@/lib/rank_utils";
import { GobanRendererConfig, GobanRenderer, PuzzlePlacementSetting } from "goban";
import { GobanController } from "@/lib/GobanController";
import { Markdown } from "@/components/Markdown";
import { Player } from "@/components/Player";
import { StarRating } from "@/components/StarRating";
import { Resizable } from "@/components/Resizable";
import * as preferences from "@/lib/preferences";
import * as data from "@/lib/data";
import { TransformSettings, PuzzleTransform } from "./PuzzleTransform";
import { PuzzleNavigation } from "./PuzzleNavigation";
import { PuzzleEditor, getAllPuzzleCollections } from "./PuzzleEditing";
import { GobanContainer } from "@/components/GobanContainer";
import { alert } from "@/lib/swal_config";
import { PopOver, popover } from "@/lib/popover";
import { PuzzleSettingsModal } from "./PuzzleSettingsModal";
import "./Puzzle.css";

type TransformationOptions = "x" | "h" | "v" | "color" | "zoom";

interface PuzzleState {
    puzzle?: any;
    show_wrong?: boolean;
    show_correct?: boolean;
    show_warning?: boolean;
    owner?: any;
    name?: string;
    rank?: number;
    id?: number;
    rating?: number;
    editing?: boolean;
    zoomable?: boolean;

    view_mode: string;
    squashed: boolean;
    loaded: boolean;
    edit_step: string;
    setup_color: string;
    puzzle_collection_summary: Array<any>;
    puzzle_collections?: any;
    hintsOn: boolean;

    analyze_tool?: string;
    analyze_subtool?: string;
    analyze_pencil_color?: string;
    move_text?: string;

    my_rating: number;
    rated: boolean;
    zoom: boolean;
    collection: any;
    transform_color: boolean;
    transform_h: boolean;
    transform_v: boolean;
    transform_x: boolean;
    label_positioning: string;
}

const ranks = rankList(0, 38, false);

function createInitialState(): PuzzleState {
    return {
        view_mode: goban_view_mode(),
        squashed: goban_view_squashed(),
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

export function Puzzle(): React.ReactElement {
    const { puzzle_id } = useParams<{ puzzle_id: string }>();
    const [state, setState] = React.useReducer(mergeState, null, createInitialState);
    const [, forceRender] = React.useReducer(incrementReducer, 0);

    // Mutable instance refs (created once, persist across renders)
    const transformRef = React.useRef<PuzzleTransform>(null);
    const navigationRef = React.useRef<PuzzleNavigation>(null);
    const editorRef = React.useRef<PuzzleEditor>(null);
    const gobanDivRef = React.useRef<HTMLDivElement>(null);
    const gobanRef = React.useRef<GobanRenderer | null>(null);
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
    const ref_transform_x_button = React.useRef<HTMLButtonElement>(null);
    const ref_transform_h_button = React.useRef<HTMLButtonElement>(null);
    const ref_transform_v_button = React.useRef<HTMLButtonElement>(null);
    const ref_transform_color_button = React.useRef<HTMLButtonElement>(null);
    const ref_transform_zoom_button = React.useRef<HTMLButtonElement>(null);
    const ref_settings_button = React.useRef<HTMLButtonElement>(null);
    const ref_edit_button = React.useRef<HTMLButtonElement>(null);
    const ref_hint_button = React.useRef<HTMLButtonElement>(null);
    const ref_toggle_coordinates_button = React.useRef<HTMLButtonElement>(null);
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
            const opts: GobanRendererConfig = editor.reset(
                gobanDiv,
                !!editing,
                replacementSettingFunction,
            );

            opts.move_tree_container = moveTreeContainerRef.current;
            gobanOptsRef.current = opts;

            if (gobanRef.current) {
                gobanRef.current.destroy();
            }
            const controller = new GobanController(opts);
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
                reset(editing);
                setState(newState);
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

    React.useEffect(() => {
        // Reinitialize
        if (gobanRef.current) {
            gobanRef.current.destroy();
            gobanRef.current = null;
            navigation.goban = null as unknown as GobanRenderer;
        }
        while (gobanDiv.firstChild) {
            gobanDiv.removeChild(gobanDiv.firstChild);
        }
        editor.clearPuzzles();

        setState({
            loaded: false,
            puzzle_collection_summary: [],
            show_correct: false,
            show_wrong: false,
            editing: false,
            hintsOn: false,
        });

        window.document.title = _("Puzzle");
        fetchPuzzle(parseInt(puzzle_id!));

        return () => {
            abort_requests_in_flight("puzzles/", "GET");
            if (gobanRef.current) {
                gobanRef.current.destroy();
                gobanRef.current = null;
                navigation.goban = null as unknown as GobanRenderer;
            }
        };
    }, [puzzle_id, fetchPuzzle, editor, navigation, gobanDiv]);

    // --- Event handlers ---

    const onResize = React.useCallback(() => {
        const squashed = goban_view_squashed();
        const view_mode = goban_view_mode();
        if (stateRef.current.squashed !== squashed || stateRef.current.view_mode !== view_mode) {
            setState({ squashed, view_mode });
        }
    }, []);

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

    const jumpToPuzzle = React.useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
        browserHistory.push(`/puzzle/${ev.target.value}`);
    }, []);

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
        },
        [puzzle_id],
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

    const toggle_transform_x = React.useCallback(() => {
        ref_transform_x_button.current?.blur();
        setTransformation("x");
    }, [setTransformation]);

    const toggle_transform_h = React.useCallback(() => {
        ref_transform_h_button.current?.blur();
        setTransformation("h");
    }, [setTransformation]);

    const toggle_transform_v = React.useCallback(() => {
        ref_transform_v_button.current?.blur();
        setTransformation("v");
    }, [setTransformation]);

    const toggle_transform_color = React.useCallback(() => {
        ref_transform_color_button.current?.blur();
        setTransformation("color");
    }, [setTransformation]);

    const toggle_transform_zoom = React.useCallback(() => {
        ref_transform_zoom_button.current?.blur();
        setTransformation("zoom");
    }, [setTransformation]);

    const save = React.useCallback(() => {
        const goban = gobanRef.current;
        const s = stateRef.current;
        const pid = puzzleIdRef.current;
        if (!goban) {
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
                .then(() => {
                    browserHistory.push(`/puzzle-collection/${puzzle.puzzle_collection}`);
                })
                .catch(errorAlerter);
        }
    }, []);

    const edit = React.useCallback(() => {
        ref_edit_button.current?.blur();

        getAllPuzzleCollections(data.get("user").id)
            .then((collections) => {
                setState({
                    editing: true,
                    puzzle_collections: collections,
                });
                reset(true);
            })
            .catch(errorAlerter);
    }, [reset]);

    const openPuzzleSettings = React.useCallback(
        (ev: React.MouseEvent) => {
            const puzzle_settings = openPuzzleSettingsControls(ev);

            const randomize_transform = preferences.get("puzzle.randomize.transform");
            const randomize_color = preferences.get("puzzle.randomize.color");

            ref_settings_button.current?.blur();

            puzzle_settings.on("close", () => {
                if (
                    randomize_transform !== preferences.get("puzzle.randomize.transform") ||
                    randomize_color !== preferences.get("puzzle.randomize.color")
                ) {
                    fetchPuzzle(parseInt(puzzleIdRef.current!));
                }
            });
        },
        [fetchPuzzle],
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
        if (!(s.puzzle.puzzle_collection > 0)) {
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
                        .then(() =>
                            browserHistory.push(
                                `/puzzle-collection/${stateRef.current.puzzle.puzzle_collection}`,
                            ),
                        )
                        .catch(errorAlerter);
                }
            });
    }, []);

    const showHint = React.useCallback(() => {
        ref_hint_button.current?.blur();
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

    if (state.editing) {
        return renderEdit();
    }
    return renderPlay();

    function renderPlay(): React.ReactElement {
        if (!state.loaded || !goban) {
            return <div />;
        }

        const view_mode = state.view_mode;
        const squashed = state.squashed;

        let show_correct = state.show_correct;
        if (goban.engine.move_tree.findBranchesWithCorrectAnswer().length === 0) {
            show_correct = true;
        }
        const turn_text =
            goban.engine.colorToMove() === "black" ? _("Black to move") : _("White to move");

        const have_content: boolean =
            show_correct ||
            state.show_wrong ||
            !!goban.engine.cur_move.text ||
            (!goban.engine.cur_move.parent && !!goban.engine.puzzle_description);

        return (
            <div className={`Puzzle ${view_mode} ${squashed ? "squashed" : ""}`}>
                <KBShortcut shortcut="escape" action={doReset} />
                <KBShortcut shortcut="left" action={undo} />

                <div className={"center-col"}>
                    <GobanContainer goban={goban} onResize={onResize} />
                </div>

                {(view_mode !== "portrait" || null) && (
                    <div className={"right-col"}>
                        {renderPuzzleInfo()}
                        {renderLayoutButtons()}
                        <hr />
                        {renderUndoResetButtons()}
                        {!show_correct && !state.show_wrong && (
                            <div className="game-state">{turn_text}</div>
                        )}
                        {(have_content || null) && renderPuzzleContent()}
                    </div>
                )}
                {(view_mode === "portrait" || null) && (
                    <div className={"right-col"}>
                        {renderLayoutButtons()}
                        <hr />
                        {renderUndoResetButtons()}
                        {!show_correct && !state.show_wrong && (
                            <div className="game-state">{turn_text}</div>
                        )}
                        {(have_content || null) && renderPuzzleContent()}
                        {renderPuzzleInfo()}
                    </div>
                )}
            </div>
        );
    }

    function renderPuzzleInfo(): React.ReactElement {
        const difficulty = longRankString(state.rank || 0);

        return (
            <dl className="horizontal">
                <dt>{_("Puzzle")}</dt>
                <dd>
                    <select value={puzzle_id} onChange={jumpToPuzzle} id="selected_puzzle">
                        {state.puzzle_collection_summary.map((p, idx) => (
                            <option key={idx} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </dd>
                <dt>{_("Collection")}</dt>
                <dd>{state.collection.name}</dd>
                <dt>{_("Difficulty")}</dt>
                <dd>{difficulty}</dd>
                <dt>{_("Rating")}</dt>
                <dd>
                    <StarRating
                        value={state.rated ? state.my_rating : (state.rating as number)}
                        rated={state.rated}
                        onChange={ratePuzzle}
                    />
                </dd>
                <dt>{_("Author")}</dt>
                <dd>
                    <Player user={state.owner} icon rank />
                </dd>
            </dl>
        );
    }

    function renderLayoutButtons(): React.ReactElement {
        return (
            <div className="btn-container">
                <div className="btn-group">
                    <button
                        type="button"
                        title={pgettext(
                            "Transform the stone positions in a puzzle",
                            "Flip diagonally",
                        )}
                        className={state.transform_x ? "active" : ""}
                        disabled={!state.collection.position_transform_enabled}
                        onClick={toggle_transform_x}
                        ref={ref_transform_x_button}
                    >
                        <i className="fa fa-expand"></i>
                    </button>
                    <button
                        type="button"
                        title={pgettext(
                            "Transform the stone positions in a puzzle",
                            "Flip horizontally",
                        )}
                        className={state.transform_h ? "active" : ""}
                        disabled={!state.collection.position_transform_enabled}
                        onClick={toggle_transform_h}
                        ref={ref_transform_h_button}
                    >
                        <i className="fa fa-arrows-h"></i>
                    </button>
                    <button
                        type="button"
                        title={pgettext(
                            "Transform the stone positions in a puzzle",
                            "Flip vertically",
                        )}
                        className={state.transform_v ? "active" : ""}
                        disabled={!state.collection.position_transform_enabled}
                        onClick={toggle_transform_v}
                        ref={ref_transform_v_button}
                    >
                        <i className="fa fa-arrows-v"></i>
                    </button>
                    <button
                        type="button"
                        title={pgettext(
                            "Transform the colors of the stones in a puzzle",
                            "Reverse colors",
                        )}
                        className={state.transform_color ? "active" : ""}
                        disabled={!state.collection.color_transform_enabled}
                        onClick={toggle_transform_color}
                        ref={ref_transform_color_button}
                    >
                        <i className="fa fa-adjust" />
                    </button>
                    {(state.zoomable || null) && (
                        <button
                            type="button"
                            title={pgettext(
                                "Toggle zoom when viewing a puzzle (whole board or only some stones)",
                                "Toggle zoom",
                            )}
                            className={state.zoom ? "active" : ""}
                            onClick={toggle_transform_zoom}
                            ref={ref_transform_zoom_button}
                        >
                            <i className="fa fa-arrows-alt"></i>
                        </button>
                    )}

                    <button
                        type="button"
                        title={pgettext(
                            "Show or hide coordinates when viewing a puzzle",
                            "Toggle coordinates",
                        )}
                        className={state.label_positioning === "all" ? "active" : ""}
                        onClick={toggleCoordinates}
                        ref={ref_toggle_coordinates_button}
                    >
                        <i className="ogs-coordinates"></i>
                    </button>

                    <button
                        type="button"
                        title={_("Open puzzle settings")}
                        onClick={openPuzzleSettings}
                        ref={ref_settings_button}
                    >
                        <i className="fa fa-gear" />
                    </button>

                    {(state.owner.id === data.get("user").id || null) && (
                        <button title={_("Edit")} onClick={edit} ref={ref_edit_button}>
                            <i className="fa fa-pencil"></i>
                        </button>
                    )}
                    <button
                        type="button"
                        className={state.hintsOn ? "active" : ""}
                        onClick={showHint}
                        ref={ref_hint_button}
                    >
                        {pgettext("Receive a puzzle hint", "Hint")}
                    </button>
                </div>
            </div>
        );
    }

    function renderUndoResetButtons(): React.ReactElement {
        if (!goban) {
            return <div />;
        }

        return (
            <div style={{ visibility: goban.engine.cur_move.parent ? "visible" : "hidden" }}>
                <button className="" onClick={undo}>
                    <i className="fa fa-step-backward"></i> {_("Undo")}
                </button>
                <button className="danger pull-right" onClick={doReset}>
                    <i className="fa fa-refresh"></i> {_("Reset")}
                </button>
            </div>
        );
    }

    function renderPuzzleContent(): React.ReactElement {
        if (!goban) {
            return <div />;
        }

        const show_correct = state.show_correct;

        let next_id = 0;
        const ids = state.puzzle_collection_summary
            .map((p) => p.id)
            .filter((id) => id !== state.id);
        let random_id = 0;
        if (ids.length > 0) {
            random_id = ids[Math.floor(Math.random() * ids.length)];
        }
        for (let i = 0; i < state.puzzle_collection_summary.length - 1; ++i) {
            if (state.puzzle_collection_summary[i].id === state.id) {
                next_id = state.puzzle_collection_summary[i + 1].id;
            }
        }

        return (
            <div className="puzzle-node-content">
                {(show_correct || null) && (
                    <Link to={next_id ? `/puzzle/${next_id}` : `#`} className="success">
                        <i className="fa fa-check-circle-o"></i> {_("Correct!")}
                    </Link>
                )}

                {(state.show_wrong || null) && (
                    <div className="incorrect">
                        <i className="fa fa-times-circle-o reject-text"></i> {_("Incorrect")}
                    </div>
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
                    <div className="actions">
                        {(random_id !== 0 || null) && (
                            <Link
                                ref={next_link}
                                to={`/puzzle/${random_id}`}
                                className="btn danger"
                            >
                                {_("Random")}
                            </Link>
                        )}
                        {((next_id !== 0 && next_id !== state.id) || null) && (
                            <Link ref={next_link} to={`/puzzle/${next_id}`} className="btn primary">
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
                )}
            </div>
        );
    }

    function renderEdit(): React.ReactElement {
        if (!state.loaded || !goban) {
            return <div />;
        }

        const view_mode = state.view_mode;
        const squashed = state.squashed;

        return (
            <div className={`Puzzle ${view_mode} ${squashed ? "squashed" : ""}`}>
                <KBShortcut shortcut="up" action={navigation.nav_up} />
                <KBShortcut shortcut="down" action={navigation.nav_down} />
                <KBShortcut shortcut="left" action={navigation.nav_prev} />
                <KBShortcut shortcut="right" action={navigation.nav_next} />
                <KBShortcut shortcut="page-up" action={navigation.nav_prev_10} />
                <KBShortcut shortcut="page-down" action={navigation.nav_next_10} />
                <KBShortcut shortcut="home" action={navigation.nav_first} />
                <KBShortcut shortcut="end" action={navigation.nav_last} />

                <KBShortcut shortcut="del" action={set_analyze_tool.delete_branch} />

                <div className={"center-col"}>
                    <GobanContainer goban={goban} onResize={onResize} />
                </div>
                <div className={"right-col"}>
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
                                    value={state.puzzle.puzzle_collection}
                                    onChange={setPuzzleCollection}
                                >
                                    <option value={0}> -- {_("Select collection")} -- </option>
                                    {state.puzzle_collections.map((e: any, idx: number) => (
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
                                        value={state.puzzle.puzzle_type}
                                        onChange={setPuzzleType}
                                    >
                                        <option value="">-- {_("Type")} --</option>
                                        <option value="life_and_death">
                                            {_("Life and Death")}
                                        </option>
                                        <option value="joseki">{_("Joseki")}</option>
                                        <option value="fuseki">{_("Fuseki")}</option>
                                        <option value="tesuji">{_("Tesuji")}</option>
                                        <option value="best_move">{_("Best Move")}</option>
                                        <option value="endgame">{_("End Game")}</option>
                                        <option value="elementary">{_("Elementary")}</option>
                                    </select>

                                    <select value={state.puzzle.width} onChange={setPuzzleSize}>
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
                                        value={state.puzzle.puzzle_rank}
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
                                    value={state.puzzle.puzzle_description}
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
                                            className={
                                                state.setup_color === "black" ? "active" : ""
                                            }
                                        >
                                            <img
                                                width="16px"
                                                height="16px"
                                                alt="black"
                                                src={
                                                    data.get("config.cdn_release") +
                                                    "/img/black.png"
                                                }
                                            />
                                        </button>
                                        <button
                                            onClick={setSetupColorWhite}
                                            className={
                                                state.setup_color === "white" ? "active" : ""
                                            }
                                        >
                                            <img
                                                width="16px"
                                                height="16px"
                                                alt="white"
                                                src={
                                                    data.get("config.cdn_release") +
                                                    "/img/white.png"
                                                }
                                            />
                                        </button>
                                    </div>
                                </dd>

                                <dt>{_("Player color")}</dt>
                                <dd>
                                    <select
                                        value={state.puzzle.initial_player}
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
                                                state.puzzle.initial_player === "black"
                                                    ? _("Black")
                                                    : _("White"),
                                        },
                                    )}
                                </dt>
                                <dd>
                                    <select
                                        value={state.puzzle.puzzle_player_move_mode}
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
                                                state.puzzle.initial_player === "black"
                                                    ? _("White")
                                                    : _("Black"),
                                        },
                                    )}
                                </dt>
                                <dd>
                                    <select
                                        value={state.puzzle.puzzle_opponent_move_mode}
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
                                        src={
                                            data.get("config.cdn_release") + "/img/black-white.png"
                                        }
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
                                    className={
                                        goban.engine.cur_move.correct_answer ? " success" : ""
                                    }
                                    onClick={setCorrectAnswer}
                                >
                                    {_("Correct answer") /* translators: Correct puzzle move */}
                                </button>

                                <button
                                    className={goban.engine.cur_move.wrong_answer ? " reject" : ""}
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
                </div>
            </div>
        );
    }
}

export function openPuzzleSettingsControls(ev: React.MouseEvent): PopOver {
    const elt = ev.target;
    if (!(elt instanceof HTMLElement)) {
        return popover({
            elt: <PuzzleSettingsModal />,
            at: { x: 0, y: 0 },
            minWidth: 300,
            minHeight: 50,
        });
    }
    const rect = elt.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const offset = {
        left: rect.left + scrollLeft,
        top: rect.top + scrollTop,
    };

    if (!offset) {
        throw new Error("No offset");
    }

    return popover({
        elt: <PuzzleSettingsModal />,
        at: { x: offset.left, y: offset.top + elt.offsetHeight },
        minWidth: 300,
        minHeight: 50,
    });
}
