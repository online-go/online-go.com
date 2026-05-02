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
import { GobanRenderer, GobanRendererConfig, JGOFMove } from "goban";
import { Player } from "@/components/Player";
import { JosekiAdmin } from "@/components/JosekiAdmin";
import { JosekiFilter, JosekiVariationFilter } from "@/components/JosekiVariationFilter";
import { OJEJosekiTag } from "@/components/JosekiTagSelector";
import { Throbber } from "@/components/Throbber";
import { IdType } from "@/lib/types";
import { GobanController } from "@/lib/GobanController";
import { GobanView, GobanViewRef } from "@/components/GobanView";

import { ExplorePane } from "./ExplorePane";
import { PlayPane } from "./PlayPane";
import { EditPane } from "./EditPane";
import { CommentsPanel } from "./CommentsPanel";
import { AuditLogPanel } from "./AuditLogPanel";
import { JosekiActionsPanel } from "./JosekiActionsPanel";
import { popover, PopOver } from "@/lib/popover";
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

    const [throb, set_throb] = React.useState(false);

    // Walking target for the move-number slider. The advance effect steps
    // toward this once per idle cycle since each navigation step fires a
    // server fetch and they can't be queued concurrently.
    const [slider_target, set_slider_target] = React.useState<number | null>(null);

    const [mode, set_mode] = React.useState<PageMode>(PageMode.Explore);
    const [user_can_edit, set_user_can_edit] = React.useState(false);
    const [user_can_administer, set_user_can_administer] = React.useState(false);
    const [user_can_comment, set_user_can_comment] = React.useState(false);

    const [move_type_sequence, set_move_type_sequence] = React.useState<MoveTypeWithComment[]>([]);
    const [joseki_errors, set_joseki_errors] = React.useState(0);

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

    const [share_confirmed, set_share_confirmed] = React.useState(false);

    const gobanViewRef = React.useRef<GobanViewRef>(null);
    const moreActionsPopoverRef = React.useRef<PopOver | null>(null);
    // Tracks how many history.forward() steps are available because the
    // user just walked back via the move bar (or browser back). Reset to
    // zero whenever a new push happens (forward exploration). Browser-
    // initiated forward/back can desync this slightly; the worst case is
    // the move-bar forward briefly falls back to placing a best_move
    // instead of replaying the redo entry.
    const forward_history_count = React.useRef(0);
    const goban_div = React.useMemo(() => {
        const div = document.createElement("div");
        div.className = "Goban";
        return div;
    }, []);
    const goban_opts_ref = React.useRef<GobanRendererConfig>({} as GobanRendererConfig);
    const controller_ref = React.useRef<GobanController | null>(null);
    const goban_ref = React.useRef<GobanRenderer | null>(null);

    // Updated every render so the goban "update" handler always calls the
    // latest onBoardUpdate (which closes over up-to-date state).
    const on_board_update_ref = React.useRef<() => void>(() => {});

    // Eagerly create on first render so GobanView always has a non-null
    // controller. Sounds disabled to match the legacy joseki view, which
    // used createGoban directly and never bound audio events.
    if (controller_ref.current === null) {
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
        controller_ref.current = new GobanController({ ...opts, enable_sounds: false });
        goban_ref.current = controller_ref.current.goban;
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

    // Async fetch callbacks and the goban "update" handler capture closures
    // at registration time; this ref is refreshed every render so they
    // always read current state values.
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

        // Keep the URL aligned with the loaded position. Push for forward
        // navigation (stone clicks from a /joseki/<id> URL move on to a
        // new /joseki/<id>) so each move gets its own history entry; replace
        // for the initial /joseki → /joseki/<root> settle; skip when the
        // URL already matches (popstate-driven loads).
        const new_url = "/joseki/" + position.node_id;
        const old_pathname = window.location.pathname;
        if (old_pathname !== new_url) {
            if (old_pathname.startsWith("/joseki/")) {
                window.history.pushState({}, "", new_url);
                forward_history_count.current = 0;
            } else {
                window.history.replaceState({}, "", new_url);
            }
        }
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

    function updatePlayerJosekiRecord(node_id: string) {
        if (!data.get("user").anonymous) {
            put(server_url + "playrecord", {
                position_id: node_id,
                errors: S.current.joseki_errors,
            }).catch((r) => {
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

        // The prefetch endpoint returns a lighter record without `play`, so
        // when we need it (load_sequence_to_board) skip the cache and refetch
        // — otherwise loadSequenceToBoard feeds undefined into substr.
        const cached = cached_positions_ref.current[node_id];
        const cache_usable =
            cached !== undefined &&
            (!load_sequence_to_board.current || typeof cached.play === "string");
        if (S.current.mode === PageMode.Explore && cache_usable) {
            processNewMoves(node_id, cached);
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
                set_move_string(ms); // trigger re-render to clear highlight class
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

        // The ms-vs-S.current guard skips redundant updates from spurious
        // goban events, but when load_sequence_to_board fires this handler
        // synchronously inside the navigation that just queued
        // set_move_string(""), S.current still holds the pre-nav value and
        // often matches the just-loaded ms — force the update through so
        // the queued "" doesn't win the batch and leave the pane hidden.
        if (ms !== S.current.move_string || load_sequence_to_board.current) {
            goban.disableStonePlacement();
            set_move_string(ms);
            processPlacement(the_move, ms);
        } else {
            back_stepping.current = false;
        }
    }

    on_board_update_ref.current = onBoardUpdate;

    function initializeGoban(initial_position?: string) {
        // Skip the redundant destroy/recreate of the eagerly-created
        // controller on first mount (no last_click yet, no initial_position).
        if (controller_ref.current != null && !initial_position && !last_click.current) {
            return;
        }

        if (controller_ref.current != null) {
            controller_ref.current.destroy();
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
        controller_ref.current = new GobanController({ ...opts, enable_sounds: false });
        goban_ref.current = controller_ref.current.goban;
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

        initializeGoban();
        fetchNextFilteredMovesFor(target_position, S.current.variation_filter);
    }

    function resetBoard() {
        last_click.current = new Date().valueOf();
        initializeBoard("root");
    }

    function setExploreMode() {
        gobanViewRef.current?.setActiveTakeover(null);
        set_mode(PageMode.Explore);
    }

    function handlePlayToggle(active: boolean) {
        if (active) {
            set_mode(PageMode.Play);
            set_move_type_sequence([]);
            set_joseki_errors(0);
            set_count_details_open(false);
            played_mistake.current = false;
            computer_turn.current = false;
        } else {
            set_mode(PageMode.Explore);
        }
    }

    function handleEditToggle(active: boolean) {
        set_mode(active ? PageMode.Edit : PageMode.Explore);
    }

    function handleAdminToggle(active: boolean) {
        if (active) {
            resetBoard();
            set_mode(PageMode.Admin);
        } else {
            set_mode(PageMode.Explore);
        }
    }

    function backOneMove() {
        if (S.current.throb) {
            return;
        }
        // Drive back through the browser history. Each forward move was
        // pushed by processNewJosekiPosition, so popstate / location effect
        // takes care of reloading the previous position.
        forward_history_count.current++;
        window.history.back();
    }

    function backOneMoveKey() {
        if (S.current.mode !== PageMode.Play) {
            backOneMove();
        }
    }

    function forwardOneMove() {
        if (S.current.throb) {
            return;
        }
        // Redo a back via browser history when one is available.
        if (forward_history_count.current > 0) {
            forward_history_count.current--;
            window.history.forward();
            return;
        }
        // At the leaf of explored history — pick the best next move and
        // place it. processNewJosekiPosition will push the resulting URL.
        if (next_moves_ref.current.length > 0) {
            const best_move = next_moves_ref.current.reduce(
                (
                    prev_move: { [key: string]: string | number },
                    next_move: { [key: string]: string | number },
                ) =>
                    (prev_move.variation_label as string) > (next_move.variation_label as string) &&
                    next_move.placement !== "pass"
                        ? next_move
                        : prev_move,
            );
            doPlacement(best_move.placement as string);
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

    function copyPositionLink() {
        if (!current_node_id || current_node_id === undefined) {
            return;
        }
        const url = `${window.location.origin}/joseki/${current_node_id}`;
        void navigator.clipboard
            .writeText(url)
            .then(() => {
                set_share_confirmed(true);
                setTimeout(() => set_share_confirmed(false), 1500);
            })
            .catch((e) => {
                console.log("Clipboard write failed:", e);
            });
    }

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

    React.useEffect(() => {
        return () => {
            controller_ref.current?.destroy();
            controller_ref.current = null;
            goban_ref.current = null;
            moreActionsPopoverRef.current?.close();
            moreActionsPopoverRef.current = null;
        };
    }, []);

    React.useEffect(() => {
        get(server_url + "user-permissions")
            .then((body) => {
                set_user_can_edit(body.can_edit);
                set_user_can_administer(body.can_admin);
                set_user_can_comment(body.can_comment);
            })
            .catch((r) => {
                console.log("Permissions GET failed:", r);
            });

        get(server_url + "tags")
            .then((body) => {
                joseki_tags_ref.current = body.tags.map(
                    (tag: { description: string; id: string }) => ({
                        label: tag.description,
                        value: tag.id,
                    }),
                );
                the_joseki_tag_ref.current = joseki_tags_ref.current?.[0];

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
    }, []);

    React.useEffect(() => {
        window.document.title = _("Joseki");

        const target_position = pos || "root";

        if (target_position !== "root") {
            load_sequence_to_board.current = true;

            const queries = queryString.parse(location.search);
            if (queries.show_comments) {
                show_comments_requested.current = true;
            }
        }

        initializeBoard(target_position);
    }, [location, pos]);

    React.useEffect(() => {
        if (
            show_comments_requested.current &&
            gobanViewRef.current &&
            current_node_id &&
            current_node_id !== "root"
        ) {
            gobanViewRef.current.setActiveTakeover("joseki-comments");
            show_comments_requested.current = false;
        }
    }, [current_node_id]);

    // Walk toward the slider target one step per idle cycle. Each step
    // fires a browser-history navigation (or a placement) that resolves
    // through location-effect → fetch → loadSequenceToBoard, so we can't
    // observe progress synchronously — rely on throb / move_string
    // changes to retrigger the effect for the next step. A step that
    // genuinely can't progress (e.g. no next_moves) just leaves the
    // slider parked at its target until the user moves it again.
    React.useEffect(() => {
        if (slider_target === null) {
            return;
        }
        if (throb) {
            return;
        }
        const goban = goban_ref.current;
        if (!goban) {
            return;
        }
        const current = goban.engine.cur_move.move_number;
        if (current === slider_target) {
            set_slider_target(null);
            return;
        }
        if (current < slider_target) {
            forwardOneMove();
        } else {
            backOneMove();
        }
    }, [slider_target, throb, move_string]);

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

    // Reuses .MoveNumberSlider classes for visual parity with the standard
    // bar but is wired to joseki's own server-driven nav (back_stepping flag
    // + per-step fetch) rather than the controller's previousMove/nextMove.
    function renderMoveControls() {
        const goban = goban_ref.current;
        const move_number = goban?.engine.cur_move.move_number ?? 0;
        const knob_max = Math.max(move_number, move_trace.current.length - 1, 1);
        const at_start = move_number === 0;
        const can_back = mode !== PageMode.Play || played_mistake.current;
        const can_forward =
            mode !== PageMode.Play &&
            ((move_trace.current.length > 1 &&
                trace_index.current < move_trace.current.length - 1) ||
                next_moves_ref.current.length > 0);

        return (
            <div
                className={
                    "Joseki-move-bar MoveNumberSlider" +
                    (played_mistake.current ? " highlight" : "")
                }
            >
                <button
                    className="MoveNumberSlider-button"
                    onClick={resetBoard}
                    disabled={at_start}
                    title={pgettext("Move navigation: reset to root", "Reset to root")}
                >
                    <i className="fa fa-fast-backward" />
                </button>
                <button
                    className="MoveNumberSlider-button"
                    onClick={backOneMove}
                    disabled={!can_back}
                    title={pgettext("Move navigation: previous move", "Previous move")}
                >
                    <i className="fa fa-step-backward" />
                </button>
                <div
                    className="MoveNumberSlider-track"
                    style={
                        {
                            "--move-frac": (slider_target ?? move_number) / Math.max(knob_max, 1),
                        } as React.CSSProperties
                    }
                >
                    <input
                        className="MoveNumberSlider-input"
                        type="range"
                        min={0}
                        max={Math.max(knob_max, 1)}
                        value={slider_target ?? move_number}
                        onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v)) {
                                set_slider_target(v);
                            }
                        }}
                        aria-label={pgettext("Move navigation slider", "Move number")}
                    />
                    <div className="MoveNumberSlider-knob">
                        <span className="MoveNumberSlider-knob-text">
                            {slider_target ?? move_number}
                        </span>
                    </div>
                </div>
                <button
                    className="MoveNumberSlider-button"
                    onClick={forwardOneMove}
                    disabled={!can_forward}
                    title={pgettext("Move navigation: next move", "Next move")}
                >
                    <i className="fa fa-step-forward" />
                </button>
                <div className="Joseki-throbber-overlay" aria-hidden="true">
                    <Throbber throb={throb} />
                </div>
            </div>
        );
    }

    function renderPositionDetails() {
        return (
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
                    {current_move_category !== "" && (
                        <div className="move-category">
                            {_("Last move")}:{" "}
                            {current_move_category === "new" ? (
                                <span className="move-category-label">
                                    {mode === PageMode.Explore
                                        ? _("Experiment")
                                        : _("Proposed Move")}
                                </span>
                            ) : (
                                <span
                                    className="move-category-label"
                                    style={{ color: ColorMap[current_move_category] }}
                                >
                                    {pgettext("Joseki move category", current_move_category)}
                                </span>
                            )}
                        </div>
                    )}

                    <div
                        className={"contributor" + (current_move_category === "new" ? " hide" : "")}
                    >
                        <span>{_("Contributor")}:</span> <Player user={contributor_id} />
                    </div>
                    <div>{_("Moves made")}:</div>
                    <div className="moves-made">
                        {current_move_category !== "new" ? (
                            <Link className="moves-made-string" to={"/joseki/" + current_node_id}>
                                {move_string}
                            </Link>
                        ) : (
                            <span className="moves-made-string">{move_string}</span>
                        )}
                        {current_move_category !== "new" && current_node_id && (
                            <button
                                className="moves-made-share"
                                onClick={copyPositionLink}
                                title={pgettext(
                                    "Copy a sharable link to this joseki position",
                                    "Copy link",
                                )}
                            >
                                <i
                                    className={
                                        "fa " + (share_confirmed ? "fa-check" : "fa-share-alt")
                                    }
                                />
                            </button>
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
                                {!count_details_open && <i className="fa fa-lg fa-caret-right"></i>}
                                {count_details_open && <i className="fa fa-lg fa-caret-down"></i>}
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
        );
    }

    function renderExplorePane() {
        return (
            <ExplorePane
                description={position_description}
                position_type={current_move_category}
                see_also={see_also}
                position_id={current_node_id as string}
                pass_available={pass_available}
                onExploreTenuki={doPass}
            />
        );
    }

    // The Edit tab falls back to ExplorePane on the empty board (nothing
    // to edit yet); the editor proper appears once a stone is placed.
    const editPaneIsExplore = move_string === "";

    const active_filter_count =
        (variation_filter.tags?.length ?? 0) +
        (variation_filter.contributor ? 1 : 0) +
        (variation_filter.source ? 1 : 0);

    const edit_label = db_locked_down
        ? _("Edit (database is locked)")
        : current_move_category === "new" && mode === PageMode.Explore
          ? _("Save new position")
          : _("Edit position");

    function openMoreActions(event?: React.MouseEvent<HTMLButtonElement>) {
        if (!event) {
            return;
        }
        // Close any existing instance first so a repeated trigger
        // (e.g. keyboard) doesn't stack two popovers.
        moreActionsPopoverRef.current?.close();
        moreActionsPopoverRef.current = null;
        const close = () => {
            moreActionsPopoverRef.current?.close();
            moreActionsPopoverRef.current = null;
        };
        const open = (id: string) => () => {
            gobanViewRef.current?.setActiveTakeover(id);
        };
        const instance = popover({
            elt: (
                <JosekiActionsPanel
                    user_can_edit={user_can_edit}
                    user_can_administer={user_can_administer}
                    db_locked_down={db_locked_down}
                    edit_label={edit_label}
                    comment_count={current_comment_count}
                    onOpenComments={open("joseki-comments")}
                    onOpenChanges={open("joseki-changes")}
                    onOpenEdit={open("joseki-edit")}
                    onOpenAdmin={open("joseki-admin")}
                    onClose={close}
                />
            ),
            below: event.currentTarget,
            minWidth: 220,
        });
        instance.on("close", () => {
            if (moreActionsPopoverRef.current === instance) {
                moreActionsPopoverRef.current = null;
            }
        });
        moreActionsPopoverRef.current = instance;
    }

    return (
        <GobanView
            ref={gobanViewRef}
            controller={controller_ref.current!}
            className="Joseki"
            customSlider={renderMoveControls()}
        >
            <KBShortcut shortcut="home" action={resetBoard} />
            <KBShortcut shortcut="left" action={backOneMoveKey} />
            <KBShortcut shortcut="right" action={forwardOneMoveKey} />

            <GobanView.Tab
                id="joseki-filter"
                type="takeover"
                icon={
                    <span className="joseki-tab-icon-with-badge">
                        <i className="fa fa-filter" />
                        {active_filter_count > 0 && (
                            <span className="joseki-tab-badge">{active_filter_count}</span>
                        )}
                    </span>
                }
                title={_("Filter joseki variations")}
            >
                <div className="joseki-filter-panel">
                    <h3 className="joseki-filter-heading">{_("Filter joseki variations")}</h3>
                    <JosekiVariationFilter
                        contributor_list_url={server_url + "contributors"}
                        source_list_url={server_url + "josekisources"}
                        current_filter={variation_filter}
                        set_variation_filter={updateVariationFilter}
                        joseki_tags={joseki_tags_ref.current || []}
                    />
                    <p className="joseki-filter-hint">
                        {_("Tag “Joseki: Done” narrows results to verified joseki sequences.")}
                    </p>
                </div>
            </GobanView.Tab>

            <GobanView.Tab
                id="joseki-comments"
                type="takeover"
                icon="comment-o"
                title={_("Comments")}
                hideFromBar
            >
                <CommentsPanel
                    position_id={current_node_id as string}
                    can_comment={user_can_comment}
                />
            </GobanView.Tab>

            <GobanView.Tab
                id="joseki-changes"
                type="takeover"
                icon="history"
                title={_("Position changes")}
                hideFromBar
            >
                <AuditLogPanel position_id={current_node_id as string} />
            </GobanView.Tab>

            <GobanView.Tab
                id="joseki-play"
                type="takeover"
                align="center"
                icon={<i className="ogs-goban" />}
                title={_("Play")}
                onToggle={handlePlayToggle}
            >
                <PlayPane
                    move_type_sequence={move_type_sequence}
                    the_joseki_tag={
                        the_joseki_tag_ref.current || { label: "<error>", value: "<error>" }
                    }
                    set_variation_filter={updateVariationFilter}
                    current_filter={variation_filter}
                />
                {renderPositionDetails()}
            </GobanView.Tab>

            {user_can_edit && (
                <GobanView.Tab
                    id="joseki-edit"
                    type="takeover"
                    icon={db_locked_down ? "lock" : "pencil"}
                    title={edit_label}
                    disabled={db_locked_down}
                    onToggle={handleEditToggle}
                    hideFromBar
                >
                    {editPaneIsExplore ? (
                        renderExplorePane()
                    ) : (
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
                    )}
                    {renderPositionDetails()}
                </GobanView.Tab>
            )}

            <GobanView.Tab
                id="joseki-admin"
                type="takeover"
                icon="gavel"
                title={user_can_administer ? _("Admin") : _("Updates")}
                onToggle={handleAdminToggle}
                hideFromBar
            >
                <JosekiAdmin
                    server_url={server_url}
                    user_can_administer={user_can_administer}
                    user_can_edit={user_can_edit}
                    db_locked_down={db_locked_down}
                    loadPositionToBoard={loadPosition}
                    updateDBLockStatus={updateDBLockStatus}
                />
            </GobanView.Tab>

            <GobanView.Tab
                id="joseki-more-actions"
                type="action"
                align="right"
                icon="ellipsis-h"
                title={_("More actions")}
                onClick={openMoreActions}
            />

            <GobanView.Tab id="joseki-explore" type="always">
                {renderExplorePane()}
                {renderPositionDetails()}
            </GobanView.Tab>
        </GobanView>
    );
}
