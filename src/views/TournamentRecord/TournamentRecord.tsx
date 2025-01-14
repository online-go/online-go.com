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
import { _ } from "@/lib/translate";
import { useParams } from "react-router-dom";
import { abort_requests_in_flight, del, put, post, get } from "@/lib/requests";
import { Markdown } from "@/components/Markdown";
import { PaginatedTable, PaginatedTableRef } from "@/components/PaginatedTable";
import { Player } from "@/components/Player";
import { ignore, errorAlerter, dup } from "@/lib/misc";
import { rankString, allRanks } from "@/lib/rank_utils";
import { createDemoBoard } from "@/components/ChallengeModal";

window.dup = dup;

import { alert } from "@/lib/swal_config";
const ranks = allRanks();

interface Round {
    updated: boolean;
    id: number;
    name: string;
    notes: string;
    entries: RoundEntry[];
}
interface TournamentRecordState {
    editing: boolean;
    tournament_record_id: number;
    loading: boolean;
    name: string;
    new_round_name: string;
    rounds: Array<Round>;
    new_player_name: string;
    new_player_rank: number;
    description?: string;
    location?: string;
    players?: { name: string; rank: number }[];
    editable_by_current_user?: boolean;
}

interface RoundEntry {
    [k: string]: any;
}

export function TournamentRecord(): React.ReactElement {
    const params = useParams<"tournament_record_id">();
    const tournament_record_id = parseInt(params.tournament_record_id ?? "0");

    const [, refresh] = React.useState(0);
    const [editing, setEditing] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [name, setName] = React.useState("");
    const [new_round_name, setNewRoundName] = React.useState("");
    const [rounds, setRounds] = React.useState<any[]>([]);
    const [new_player_name, setNewPlayerName] = React.useState("");
    const [new_player_rank, setNewPlayerRank] = React.useState(1037);
    const [description, setDescription] = React.useState("");
    const [location, setLocation] = React.useState("");
    const [players, setPlayers] = React.useState<any[]>([]);
    const [editable_by_current_user, setEditableByCurrentUser] = React.useState(false);

    const player_table_ref = React.useRef<PaginatedTableRef>(null);
    const loaded_state = React.useRef<Partial<TournamentRecordState>>({});

    React.useEffect(() => {
        if (tournament_record_id) {
            resolve();
        }

        return () => {
            abort_requests();
        };
    }, [tournament_record_id]);

    const setFromLoadedState = () => {
        if (!loaded_state.current) {
            return;
        }

        setLoading(!!loaded_state.current.loading);
        setEditing(!!loaded_state.current.editing);
        setName(loaded_state.current.name ?? "");
        setRounds(loaded_state.current.rounds as any);
        setDescription(loaded_state.current.description ?? "");
        setLocation(loaded_state.current.location ?? "");
        setPlayers(loaded_state.current.players as any);
        setEditableByCurrentUser(loaded_state.current.editable_by_current_user as any);
    };

    const abort_requests = () => {
        abort_requests_in_flight(`tournament_records/${tournament_record_id}`);
    };

    const resolve = () => {
        abort_requests();

        get(`tournament_records/${tournament_record_id}`)
            .then((res) => {
                res.loading = false;
                res.editing = false;
                loaded_state.current = dup(res);
                setFromLoadedState();
            })
            .catch(errorAlerter);
    };

    const startEditing = () => {
        setEditing(true);
    };

    const save = () => {
        put(`tournament_records/${tournament_record_id}`, {
            name: name,
            description: description,
            location: location,
        })
            .then(ignore)
            .catch(errorAlerter);

        for (const round of rounds) {
            if (round.updated) {
                put(`tournament_records/${tournament_record_id}/round/${round.id}`, {
                    name: round.name,
                })
                    .then(ignore)
                    .catch(errorAlerter);
            }
        }

        loaded_state.current.editing = false;
        loaded_state.current.name = name;
        loaded_state.current.rounds = dup(rounds);
        loaded_state.current.description = description;
        setEditing(false);
        refresh(Math.random());
    };

    const cancel = () => {
        loaded_state.current.editing = false;
        setFromLoadedState();
    };

    const setRoundName = (idx: number, ev: React.ChangeEvent<HTMLInputElement>) => {
        const new_rounds = dup(rounds);
        new_rounds[idx].name = ev.target.value;
        new_rounds[idx].updated = true;
        setRounds(new_rounds);
    };

    const addRound = () => {
        if (new_round_name.trim().length < 2) {
            (document.querySelector(".round-name-editor") as HTMLElement)?.focus();
            return;
        }

        post(`tournament_records/${tournament_record_id}/rounds`, {
            name: new_round_name,
            notes: "",
        })
            .then((res) => {
                const new_rounds = dup(rounds);
                new_rounds.unshift(res);
                setRounds(new_rounds);
                setNewRoundName("");
            })
            .catch(errorAlerter);
    };

    const addPlayer = () => {
        const name = new_player_name;
        const rank = new_player_rank;

        if (name.trim().length < 2) {
            (document.querySelector(".new-player-name") as HTMLElement)?.focus();
            return;
        }

        const new_player = { name, rank };

        post(`tournament_records/${tournament_record_id}/players/`, new_player)
            .then((res) => {
                players.push(res);
                player_table_ref.current?.refresh();
                setNewPlayerName("");
            })
            .catch(errorAlerter);
    };

    const removePlayer = (player: any) => {
        void alert
            .fire({
                title: "Really remove player?",
                text: player.name + " [" + rankString(player.rank) + "]",
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    del(`tournament_records/${tournament_record_id}/players/${player.id}`)
                        .then(() => {
                            player_table_ref.current?.refresh();
                        })
                        .catch(errorAlerter);
                }
            });
    };

    const deleteEntry = (round: Round, entry: RoundEntry) => {
        alert
            .fire({
                text: "Are you sure you wish to delete this entry? The original game or review content will not be affected, but the entry will be removed from this list of game in this round.",
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    for (let i = 0; i < round.entries.length; ++i) {
                        if (round.entries[i].id === entry.id) {
                            round.entries.splice(i, 1);
                            break;
                        }
                    }
                    refresh(Math.random());

                    del(`tournament_records/${tournament_record_id}/rounds/${round.id}/${entry.id}`)
                        .then(ignore)
                        .catch(errorAlerter);
                }
            })
            .catch(errorAlerter);
    };

    const deleteRound = (round: Round) => {
        void alert
            .fire({
                title: _("Are you sure you wish to delete this round?"),
                text: round.name,
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    del(`tournament_records/${tournament_record_id}/round/${round.id}/`)
                        .then(() => {
                            for (let i = 0; i < rounds.length; ++i) {
                                if (rounds[i].id === round.id) {
                                    rounds.splice(i, 1);
                                    break;
                                }
                            }
                            refresh(Math.random());
                        })
                        .catch(errorAlerter);
                }
            });
    };

    const linkGame = (round: Round) => {
        void alert
            .fire({
                text: _("Please provide the link to the game, review, or demo board"),
                input: "url", // TBD should we provide stricter validation - make sure it is actually pointing at one?
                showCancelButton: true,
            })
            .then(({ value: url, isConfirmed }) => {
                if (isConfirmed) {
                    post(`tournament_records/${tournament_record_id}/round/${round.id}/`, {
                        url,
                        notes: "",
                    })
                        .then((res) => {
                            round.entries.unshift(res);
                            refresh(Math.random());
                        })
                        .catch(errorAlerter);
                }
            });
    };

    const recordGame = (round: Round) => {
        createDemoBoard(players, tournament_record_id, round.id);
    };

    const editable = editable_by_current_user || null;

    if (loading) {
        return <div id="TournamentRecord">{_("Loading...")}</div>;
    }

    return (
        <div id="TournamentRecord">
            <div className="space-between center">
                {editing ? (
                    <input
                        type="text"
                        className="name-editor"
                        onChange={(ev) => setName(ev.target.value)}
                        placeholder={_("Name")}
                        value={name}
                    />
                ) : (
                    <h1 className="name">{name}</h1>
                )}

                {((!editing && editable) || null) && (
                    <button onClick={startEditing} className="danger xs">
                        {_("Edit")}
                    </button>
                )}
                {((editing && editable) || null) && (
                    <div>
                        <button onClick={save} className="primary xs">
                            {_("Save")}
                        </button>
                        <button onClick={cancel} className="default xs">
                            {_("Cancel")}
                        </button>
                    </div>
                )}
            </div>

            <div className="space-between">
                {editing ? (
                    <textarea
                        className="description-editor"
                        rows={15}
                        onChange={(ev) => setDescription(ev.target.value)}
                        placeholder={_("Description")}
                        value={description}
                    />
                ) : (
                    <Markdown source={description} />
                )}

                <div>
                    <h3>{_("Players")}</h3>

                    <PaginatedTable
                        className="TournamentRecord-table"
                        ref={player_table_ref}
                        name="game-history"
                        source={`tournament_records/${tournament_record_id}/players`}
                        orderBy={["-rank", "name"]}
                        columns={[
                            {
                                header: "",
                                className: () => "player",
                                render: (p) => <span>{p.name}</span>,
                            },

                            {
                                header: "",
                                className: () => "rank",
                                render: (p) => <span>[{rankString(p.rank)}]</span>,
                            },

                            {
                                header: "",
                                className: () => "rank",
                                render: (p) =>
                                    editable && (
                                        <i
                                            className="fa fa-trash"
                                            onClick={() => removePlayer(p)}
                                        />
                                    ),
                            },
                        ]}
                    />

                    {editable && (
                        <div className="add-player">
                            <input
                                type="text"
                                className="new-player-name"
                                onChange={(ev) => setNewPlayerName(ev.target.value)}
                                value={new_player_name}
                                placeholder="Player name"
                            />

                            <select
                                value={new_player_rank}
                                onChange={(ev) => setNewPlayerRank(parseInt(ev.target.value))}
                                className="challenge-dropdown form-control"
                            >
                                {ranks.map((r, idx) => (
                                    <option key={idx} value={r.rank}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>

                            <button onClick={addPlayer} className="default xs">
                                {_("Add player")}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="hr" />

            <h1>{_("Rounds")}</h1>

            {editable && (
                <div className="round-line">
                    <input
                        type="text"
                        className="round-name-editor"
                        onChange={(ev) => setNewRoundName(ev.target.value)}
                        placeholder={_("Round name")}
                        value={new_round_name}
                    />
                    <button onClick={addRound} className="default xs">
                        {_("Add round")}
                    </button>
                </div>
            )}
            {rounds.map((round, idx) => (
                <div key={round.id} className="round">
                    <div className="space-between center round-name">
                        {editing ? (
                            <input
                                type="text"
                                className="round-name-editor"
                                onChange={(ev) => setRoundName(idx, ev)}
                                placeholder={_("Name")}
                                value={round.name}
                            />
                        ) : (
                            <h3>{round.name}</h3>
                        )}

                        {editable && (
                            <div>
                                <button onClick={() => recordGame(round)} className="default xs">
                                    {_("Record game")}
                                </button>
                                <button onClick={() => linkGame(round)} className="default xs">
                                    {_("Link game")}
                                </button>
                                {editing && (
                                    <button
                                        onClick={() => deleteRound(round)}
                                        className="default xs"
                                    >
                                        {_("Remove round")}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <Markdown source={round.notes} />

                    <div className="round-entries-container">
                        <table className="round-entries">
                            <tbody>
                                {round.entries.map((entry: RoundEntry) => (
                                    <tr key={entry.id} className="round-entry">
                                        {editable && (
                                            <td>
                                                <i
                                                    className="fa fa-trash"
                                                    onClick={() => deleteEntry(round, entry)}
                                                />
                                            </td>
                                        )}
                                        <td>
                                            <a className="name" href={entry.url}>
                                                {entry.name}
                                            </a>
                                        </td>
                                        <td>
                                            <Player user={entry.white} disable-cache-update />
                                        </td>
                                        <td>
                                            <Player user={entry.black} disable-cache-update />
                                        </td>
                                        <td>
                                            {(entry.game_id || null) && (
                                                <a
                                                    className="sgf"
                                                    href={`/api/v1/games/${entry.game_id}/sgf?without-comments=1`}
                                                >
                                                    {_("SGF")}
                                                </a>
                                            )}
                                            {(entry.review_id || null) && (
                                                <a
                                                    className="sgf"
                                                    href={`/api/v1/reviews/${entry.review_id}/sgf?without-comments=1`}
                                                >
                                                    {_("SGF")}
                                                </a>
                                            )}
                                        </td>
                                        <td>
                                            {(entry.game_id || null) && (
                                                <a
                                                    className="sgf with-comments"
                                                    href={`/api/v1/games/${entry.game_id}/sgf`}
                                                >
                                                    {_("SGF with comments")}
                                                </a>
                                            )}
                                            {(entry.review_id || null) && (
                                                <a
                                                    className="sgf with-comments"
                                                    href={`/api/v1/reviews/${entry.review_id}/sgf`}
                                                >
                                                    {_("SGF with comments")}
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}
