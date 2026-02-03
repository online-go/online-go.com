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
import { _, interpolate } from "@/lib/translate";
import { Modal, openModal } from "@/components/Modal";
import { get, post } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import * as data from "@/lib/data";
import "./SGFCollectionModal.css";

interface Events {}

interface Collection {
    id: number;
    name: string;
    private: boolean;
    parent_id: number;
    parent?: Collection;
    collections: Collection[];
    games: any[];
    game_ct?: number;
}

interface SGFCollectionModalProperties {
    gameId: number;
    gameName?: string;
    onSuccess?: () => void;
}

interface SGFCollectionModalState {
    collections?: { [id: string]: Collection };
    selectedCollectionId: string;
    loading: boolean;
    uploading: boolean;
    fileName: string;
}

export class SGFCollectionModal extends Modal<
    Events,
    SGFCollectionModalProperties,
    SGFCollectionModalState
> {
    constructor(props: SGFCollectionModalProperties) {
        super(props);
        this.state = {
            collections: undefined,
            selectedCollectionId: "0",
            loading: true,
            uploading: false,
            fileName: props.gameName || `Game ${props.gameId}`,
        };
    }

    componentDidMount() {
        this.loadCollections();
    }

    loadCollections = () => {
        const user = data.get("user");
        if (!user || user.anonymous) {
            return;
        }

        this.setState({ loading: true });
        get(`library/${user.id}`)
            .then((library) => {
                const collections: { [id: number]: Collection } = {};

                const root: Collection = {
                    id: 0,
                    name: _("Main Library"),
                    private: false,
                    parent_id: 0,
                    parent: undefined,
                    collections: [],
                    games: [],
                };

                collections[0] = root;

                for (const c of library.collections) {
                    const collection = {
                        id: c[0],
                        name: c[1],
                        private: c[2],
                        parent_id: c[3] || 0,
                        collections: [],
                        games: [],
                    };
                    collections[collection.id] = collection;
                }

                for (const id in collections) {
                    if (id === "0") {
                        continue;
                    }

                    collections[id].parent = collections[collections[id].parent_id];
                    collections[id].parent?.collections.push(collections[id]);
                }

                this.setState({ collections, loading: false });
            })
            .catch((error) => {
                errorAlerter(error);
                this.setState({ loading: false });
            });
    };

    addToCollection = () => {
        if (!this.state.collections || this.state.uploading) {
            return;
        }

        this.setState({ uploading: true });

        const user = data.get("user");
        console.log("DEBUG: Adding game to library", {
            user_id: user.id,
            game_id: this.props.gameId,
            collection_id: parseInt(this.state.selectedCollectionId),
            name: this.state.fileName,
            url: `library/${user.id}`,
        });

        post(`library/${user.id}`, {
            game_id: this.props.gameId,
            collection_id: parseInt(this.state.selectedCollectionId),
            name: this.state.fileName,
        })
            .then(() => {
                if (this.props.onSuccess) {
                    this.props.onSuccess();
                }
                this.close();
            })
            .catch((error) => {
                errorAlerter(error);
                this.setState({ uploading: false });
            });
    };

    renderCollectionOption = (collection: Collection, depth: number = 0): React.ReactNode[] => {
        const indent = "  ".repeat(depth);
        const name = collection.id === 0 ? collection.name : `${indent}${collection.name}/`;

        return [
            <option key={collection.id} value={collection.id}>
                {name}
                {collection.game_ct !== undefined &&
                    ` (${interpolate(_("{{count}} games"), { count: collection.game_ct })})`}
            </option>,
            ...collection.collections.flatMap((child) =>
                this.renderCollectionOption(child, depth + 1),
            ),
        ];
    };

    render() {
        const { loading, uploading, collections, selectedCollectionId } = this.state;
        const user = data.get("user");

        if (!user || user.anonymous) {
            return (
                <div className="Modal SGFCollectionModal">
                    <div className="header">
                        <h2>{_("Add SGF to Library")}</h2>
                    </div>
                    <div className="body">
                        <p>{_("You must be signed in to add games to your SGF library.")}</p>
                    </div>
                    <div className="buttons">
                        <button onClick={this.close}>{_("Close")}</button>
                    </div>
                </div>
            );
        }

        return (
            <div className="Modal SGFCollectionModal">
                <div className="header">
                    <h2>{_("Add SGF to Library")}</h2>
                </div>
                <div className="body">
                    {loading ? (
                        <p>{_("Loading collections...")}</p>
                    ) : collections ? (
                        <>
                            <p>{_("Select a collection to add this game to:")}</p>
                            <div className="collection-selector">
                                <select
                                    value={selectedCollectionId}
                                    onChange={(e) =>
                                        this.setState({ selectedCollectionId: e.target.value })
                                    }
                                    disabled={uploading}
                                >
                                    {this.renderCollectionOption(collections["0"])}
                                </select>
                            </div>
                            <div className="game-name-field">
                                <label htmlFor="game-name">
                                    <strong>{_("Game Name:")}</strong>
                                </label>
                                <input
                                    id="game-name"
                                    type="text"
                                    value={this.state.fileName}
                                    onChange={(e) => this.setState({ fileName: e.target.value })}
                                    disabled={uploading}
                                    placeholder={_("Enter game name")}
                                />
                            </div>
                        </>
                    ) : (
                        <p>{_("Failed to load collections.")}</p>
                    )}
                </div>
                <div className="buttons">
                    <button onClick={this.close} disabled={uploading}>
                        {_("Cancel")}
                    </button>
                    <button
                        className="primary"
                        onClick={this.addToCollection}
                        disabled={loading || uploading || !collections}
                    >
                        {uploading ? _("Adding...") : _("Add game to SGF Library")}
                    </button>
                </div>
            </div>
        );
    }
}

export function openSGFCollectionModal(gameId: number, gameName?: string, onSuccess?: () => void) {
    return openModal(
        <SGFCollectionModal
            gameId={gameId}
            gameName={gameName}
            onSuccess={onSuccess}
            fastDismiss
        />,
    );
}
