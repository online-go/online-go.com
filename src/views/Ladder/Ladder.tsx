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
import { del, get, put, post, abort_requests_in_flight } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { _, pgettext, interpolate } from "@/lib/translate";
import * as data from "@/lib/data";
import { List, AutoSizer } from "react-virtualized";
import { Player } from "@/components/Player";
import { UIPush } from "@/components/UIPush";
import { shouldOpenNewTab, rulesText } from "@/lib/misc";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { close_all_popovers, popover } from "@/lib/popover";
import { browserHistory } from "@/lib/ogsHistory";
import { alert } from "@/lib/swal_config";
import { RouteComponentProps, rr6ClassShim } from "@/lib/ogs-rr6-shims";
import { IdType } from "@/lib/types";
import { PlayerCacheEntry } from "@/lib/player_cache";

type LadderProperties = RouteComponentProps<{
    ladder_id: string;
}>;

interface LadderState {
    ladder_id: IdType;
    ladder?: {
        group: any; // doesn't appear this member is used
        name: string;
        player_is_member_of_group: boolean;
        player_rank: number;
        rules?: string;
        handicap?: number;
    };
    ladder_size: number;
    topVisibleEntry: number;
    highlight_rank: number;
    scrollToIndex?: number;
    invalidationCount: number;
}

class _Ladder extends React.PureComponent<LadderProperties, LadderState> {
    constructor(props: LadderProperties) {
        super(props);
        this.state = {
            ladder_id: this.props.match.params.ladder_id,
            ladder: undefined,
            ladder_size: 1,
            topVisibleEntry: 0,
            highlight_rank: -1,
            scrollToIndex: undefined,
            invalidationCount: 0,
        };
    }

    componentDidMount() {
        window.document.title = _("Ladder");
        this.resolve(this.props.match.params.ladder_id);
    }

    componentDidUpdate(prevProps: LadderProperties) {
        if (this.props.match.params.ladder_id !== prevProps.match.params.ladder_id) {
            this.setState({ ladder_id: this.props.match.params.ladder_id });
            this.resolve(this.props.match.params.ladder_id);
        }
    }

    resolve(ladder_id: IdType) {
        get(`ladders/${ladder_id}`)
            .then((ladder) => {
                this.setState({
                    ladder: ladder,
                    ladder_size: ladder.size,
                    highlight_rank: ladder.player_rank > 0 ? ladder.player_rank : -1,
                    scrollToIndex: Math.max(0, ladder.player_rank - 1),
                });
                window.document.title = _(ladder.name);
            })
            .catch(errorAlerter);
    }

    join = () => {
        post(`ladders/${this.props.match.params.ladder_id}/players`, {})
            .then(() => {
                this.invalidate();
                this.resolve(this.props.match.params.ladder_id);
            })
            .catch(errorAlerter);
    };

    leave = () => {
        void alert
            .fire({
                text: _(
                    "Are you sure you want to withdraw from the ladder? If you decide to rejoin the ladder in the future you will have to start from the bottom!",
                ),
                showCancelButton: true,
                confirmButtonText: _("Yes"),
                cancelButtonText: _("No"),
                focusCancel: true,
            })
            .then(({ value: yes }) => {
                if (yes) {
                    del(`ladders/${this.props.match.params.ladder_id}/players`)
                        .then(() => {
                            this.invalidate();
                            this.resolve(this.props.match.params.ladder_id);
                        })
                        .catch(errorAlerter);
                }
            });
    };

    updateAutocompletedPlayer = (user: null | (PlayerCacheEntry & { ladder_rank: number })) => {
        if (user) {
            this.setState({
                scrollToIndex: Math.max(0, user.ladder_rank - 1),
                highlight_rank: user.ladder_rank,
            });
        }
    };

    goToGroup = (ev: React.MouseEvent) => {
        close_all_popovers();

        const url: string = "/group/" + this.state.ladder?.group.id;
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    };

    render() {
        const user = data.get("user");
        const group_text = pgettext("Go to the main page for this group.", "Group Page");

        return (
            <div className="Ladder-container">
                <div className="Ladder">
                    <UIPush
                        event="players-updated"
                        channel={`ladder-${this.props.match.params.ladder_id}`}
                        action={this.invalidate}
                    />

                    <div className="Ladder-header">
                        {this.state.ladder && this.state.ladder?.group !== null && (
                            <button
                                className="xs no-shadow"
                                onAuxClick={this.goToGroup}
                                onClick={this.goToGroup}
                            >
                                <i className="fa fa-users" /> {group_text}
                            </button>
                        )}
                        <h2>{this.state.ladder && this.state.ladder.name}</h2>

                        <div className="ladder-configuration">
                            <table>
                                <tr>
                                    <th>{_("Rules")}</th>
                                    <td>{rulesText(this.state.ladder?.rules ?? "japanese")}</td>
                                </tr>
                                <tr>
                                    <th>{_("Handicap")}</th>
                                    <td>
                                        {this.state.ladder?.handicap === -1
                                            ? _("Automatic")
                                            : _("None")}
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <PlayerAutocomplete
                            ladderId={this.props.match.params.ladder_id}
                            onComplete={this.updateAutocompletedPlayer as any}
                        />

                        {this.state.ladder &&
                            (!this.state.ladder.group ||
                                this.state.ladder.player_is_member_of_group) && (
                                <span>
                                    {this.state.ladder.player_rank > 0 ? (
                                        <button onClick={this.leave}>
                                            {_("Drop out from ladder")}
                                        </button>
                                    ) : (
                                        <button
                                            className="primary"
                                            disabled={user.anonymous}
                                            onClick={this.join}
                                        >
                                            {_("Join Ladder")}
                                        </button>
                                    )}
                                </span>
                            )}
                    </div>

                    <div className="AutoSizer-container">
                        <AutoSizer>
                            {({ width, height }) => (
                                <List
                                    height={height}
                                    width={width}
                                    overscanRowCount={
                                        20 - (this.state.invalidationCount % 2) /* forces refresh */
                                    }
                                    rowHeight={30}
                                    rowCount={this.state.ladder_size}
                                    rowRenderer={this.renderRow}
                                    scrollToIndex={this.state.scrollToIndex}
                                    scrollToAlignment="center"
                                />
                            )}
                        </AutoSizer>
                    </div>
                </div>
            </div>
        );
    }

    // @typescript-eslint/no-unused-vars
    renderRow = ({
        index,
        isScrolling,
        key,
        style,
    }: {
        index: number;
        isScrolling: boolean;
        isVisible: boolean;
        key: string;
        style: any;
    }) => {
        return (
            <div className="LadderRow-container" key={key} style={style}>
                <LadderRow
                    index={index}
                    ladder={this}
                    invalidationCount={this.state.invalidationCount}
                    highlightRank={this.state.highlight_rank}
                    isScrolling={isScrolling}
                />
            </div>
        );
    };

    cache: { [index: number]: any } = {};
    requests_in_flight: { [page_number: number]: Promise<any> } = {};

    invalidate = () => {
        abort_requests_in_flight(`ladders/${this.props.match.params.ladder_id}/players`, "GET");
        this.requests_in_flight = {};
        this.cache = {};
        this.setState({ invalidationCount: this.state.invalidationCount + 1 });
    };

    load = (idx: number, only_from_cache: boolean): Promise<any> | any => {
        const PAGE_SIZE = 20;

        if (idx in this.cache) {
            return this.cache[idx];
        }

        if (only_from_cache) {
            return null;
        }

        const page = Math.floor(idx / PAGE_SIZE) + 1;
        if (page in this.requests_in_flight) {
            return this.requests_in_flight[page].then(() => this.cache[idx]);
        }

        this.requests_in_flight[page] = new Promise<void>((resolve, reject) => {
            get(`ladders/${this.props.match.params.ladder_id}/players`, {
                page,
                page_size: PAGE_SIZE,
            })
                .then((obj) => {
                    delete this.requests_in_flight[page];
                    const start = (page - 1) * PAGE_SIZE;

                    for (let i = 0; i < obj.results.length; ++i) {
                        this.cache[start + i] = obj.results[i];

                        this.cache[start + i].incoming_challenges =
                            this.cache[start + i].incoming_challenges.sort(by_ladder_rank);
                        this.cache[start + i].outgoing_challenges =
                            this.cache[start + i].outgoing_challenges.sort(by_ladder_rank);
                    }

                    resolve();
                })
                .catch(() => {
                    delete this.requests_in_flight[page];
                    reject();
                });
        });

        return this.requests_in_flight[page].then(() => this.cache[idx]);

        function by_ladder_rank(a: any, b: any) {
            let ar = a.player.ladder_rank;
            let br = b.player.ladder_rank;
            if (ar < 0) {
                ar = 1000000000;
            }
            if (br < 0) {
                br = 1000000000;
            }
            return ar - br;
        }
    };
}

export const Ladder = rr6ClassShim(_Ladder);

interface LadderRowProperties {
    index: number;
    isScrolling: boolean;
    highlightRank: number;
    ladder: _Ladder;
    invalidationCount: number;
}

interface LadderRowState {
    row?: {
        incoming_challenges: any;
        outgoing_challenges: any;
        can_challenge: { challengeable: boolean };
        rank: number;
        player: PlayerCacheEntry;
    };
}

export class LadderRow extends React.Component<LadderRowProperties, LadderRowState> {
    unmounted: boolean = false;

    constructor(props: LadderRowProperties) {
        super(props);
        this.state = { row: undefined };
        this.sync();
    }

    shouldComponentUpdate(nextProps: LadderRowProperties, nextState: LadderRowState) {
        if (!this.state || nextState !== this.state) {
            return true;
        }

        if (nextProps.index !== this.props.index) {
            return true;
        }

        if (this.props.isScrolling !== nextProps.isScrolling) {
            return true;
        }

        if (this.props.highlightRank !== nextProps.highlightRank) {
            return true;
        }

        if (this.props.invalidationCount !== nextProps.invalidationCount) {
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps: LadderRowProperties) {
        if (
            prevProps.index !== this.props.index ||
            this.props.isScrolling !== prevProps.isScrolling ||
            this.props.invalidationCount !== prevProps.invalidationCount
        ) {
            this.sync();
        }
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    sync() {
        if (this.props.isScrolling) {
            /* if we're scrolling, only show rows if we have them in cache */
            const obj = this.props.ladder.load(this.props.index, true);
            if (!this.state) {
                this.state = { row: obj };
            } else if (obj) {
                if (this.state.row !== obj) {
                    this.setState({ row: obj });
                }
            }
        } else {
            /* not scrolling, do actual loading */
            const index = this.props.index;
            const resolve = (obj: any) => {
                if (this.unmounted || index !== this.props.index) {
                    /* the row we're responsible for rendering has changed, abandon our work */
                    return;
                }

                if (this.state) {
                    this.setState({ row: obj });
                } else {
                    this.state = { row: obj };
                }
            };

            const obj_or_promise = this.props.ladder.load(this.props.index, false);

            if (obj_or_promise && obj_or_promise.then) {
                obj_or_promise.then(resolve).catch(() => 0);
            } else {
                resolve(obj_or_promise);
            }
        }
    }

    render() {
        const user = data.get("user");
        const row = this.state.row;
        const challenged_by = row && row.incoming_challenges;
        const challenging = row && row.outgoing_challenges;

        // <b>{_("Challenged by") /* Translators: List of players that challenged this player in a ladder */}: </b>
        // <b>{_("Challenging") /* Translators: List of players that have been challenged by this player in a ladder */}: </b>

        let row_class = "challengeable";
        if (row && !user.anonymous && row.can_challenge && !row.can_challenge.challengeable) {
            row_class = "not-challengeable";
        }

        return (
            <div
                onClick={this.challengeDetails}
                className={
                    "LadderRow " +
                    (row && row.rank === this.props.highlightRank ? " highlight " : "") +
                    row_class
                }
            >
                <div className="ladder-player">
                    <span className="rank"># {(row && row.rank) || this.props.index + 1}</span>

                    {row && <Player flag nochallenge nolink user={row.player} />}

                    <span className="right">
                        {(challenging || null) && (
                            <span className="outgoing">{challenging.length || ""}</span>
                        )}

                        {(challenged_by || null) && (
                            <span className="incoming">{challenged_by.length || ""}</span>
                        )}

                        {/*
                        <span className='btn-group'>
                            {((challenging && challenging.length) || null) &&
                                <button className='xs danger outgoing' onClick={this.challengeDetails}>{challenging.length}</button>
                            }

                            {((challenged_by && challenged_by.length) || null) &&
                                <button className='xs info incoming' onClick={this.challengeDetails}>{challenged_by.length}</button>
                            }
                        </span>
                        */}
                    </span>
                </div>
            </div>
        );
    }

    adjustLadderPosition(player: PlayerCacheEntry) {
        console.log(player);

        void alert
            .fire({
                text: "New ladder position for player " + player.username,
                input: "number",
                showCancelButton: true,
            })
            .then(({ value: new_rank }) => {
                if (new_rank) {
                    put(
                        `ladders/${this.props.ladder.props.match.params.ladder_id}/players/moderate`,
                        {
                            moderation_note: "Adjusting ladder position",
                            player_id: player.id,
                            rank: new_rank,
                        },
                    )
                        .then(() => {
                            close_all_popovers();
                            this.props.ladder.invalidate();
                        })
                        .catch(errorAlerter);
                }
            });
    }

    challengeDetails = (event: React.MouseEvent) => {
        if (!this.state.row) {
            return;
        }

        const row = this.state.row;
        const user = data.get("user");
        const challenged_by = row && row.incoming_challenges;
        const challenging = row && row.outgoing_challenges;

        close_all_popovers();

        popover({
            elt: (
                <div className="Ladder-challenge-details">
                    <h3>
                        <Player flag nochallenge user={row.player} />
                    </h3>

                    {row && row.can_challenge && (
                        <div className="challenge-button-or-text">
                            {row.can_challenge.challengeable ? (
                                <button
                                    className="primary xs"
                                    onClick={this.challenge.bind(this, row)}
                                >
                                    {_("Challenge")}
                                </button>
                            ) : (
                                <div className="not-challengeable">
                                    {canChallengeTooltip(row.can_challenge)}
                                </div>
                            )}
                        </div>
                    )}

                    {((challenging && challenging.length) || null) && (
                        <div className="outgoing">
                            <b>
                                {
                                    _(
                                        "Challenging",
                                    ) /* Translators: List of players that have been challenged by this player in a ladder */
                                }
                                :{" "}
                            </b>

                            <span className="challenge-list">
                                {challenging.map((challenge: any, idx: number) => (
                                    <span
                                        key={idx}
                                        className="fake-link challenge-link"
                                        onClick={() =>
                                            browserHistory.push(`/game/${challenge.game_id}`)
                                        }
                                    >
                                        <span className="challenge-rank">
                                            #{challenge.player.ladder_rank}
                                        </span>
                                        <Player nolink user={challenge.player} />
                                    </span>
                                ))}
                            </span>
                        </div>
                    )}

                    {((challenged_by && challenged_by.length) || null) && (
                        <div className="incoming">
                            <b>
                                {
                                    _(
                                        "Challenged by",
                                    ) /* Translators: List of players that challenged this player in a ladder */
                                }
                                :{" "}
                            </b>

                            <span className="challenge-list">
                                {challenged_by.map((challenge: any, idx: number) => (
                                    <span
                                        key={idx}
                                        className="fake-link challenge-link"
                                        onClick={() =>
                                            browserHistory.push(`/game/${challenge.game_id}`)
                                        }
                                    >
                                        <span className="challenge-rank">
                                            #{challenge.player.ladder_rank}
                                        </span>
                                        <Player nolink user={challenge.player} />
                                    </span>
                                ))}
                            </span>
                        </div>
                    )}

                    {(user.is_moderator || null) && (
                        <div>
                            <button
                                className="xs danger"
                                onClick={() => this.adjustLadderPosition(row.player)}
                            >
                                Adjust ladder position
                            </button>
                        </div>
                    )}
                </div>
            ),
            below: event.target as HTMLElement,
            minWidth: 240,
            minHeight: 200,
        });
    };

    challenge(ladder_player: { player: PlayerCacheEntry }) {
        void alert
            .fire({
                text: interpolate(
                    _(
                        "Are you ready to start your game with {{player_name}}?",
                    ) /* translators: ladder challenge */,
                    { player_name: ladder_player.player.username },
                ),
                showCancelButton: true,
                confirmButtonText: _("Yes!"),
                cancelButtonText: _("No"),
            })
            .then(({ value: yes }) => {
                if (yes) {
                    post(
                        `ladders/${this.props.ladder.props.match.params.ladder_id}/players/challenge`,
                        {
                            player_id: ladder_player.player.id,
                        },
                    )
                        .then(() => {
                            this.props.ladder.invalidate();
                        })
                        .catch(errorAlerter);
                }
            });
    }
}

function canChallengeTooltip(obj: any): string | null {
    if (obj.reason_code) {
        switch (obj.reason_code) {
            case 0x001:
                return pgettext(
                    "Can't challenge player in ladder because: ",
                    "Can't challenge yourself",
                );
            case 0x002:
                return pgettext(
                    "Can't challenge player in ladder because: ",
                    "Their ladder position is lower than yours",
                );
            case 0x003:
                return pgettext(
                    "Can't challenge player in ladder because: ",
                    "Player is not in the ladder",
                );
            case 0x004:
                return pgettext(
                    "Can't challenge player in ladder because: ",
                    "Their ladder position is too high",
                );
            case 0x005:
                return interpolate(
                    pgettext(
                        "Can't challenge player in ladder because: ",
                        "Already playing {{number}} games you've initiated",
                    ),
                    { number: obj.reason_parameter }, // eslint-disable-line id-denylist
                );
            case 0x006:
                return pgettext(
                    "Can't challenge player in ladder because: ",
                    "Already playing a game against this person",
                );
            case 0x007:
                return pgettext(
                    "Can't challenge player in ladder because: ",
                    "Last challenge within 7 days",
                );
            case 0x008:
                return pgettext(
                    "Can't challenge player in ladder because: ",
                    "Player already has the maximum number of challenges",
                );
        }
    }

    if (obj.reason) {
        return obj.reason;
    }

    return null;
}
