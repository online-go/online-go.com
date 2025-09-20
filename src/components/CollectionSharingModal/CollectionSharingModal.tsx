/*
 * Copyright (C)   Online-Go.com
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
import { post, get, del } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { _ } from "@/lib/translate";
import { PlayerCacheEntry } from "@/lib/player_cache";

interface CollectionSharingModalProps {
    collection_id: number;
    collection_name: string;
    onClose: () => void;
}

interface SharedWithItem {
    id: number;
    player?: PlayerCacheEntry;
    group?: {
        id: number;
        name: string;
    };
}

interface CollectionSharingModalState {
    sharedWith: SharedWithItem[];
    newPlayerName: string;
    newGroupName: string;
    loading: boolean;
}

export function CollectionSharingModal({
    collection_id,
    collection_name,
    onClose,
}: CollectionSharingModalProps): React.ReactElement {
    const [state, setState] = React.useState<CollectionSharingModalState>({
        sharedWith: [],
        newPlayerName: "",
        newGroupName: "",
        loading: false,
    });

    React.useEffect(() => {
        void refreshSharedWith();
    }, [collection_id]);

    const refreshSharedWith = async () => {
        setState((prev) => ({ ...prev, loading: true }));
        try {
            const response = await get(`library/collections/${collection_id}/acl`);
            setState((prev) => ({ ...prev, sharedWith: response, loading: false }));
        } catch (err) {
            errorAlerter(err);
            setState((prev) => ({ ...prev, loading: false }));
        }
    };

    const addPlayer = async () => {
        if (!state.newPlayerName.trim()) {
            return;
        }

        setState((prev) => ({ ...prev, loading: true }));
        try {
            // First, resolve the player by username
            const playerResponse = await get(`players/${state.newPlayerName.trim()}`);
            if (playerResponse && playerResponse.id) {
                await post(`library/collections/${collection_id}/acl`, {
                    player_id: playerResponse.id,
                });
                setState((prev) => ({ ...prev, newPlayerName: "" }));
                await refreshSharedWith();
            } else {
                alert(_("Player not found"));
            }
        } catch (err) {
            errorAlerter(err);
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    };

    const addGroup = async () => {
        if (!state.newGroupName.trim()) {
            return;
        }

        setState((prev) => ({ ...prev, loading: true }));
        try {
            // First, resolve the group by name
            const groupResponse = await get(`groups/${state.newGroupName.trim()}`);
            if (groupResponse && groupResponse.id) {
                await post(`library/collections/${collection_id}/acl`, {
                    group_id: groupResponse.id,
                });
                setState((prev) => ({ ...prev, newGroupName: "" }));
                await refreshSharedWith();
            } else {
                alert(_("Group not found"));
            }
        } catch (err) {
            errorAlerter(err);
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    };

    const removeShare = async (itemId: number) => {
        const item = state.sharedWith.find((item) => item.id === itemId);
        if (!item) {
            return;
        }

        setState((prev) => ({ ...prev, loading: true }));
        try {
            if (item.player) {
                await del(`library/collections/${collection_id}/acl`, {
                    player_id: item.player.id,
                });
            } else if (item.group) {
                await del(`library/collections/${collection_id}/acl`, { group_id: item.group.id });
            }
            await refreshSharedWith();
        } catch (err) {
            errorAlerter(err);
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === "Enter") {
            action();
        }
    };

    return (
        <div className="Modal CollectionSharingModal">
            <div className="header">
                <h3>{_("Share Collection: ") + collection_name}</h3>
                <button className="close" onClick={onClose}>
                    ×
                </button>
            </div>
            <div className="body">
                <div className="share-with">
                    <h4>{_("Shared with:")}</h4>
                    {state.loading ? (
                        <div className="loading">{_("Loading...")}</div>
                    ) : state.sharedWith.length === 0 ? (
                        <div className="empty">{_("No one has access to this collection")}</div>
                    ) : (
                        <div className="shared-items">
                            {state.sharedWith.map((item) => (
                                <div key={item.id} className="shared-item">
                                    <span className="name">
                                        {item.player?.username || item.group?.name}
                                        {item.player ? ` (${_("Player")})` : ` (${_("Group")})`}
                                    </span>
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeShare(item.id)}
                                        disabled={state.loading}
                                    >
                                        {_("Remove")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="add-sharing">
                    <h4>{_("Add sharing:")}</h4>
                    <div className="add-player">
                        <input
                            type="text"
                            placeholder={_("Player username")}
                            value={state.newPlayerName}
                            onChange={(e) =>
                                setState((prev) => ({ ...prev, newPlayerName: e.target.value }))
                            }
                            onKeyPress={(e) => handleKeyPress(e, addPlayer)}
                            disabled={state.loading}
                        />
                        <button
                            onClick={addPlayer}
                            disabled={state.loading || !state.newPlayerName.trim()}
                        >
                            {_("Add Player")}
                        </button>
                    </div>
                    <div className="add-group">
                        <input
                            type="text"
                            placeholder={_("Group name")}
                            value={state.newGroupName}
                            onChange={(e) =>
                                setState((prev) => ({ ...prev, newGroupName: e.target.value }))
                            }
                            onKeyPress={(e) => handleKeyPress(e, addGroup)}
                            disabled={state.loading}
                        />
                        <button
                            onClick={addGroup}
                            disabled={state.loading || !state.newGroupName.trim()}
                        >
                            {_("Add Group")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
