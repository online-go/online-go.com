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
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete/PlayerAutocomplete";
import "./CollectionSharingModal.css";

interface CollectionSharingModalProps {
    collection_id: number;
    collection_name: string;
    onClose: () => void;
}

interface SharedWithItem {
    id: number;
    player?: PlayerCacheEntry;
}

interface CollectionSharingModalState {
    sharedWith: SharedWithItem[];
    selectedPlayer: PlayerCacheEntry | null;
    loading: boolean;
}

export function CollectionSharingModal({
    collection_id,
    collection_name,
    onClose,
}: CollectionSharingModalProps): React.ReactElement {
    const [state, setState] = React.useState<CollectionSharingModalState>({
        sharedWith: [],
        selectedPlayer: null,
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
        if (!state.selectedPlayer) {
            return;
        }

        setState((prev) => ({ ...prev, loading: true }));
        try {
            await post(`library/collections/${collection_id}/acl`, {
                player_id: state.selectedPlayer.id,
            });
            setState((prev) => ({ ...prev, selectedPlayer: null }));
            await refreshSharedWith();
        } catch (err) {
            errorAlerter(err);
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    };

    const removeShare = async (itemId: number) => {
        const item = state.sharedWith.find((item) => item.id === itemId);
        if (!item || !item.player) {
            return;
        }

        setState((prev) => ({ ...prev, loading: true }));
        try {
            await del(`library/collections/${collection_id}/acl`, {
                player_id: item.player.id,
            });
            await refreshSharedWith();
        } catch (err) {
            errorAlerter(err);
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
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
                                    <span className="name">{item.player?.username}</span>
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
                        <PlayerAutocomplete
                            onComplete={(player) => {
                                setState((prev) => ({ ...prev, selectedPlayer: player }));
                            }}
                            placeholder={_("Player username")}
                        />
                        <button
                            onClick={addPlayer}
                            disabled={state.loading || !state.selectedPlayer}
                        >
                            {_("Add Player")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
