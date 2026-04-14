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

/* cspell: words cfilterid tfilterid sfilterid josekisources tagcounts playrecord */

/* A page for looking up and playing against josekis stored in the OGS OJE */

import * as React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import queryString from "query-string";

import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { _, interpolate, pgettext } from "@/lib/translate";
import { get, put, post } from "@/lib/requests";
import { KBShortcut } from "@/components/KBShortcut";
import { GobanRenderer, GobanRendererConfig, JGOFMove, createGoban } from "goban";
import { Player } from "@/components/Player";
import { JosekiAdmin } from "@/components/JosekiAdmin";
import { JosekiFilter } from "@/components/JosekiVariationFilter";
import { OJEJosekiTag } from "@/components/JosekiTagSelector";
import { Throbber } from "@/components/Throbber";
import { IdType } from "@/lib/types";
import { GobanContainer } from "@/components/GobanContainer";

import { ExplorePane } from "./ExplorePane";
import { PlayPane } from "./PlayPane";
import { EditPane } from "./EditPane";
import {
    server_url,
    prefetch_url,
    position_url,
    tag_count_url,
    MoveCategory,
    PageMode,
    ColorMap,
    bad_moves,
    MoveTypeWithComment,
} from "./joseki-utils";

import "./Joseki.css";

// Arrange translation of known joseki tags
// (these values come from the Joseki Tags table on the server)
try {
    pgettext("This is a Joseki Tag", "Joseki: Done");
    pgettext("This is a Joseki Tag", "Fuseki: Done");
    pgettext("This is a Joseki Tag", "Current");
    pgettext("This is a Joseki Tag", "Basic");
    pgettext("This is a Joseki Tag", "Position is settled");
    pgettext("This is a Joseki Tag", "Fighting pattern");
    pgettext("This is a Joseki Tag", "Black gets the corner");
    pgettext("This is a Joseki Tag", "Black gets the corner and top");
    pgettext("This is a Joseki Tag", "Black gets the corner and center");
    pgettext("This is a Joseki Tag", "Black gets the corner and right");
    pgettext("This is a Joseki Tag", "Black gets the corner, top and center");
    pgettext("This is a Joseki Tag", "Black gets the corner, top and right");
    pgettext("This is a Joseki Tag", "Black gets the corner, center and right");
    pgettext("This is a Joseki Tag", "Black gets the top");
    pgettext("This is a Joseki Tag", "Black gets the centre");
    pgettext("This is a Joseki Tag", "Black gets the right");
    pgettext("This is a Joseki Tag", "Black gets the top and centre");
    pgettext("This is a Joseki Tag", "Black gets the top and right");
    pgettext("This is a Joseki Tag", "Black gets the centre and right");
    pgettext("This is a Joseki Tag", "White gets the corner");
    pgettext("This is a Joseki Tag", "White gets the corner and top");
    pgettext("This is a Joseki Tag", "White gets the corner and center");
    pgettext("This is a Joseki Tag", "White gets the corner and right");
    pgettext("This is a Joseki Tag", "White gets the corner, top and center");
    pgettext("This is a Joseki Tag", "White gets the corner, top and right");
    pgettext("This is a Joseki Tag", "White gets the corner, center and right");
    pgettext("This is a Joseki Tag", "White gets the top");
    pgettext("This is a Joseki Tag", "White gets the centre");
    pgettext("This is a Joseki Tag", "White gets the right");
    pgettext("This is a Joseki Tag", "White gets the top and centre");
    pgettext("This is a Joseki Tag", "White gets the top and right");
    pgettext("This is a Joseki Tag", "White gets the centre and right");
    pgettext("This is a Joseki Tag", "Black gets sente");
    pgettext("This is a Joseki Tag", "White gets sente");

    // and move categories
    pgettext("Joseki move category", "Ideal");
    pgettext("Joseki move category", "Good");
    pgettext("Joseki move category", "Mistake");
    pgettext("Joseki move category", "Trick");
    pgettext("Joseki move category", "Question");
} catch (e) {
    console.log(e);
}

export function Joseki(): React.ReactElement {
    const { pos } = useParams<{ pos: string }>();
    const location = useLocation();

    // ---- State ----
    const [move_string, set_move_string] = React.useState("");
    const [current_node_id, set_current_node_id] = React.useState<string | undefined>(
        pos || "root",
    );
    const [most_recent_known_node, set_most_recent_known_node] = React.useState<
        string | undefined
    >();
    const [position_description, set_position_description] = React.useState("");
    const [see_also, set_see_also] = React.useState<number[]>([]);
    const [variation_label, set_variation_label] = React.useState("_");
    const [current_move_category, set_current_move_category] = React.useState("");
    const [pass_available, set_pass_available] = React.useState<boolean | string>(false);
    const [contributor_id, set_contributor_id] = React.useState(-1);
    const [child_count, set_child_count] = React.useState(0);
    const goban_container_left_padding = 0;

    const [throb, set_throb] = React.useState(false);

    const [mode, set_mode] = React.useState<PageMode>(PageMode.Explore);
    const [user_can_edit, set_user_can_edit] = React.useState(false);
    const [user_can_administer, set_user_can_administer] = React.useState(false);
    const [user_can_comment, set_user_can_comment] = React.useState(false);

    const [move_type_sequence, set_move_type_sequence] = React.useState<MoveTypeWithComment[]>([]);
    const [joseki_errors, set_joseki_errors] = React.useState(0);
    const [josekis_played, set_josekis_played] = React.useState<number | undefined>();
    const [josekis_completed, set_josekis_completed] = React.useState<number | undefined>();
    const [joseki_successes, set_joseki_successes] = React.useState<number | undefined>();
    const [joseki_best_attempt, set_joseki_best_attempt] = React.useState<number | undefined>();

    const [joseki_source, set_joseki_source] = React.useState<
        { url: string; description: string; id?: IdType } | undefined
    >();
    const [tags, set_tags] = React.useState<
        Array<{ description: string; group: number; id: number; [key: string]: string | number }>
    >([]);

    const [variation_filter, set_variation_filter_state] = React.useState<JosekiFilter>(
        {} as JosekiFilter,
    );

    const [count_details_open, set_count_details_open] = React.useState(false);
    const [tag_counts, set_tag_counts] = React.useState<{ tagname: string; count: number }[]>([]);
    const [counts_throb, set_counts_throb] = React.useState(false);

    const [db_locked_down, set_db_locked_down] = React.useState(true);

    const [current_comment_count, set_current_comment_count] = React.useState<number | undefined>();

    // ---- Refs for mutable instance variables ----
    const goban_div = React.useMemo(() => {
        const div = document.createElement("div");
        div.className = "Goban";
        return div;
    }, []);
    const goban_opts_ref = React.useRef<GobanRendererConfig>({} as GobanRendererConfig);
    const goban_ref = React.useRef<GobanRenderer | null>(null);

    // Function ref for goban callbacks -- declared early so the eager
    // goban init below can reference it. Updated every render (see below)
    // so the goban "update" handler always calls the latest onBoardUpdate.
    const on_board_update_ref = React.useRef<() => void>(() => {});

    // Eagerly create the initial goban on first render (matches class constructor
    // behavior) so GobanContainer always has a non-null goban to render.
    if (goban_ref.current === null) {
        const opts: GobanRendererConfig = {
            board_div: goban_div,
            interactive: true,
            mode: "puzzle",
            player_id: 0,
            server_socket: undefined,
            square_size: 20,
            stone_font_scale: preferences.get("stone-font-scale"),
        };
        goban_opts_ref.current = opts;
        goban_ref.current = createGoban(opts);
        goban_ref.current.setMode("puzzle");
        goban_ref.current.on("update", () => on_board_update_ref.current());
        (window as unknown as Record<string, unknown>).global_goban = goban_ref.current;
    }

    const joseki_tags_ref = React.useRef<OJEJosekiTag[] | undefined>(undefined);
    const the_joseki_tag_ref = React.useRef<OJEJosekiTag | undefined>(undefined);

    const last_server_position = React.useRef("");
    const last_placement_ref = React.useRef("");
    const next_moves_ref = React.useRef<Array<{ [key: string]: string | number }>>([]);
    const current_marks_ref = React.useRef<Array<{ label: string; position: string }>>([]);
    const load_sequence_to_board = React.useRef(false);
    const show_comments_requested = React.useRef(false);
    const previous_position_ref = React.useRef<{ [key: string]: string | number }>({});
    const back_stepping = React.useRef(false);
    const played_mistake = React.useRef(false);
    const computer_turn = React.useRef(false);
    const cached_positions_ref = React.useRef<{
        [id: string]: { [key: string]: string | number | boolean | null | object };
    }>({});
    const move_trace = React.useRef<string[]>([]);
    const trace_index = React.useRef(-1);
    const waiting_for = React.useRef("");

    const prefetching_ref = React.useRef(false);
    const prefetched_ref = React.useRef<{ [id: string]: boolean }>({});

    const last_click = React.useRef<number | undefined>(undefined);

    // ---- Ref to hold latest state for goban callbacks ----
    // Async fetch callbacks (.then handlers) and the goban "update" event
    // capture closures at registration time. This ref is updated every
    // render so those handlers always read current state values.
    const S = React.useRef({
        move_string,
        mode,
        current_move_category,
        most_recent_known_node,
        current_node_id,
        move_type_sequence,
        joseki_errors,
        count_details_open,
        variation_filter,
        throb,
    });
    S.current = {
        move_string,
        mode,
        current_move_category,
        most_recent_known_node,
        current_node_id,
        move_type_sequence,
        joseki_errors,
        count_details_open,
        variation_filter,
        throb,
    };

    // ---- Core functions ----

    function renderCurrentJosekiPosition() {
        const goban = goban_ref.current;
        if (!goban) {
            return;
        }
        const next_moves = next_moves_ref.current;
        const marks = current_marks_ref.current;
        goban.engine.cur_move.clearMarks();
        let new_options: { [k: string]: { move: string; color: string } } = {};
        let pass_avail: boolean | string = false;
        next_moves.forEach((option) => {
            new_options = {};
            if (option["placement"] === "pass") {
                pass_avail = (option["category"] as string).toLowerCase();
            } else {
                const label = option["variation_label"] as string;
                new_options[label] = {
                    move: goban.encodeMove(
                        goban.decodePrettyCoordinates(option["placement"] as string),
                    ),
                    color: ColorMap[option["category"] as string],
                };
            }
            goban.setColoredMarks(new_options);
        });

        set_pass_available(pass_avail);
        const new_marks: { [k: string]: string } = {};
        marks?.forEach((mark) => {
            const label = mark["label"];
            new_marks[label] = goban.encodeMove(goban.decodePrettyCoordinates(mark["position"]));
            goban.setMarks(new_marks);
        });
        goban.redraw(true);
    }

    function processNewJosekiPosition(position: {
        [key: string]: string | number | boolean | null | object;
    }) {
        set_position_description(position.description as string);
        set_see_also(position.see_also as number[]);
        set_contributor_id(position.contributor as number);
        set_variation_label(position.variation_label as string);
        set_current_move_category(position.category as string);
        set_current_node_id(position.node_id + "");
        set_current_comment_count(position.comment_count as number);
        set_joseki_source(
            position.joseki_source as { url: string; description: string; id?: IdType } | undefined,
        );
        set_tags(
            position.tags as Array<{
                description: string;
                group: number;
                id: number;
                [key: string]: string | number;
            }>,
        );
        set_child_count(position.child_count as number);
        set_db_locked_down(position.db_locked_down as boolean);

        waiting_for.current = "";
        last_server_position.current = position.play as string;
        last_placement_ref.current = position.placement as string;
        next_moves_ref.current = position.next_moves as Array<{ [key: string]: string | number }>;
        current_marks_ref.current = JSON.parse(position.marks as string) || [];
        previous_position_ref.current = position.parent as { [key: string]: string | number };

        if (S.current.mode !== PageMode.Play || S.current.move_string === "") {
            renderCurrentJosekiPosition();
        }

        window.history.replaceState({}, document.title, "/joseki/" + position.node_id);
    }

    function showVariationCounts(node_id: string) {
        set_tag_counts([]);
        set_count_details_open(true);
        set_counts_throb(true);

        get(tag_count_url(node_id))
            .then((body) => {
                let tag_list: Array<{
                    description: string;
                    group: number;
                    seq: number;
                    continuationCount: number;
                }> = [];
                if (body.tags) {
                    tag_list = body.tags.sort(
                        (t1: { group: number; seq: number }, t2: { group: number; seq: number }) =>
                            t1.group !== t2.group
                                ? Math.sign(t1.group - t2.group)
                                : Math.sign(t1.seq - t2.seq),
                    );
                }
                const counts: { tagname: string; count: number }[] = [];
                tag_list.forEach((t) => {
                    counts.push({ tagname: t.description, count: t.continuationCount });
                });
                set_tag_counts(counts);
                set_counts_throb(false);
            })
            .catch((r) => {
                console.log("Continuation Counts GET failed:", r);
            });
    }

    function extractPlayResults(results_dto: {
        josekis_played: number;
        josekis_completed: number;
        error_count: number;
        successes: number;
    }) {
        set_josekis_played(results_dto.josekis_played);
        set_josekis_completed(results_dto.josekis_completed);
        set_joseki_best_attempt(results_dto.error_count);
        set_joseki_successes(results_dto.successes);
    }

    function updatePlayerJosekiRecord(node_id: string) {
        if (!data.get("user").anonymous) {
            put(server_url + "playrecord", {
                position_id: node_id,
                errors: S.current.joseki_errors,
            })
                .then((body) => {
                    extractPlayResults(body);
                })
                .catch((r) => {
                    console.log("Play record PUT failed:", r);
                });
        }
    }

    function prefetchFor(node_id: string, filter: JosekiFilter) {
        if (!prefetching_ref.current) {
            if (!prefetched_ref.current[node_id]) {
                prefetching_ref.current = true;
                get(prefetch_url(node_id, filter, S.current.mode))
                    .then((body) => {
                        prefetching_ref.current = false;
                        prefetched_ref.current[node_id] = true;
                        body.forEach((move_info: { [key: string]: string | number }) => {
                            cached_positions_ref.current = {
                                [move_info["node_id"]]: move_info,
                                ...cached_positions_ref.current,
                            };
                        });
                    })
                    .catch((r) => {
                        prefetching_ref.current = false;
                        console.log("Node Prefetch failed:", r);
                        set_throb(false);
                    });
            }
        }
    }

    function processNewMoves(
        node_id: string,
        dto: { [key: string]: string | number | boolean | null | object },
    ) {
        if (load_sequence_to_board.current) {
            loadSequenceToBoard(dto.play as string);
            load_sequence_to_board.current = false;
        }

        processNewJosekiPosition(dto);

        if (S.current.count_details_open) {
            showVariationCounts(node_id);
        }

        if (S.current.mode === PageMode.Play) {
            const next = dto.next_moves as Array<{
                category: string;
                placement: string;
                node_id: number;
            }>;
            const good_moves = next.filter((move) => !bad_moves.includes(move.category));

            if (good_moves.length === 0 && !played_mistake.current) {
                set_move_type_sequence((prev) => [
                    ...prev,
                    { type: "complete", comment: _("Joseki!") },
                ]);
                updatePlayerJosekiRecord(node_id);
            }

            if (computer_turn.current) {
                computer_turn.current = false;
            } else if (next.length > 0 && S.current.move_string !== "") {
                const next_play = next[Math.floor(Math.random() * next.length)];

                computer_turn.current = true;
                if (next_play.placement === "pass") {
                    goban_ref.current!.pass();
                    on_board_update_ref.current();
                } else {
                    const loc = goban_ref.current!.engine.decodeMoves(next_play.placement)[0];
                    goban_ref.current!.engine.place(loc.x, loc.y);
                    on_board_update_ref.current();
                }
            }
        }

        set_throb(false);
        goban_ref.current!.enableStonePlacement();
    }

    function fetchNextFilteredMovesFor(node_id: string, filter: JosekiFilter) {
        if (!the_joseki_tag_ref.current) {
            return;
        }

        waiting_for.current = node_id;

        set_position_description("");
        set_throb(true);

        show_comments_requested.current = load_sequence_to_board.current
            ? show_comments_requested.current
            : false;

        if (
            S.current.mode === PageMode.Explore &&
            cached_positions_ref.current.hasOwnProperty(node_id)
        ) {
            processNewMoves(node_id, cached_positions_ref.current[node_id]);
            prefetchFor(node_id, filter);
        } else {
            get(position_url(node_id, filter, S.current.mode))
                .then((body) => {
                    const target_node = body;

                    if (
                        (waiting_for.current === "root" && target_node.placement === "root") ||
                        waiting_for.current === target_node.node_id.toString()
                    ) {
                        processNewMoves(node_id, target_node);
                        cached_positions_ref.current = {
                            [node_id]: target_node,
                            ...cached_positions_ref.current,
                        };
                    }
                })
                .catch((r) => {
                    console.log("Node GET failed:", r);
                    set_throb(false);
                });

            setTimeout(() => {
                prefetchFor(node_id, filter);
            }, 100);
        }
    }

    function fetchNextMovesFor(node_id: string) {
        fetchNextFilteredMovesFor(node_id, S.current.variation_filter);
    }

    function loadSequenceToBoard(sequence: string) {
        const ogs_move_string = sequence.substr(6).replace(/\./g, "").replace(/pass/g, "..");
        initializeGoban(ogs_move_string);
        on_board_update_ref.current();
    }

    function renderMistakeResult() {
        renderCurrentJosekiPosition();

        if (last_placement_ref.current !== "pass") {
            const new_options = {
                X: {
                    move: goban_ref.current!.encodeMove(
                        goban_ref.current!.decodePrettyCoordinates(last_placement_ref.current),
                    ),
                    color: ColorMap["MISTAKE"],
                },
            };
            goban_ref.current!.setColoredMarks(new_options);
        }
    }

    function processPlacement(move: { x: number; y: number } | undefined, ms: string) {
        const placement = move ? goban_ref.current!.prettyCoordinates(move.x, move.y) : "root";

        if (back_stepping.current) {
            back_stepping.current = false;
            if (S.current.mode === PageMode.Play) {
                played_mistake.current = false;
                goban_ref.current!.enableStonePlacement();
            } else if (S.current.current_move_category !== "new") {
                const stepping_back_to = previous_position_ref.current.node_id as string;
                fetchNextMovesFor(stepping_back_to);
                trace_index.current--;
                if (trace_index.current === -1) {
                    trace_index.current = 0;
                    move_trace.current.unshift(stepping_back_to);
                } else if (
                    move_trace.current[trace_index.current] !== stepping_back_to &&
                    move_trace.current[trace_index.current] !== "root"
                ) {
                    console.log(
                        "** whoa, move trace out of sync",
                        move_trace.current[trace_index.current],
                        stepping_back_to,
                    );
                    trace_index.current = 0;
                    move_trace.current = [stepping_back_to];
                }
            } else {
                const play = ".root." + ms.replace(/,/g, ".");
                if (play === last_server_position.current) {
                    if (S.current.most_recent_known_node) {
                        fetchNextMovesFor(S.current.most_recent_known_node);
                    }
                } else {
                    goban_ref.current!.enableStonePlacement();
                }
            }
        } else if (load_sequence_to_board.current) {
            goban_ref.current!.enableStonePlacement();
        } else {
            // they must have clicked a stone onto the board
            const chosen_move = next_moves_ref.current.find((m) => m.placement === placement);

            if (
                S.current.mode === PageMode.Play &&
                !computer_turn.current &&
                (chosen_move === undefined || bad_moves.includes(chosen_move.category as string))
            ) {
                played_mistake.current = true;
                last_placement_ref.current = placement;
            }

            if (chosen_move !== undefined && !played_mistake.current) {
                const node_id = chosen_move.node_id + "";
                fetchNextMovesFor(node_id);

                if (trace_index.current === move_trace.current.length - 1) {
                    move_trace.current.push(node_id);
                    trace_index.current++;
                } else {
                    if (node_id === move_trace.current[trace_index.current + 1]) {
                        trace_index.current++;
                    } else {
                        move_trace.current.length = trace_index.current + 1;
                        move_trace.current.push(node_id);
                        trace_index.current++;
                    }
                }
            } else if (chosen_move === undefined && !played_mistake.current) {
                let next_variation_label = "1";
                if (next_moves_ref.current.length > 0) {
                    const labelled_here = next_moves_ref.current.reduce(
                        (count: number, m: { [key: string]: string | number }) =>
                            "123456789".includes(m["variation_label"] as string) &&
                            m["placement"] !== "pass"
                                ? count + 1
                                : count,
                        0,
                    );
                    next_variation_label = "123456789_".charAt(labelled_here);
                }
                next_moves_ref.current = [];
                set_most_recent_known_node(S.current.current_node_id);
                set_current_node_id(undefined);
                set_position_description("");
                set_current_move_category("new");
                set_child_count(0);
                set_tag_counts([]);
                set_variation_label(next_variation_label);
                set_joseki_source(undefined);
                set_tags([]);
                goban_ref.current!.enableStonePlacement();
            }

            if (S.current.mode === PageMode.Play) {
                const move_type = computer_turn.current
                    ? "computer"
                    : chosen_move === undefined ||
                        bad_moves.includes(chosen_move?.category as string)
                      ? "bad"
                      : "good";

                const comment =
                    placement +
                    ": " +
                    (chosen_move === undefined
                        ? _("That move isn't listed!")
                        : pgettext(
                              "Joseki move category",
                              (MoveCategory as Record<string, string>)[
                                  chosen_move.category as string
                              ],
                          ));

                set_move_type_sequence((prev) => [...prev, { type: move_type, comment }]);
                if (move_type === "bad") {
                    set_joseki_errors((prev) => prev + 1);
                }
            }

            if (
                S.current.mode === PageMode.Play &&
                played_mistake.current &&
                !back_stepping.current &&
                !computer_turn.current
            ) {
                renderMistakeResult();
            }
        }
    }

    // The onBoardUpdate function - defined here and assigned to the ref each render
    function onBoardUpdate() {
        last_click.current = new Date().valueOf();
        const goban = goban_ref.current;
        if (!goban) {
            return;
        }
        const mvs = goban.decodeMoves(goban.engine.cur_move.getMoveStringToThisPoint());

        let ms: string;
        let the_move: JGOFMove | undefined;

        if (mvs.length > 0) {
            const move_string_array = mvs.map((p) => {
                let coord = goban.prettyCoordinates(p.x, p.y);
                coord = coord === "" ? "pass" : coord;
                return coord;
            });

            ms = move_string_array.join(",");
            the_move = mvs[mvs.length - 1];
        } else {
            ms = "";
            the_move = undefined;
        }

        if (ms !== S.current.move_string) {
            goban.disableStonePlacement();
            set_move_string(ms);
            processPlacement(the_move, ms);
        } else {
            back_stepping.current = false;
        }
    }

    // Keep the ref pointing to the latest version
    on_board_update_ref.current = onBoardUpdate;

    // ---- Goban initialization ----
    function initializeGoban(initial_position?: string) {
        if (goban_ref.current != null) {
            goban_ref.current.destroy();
        }

        const opts: GobanRendererConfig = {
            board_div: goban_div,
            interactive: true,
            mode: "puzzle",
            player_id: 0,
            server_socket: undefined,
            square_size: 20,
            stone_font_scale: preferences.get("stone-font-scale"),
        };

        if (initial_position) {
            (opts as Record<string, unknown>)["moves"] = initial_position;
        }
        goban_opts_ref.current = opts;
        goban_ref.current = createGoban(opts);
        goban_ref.current.setMode("puzzle");
        goban_ref.current.on("update", () => on_board_update_ref.current());
        (window as unknown as Record<string, unknown>).global_goban = goban_ref.current;
    }

    function initializeBoard(target_position: string = "root") {
        next_moves_ref.current = [];
        move_trace.current = [target_position];
        trace_index.current = 0;

        played_mistake.current = false;
        computer_turn.current = false;

        set_move_string("");
        set_current_move_category("");
        set_move_type_sequence([]);
        set_joseki_errors(0);
        set_joseki_successes(undefined);
        set_joseki_best_attempt(undefined);

        initializeGoban();
        // Ask the server for the moves from this position
        fetchNextFilteredMovesFor(target_position, S.current.variation_filter);
    }

    function resetBoard() {
        last_click.current = new Date().valueOf();
        initializeBoard("root");
    }

    // ---- Mode setters ----
    function setAdminMode() {
        resetBoard();
        set_mode(PageMode.Admin);
    }

    function setExploreMode() {
        set_mode(PageMode.Explore);
    }

    function setPlayMode() {
        set_mode(PageMode.Play);
        set_move_type_sequence([]);
        set_joseki_errors(0);
        set_joseki_successes(undefined);
        set_joseki_best_attempt(undefined);
        set_count_details_open(false);
        played_mistake.current = false;
        computer_turn.current = false;

        // Fetch play results
        get(server_url + "playrecord")
            .then((body) => {
                extractPlayResults(body);
            })
            .catch((r) => {
                console.log("Play results GET failed:", r);
            });
    }

    function setEditMode() {
        set_mode(PageMode.Edit);
    }

    // ---- Navigation ----
    function backOneMove() {
        if (!back_stepping.current && !S.current.throb) {
            back_stepping.current = true;
            goban_ref.current?.showPrevious();
        }
    }

    function backOneMoveKey() {
        if (S.current.mode !== PageMode.Play) {
            backOneMove();
        }
    }

    function forwardOneMove() {
        if (move_trace.current.length < 2 || trace_index.current > move_trace.current.length - 2) {
            if (next_moves_ref.current.length > 0) {
                const best_move = next_moves_ref.current.reduce(
                    (
                        prev_move: { [key: string]: string | number },
                        next_move: { [key: string]: string | number },
                    ) =>
                        (prev_move.variation_label as string) >
                            (next_move.variation_label as string) && next_move.placement !== "pass"
                            ? next_move
                            : prev_move,
                );
                doPlacement(best_move.placement as string);
            }
            return;
        }

        const target_forward_move = move_trace.current[trace_index.current + 1];
        if (cached_positions_ref.current.hasOwnProperty(target_forward_move)) {
            const step_to = (
                cached_positions_ref.current[target_forward_move] as Record<string, string>
            ).placement;
            doPlacement(step_to);
        }
    }

    function forwardOneMoveKey() {
        if (S.current.mode !== PageMode.Play) {
            forwardOneMove();
        }
    }

    function doPlacement(placement: string) {
        if (placement === "pass") {
            doPass();
        } else {
            const loc = goban_ref.current!.engine.decodeMoves(placement)[0];
            try {
                goban_ref.current!.engine.place(loc.x, loc.y);
            } catch (e) {
                console.warn(e);
            }
            on_board_update_ref.current();
        }
    }

    function doPass() {
        goban_ref.current!.pass();
        goban_ref.current!.engine.cur_move.clearMarks();
        goban_ref.current!.redraw();
        on_board_update_ref.current();
    }

    // ---- Filter and misc ----
    function updateVariationFilter(filter: JosekiFilter) {
        set_variation_filter_state(filter);
        data.set("oje-variation-filter", filter);
        cached_positions_ref.current = {};
        prefetching_ref.current = false;
        const node_to_fetch = waiting_for.current || S.current.current_node_id;
        if (node_to_fetch) {
            fetchNextFilteredMovesFor(node_to_fetch, filter);
        }
    }

    function updateMarks(marks: Array<{ label: string; position: string }>) {
        current_marks_ref.current = marks;
        renderCurrentJosekiPosition();
    }

    function toggleContinuationCountDetail() {
        if (count_details_open) {
            set_count_details_open(false);
        } else if (current_node_id) {
            showVariationCounts(current_node_id);
        }
    }

    function updateDBLockStatus(new_status: boolean) {
        set_db_locked_down(new_status);
    }

    function loadPosition(node_id: string) {
        console.log("load position:", node_id);
        load_sequence_to_board.current = true;
        fetchNextMovesFor(node_id);
        move_trace.current = [];
        trace_index.current = -1;
    }

    // ---- Save position ----
    function saveNewPositionInfo(
        move_type: string,
        vl: string,
        tag_ids: number[],
        description: string,
        joseki_source_id: string | undefined,
        marks: { label: string; position: string }[],
    ) {
        const mark_string = JSON.stringify(marks);

        cached_positions_ref.current = {};

        if (S.current.current_move_category !== "new") {
            put(position_url(S.current.current_node_id as string), {
                description,
                variation_label: vl,
                tags: tag_ids,
                category: move_type.toUpperCase(),
                joseki_source_id,
                marks: mark_string,
            })
                .then((body) => {
                    processNewJosekiPosition(body);
                    setExploreMode();
                })
                .catch((r) => {
                    console.log("Position PUT failed:", r);
                });
        } else {
            post(server_url + "positions", {
                sequence: S.current.move_string,
                category: move_type.toUpperCase(),
            })
                .then((body) => {
                    console.log("resulting node_id:", body.node_id);
                    put(position_url(body.node_id), {
                        description,
                        variation_label: vl,
                        tags: tag_ids,
                        joseki_source_id,
                        marks: mark_string,
                    })
                        .then((body2) => {
                            processNewJosekiPosition(body2);
                            setExploreMode();
                        })
                        .catch((r) => {
                            console.log("Position PUT failed:", r);
                        });
                })
                .catch((r) => {
                    console.log("PositionS POST failed:", r);
                });
        }
    }

    // ---- Effects ----

    // Main initialization effect - runs on mount and re-runs when location changes
    React.useEffect(() => {
        window.document.title = _("Joseki");

        // Fetch user permissions
        get(server_url + "user-permissions")
            .then((body) => {
                set_user_can_edit(body.can_edit);
                set_user_can_administer(body.can_admin);
                set_user_can_comment(body.can_comment);
            })
            .catch((r) => {
                console.log("Permissions GET failed:", r);
            });

        // Fetch tags
        get(server_url + "tags")
            .then((body) => {
                joseki_tags_ref.current = body.tags.map(
                    (tag: { description: string; id: string }) => ({
                        label: tag.description,
                        value: tag.id,
                    }),
                );
                the_joseki_tag_ref.current = body.tags[0].id;

                const saved_filter = data.get("oje-variation-filter");

                updateVariationFilter(
                    saved_filter
                        ? saved_filter
                        : {
                              tags: joseki_tags_ref.current ? [joseki_tags_ref.current[0]] : [],
                              contributor: undefined,
                              source: undefined,
                          },
                );
            })
            .catch((r) => {
                console.log("Tags GET failed:", r);
            });

        const target_position = pos || "root";

        if (target_position !== "root") {
            load_sequence_to_board.current = true;

            const queries = queryString.parse(location.search);
            if (queries.show_comments) {
                show_comments_requested.current = true;
            }
        }

        initializeBoard(target_position);
    }, [location]);

    // ---- Render helpers ----
    const tenuki_type =
        pass_available && mode !== PageMode.Play && move_string !== "" ? pass_available : "";

    const count_details = count_details_open ? (
        <React.Fragment>
            {tag_counts
                .filter((t) => t.count > 0)
                .map((t, idx) => (
                    <div className="variation-count-item" key={idx}>
                        <span>{pgettext("This is a Joseki Tag", t.tagname)}:</span>
                        <span>{t.count}</span>
                    </div>
                ))}
        </React.Fragment>
    ) : (
        ""
    );

    const tag_elements = !tags
        ? ""
        : [...tags]
              .sort((a, b) => Math.sign(a.group - b.group))
              .map((tag, idx) => (
                  <div className="position-tag" key={idx}>
                      <span>{pgettext("This is a Joseki Tag", tag["description"])}</span>
                  </div>
              ));

    function renderModeControl() {
        return (
            <div className="mode-control btn-group">
                <button
                    className={"btn s  " + (mode === PageMode.Explore ? "primary" : "")}
                    onClick={setExploreMode}
                >
                    {_("Explore")}
                </button>
                <button
                    className={"btn s  " + (mode === PageMode.Play ? "primary" : "")}
                    onClick={setPlayMode}
                >
                    {_("Play")}
                </button>
                {user_can_edit && !db_locked_down && (
                    <button
                        className={"btn s  " + (mode === PageMode.Edit ? "primary" : "")}
                        onClick={setEditMode}
                    >
                        {current_move_category === "new" && mode === PageMode.Explore
                            ? _("Save")
                            : _("Edit")}
                    </button>
                )}
                {user_can_edit && db_locked_down && (
                    <button className={"s"} disabled>
                        Edit <i className="fa fa-lock" />
                    </button>
                )}
                <button
                    className={"btn s  " + (mode === PageMode.Admin ? "primary" : "")}
                    onClick={setAdminMode}
                >
                    {user_can_administer ? _("Admin") : _("Updates")}
                </button>
            </div>
        );
    }

    function renderModeMainPane() {
        if (mode === PageMode.Admin) {
            return (
                <JosekiAdmin
                    server_url={server_url}
                    user_can_administer={user_can_administer}
                    user_can_edit={user_can_edit}
                    db_locked_down={db_locked_down}
                    loadPositionToBoard={loadPosition}
                    updateDBLockStatus={updateDBLockStatus}
                />
            );
        } else if (
            mode === PageMode.Explore ||
            (mode === PageMode.Edit && move_string === "") // you can't edit the empty board
        ) {
            return (
                <ExplorePane
                    description={position_description}
                    position_type={current_move_category}
                    see_also={see_also}
                    comment_count={current_comment_count as number}
                    position_id={current_node_id as string}
                    can_comment={user_can_comment}
                    joseki_source={joseki_source as { url: string; description: string }}
                    tags={tags}
                    joseki_tags={joseki_tags_ref.current || []}
                    set_variation_filter={updateVariationFilter}
                    current_filter={variation_filter}
                    child_count={child_count}
                    show_comments={show_comments_requested.current}
                />
            );
        } else if (mode === PageMode.Edit) {
            return (
                <EditPane
                    node_id={current_node_id as unknown as number}
                    category={current_move_category}
                    description={position_description}
                    variation_label={variation_label}
                    joseki_source_id={(joseki_source ? joseki_source.id : "none") as number}
                    tags={tags}
                    contributor={contributor_id}
                    available_tags={joseki_tags_ref.current || []}
                    save_new_info={saveNewPositionInfo}
                    update_marks={updateMarks}
                />
            );
        } else {
            return (
                <PlayPane
                    move_type_sequence={move_type_sequence}
                    joseki_errors={joseki_errors}
                    josekis_played={josekis_played as number}
                    josekis_completed={josekis_completed as number}
                    joseki_best_attempt={joseki_best_attempt as number}
                    joseki_successes={joseki_successes as number}
                    the_joseki_tag={
                        the_joseki_tag_ref.current || { label: "<error>", value: "<error>" }
                    }
                    joseki_tags={joseki_tags_ref.current || []}
                    set_variation_filter={updateVariationFilter}
                    current_filter={variation_filter}
                />
            );
        }
    }

    return (
        <div className={"Joseki"}>
            <KBShortcut shortcut="home" action={resetBoard} />
            <KBShortcut shortcut="left" action={backOneMoveKey} />
            <KBShortcut shortcut="right" action={forwardOneMoveKey} />

            <div className={"left-col" + (mode === PageMode.Admin ? " admin-mode" : "")}>
                <GobanContainer
                    goban={goban_ref.current!}
                    extra_props={{
                        style: { paddingLeft: goban_container_left_padding },
                    }}
                />
            </div>
            <div className="right-col">
                <div className="top-bar">
                    {/* Note: played_mistake, move_trace, trace_index, and next_moves_ref are refs
                        used in the JSX below for button visibility. This is safe because every code
                        path that modifies them also triggers a state change (e.g., set_move_string,
                        set_throb), ensuring a re-render with fresh ref values. */}
                    <div className={"move-controls" + (played_mistake.current ? " highlight" : "")}>
                        <i className="fa fa-fast-backward" onClick={resetBoard}></i>
                        <i
                            className={
                                "fa fa-step-backward" +
                                (mode !== PageMode.Play || played_mistake.current ? "" : " hide")
                            }
                            onClick={backOneMove}
                        ></i>
                        <i
                            className={
                                "fa fa-step-forward" +
                                (mode !== PageMode.Play &&
                                ((move_trace.current.length > 1 &&
                                    trace_index.current < move_trace.current.length - 1) ||
                                    next_moves_ref.current.length > 0)
                                    ? ""
                                    : " hide")
                            }
                            onClick={forwardOneMove}
                        ></i>
                        <button className={"pass-button " + tenuki_type} onClick={doPass}>
                            {_("Tenuki")}
                        </button>
                        <div className="throbber-spacer">
                            <Throbber throb={throb} />
                        </div>
                    </div>
                    <div className="top-bar-other">
                        {renderModeControl()}
                        <a
                            href="https://github.com/online-go/online-go.com/wiki/OGS-Joseki-Explorer"
                            className="joseki-help"
                        >
                            <i className="fa fa-question-circle-o"></i>
                        </a>
                    </div>
                </div>

                {renderModeMainPane()}

                <div className="position-details">
                    <div className={"status-info" + (move_string === "" ? " hide" : "")}>
                        <div className="position-other-info">
                            {tag_elements}
                            {joseki_source && joseki_source.url.length > 0 && (
                                <div className="position-joseki-source">
                                    <span>{_("Source")}:</span>
                                    <a href={joseki_source.url}>{joseki_source.description}</a>
                                </div>
                            )}
                            {joseki_source && joseki_source.url.length === 0 && (
                                <div className="position-joseki-source">
                                    <span>{_("Source")}:</span>
                                    <span>{joseki_source.description}</span>
                                </div>
                            )}
                        </div>
                        <div className="move-category">
                            {current_move_category === ""
                                ? ""
                                : _("Last move") +
                                  ": " +
                                  (current_move_category === "new"
                                      ? mode === PageMode.Explore
                                          ? _("Experiment")
                                          : _("Proposed Move")
                                      : pgettext("Joseki move category", current_move_category))}
                        </div>

                        <div
                            className={
                                "contributor" + (current_move_category === "new" ? " hide" : "")
                            }
                        >
                            <span>{_("Contributor")}:</span> <Player user={contributor_id} />
                        </div>
                        <div>{_("Moves made")}:</div>
                        <div className="moves-made">
                            {current_move_category !== "new" ? (
                                <Link
                                    className="moves-made-string"
                                    to={"/joseki/" + current_node_id}
                                >
                                    {move_string}
                                </Link>
                            ) : (
                                <span className="moves-made-string">{move_string}</span>
                            )}
                        </div>
                    </div>
                    <div className="continuations-pane">
                        {!!child_count && (
                            <React.Fragment>
                                <button
                                    className="position-child-count"
                                    onClick={toggleContinuationCountDetail}
                                >
                                    {interpolate(_("This position leads to {{count}} others"), {
                                        count: child_count,
                                    })}
                                    {!count_details_open && (
                                        <i className="fa fa-lg fa-caret-right"></i>
                                    )}
                                    {count_details_open && (
                                        <i className="fa fa-lg fa-caret-down"></i>
                                    )}
                                </button>
                                <div
                                    className={
                                        "child-count-details-pane" +
                                        (count_details_open ? " details-pane-open" : "")
                                    }
                                >
                                    {count_details_open && (
                                        <div className="count-details">
                                            <Throbber throb={counts_throb} />
                                            {count_details}
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        )}
                        {!child_count && (
                            <React.Fragment>
                                <div className="position-child-count">
                                    {_("This position has no continuations") + "."}
                                </div>
                                <div className="child-count-details-pane"></div>
                            </React.Fragment>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
