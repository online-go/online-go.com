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

/* A page for looking up and playing against josekis stored in the OGS OJE*/

import * as React from "react";
import * as ReactSelect from "react-select";
import { Link } from "react-router-dom";
import { RouteComponentProps, rr6ClassShim } from "ogs-rr6-shims";
import * as queryString from "query-string";

import * as data from "data";
import { _, interpolate, pgettext, npgettext } from "translate";
import { get, put, post } from "requests";
import { KBShortcut } from "KBShortcut";
import { Goban, GoMath, GobanConfig, JGOFMove } from "goban";
import { AutoTranslate } from "AutoTranslate";
import { Markdown } from "Markdown";
import { chat_manager } from "chat_manager";

import { Player } from "Player";

import { JosekiAdmin } from "JosekiAdmin";

import { openModal } from "Modal";
import { JosekiSourceModal } from "JosekiSourceModal";
import { JosekiVariationFilter, JosekiFilter } from "JosekiVariationFilter";
import { JosekiTagSelector, JosekiTag } from "JosekiTagSelector";
import { Throbber } from "Throbber";
import { IdType } from "src/lib/types";
import { GobanContainer } from "GobanContainer";

const server_url = data.get("oje-url", "/oje/");

const prefetch_url = (node_id: string, variation_filter?: JosekiFilter, mode?: string) => {
    let prefetch_url = server_url + "positions?id=" + node_id;
    if (variation_filter) {
        if (variation_filter.contributor) {
            prefetch_url += "&cfilterid=" + variation_filter.contributor;
        }
        if (variation_filter.tags && variation_filter.tags.length !== 0) {
            prefetch_url += "&tfilterid=" + variation_filter.tags.map((tag) => tag.value).join(",");
        }
        if (variation_filter.source) {
            prefetch_url += "&sfilterid=" + variation_filter.source;
        }
    }
    if (mode) {
        prefetch_url += "&mode=" + mode;
    }
    return prefetch_url;
};

const position_url = (node_id: string, variation_filter?: JosekiFilter, mode?: string) => {
    let position_url = server_url + "position?id=" + node_id;
    if (variation_filter) {
        if (variation_filter.contributor) {
            position_url += "&cfilterid=" + variation_filter.contributor;
        }
        if (variation_filter.tags && variation_filter.tags.length !== 0) {
            position_url += "&tfilterid=" + variation_filter.tags.map((tag) => tag.value).join(",");
        }
        if (variation_filter.source) {
            position_url += "&sfilterid=" + variation_filter.source;
        }
    }
    if (mode) {
        position_url += "&mode=" + mode;
    }
    return position_url;
};

const joseki_sources_url = server_url + "josekisources";

const tag_count_url = (node_id: string): string => server_url + "position/tagcounts?id=" + node_id;

// Joseki specific markdown

const applyJosekiMarkdown = (markdown: string): string => {
    // Highligh marks in the text
    let result = markdown.replace(/<([A-Z]):([A-Z][0-9]{1,2})>/gm, "**$1**");

    // Transform position references into actual link
    result = result.replace(
        /<position: *([0-9]+)>/gim,
        "**[" + _("Position") + " $1](/joseki/$1)**",
    );

    return result;
};

enum MoveCategory {
    // needs to match the definitions in the backend PlayCategory class
    // conceivably, should fetch these from the backend - the string value is used in comparisons :(
    IDEAL = "Ideal",
    GOOD = "Good",
    MISTAKE = "Mistake",
    TRICK = "Trick",
    QUESTION = "Question",
}

const bad_moves = ["MISTAKE", "QUESTION"]; // moves the player is not allowed to play in Play mode

enum PageMode {
    Explore = "0",
    Play = "1",
    Edit = "2",
    Admin = "3",
}

// These are the colors painted onto moves of each category
const ColorMap = {
    IDEAL: "#008300",
    GOOD: "#436600",
    MISTAKE: "#b3001e",
    TRICK: "#ffff00",
    QUESTION: "#00ccff",
};

// Play mode move classification
type MoveType = "bad" | "good" | "computer" | "complete";

type JosekiProps = RouteComponentProps<{ pos: string }>;

interface MoveTypeWithComment {
    type: MoveType;
    comment: string;
}
interface JosekiState {
    move_string: string;
    current_node_id?: string;
    most_recent_known_node?: string;
    position_description: string;
    see_also: number[];
    variation_label: string;
    current_move_category: string;
    pass_available: boolean;
    contributor_id: number;
    child_count: number;
    goban_container_left_padding: number;

    throb: boolean;

    mode: PageMode;
    user_can_edit: boolean;
    user_can_administer: boolean;
    user_can_comment: boolean;

    move_type_sequence: MoveTypeWithComment[];
    joseki_errors: number;
    josekis_played?: number;
    josekis_completed?: number;
    joseki_successes?: number;
    joseki_best_attempt?: number;

    joseki_source?: {
        url: string;
        description: string;
        id?: IdType;
    };
    tags: any[]; // the tags that are on the current position

    variation_filter: JosekiFilter;

    count_details_open: boolean;
    tag_counts: { tagname: string; count: number }[];
    counts_throb: boolean;

    db_locked_down: boolean;

    current_comment_count?: number;
    played_mistake?: boolean; // Appears to be unused
    computer_turn?: boolean; // Appears to be unused
    count_display_open?: boolean; // Appears to be unused
    extra_throb?: boolean; // Appears to be unused

    position_type?: "new"; // It seems this is never set
}

class _Joseki extends React.Component<JosekiProps, JosekiState> {
    goban!: Goban;
    goban_div: HTMLDivElement;
    goban_opts: any = {};
    goban_container!: HTMLDivElement;

    joseki_tags!: JosekiTag[]; // the list of valid tags, collected from the server
    the_joseki_tag!: JosekiTag; //  the tag that represents "Joseki Done"
    last_server_position = ""; // the most recent position that the server returned to us, used in back stepping
    last_placement = "";
    next_moves: Array<any> = []; // these are the moves that the server has told us are available as joseki moves from the current board position
    current_marks!: Array<{ label: string; position: string }>; // the marks on the board - from the server, or from editing
    load_sequence_to_board = false; // True if we need to load the stones from the whole sequence received from the server onto the board
    show_comments_requested = false; //  If there is a "show_comments" parameter in the URL
    previous_position: { [key: string]: any } = {}; // Saving the information of the node we have moved from, so we can get back to it
    back_stepping = false; // Set to true when the person clicks the back arrow, to indicate we need to fetch the position information
    played_mistake = false;
    computer_turn = false; // when we are placing the computer's stone in Play mode
    filter_change = false; // set to true when a position is being reloaded due to filter change
    cached_positions = {}; // a hash by node-ide of position information we've received from the server
    move_trace: string[] = []; // the list of moves that we know the person clicked on to maximum depth, so we can forward-step
    trace_index = -1; // index into move_trace of the current node that we are on
    waiting_for = ""; // what position is the most recent fetch to the server waiting to hear about.

    prefetching = false; // if we have a prefetch of node positions in flight
    prefetched: { [id: string]: any } = {}; // Nodes that we have already prefetched, so don't do it again

    last_click!: number; // most recent time (ms) we got a click from the goban

    constructor(props: JosekiProps) {
        super(props);

        this.state = {
            move_string: "", // This is used for making sure we know what the current move is. It is the display value also.
            current_node_id: this.props.match.params.pos || ("root" as string), // The server's ID for this node, so we can uniquely identify it and create our own route for it,
            most_recent_known_node: undefined, // the value of current_node_id when the person clicked on a node not in the db
            position_description: "",
            see_also: [], // a list of node_ids that have the same board position (by unique board position id)
            variation_label: "_",
            current_move_category: "",
            pass_available: false, // Whether pass is one of the joseki moves or not.   Contains the category of the position resulting from pass, if present
            contributor_id: -1, // the person who created the node that we are displaying
            child_count: 0,
            goban_container_left_padding: 0,

            throb: false, // whether to show board-loading throbber

            mode: PageMode.Explore,
            user_can_edit: false, // Purely for rendering purposes, server won't let them do it anyhow if they aren't allowed.
            user_can_administer: false,
            user_can_comment: false,

            move_type_sequence: [] as MoveTypeWithComment[], // This is the sequence of "move types" that is passed to the Play pane to display
            joseki_errors: 0, // How many errors made by the player in the current sequence in Play mode.
            josekis_played: undefined, // The player's joseki playing record...
            josekis_completed: undefined,
            joseki_successes: undefined,
            joseki_best_attempt: undefined,

            joseki_source: undefined, // the source of the current position
            tags: [], // the tags that are on the current position

            variation_filter: {} as JosekiFilter, // start with no filter defined, it gets set when we get the tags

            count_details_open: false,
            tag_counts: [], // A count of the number of continuations from this position that have each tag
            counts_throb: false,

            db_locked_down: true, // pessimistic till it tells us otherwise
        };

        this.goban_div = document.createElement("div");
        this.goban_div.className = "Goban";

        // arrange translation of known joseki tags
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
    }

    initializeGoban = (initial_position?: string) => {
        // this can be called at any time to reset the board
        if (this.goban != null) {
            this.goban.destroy();
        }

        const opts: GobanConfig = {
            board_div: this.goban_div,
            interactive: true,
            mode: "puzzle",
            player_id: 0,
            server_socket: undefined,
            square_size: 20,
        };

        if (initial_position) {
            opts["moves"] = initial_position as any;
        }
        this.goban_opts = opts;
        this.goban = new Goban(opts);
        this.goban.setMode("puzzle");
        this.goban.on("update", () => this.onBoardUpdate());
        (window as any)["global_goban"] = this.goban;
    };

    componentDidMount = () => {
        this.getUserJosekiPermissions();

        // we get the tags here because they are needed for selector components, initial settings for those,
        // and also for Play mode
        get(server_url + "tags")
            .then((body: any) => {
                this.joseki_tags = body.tags.map((tag: any) => ({
                    label: tag.description,
                    value: tag.id,
                }));
                // By agreement and definition, the first tag in the list from the server must be the Joseki tag
                this.the_joseki_tag = body.tags[0].id;

                // Make the variation filter initialize to "Joseki" tag, if they
                // didn't already set one
                const saved_filter = data.get("oje-variation-filter");

                this.updateVariationFilter(
                    saved_filter
                        ? saved_filter
                        : {
                              tags: [this.joseki_tags[0]],
                              contributor: undefined,
                              source: undefined,
                          },
                );
            })
            .catch((r) => {
                console.log("Tags GET failed:", r);
            });

        const target_position = this.props.match.params.pos || "root";

        if (target_position !== "root") {
            this.load_sequence_to_board = true;

            const queries = queryString.parse(this.props.location.search);
            if (queries.show_comments) {
                this.show_comments_requested = true;
            }
        }

        this.initializeBoard(target_position);
    };

    initializeBoard = (target_position: string = "root") => {
        this.next_moves = [];
        this.move_trace = [target_position];
        this.trace_index = 0;

        this.played_mistake = false;
        this.computer_turn = false;

        this.setState({
            move_string: "",
            current_move_category: "",
            move_type_sequence: [],
            joseki_errors: 0,
            joseki_successes: undefined,
            joseki_best_attempt: undefined,
        });
        this.initializeGoban();
        this.resetJosekiSequence(target_position);
    };

    resetBoard = () => {
        this.last_click = new Date().valueOf();
        this.initializeBoard("root");
    };

    getUserJosekiPermissions = () => {
        get(server_url + "user-permissions")
            .then((body) => {
                this.setState({
                    user_can_edit: body.can_edit,
                    user_can_administer: body.can_admin,
                    user_can_comment: body.can_comment,
                });
            })
            .catch((r) => {
                console.log("Permissions GET failed:", r);
            });
    };

    resetJosekiSequence = (pos: string) => {
        // ask the server for the moves from position pos
        this.fetchNextFilteredMovesFor(pos, this.state.variation_filter);
    };

    loadPosition = (node_id: string) => {
        console.log("load position:", node_id);
        this.load_sequence_to_board = true;
        this.fetchNextMovesFor(node_id);
        this.move_trace = [];
        this.trace_index = -1;
    };

    updatePlayerJosekiRecord = (node_id: string) => {
        if (!data.get("user").anonymous) {
            put(server_url + "playrecord", {
                position_id: node_id,
                errors: this.state.joseki_errors,
            })
                .then((body) => {
                    this.extractPlayResults(body);
                })
                .catch((r) => {
                    console.log("Play record PUT failed:", r);
                });
        }
    };

    // Fetch the next moves based on the current filter
    fetchNextMovesFor = (node_id: string) => {
        this.fetchNextFilteredMovesFor(node_id, this.state.variation_filter);
    };

    // Fetch the next moves based on the supplied filter
    // Note that this is where a "position gets rendered" after the placement of a stone, or some other trigger.
    // A trigger like placing a stone happens, then this gets called (from processPlacement etc), then the result gets rendered
    // in the processing of the result of the fetch for that position.

    private fetchNextFilteredMovesFor = (node_id: string, variation_filter: JosekiFilter) => {
        if (!this.the_joseki_tag) {
            return; // there is no point fetching anything until we've finished getting the initial stuff from the server.
        }
        /* TBD: error handling, cancel on new route */
        /* Note that this routine is responsible for enabling stone placement when it has finished the fetch */
        this.waiting_for = node_id; // keep track of which position is the latest one that we're interested in

        // visual indication that we are processing their click
        this.setState({
            position_description: "",
            throb: true,
        });

        // We have to turn show_comments_requested off once we are done loading a first position...
        this.show_comments_requested = this.load_sequence_to_board
            ? this.show_comments_requested
            : false;

        // Because of tricky sequencing of state update from server responses, caching works only with
        // explore mode  ... the other modes need processNewMoves to happen after completion of fetchNextFilteredMovesFor() (IE this procedure)
        // which doesn't work with caching... needs some reorganisation to make that work
        if (this.state.mode === PageMode.Explore && this.cached_positions.hasOwnProperty(node_id)) {
            this.processNewMoves(node_id, (this.cached_positions as any)[node_id]);
            this.prefetchFor(node_id, variation_filter);
        } else {
            // First, get the required position from the server as soon as possible
            get(position_url(node_id, variation_filter, this.state.mode))
                .then((body) => {
                    const target_node = body; // the one we're after comes in the first slot of the array

                    // If this response we just got is the one we're waiting for now (rather than an old one) then process it
                    if (
                        (this.waiting_for === "root" && target_node.placement === "root") ||
                        this.waiting_for === target_node.node_id.toString()
                    ) {
                        this.processNewMoves(node_id, target_node);
                        // caching this one is important, because node_id could be "root", which needs to be cached this way
                        this.cached_positions = {
                            [node_id]: target_node,
                            ...this.cached_positions,
                        };
                    } else {
                        // This can happen when (for example) the filter changes, causing a re-fetch with different filter params
                        // with one already mid-flight.
                        /*console.log(
                            "Ignoring server response",
                            target_node.node_id,
                            " while looking for ",
                            this.waiting_for,
                        ); */
                    }
                })
                .catch((r) => {
                    console.log("Node GET failed:", r);
                    this.setState({ throb: false });
                });

            // Then prefetch the next positions from this one, after a short pause to let the main fetch get underway
            setTimeout(() => {
                this.prefetchFor(node_id, variation_filter);
            }, 100);
        }
    };

    prefetchFor = (node_id: string, variation_filter: JosekiFilter) => {
        // Prefetch the next nodes, by calling the prefetch API, unless we already have a pre-fetch in flight
        // (no point in driving server load up with overlapping and expensive prefetches!)
        if (!this.prefetching) {
            if (!this.prefetched[node_id]) {
                this.prefetching = true;
                get(prefetch_url(node_id, variation_filter, this.state.mode))
                    .then((body) => {
                        this.prefetching = false;
                        this.prefetched[node_id] = true;
                        body.forEach((move_info: any) => {
                            this.cached_positions = {
                                [move_info["node_id"]]: move_info,
                                ...this.cached_positions,
                            };
                        });
                    })
                    .catch((r) => {
                        this.prefetching = false;
                        console.log("Node Prefetch failed:", r);
                        this.setState({ throb: false });
                    });
            }
        }
    };

    // Handle the per-move processing of getting to the new node.
    // node_id is a string because it can be either "root" or a node id number
    // The data is in dto - it is a BoardPositionDTO from the server, but may have been
    // cached locally.

    processNewMoves = (node_id: string, dto: any) => {
        if (this.load_sequence_to_board) {
            // when they clicked a position link, we have to load the whole sequence we received onto the board
            // to get to that position
            this.loadSequenceToBoard(dto.play);
            this.load_sequence_to_board = false;
        }

        this.processNewJosekiPosition(dto);

        // const elapsed = new Date().valueOf() - this.last_click;

        if (this.state.count_details_open) {
            this.showVariationCounts(node_id);
        }

        if (this.state.mode === PageMode.Play) {
            const good_moves = dto.next_moves.filter(
                (move: any) => !bad_moves.includes(move.category),
            );

            if (good_moves.length === 0 && !this.played_mistake) {
                this.setState({
                    move_type_sequence: [
                        ...this.state.move_type_sequence,
                        { type: "complete", comment: _("Joseki!") }, // translators: the person completed a joseki sequence successfully
                    ],
                });
                this.updatePlayerJosekiRecord(node_id);
            }

            if (this.computer_turn) {
                // obviously, we don't place another stone if we just placed one
                this.computer_turn = false;
            } else if (dto.next_moves.length > 0 && this.state.move_string !== "") {
                // the computer plays both good and bad moves
                const next_play = dto.next_moves[Math.floor(Math.random() * dto.next_moves.length)];

                this.computer_turn = true;
                if (next_play.placement === "pass") {
                    this.goban.pass();
                    this.onBoardUpdate();
                } else {
                    const location = this.goban.engine.decodeMoves(next_play.placement)[0];
                    this.goban.engine.place(location.x, location.y);
                    this.onBoardUpdate();
                }
            }
        }

        this.setState({ throb: false });
        this.goban.enableStonePlacement();
    };

    loadSequenceToBoard = (sequence: string) => {
        // We expect sequence to come from the server in the form ".root.K10.L11.pass.Q12"
        // Goban wants "K10L11..Q12"

        const ogs_move_string = sequence.substr(6).replace(/\./g, "").replace(/pass/g, "..");
        this.initializeGoban(ogs_move_string);
        this.onBoardUpdate();
    };

    // Decode a response from the server into state we need, and display accordingly
    // "position" is a BoardPositionDTO
    processNewJosekiPosition = (position: any) => {
        this.setState({
            // I really wish I'd just put all of this into a single state object :S
            // It's on the "gee that would be good to refactor" list...
            position_description: position.description,
            see_also: position.see_also,
            contributor_id: position.contributor,
            variation_label: position.variation_label, // needed for when we edit this position
            current_move_category: position.category,
            current_node_id: position.node_id + "", // make sure it's a string - we don't care whether the server thinks its a number
            current_comment_count: position.comment_count,
            joseki_source: position.joseki_source,
            tags: position.tags,
            child_count: position.child_count,
            db_locked_down: position.db_locked_down,
        });
        this.waiting_for = "";
        this.last_server_position = position.play;
        this.last_placement = position.placement;
        this.next_moves = position.next_moves;
        this.current_marks = JSON.parse(position.marks) || [];
        this.previous_position = position.parent;
        if (this.state.mode !== PageMode.Play || this.state.move_string === "") {
            this.renderCurrentJosekiPosition();
        }

        // Give them the URL for this position in the URL bar
        window.history.replaceState({}, document.title, "/joseki/" + position.node_id);
    };

    // Draw all the variations that we know about from the server (array of moves from the server)
    renderCurrentJosekiPosition = () => {
        const next_moves = this.next_moves;
        const current_marks = this.current_marks;
        this.goban.engine.cur_move.clearMarks(); // these usually get removed when the person clicks ... but just in case.
        let new_options: { [k: string]: { move: string; color: string } } = {};
        let pass_available = false;
        next_moves.forEach((option) => {
            new_options = {};
            if (option["placement"] === "pass") {
                pass_available = option["category"].toLowerCase(); // this is used as a css style for the button
            } else {
                const label = option["variation_label"];
                new_options[label] = {
                    move: GoMath.encodePrettyCoord(option["placement"], this.goban.height),
                    color: (ColorMap as any)[option["category"]],
                };
            }
            // we have to do this one at a time in case there are more than one variation with the same label
            // because we can draw multiple with the same label, but only one at a time with this call!
            this.goban.setColoredMarks(new_options);
        });

        this.setState({ pass_available });
        const new_marks: { [k: string]: string } = {};
        current_marks.forEach((mark: { [k: string]: string }) => {
            const label = mark["label"];
            new_marks[label] = GoMath.encodePrettyCoord(mark["position"], this.goban.height);
            this.goban.setMarks(new_marks);
        });
        this.goban.redraw(true); // stop it optimizing away color changes when mark doesn't change.
    };

    /* This is called every time a move is played on the Goban
       or anything else changes about the state of the board (back-step, sequence load)

       We ask the board engine what the position is now, and update the display accordingly */

    onBoardUpdate = () => {
        this.last_click = new Date().valueOf();
        const mvs = GoMath.decodeMoves(
            this.goban.engine.cur_move.getMoveStringToThisPoint(),
            this.goban.width,
            this.goban.height,
        );

        let move_string;
        let the_move;

        if (mvs.length > 0) {
            const move_string_array = mvs.map((p) => {
                let coord = GoMath.prettyCoords(p.x, p.y, this.goban.height);
                coord = coord === "" ? "pass" : coord; // if we put '--' here instead ... https://stackoverflow.com/questions/56822128/rtl-text-direction-displays-dashes-very-strangely-bug-or-misunderstanding#
                return coord;
            });

            move_string = move_string_array.join(",");

            the_move = mvs[mvs.length - 1];
        } else {
            move_string = "";
            the_move = undefined;
        }
        if (move_string !== this.state.move_string) {
            this.goban.disableStonePlacement(); // we need to only have one click being processed at a time
            this.setState({ move_string });
            this.processPlacement(the_move as JGOFMove, move_string); // this is responsible for making sure stone placement is turned back on
        } else {
            this.back_stepping = false; // Needed for if they back step twice at the empty board
        }
    };

    // This is like GoMath.PrettyCoords except we must always have 3 characters
    josekiCoords(x: number, y: number, board_height: number): string {
        if (x >= 0) {
            return "ABCDEFGHJKLMNOPQRSTUVWXYZ"[x] + String(board_height - y).padStart(2, "0");
        }
        return "pass";
    }

    processPlacement(move: { x: number; y: number }, move_string: string) {
        /* They've either
            clicked a stone onto the board in a new position,
            or hit "back" to arrive at an old position,
            or we got here during "loading a new sequence"

            Note that this routine must either call this.fetchNextMovesFor() or this.goban.enableStonePlacement()
            ... otherwise stone placement will be left turned off.
            */

        const placement = move ? this.josekiCoords(move.x, move.y, this.goban.height) : "root";

        if (this.back_stepping) {
            const play = ".root." + move_string.replace(/,/g, ".");
            //console.log("finishing back step to ", play);
            //console.log("with category", this.state.current_move_category);
            this.back_stepping = false;
            if (this.state.mode === PageMode.Play) {
                // in theory can only happen when back stepping out of a mistake
                // in this case, all the data for the position we arrived at should be valid (not reset exploratory)
                this.played_mistake = false;
                this.back_stepping = false;
                this.goban.enableStonePlacement();
            } else if (this.state.current_move_category !== "new") {
                const stepping_back_to = this.previous_position.node_id;
                this.fetchNextMovesFor(stepping_back_to);
                this.trace_index--;
                if (this.trace_index === -1) {
                    // they might have started not at root, so they _can_ attempt to step backwards past zero
                    this.trace_index = 0;
                    this.move_trace.unshift(stepping_back_to);
                } else if (
                    this.move_trace[this.trace_index] !== stepping_back_to &&
                    this.move_trace[this.trace_index] !== "root"
                ) {
                    console.log(
                        "** whoa, move trace out of sync",
                        this.move_trace[this.trace_index],
                        stepping_back_to,
                    );
                    this.trace_index = 0;
                    this.move_trace = [stepping_back_to];
                }
                // this.setState({ current_move_category: this.previous_position.category }); redundant, done in processNewJosekiPosition?
            } else if (play === this.last_server_position) {
                //console.log("Arriving back at known moves...");
                // We have back stepped back to known moves
                if (this.state.most_recent_known_node) {
                    this.fetchNextMovesFor(this.state.most_recent_known_node);
                }
            } else {
                this.back_stepping = false; // nothing else to do
                this.goban.enableStonePlacement();
            }

            //console.log("trace:", this.move_trace, this.trace_index);
        } else if (this.load_sequence_to_board) {
            this.goban.enableStonePlacement();
        } else {
            // they must have clicked a stone onto the board
            const chosen_move = this.next_moves.find((move) => move.placement === placement);

            if (
                this.state.mode === PageMode.Play &&
                !this.computer_turn && // computer is allowed/expected to play mistake moves to test the response to them
                (chosen_move === undefined || // not in valid list of next_moves
                    bad_moves.includes(chosen_move.category))
            ) {
                this.played_mistake = true;
                this.last_placement = placement;
            }

            if (chosen_move !== undefined && !this.played_mistake) {
                /* The database already knows about this move, so we just get and display the new position information */
                const node_id = chosen_move.node_id + "";
                this.fetchNextMovesFor(node_id);

                if (this.trace_index === this.move_trace.length - 1) {
                    this.move_trace.push(node_id);
                    this.trace_index++;
                } else {
                    if (node_id === this.move_trace[this.trace_index + 1]) {
                        // we're going forwards the same way we went last time
                        this.trace_index++;
                    } else {
                        // we must have back-stepped and are now going a different way
                        // dump old move trace past this point
                        this.move_trace.length = this.trace_index + 1;
                        // and add this one instead
                        this.move_trace.push(node_id);
                        this.trace_index++;
                    }
                }

                //console.log("trace:", this.move_trace, this.trace_index);
            } else if (chosen_move === undefined && !this.played_mistake) {
                /* This isn't in the database */
                let next_variation_label = "1";
                // pre-set the variation label for edit-mode with the number of children this new move's parent has.
                if (this.next_moves.length > 0) {
                    const labelled_here = this.next_moves.reduce(
                        (count, move) =>
                            "123456789".includes(move["variation_label"]) &&
                            move["placement"] !== "pass"
                                ? count + 1
                                : count,
                        0,
                    );
                    // Chose the next variation label to be the one after the current count
                    // Note that '1' will never actually be chosen through this code.
                    next_variation_label = "123456789_".charAt(labelled_here);
                }
                this.next_moves = [];
                this.setState({
                    most_recent_known_node: this.state.current_node_id,
                    current_node_id: undefined,
                    position_description: "", // Blank default description
                    current_move_category: "new",
                    child_count: 0,
                    tag_counts: [],
                    variation_label: next_variation_label,
                    joseki_source: undefined,
                    tags: [],
                });
                this.goban.enableStonePlacement();
            }

            if (this.state.mode === PageMode.Play) {
                const move_type = this.computer_turn
                    ? "computer"
                    : chosen_move === undefined || bad_moves.includes(chosen_move.category)
                      ? "bad"
                      : "good";

                const comment =
                    placement +
                    ": " +
                    (chosen_move === undefined
                        ? _("That move isn't listed!")
                        : pgettext(
                              "Joseki move category",
                              (MoveCategory as any)[chosen_move.category],
                          ));

                this.setState({
                    move_type_sequence: [
                        ...this.state.move_type_sequence,
                        { type: move_type, comment: comment },
                    ],
                    joseki_errors:
                        move_type === "bad"
                            ? this.state.joseki_errors + 1
                            : this.state.joseki_errors,
                });
            }

            if (
                this.state.mode === PageMode.Play &&
                this.played_mistake &&
                !this.back_stepping &&
                !this.computer_turn
            ) {
                // They clicked a non-Joseki move

                this.renderMistakeResult();
                // Note: we have not called fetchNextMoves or enablePlacement, so placement is turned off now!
            }
        }
    }

    renderMistakeResult = () => {
        // Draw the correct options (which must be still in this.next_moves)
        // and cross out the wrong option (which is expected in this.last_placement)

        this.renderCurrentJosekiPosition();

        if (this.last_placement !== "pass") {
            const new_options = {
                X: {
                    move: GoMath.encodePrettyCoord(this.last_placement, this.goban.height),
                    color: ColorMap["MISTAKE"],
                },
            };
            this.goban.setColoredMarks(new_options);
        }
    };

    componentDidUpdate(prevProps: JosekiProps) {
        if (prevProps.location !== this.props.location) {
            this.componentDidMount(); // force reload of position if they click a position link
        }
    }

    setAdminMode = () => {
        this.resetBoard();
        this.setState({
            mode: PageMode.Admin,
        });
    };

    setExploreMode = () => {
        this.setState({
            mode: PageMode.Explore,
        });
    };

    setPlayMode = () => {
        this.setState({
            mode: PageMode.Play,
            played_mistake: false,
            move_type_sequence: [],
            computer_turn: false,
            joseki_errors: 0,
            joseki_successes: undefined,
            joseki_best_attempt: undefined,
            count_display_open: false,
        });
        this.fetchPlayResults();
    };

    setEditMode = () => {
        this.setState({
            mode: PageMode.Edit,
        });
    };

    // Here we are getting the user's overall play history results
    fetchPlayResults = () => {
        const results_url = server_url + "playrecord";

        this.setState({ extra_throb: true });
        get(results_url)
            .then((body) => {
                this.setState({ extra_throb: false });
                this.extractPlayResults(body);
            })
            .catch((r) => {
                console.log("Play results GET failed:", r);
            });
    };

    // results DTO can come from either a fetch of the overall player record, or a put of the results of a particular sequence
    extractPlayResults = (results_dto: any) => {
        this.setState({
            josekis_played: results_dto.josekis_played,
            josekis_completed: results_dto.josekis_completed,
            joseki_best_attempt: results_dto.error_count,
            joseki_successes: results_dto.successes,
        });
    };

    backOneMoveKey = () => {
        //console.log("backarrow key");
        // Play mode has back and forwards button disabled
        if (this.state.mode !== PageMode.Play) {
            this.backOneMove();
        }
    };

    backOneMove = () => {
        // They clicked the back button ... tell goban and let it call us back with the result
        if (!this.back_stepping && !this.state.throb) {
            this.back_stepping = true; // make sure we know the reason why the goban called us back
            this.goban.showPrevious();
        }
    };

    forwardOneMoveKey = () => {
        // Play mode has back and forwards button disabled
        if (this.state.mode !== PageMode.Play) {
            this.forwardOneMove();
        }
    };

    forwardOneMove = () => {
        // They clicked the forwards arrow, so take them forwards the way they went before, if we can...
        if (this.move_trace.length < 2 || this.trace_index > this.move_trace.length - 2) {
            // We don't have a saved move to step forwards to

            // Try to step them forwards into the best joseki choice at this position...
            // (but don't do passes, cause that's weird for arrow keys, and more complicated to achieve :) )

            if (this.next_moves.length > 0) {
                const best_move = this.next_moves.reduce((prev_move, next_move) =>
                    prev_move.variation_label > next_move.variation_label &&
                    next_move.placement !== "pass"
                        ? next_move
                        : prev_move,
                );
                this.doPlacement(best_move.placement);
            }
            return;
        }

        const target_forward_move = this.move_trace[this.trace_index + 1];
        if (this.cached_positions.hasOwnProperty(target_forward_move)) {
            // we should of course have it cached, since they visited it already
            // which is handy, because we need the placement from the node id - available in the cache
            const step_to = (this.cached_positions as any)[target_forward_move].placement;
            this.doPlacement(step_to);
        }
    };

    doPlacement = (placement: string): void => {
        if (placement === "pass") {
            this.doPass();
        } else {
            const location = this.goban.engine.decodeMoves(placement)[0];
            try {
                // Sometimes we get ahead of ourselves and try stomping stones
                // down on top of each other. This happens sometimes if we hit
                // the forward button really fast. It'd probably be better to
                // handle that better, so I'll open an issue for that but for
                // now I'm catching the error so it doesn't clutter up the sentry
                // logs anymore.
                this.goban.engine.place(location.x, location.y);
            } catch (e) {
                console.warn(e);
            }
            this.onBoardUpdate();
        }
    };

    doPass = () => {
        this.goban.pass();
        this.goban.engine.cur_move.clearMarks();
        this.goban.redraw();
        this.onBoardUpdate(); // seems like pass does not trigger this!
    };

    updateVariationFilter = (filter: JosekiFilter) => {
        this.setState({
            variation_filter: filter,
        });
        data.set("oje-variation-filter", filter);
        this.cached_positions = {}; // dump cache because the filter changed, and the cache holds filtered results
        this.prefetching = false; // and ignore any results already in flight
        const node_to_fetch = this.waiting_for || this.state.current_node_id;
        if (node_to_fetch) {
            this.fetchNextFilteredMovesFor(node_to_fetch, filter);
        }
    };

    updateMarks = (marks: Array<{ label: string; position: string }>) => {
        this.current_marks = marks;
        this.renderCurrentJosekiPosition();
    };

    toggleContinuationCountDetail = () => {
        if (this.state.count_details_open) {
            this.hideVariationCounts();
        } else if (this.state.current_node_id) {
            this.showVariationCounts(this.state.current_node_id);
        }
    };

    showVariationCounts = (node_id: string) => {
        this.setState({
            tag_counts: [],
            count_details_open: true,
            counts_throb: true,
        });

        get(tag_count_url(node_id))
            .then((body) => {
                let tags: any[] = [];
                if (body.tags) {
                    tags = body.tags.sort((t1: any, t2: any) =>
                        t1.group !== t2.group
                            ? Math.sign(t1.group - t2.group)
                            : Math.sign(t1.seq - t2.seq),
                    );
                }
                const counts: any[] = [];
                tags.forEach((t) => {
                    counts.push({ tagname: t.description, count: t.continuationCount });
                });
                this.setState({
                    tag_counts: counts,
                    counts_throb: false,
                });
            })
            .catch((r) => {
                console.log("Continuation Counts GET failed:", r);
            });
    };

    hideVariationCounts = () => {
        this.setState({ count_details_open: false });
    };

    updateDBLockStatus = (new_status: boolean) => {
        this.setState({ db_locked_down: new_status });
    };

    render() {
        //console.log("Joseki app rendering ", this.state.variation_filter);

        const tenuki_type =
            this.state.pass_available &&
            this.state.mode !== PageMode.Play &&
            this.state.move_string !== ""
                ? this.state.pass_available
                : "";

        const count_details = this.state.count_details_open ? (
            <React.Fragment>
                {this.state.tag_counts
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

        const tags = !this.state.tags
            ? ""
            : this.state.tags
                  .sort((a, b) => Math.sign(a.group - b.group))
                  .map((tag, idx) => (
                      <div className="position-tag" key={idx}>
                          <span>{pgettext("This is a Joseki Tag", tag["description"])}</span>
                      </div>
                  ));

        return (
            <div className={"Joseki"}>
                <KBShortcut shortcut="home" action={this.resetBoard} />
                <KBShortcut shortcut="left" action={this.backOneMoveKey} />
                <KBShortcut shortcut="right" action={this.forwardOneMoveKey} />

                <div
                    className={
                        "left-col" + (this.state.mode === PageMode.Admin ? " admin-mode" : "")
                    }
                >
                    <GobanContainer
                        goban={this.goban}
                        extra_props={{
                            style: { paddingLeft: this.state.goban_container_left_padding },
                        }}
                    />
                </div>
                <div className="right-col">
                    <div className="top-bar">
                        <div
                            className={"move-controls" + (this.played_mistake ? " highlight" : "")}
                        >
                            <i className="fa fa-fast-backward" onClick={this.resetBoard}></i>
                            <i
                                className={
                                    "fa fa-step-backward" +
                                    (this.state.mode !== PageMode.Play || this.played_mistake
                                        ? ""
                                        : " hide")
                                }
                                onClick={this.backOneMove}
                            ></i>
                            <i
                                className={
                                    "fa fa-step-forward" +
                                    (this.state.mode !== PageMode.Play &&
                                    ((this.move_trace.length > 1 &&
                                        this.trace_index < this.move_trace.length - 1) ||
                                        this.next_moves.length > 0)
                                        ? ""
                                        : " hide")
                                }
                                onClick={this.forwardOneMove}
                            ></i>
                            <button className={"pass-button " + tenuki_type} onClick={this.doPass}>
                                {_("Tenuki")}
                            </button>
                            <div className="throbber-spacer">
                                <Throbber throb={this.state.throb} />
                            </div>
                        </div>
                        <div className="top-bar-other">
                            {this.renderModeControl()}
                            <a
                                href="https://github.com/online-go/online-go.com/wiki/OGS-Joseki-Explorer"
                                className="joseki-help"
                            >
                                <i className="fa fa-question-circle-o"></i>
                            </a>
                        </div>
                    </div>

                    {this.renderModeMainPane()}

                    <div className="position-details">
                        <div
                            className={
                                "status-info" + (this.state.move_string === "" ? " hide" : "")
                            }
                        >
                            {this.state.position_type !== "new" && (
                                <div className="position-other-info">
                                    {tags}
                                    {this.state.joseki_source &&
                                        this.state.joseki_source.url.length > 0 && (
                                            <div className="position-joseki-source">
                                                <span>{_("Source")}:</span>
                                                <a href={this.state.joseki_source.url}>
                                                    {this.state.joseki_source.description}
                                                </a>
                                            </div>
                                        )}
                                    {this.state.joseki_source &&
                                        this.state.joseki_source.url.length === 0 && (
                                            <div className="position-joseki-source">
                                                <span>{_("Source")}:</span>
                                                <span>{this.state.joseki_source.description}</span>
                                            </div>
                                        )}
                                </div>
                            )}
                            <div className="move-category">
                                {this.state.current_move_category === ""
                                    ? ""
                                    : _("Last move") +
                                      ": " +
                                      (this.state.current_move_category === "new"
                                          ? this.state.mode === PageMode.Explore
                                              ? _("Experiment")
                                              : _("Proposed Move")
                                          : pgettext(
                                                "Joseki move category",
                                                this.state.current_move_category,
                                            ))}
                            </div>

                            <div
                                className={
                                    "contributor" +
                                    (this.state.current_move_category === "new" ? " hide" : "")
                                }
                            >
                                <span>{_("Contributor")}:</span>{" "}
                                <Player user={this.state.contributor_id} />
                            </div>
                            <div>{_("Moves made")}:</div>
                            <div className="moves-made">
                                {this.state.current_move_category !== "new" ? (
                                    <Link
                                        className="moves-made-string"
                                        to={"/joseki/" + this.state.current_node_id}
                                    >
                                        {this.state.move_string}
                                    </Link>
                                ) : (
                                    <span className="moves-made-string">
                                        {this.state.move_string}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="continuations-pane">
                            {!!this.state.child_count && (
                                <React.Fragment>
                                    <button
                                        className="position-child-count"
                                        onClick={this.toggleContinuationCountDetail}
                                    >
                                        {interpolate(_("This position leads to {{count}} others"), {
                                            count: this.state.child_count,
                                        })}
                                        {!this.state.count_details_open && (
                                            <i className="fa fa-lg fa-caret-right"></i>
                                        )}
                                        {this.state.count_details_open && (
                                            <i className="fa fa-lg fa-caret-down"></i>
                                        )}
                                    </button>
                                    <div
                                        className={
                                            "child-count-details-pane" +
                                            (this.state.count_details_open
                                                ? " details-pane-open"
                                                : "")
                                        }
                                    >
                                        {this.state.count_details_open && (
                                            <div className="count-details">
                                                <Throbber throb={this.state.counts_throb} />
                                                {count_details}
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            )}
                            {!this.state.child_count && (
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

    renderModeControl = () => (
        <div className="mode-control btn-group">
            <button
                className={"btn s  " + (this.state.mode === PageMode.Explore ? "primary" : "")}
                onClick={this.setExploreMode}
            >
                {_("Explore")}
            </button>
            <button
                className={"btn s  " + (this.state.mode === PageMode.Play ? "primary" : "")}
                onClick={this.setPlayMode}
            >
                {_("Play")}
            </button>
            {this.state.user_can_edit && !this.state.db_locked_down && (
                <button
                    className={"btn s  " + (this.state.mode === PageMode.Edit ? "primary" : "")}
                    onClick={this.setEditMode}
                >
                    {this.state.current_move_category === "new" &&
                    this.state.mode === PageMode.Explore
                        ? _("Save")
                        : _("Edit")}
                </button>
            )}
            {this.state.user_can_edit && this.state.db_locked_down && (
                <button className={"btn s "} disabled>
                    Edit <i className="fa fa-lock" />
                </button>
            )}
            <button
                className={"btn s  " + (this.state.mode === PageMode.Admin ? "primary" : "")}
                onClick={this.setAdminMode}
            >
                {this.state.user_can_administer ? _("Admin") : _("Updates")}
            </button>
        </div>
    );

    renderModeMainPane = () => {
        if (this.state.mode === PageMode.Admin) {
            return (
                <JosekiAdmin
                    server_url={server_url}
                    user_can_administer={this.state.user_can_administer}
                    user_can_edit={this.state.user_can_edit}
                    db_locked_down={this.state.db_locked_down}
                    loadPositionToBoard={this.loadPosition}
                    updateDBLockStatus={this.updateDBLockStatus}
                />
            );
        } else if (
            this.state.mode === PageMode.Explore ||
            (this.state.mode === PageMode.Edit && this.state.move_string === "") // you can't edit the empty board
        ) {
            return (
                <ExplorePane
                    description={this.state.position_description}
                    position_type={this.state.current_move_category}
                    see_also={this.state.see_also}
                    comment_count={this.state.current_comment_count as number}
                    position_id={this.state.current_node_id as any}
                    can_comment={this.state.user_can_comment}
                    joseki_source={this.state.joseki_source as any}
                    tags={this.state.tags}
                    joseki_tags={this.joseki_tags}
                    set_variation_filter={this.updateVariationFilter}
                    current_filter={this.state.variation_filter}
                    child_count={this.state.child_count}
                    show_comments={this.show_comments_requested}
                />
            );
        } else if (this.state.mode === PageMode.Edit) {
            return (
                <EditPane
                    node_id={this.state.current_node_id as any} // initial value of component node_id state
                    category={this.state.current_move_category}
                    description={this.state.position_description}
                    variation_label={this.state.variation_label}
                    joseki_source_id={
                        (this.state.joseki_source ? this.state.joseki_source.id : "none") as number
                    } // this is copied into the initial value of joseki_source state in the component
                    tags={this.state.tags}
                    contributor={this.state.contributor_id}
                    available_tags={this.joseki_tags}
                    save_new_info={this.saveNewPositionInfo}
                    update_marks={this.updateMarks}
                />
            );
        } else {
            return (
                <PlayPane
                    move_type_sequence={this.state.move_type_sequence}
                    joseki_errors={this.state.joseki_errors}
                    josekis_played={this.state.josekis_played as number}
                    josekis_completed={this.state.josekis_completed as number}
                    joseki_best_attempt={this.state.joseki_best_attempt as number}
                    joseki_successes={this.state.joseki_successes as number}
                    the_joseki_tag={this.the_joseki_tag}
                    joseki_tags={this.joseki_tags}
                    set_variation_filter={this.updateVariationFilter}
                    current_filter={this.state.variation_filter}
                />
            );
        }
    };

    saveNewPositionInfo = (
        move_type: string,
        variation_label: string,
        tags: number[],
        description: string,
        joseki_source_id: string | undefined,
        marks: { label: string; position: string }[],
    ) => {
        const mark_string = JSON.stringify(marks); // 'marks' is just a string as far as back end is concerned

        this.cached_positions = {}; // dump cache to make sure the editor sees their new results

        if (this.state.current_move_category !== "new") {
            // they must have pressed save on a current position.
            put(position_url(this.state.current_node_id as string), {
                description: description,
                variation_label: variation_label,
                tags: tags,
                category: move_type.toUpperCase(),
                joseki_source_id: joseki_source_id,
                marks: mark_string,
            })
                .then((body) => {
                    this.processNewJosekiPosition(body);
                    this.setExploreMode();
                })
                .catch((r) => {
                    console.log("Position PUT failed:", r);
                });
        } else {
            // Here the person has added one or more moves then clicked "save"
            // First we save the new position(s)
            post(server_url + "positions", {
                sequence: this.state.move_string,
                category: move_type.toUpperCase(),
            })
                .then((body) => {
                    //console.log("Server response to sequence POST:", body);

                    // Now we can save the fields that apply only to the final position

                    console.log("resulting node_id:", body.node_id);
                    put(position_url(body.node_id), {
                        description: description,
                        variation_label: variation_label,
                        tags: tags,
                        joseki_source_id: joseki_source_id,
                        marks: mark_string,
                    })
                        .then((body) => {
                            this.processNewJosekiPosition(body);
                            this.setExploreMode();
                        })
                        .catch((r) => {
                            console.log("Position PUT failed:", r);
                        });
                })
                .catch((r) => {
                    console.log("PositionS POST failed:", r);
                });
        }
    };
}

export const Joseki = rr6ClassShim(_Joseki);

// This pane responds to changes in position ID by showing the new node information
interface ExploreProps {
    position_id: string;
    description: string;
    position_type: string;
    see_also: number[];
    comment_count: number;
    can_comment: boolean;
    joseki_source: { url: string; description: string };
    joseki_tags: JosekiTag[];
    tags: Array<any>;
    set_variation_filter(filter: JosekiFilter): void;
    current_filter: JosekiFilter;
    child_count: number;
    show_comments: boolean;
}

interface Comment {
    user_id: string;
    date: Date;
    comment: string;
}
interface ExploreState {
    extra_info_selected: string;
    current_position: string;
    commentary: Comment[];
    forum_thread: string;
    audit_log: Comment[];
    next_comment: string;
    extra_throb: boolean;
}
class ExplorePane extends React.Component<ExploreProps, ExploreState> {
    constructor(props: ExploreProps) {
        super(props);

        this.state = {
            extra_info_selected: "none",
            current_position: "",
            commentary: [],
            forum_thread: "",
            audit_log: [],
            next_comment: "",
            extra_throb: false,
        };
    }

    componentDidMount = () => {
        if (this.props.show_comments) {
            console.log("comments forced");
            this.showComments();
        } else {
            this.showFilterSelector();
        }
    };

    static getDerivedStateFromProps(nextProps: ExploreProps, prevState: ExploreState) {
        // Detect position id changes, so we can manage the extra_info pane based on this
        if (nextProps.position_id !== prevState.current_position) {
            return { current_position: nextProps.position_id };
        } else {
            return null;
        }
    }

    componentDidUpdate = (prevProps: ExploreProps) => {
        if (prevProps.position_id !== this.props.position_id) {
            this.showFilterSelector();
        } else {
            if (
                this.props.position_id &&
                this.props.show_comments &&
                this.state.extra_info_selected === "none"
            ) {
                this.showComments();
            }
        }
    };

    showComments = () => {
        // Possible optimization: don't re-fetch if we already have them for this node
        const comments_url = server_url + "commentary?id=" + this.props.position_id;
        this.setState({ extra_throb: true });

        get(comments_url)
            .then((body) => {
                this.setState({ extra_throb: false });
                this.extractCommentary(body);
            })
            .catch((r) => {
                console.log("Comments GET failed:", r);
            });
        this.setState({ extra_info_selected: "comments" });
    };

    // (note - forum thread posting currently not supported, because discourse doesn't support it)
    extractCommentary = (commentary_dto: any) => {
        const commentary = commentary_dto.commentary.map((comment: any) => ({
            user_id: comment.user_id,
            date: new Date(comment.date),
            comment: comment.comment,
        }));
        const forum_thread_url =
            commentary_dto.forum_thread_id === null
                ? ""
                : "https://forums.online-go.com/t/" + commentary_dto.forum_thread_id;

        this.setState({
            commentary: commentary,
            forum_thread: forum_thread_url,
        });
    };

    hideExtraInfo = () => {
        this.setState({ extra_info_selected: "none" });
    };

    showAuditLog = () => {
        const audits_url = server_url + "audits?id=" + this.props.position_id;
        this.setState({ extra_throb: true });
        get(audits_url)
            .then((body) => {
                this.extractAuditLog(body);
            })
            .catch((r) => {
                console.log("Audits GET failed:", r);
            })
            .finally(() => {
                this.setState({ extra_throb: false });
            });

        this.setState({ extra_info_selected: "audit-log" });
    };

    extractAuditLog = (audit_log_dto: any) => {
        // the format is basically what we need.  Just capture it!
        this.setState({ audit_log: audit_log_dto });
    };

    showFilterSelector = () => {
        this.setState({ extra_info_selected: "variation-filter" });
    };

    // This is to provide visibility to the community that a comment was posted.
    // Our own chat is not ideal (no topics in a channel, not persistent etc), but since our forum (discourse)
    // don't have an API for posting into it, this is the best we've come up with.

    postCommentToChat = (comment: string, position_url: string) => {
        const proxy = chat_manager.join("global-joseki");
        proxy.channel.send(`/me said at ${position_url}: "${comment}"`);
    };

    onCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // If they hit enter, we intercept and save.  Otherwise just let them keep typing characters, up to the max length
        // (if they are allowed, of course)
        // because \r or \n give it length=1, we can't just check falsy to prevent empty comments
        if (/\r|\n/.exec(e.target.value) && e.target.value.length > 1) {
            const comment_url = server_url + "comment?id=" + this.props.position_id;
            const comment = this.state.next_comment;
            post(comment_url, { comment })
                .then((body) => {
                    this.extractCommentary(body);
                    this.postCommentToChat(
                        comment,
                        // (The chat knows how to mark up the full production server URL nicely)
                        `joseki ${this.props.position_id}`,
                    );
                })
                .catch((r) => {
                    console.log("Comment PUT failed:", r);
                });

            this.setState({ next_comment: "" });
        } else if (e.target.value.length < 200 && this.props.can_comment) {
            this.setState({ next_comment: e.target.value });
        }
    };

    render = () => {
        const filter_active =
            (this.props.current_filter.tags && this.props.current_filter.tags.length !== 0) ||
            this.props.current_filter.contributor ||
            this.props.current_filter.source;

        const description = applyJosekiMarkdown(this.props.description);

        //console.log("Explore Pane rendering", this.props.current_filter);

        return (
            <div className="explore-pane">
                <div className="description-column">
                    {this.props.position_type !== "new" ? (
                        <div className="position-description">
                            <AutoTranslate source={description} source_language={"en"} markdown />
                        </div>
                    ) : (
                        "" // "(new)"
                    )}
                    {(this.props.see_also.length !== 0 || null) && (
                        <div className="see-also-block">
                            <div>{_("See also:")}</div>
                            {this.props.see_also.map((node, index) => (
                                <Link key={index} to={"/joseki/" + node + " "}>
                                    {node}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
                <div className={"extra-info-column extra-info-open"}>
                    <div className="btn-group extra-info-selector">
                        <button
                            className={
                                "btn s " +
                                (this.state.extra_info_selected === "variation-filter"
                                    ? " primary"
                                    : "")
                            }
                            onClick={
                                this.state.extra_info_selected === "variation-filter"
                                    ? this.hideExtraInfo
                                    : this.showFilterSelector
                            }
                        >
                            <span>{_("Filter")}</span>
                            {this.state.extra_info_selected === "variation-filter" ? (
                                <i className={"fa fa-filter hide"} />
                            ) : (
                                <i
                                    className={
                                        "fa fa-filter" + (filter_active ? " filter-active" : "")
                                    }
                                />
                            )}
                        </button>
                        <button
                            className={
                                "btn s " +
                                (this.state.extra_info_selected === "comments" ? " primary" : "")
                            }
                            onClick={
                                this.state.extra_info_selected === "comments"
                                    ? this.hideExtraInfo
                                    : this.showComments
                            }
                        >
                            {_("Comments")} ({this.props.comment_count})
                        </button>
                        <button
                            className={
                                "btn s " +
                                (this.state.extra_info_selected === "audit-log" ? " primary" : "")
                            }
                            onClick={
                                this.state.extra_info_selected === "audit-log"
                                    ? this.hideExtraInfo
                                    : this.showAuditLog
                            }
                        >
                            {_("Changes")}
                        </button>
                    </div>

                    {this.state.extra_info_selected === "comments" && (
                        <div className="discussion-container">
                            <div className="discussion-lines">
                                <Throbber throb={this.state.extra_throb} />
                                {this.state.commentary.map((comment, idx) => (
                                    <div className="comment" key={idx}>
                                        <div className="comment-header">
                                            <Player user={parseInt(comment.user_id)}></Player>
                                            <div className="comment-date">
                                                {comment.date.toDateString()}
                                            </div>
                                        </div>
                                        <AutoTranslate
                                            className="comment-text"
                                            source={applyJosekiMarkdown(comment.comment)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <textarea
                                className="comment-input"
                                hidden={!this.props.can_comment}
                                rows={1}
                                value={this.state.next_comment}
                                onChange={this.onCommentChange}
                            />
                        </div>
                    )}

                    {this.state.extra_info_selected === "audit-log" && (
                        <div className="audit-container">
                            <Throbber throb={this.state.extra_throb} />
                            {this.state.audit_log.map((audit, idx) => (
                                <div className="audit-entry" key={idx}>
                                    <div className="audit-header">
                                        <Player user={parseInt(audit.user_id)}></Player>
                                        <div className="audit-date">
                                            {new Date(audit.date).toDateString()}
                                        </div>
                                    </div>
                                    {audit.comment}
                                </div>
                            ))}
                        </div>
                    )}

                    {this.state.extra_info_selected === "variation-filter" && (
                        <div className="filter-container">
                            <JosekiVariationFilter
                                contributor_list_url={server_url + "contributors"}
                                source_list_url={server_url + "josekisources"}
                                current_filter={this.props.current_filter}
                                set_variation_filter={this.props.set_variation_filter}
                                joseki_tags={this.props.joseki_tags}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };
}

// We should display entertaining gamey encouragement for playing Josekis correctly here...
interface PlayProps {
    move_type_sequence: MoveTypeWithComment[];
    joseki_errors: number;
    josekis_played: number;
    josekis_completed: number;
    joseki_best_attempt: number;
    joseki_successes: number;
    the_joseki_tag: JosekiTag;
    joseki_tags: JosekiTag[];
    set_variation_filter(filter: JosekiFilter): void;
    current_filter: JosekiFilter;
}

interface PlayState {
    extra_info_selected: string;
    extra_throb: boolean;
    forced_filter: boolean;
}
class PlayPane extends React.Component<PlayProps, PlayState> {
    constructor(props: PlayProps) {
        super(props);
        this.state = {
            extra_info_selected: "none",
            extra_throb: false,
            forced_filter: false,
        };
    }

    iconFor = (move_type: string) => {
        switch (move_type) {
            case "good":
                return <i className="fa fa-check" />;
            case "bad":
                return <i className="fa fa-times" />;
            case "computer":
                return <i className="fa fa-desktop" />;
            case "complete":
                return <i className="fa fa-star" />;
            default:
                return "";
        }
    };

    componentDidMount = () => {
        if (
            this.props.current_filter.contributor &&
            this.props.current_filter.tags &&
            this.props.current_filter.source
        ) {
            // Set up a Joseki filter by default
            this.props.set_variation_filter({
                tags: [this.props.the_joseki_tag],
                contributor: undefined,
                source: undefined,
            });
            this.showFilterSelector();
            this.setState({ forced_filter: true });
        } else {
            this.showResults();
        }
    };

    // here we are detecting each time they play a move, so we can
    // set the extra info selector in the most helpful way
    static getDerivedStateFromProps = (nextProps: PlayProps, prevState: PlayState) => {
        if (prevState.forced_filter && nextProps.move_type_sequence.length > 1) {
            return {
                extra_info_selected: "results",
                forced_filter: false,
            };
        }
        return null;
    };

    showFilterSelector = () => {
        this.setState({ extra_info_selected: "variation-filter" });
    };

    showResults = () => {
        this.setState({ extra_info_selected: "results" });
    };

    hideExtraInfo = () => {
        this.setState({ extra_info_selected: "none" });
    };

    render = () => {
        const filter_active =
            (this.props.current_filter.tags && this.props.current_filter.tags.length !== 0) ||
            this.props.current_filter.contributor ||
            this.props.current_filter.source;

        return (
            <div className="play-columns">
                <div className="play-dashboard">
                    {this.props.move_type_sequence.length === 0 && <div> Your move...</div>}
                    {this.props.move_type_sequence.map((move_type, id) => (
                        <div key={id}>
                            {this.iconFor(move_type["type"])}
                            {move_type["comment"]}
                        </div>
                    ))}
                </div>
                <div className={"extra-info-column extra-info-open"}>
                    <div className="btn-group extra-info-selector">
                        <button
                            className={
                                "btn s " +
                                (this.state.extra_info_selected === "results" ? " primary" : "")
                            }
                            onClick={
                                this.state.extra_info_selected === "results"
                                    ? this.hideExtraInfo
                                    : this.showResults
                            }
                        >
                            {_("Results")}
                        </button>
                        <button
                            className={
                                "btn s " +
                                (this.state.extra_info_selected === "variation-filter"
                                    ? " primary"
                                    : "")
                            }
                            onClick={
                                this.state.extra_info_selected === "variation-filter"
                                    ? this.hideExtraInfo
                                    : this.showFilterSelector
                            }
                        >
                            <span>{_("Filter")}</span>
                            {this.state.extra_info_selected === "variation-filter" ? (
                                <i className={"fa fa-filter hide"} />
                            ) : (
                                <i
                                    className={
                                        "fa fa-filter" + (filter_active ? " filter-active" : "")
                                    }
                                />
                            )}
                        </button>
                    </div>
                    {this.state.extra_info_selected === "results" && (
                        <div className="play-results-container">
                            <h4>{_("Overall:")}</h4>
                            <div>
                                {_("Josekis played")}: {this.props.josekis_played}
                            </div>
                            <div>
                                {_("Josekis played correctly")}: {this.props.josekis_completed}
                            </div>

                            <h4>{_("This Sequence:")}</h4>
                            <div>
                                {_("Mistakes so far")}: {this.props.joseki_errors}
                            </div>

                            {!!this.props.joseki_successes && (
                                <div>
                                    {_("Correct plays of this position")}:{" "}
                                    {this.props.joseki_successes}
                                </div>
                            )}
                            {!!this.props.joseki_best_attempt && (
                                <div>
                                    {interpolate(_("Best attempt: {{mistakes}}"), {
                                        mistakes: this.props.joseki_best_attempt,
                                    }) +
                                        " " +
                                        npgettext(
                                            "mistakes",
                                            "mistake",
                                            "mistakes",
                                            this.props.joseki_best_attempt,
                                        )}
                                </div>
                            )}
                        </div>
                    )}

                    {this.state.extra_info_selected === "variation-filter" && (
                        <div className="filter-container">
                            <JosekiVariationFilter
                                contributor_list_url={server_url + "contributors"}
                                source_list_url={server_url + "josekisources"}
                                current_filter={this.props.current_filter}
                                set_variation_filter={this.props.set_variation_filter}
                                joseki_tags={this.props.joseki_tags}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };
}

// This pane enables the user to edit the description and move attributes of the current position
// It re-reads position Props on node_id change

interface EditProps {
    node_id: number;
    description: string;
    category: string;
    variation_label: string;
    joseki_source_id: number;
    available_tags: JosekiTag[];
    tags: Array<any>; // TBD yuk what is this `any`
    contributor: number;
    save_new_info: (
        move_type: string,
        variation_label: string,
        tags: number[],
        description: string,
        joseki_source: string | undefined,
        marks: { label: string; position: string }[],
    ) => void;
    update_marks: (marks: Array<{ label: string; position: string }>) => void;
}

interface EditState {
    move_category: string;
    new_description: string;
    preview: string;
    node_id: number;
    joseki_source_list: { id: number; description: string }[];
    joseki_source: string | number;
    available_tag_list: any[]; // Appears to be unused
    // 'tags' is the value of the multi-select.  It has to have keys of 'label' and 'value' apparently.
    // ('valueKey' and 'labelKey' aren't working for me)
    tags: { label: string; value: number }[];
    variation_label: string;
}

class EditPane extends React.Component<EditProps, EditState> {
    constructor(props: EditProps) {
        super(props);

        this.state = {
            move_category:
                this.props.category === "new" ? Object.keys(MoveCategory)[0] : this.props.category,
            new_description: this.props.description,
            preview: this.props.description,
            node_id: this.props.node_id,
            joseki_source_list: [],
            joseki_source: this.props.joseki_source_id,
            available_tag_list: [],
            // 'tags' is the value of the multi-select.  It has to have keys of 'label' and 'value' apparently.
            // ('valueKey' and 'labelKey' aren't working for me)
            tags:
                this.props.tags === null
                    ? []
                    : this.props.tags.map((t) => ({ label: t.description, value: t.id })),
            variation_label: this.props.variation_label || "1",
        };

        // Get the list of joseki sources
        get(joseki_sources_url)
            .then((body) => {
                this.setState({
                    joseki_source_list: [{ id: "none", description: "(unknown)" }, ...body.sources],
                });
            })
            .catch((r) => {
                console.log("Sources GET failed:", r);
            });
    }

    static getDerivedStateFromProps = (nextProps: EditProps, prevState: EditState) => {
        // Detect node changes (resulting from clicking on the board), so we can update
        if (nextProps.node_id !== prevState.node_id) {
            return {
                node_id: nextProps.node_id,
                move_type:
                    nextProps.category === "new"
                        ? Object.keys(MoveCategory)[0]
                        : nextProps.category,
                new_description: nextProps.description,
                joseki_source: nextProps.joseki_source_id,
                tags:
                    nextProps.tags === null
                        ? []
                        : nextProps.tags.map((t) => ({ label: t.description, value: t.id })),
                variation_label: nextProps.variation_label || "1",
            };
        } else {
            return null;
        }
    };

    onTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({ move_category: e.target.value });
    };

    onSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({ joseki_source: e.target.value });
    };

    onTagChange = (e: ReactSelect.MultiValue<JosekiTag>) => {
        //console.log("changing tags", e);
        this.setState({ tags: e } as any);
    };

    handleEditInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const new_description = e.target.value;

        this.props.update_marks(this.currentMarksInDescription(new_description));

        this.setState({ new_description });
    };

    saveNewInfo = () => {
        this.props.save_new_info(
            this.state.move_category,
            this.state.variation_label,
            this.state.tags.map((t) => t.value),
            this.state.new_description,
            this.state.joseki_source !== "none" ? String(this.state.joseki_source) : undefined,
            this.currentMarksInDescription(this.state.new_description),
        );
    };

    currentMarksInDescription = (
        description: string,
    ): Array<{ label: string; position: string }> => {
        // Extract markup for "board marks"
        // maps markup of form "<label:position>"  to an array of {label, position} objects for each mark

        if (description === null) {
            // I don't see how, but Sentry logs seem to imply there is a way!
            return [];
        }

        // we have to grok each mark out of the multiline string then parse it, because es5.
        const mark_matches = description.match(/<[A-Z]:[A-Z][0-9]{1,2}>/gm);

        const current_marks: any[] = [];

        if (mark_matches) {
            mark_matches.forEach((mark) => {
                const extract = mark.match(/<([A-Z]):([A-Z][0-9]{1,2})>/);
                if (extract) {
                    current_marks.push({ label: extract[1], position: extract[2] });
                }
            });
        }

        return current_marks;

        /* The es2017 way:

        const mark_matches = Array.from(description.matchAll(/<([A-Z]):([A-Z][0-9]{1,2})>/mg));

        return mark_matches.map((mark_match) => ({label:mark_match[1], position: mark_match[2]}));
        */
    };

    promptForJosekiSource = () => {
        openModal(<JosekiSourceModal add_joseki_source={this.addJosekiSource} fastDismiss />);
    };

    addJosekiSource = (description: string, url: string) => {
        post(server_url + "josekisources", {
            source: { description: description, url: url, contributor: this.props.contributor },
        })
            .then((body) => {
                const new_source = { id: body.source.id, description: body.source.description };
                this.setState({
                    joseki_source_list: [new_source, ...this.state.joseki_source_list],
                    joseki_source: new_source.id,
                });
            })
            .catch((r) => {
                console.log("Sources POST failed:", r);
            });
    };

    onLabelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({ variation_label: e.target.value });
    };

    render = () => {
        // create the set of select option elements from the valid MoveCategory items, with the current one at the top
        const selections = Object.keys(MoveCategory).map((selection, i) => (
            <option key={i} value={(MoveCategory as any)[selection]}>
                {pgettext("Joseki move category", (MoveCategory as any)[selection])}
            </option>
        ));

        if (this.state.move_category !== "new") {
            selections.unshift(
                <option key={-1} value={(MoveCategory as any)[this.state.move_category]}>
                    {pgettext(
                        "Joseki move category",
                        (MoveCategory as any)[this.state.move_category],
                    )}
                </option>,
            );
        }

        const labels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "_"].map((label, i) => (
            <option key={i} value={label}>
                {label}
            </option>
        ));

        const sources = this.state.joseki_source_list.map((selection, i) => (
            <option key={i} value={selection["id"]}>
                {_(selection["description"])}
            </option>
        ));

        // give feedback that we recognised their marks
        const preview = applyJosekiMarkdown(this.state.new_description);

        return (
            <div className="edit-container">
                <div className="move-attributes">
                    <div className="move-type-selection">
                        <span>{_("This sequence is")}:</span>
                        <select value={this.state.move_category} onChange={this.onTypeChange}>
                            {selections}
                        </select>
                    </div>
                    <div className="variation-order-select">
                        <span>{_("Variation label")}:</span>
                        <select value={this.state.variation_label} onChange={this.onLabelChange}>
                            {labels}
                        </select>
                    </div>

                    <div className="joseki-source-edit">
                        <div>{_("Source")}:</div>
                        <div className="joseki-source-edit-controls">
                            <select value={this.state.joseki_source} onChange={this.onSourceChange}>
                                {sources}
                            </select>
                            <i className="fa fa-plus-circle" onClick={this.promptForJosekiSource} />
                        </div>
                    </div>
                    <div className="tag-edit">
                        <div>{_("Tags")}:</div>
                        <JosekiTagSelector
                            available_tags={this.props.available_tags}
                            selected_tags={this.state.tags as any}
                            on_tag_update={this.onTagChange}
                        />
                    </div>
                </div>
                <div className="description-edit">
                    <div className="edit-label">{_("Position description")}:</div>

                    {/* Here is the edit box for the markdown source of the description */}
                    <textarea onChange={this.handleEditInput} value={this.state.new_description} />

                    <div className="position-edit-button">
                        <button className="btn xs primary" onClick={this.saveNewInfo}>
                            {_("Save")}
                        </button>
                    </div>
                    <div className="edit-label">{_("Preview")}:</div>

                    {/* The actual description rendered here */}
                    {this.state.new_description.length !== 0 && (
                        <Markdown className="description-preview" source={preview} />
                    )}

                    {/* and a placeholder for the description when the markdown is empty*/}
                    {this.state.new_description.length === 0 && (
                        <div className="description-preview edit-label">
                            ({_("position description")})
                        </div>
                    )}
                </div>
            </div>
        );
    };
}
