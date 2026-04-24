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
import { del, get, post } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { Player } from "@/components/Player";
import { PlayerAutocomplete, PlayerAutocompleteRef } from "@/components/PlayerAutocomplete";
import { GroupAutocomplete } from "@/components/GroupAutocomplete";
import { PlayerCacheEntry } from "@/lib/player_cache";
import "./PuzzleCollectionAcl.css";

interface AclEntry {
    id: number;
    player_id?: number;
    group_id?: number;
    group_name?: string;
}

interface PuzzleCollectionAclProps {
    collection_id: number;
}

export function PuzzleCollectionAcl({
    collection_id,
}: PuzzleCollectionAclProps): React.ReactElement {
    const [acl, setAcl] = React.useState<AclEntry[]>([]);
    const [selected_player, setSelectedPlayer] = React.useState<PlayerCacheEntry | null>(null);
    const [selected_group, setSelectedGroup] = React.useState<{
        id?: number;
        name: string;
    } | null>(null);
    const player_autocomplete_ref = React.useRef<PlayerAutocompleteRef>(null);
    const group_autocomplete_ref = React.useRef<GroupAutocomplete>(null);

    const url = `puzzles/collections/${collection_id}/acl`;
    const del_url = `puzzles/collections/acl/`;

    const refresh = React.useCallback(() => {
        get(url)
            .then((response: AclEntry[]) => setAcl(response))
            .catch(errorAlerter);
    }, [url]);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    const grantAccess = () => {
        const player_id = selected_player?.id;
        const group_id = selected_group?.id;
        if (!player_id && !group_id) {
            return;
        }

        player_autocomplete_ref.current?.clear();
        group_autocomplete_ref.current?.clear();

        const body: { player_id?: number; group_id?: number } = {};
        if (player_id) {
            body.player_id = player_id;
        }
        if (group_id) {
            body.group_id = group_id;
        }
        post(url, body).then(refresh).catch(errorAlerter);
        setSelectedPlayer(null);
        setSelectedGroup(null);
    };

    const removeEntry = (entry: AclEntry) => {
        setAcl((prev) => prev.filter((e) => e.id !== entry.id));
        del(del_url + entry.id)
            .then(refresh)
            .catch((e) => {
                refresh();
                errorAlerter(e);
            });
    };

    return (
        <div className="PuzzleCollectionAcl">
            <div className="PuzzleCollectionAcl-grant">
                <PlayerAutocomplete ref={player_autocomplete_ref} onComplete={setSelectedPlayer} />
                <GroupAutocomplete ref={group_autocomplete_ref} onComplete={setSelectedGroup} />
                <button
                    type="button"
                    className="primary sm"
                    disabled={!selected_player && !selected_group}
                    onClick={grantAccess}
                >
                    {_("Grant access")}
                </button>
            </div>

            {acl.length > 0 && (
                <ul className="PuzzleCollectionAcl-entries">
                    {acl.map((entry) => (
                        <li key={entry.id} className="PuzzleCollectionAcl-entry">
                            <button
                                type="button"
                                className="PuzzleCollectionAcl-entry-remove"
                                title={_("Revoke access")}
                                onClick={() => removeEntry(entry)}
                            >
                                <i className="fa fa-remove" />
                            </button>
                            {entry.group_id ? (
                                <a
                                    href={`/group/${entry.group_id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="PuzzleCollectionAcl-group"
                                >
                                    {entry.group_name}
                                </a>
                            ) : (
                                <Player user={entry.player_id} />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
