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
import { get, post, del } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { _ } from "@/lib/translate";
import "./PlayerTagInput.styl";

interface Tag {
    id: number;
    name: string;
}

interface PlayerGameTag {
    id: number;
    tag_id: number;
    tag_name: string;
    created: string;
    created_by: string | null;
}

interface PlayerTagInputProps {
    playerId: number;
    gameId: number;
}

export function PlayerTagInput({ playerId, gameId }: PlayerTagInputProps): React.ReactElement {
    const [tags, setTags] = React.useState<PlayerGameTag[]>([]);
    const [allTags, setAllTags] = React.useState<Tag[]>([]);
    const [inputValue, setInputValue] = React.useState("");
    const [loading, setLoading] = React.useState(true);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Load current tags for this player/game
    React.useEffect(() => {
        setLoading(true);
        Promise.all([
            get(`/fair_play/tags/game/${gameId}/player/${playerId}/`),
            get("/fair_play/tags/"),
        ])
            .then(([playerTags, availableTags]: [PlayerGameTag[], Tag[]]) => {
                setTags(playerTags);
                setAllTags(availableTags);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error loading tags:", err);
                setLoading(false);
            });
    }, [playerId, gameId]);

    // Handle clicking outside dropdown
    React.useEffect(() => {
        if (!showDropdown) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);

    const addTag = (tagName: string) => {
        const trimmedName = tagName.trim().toLowerCase();
        if (!trimmedName) {
            return;
        }

        // Check if tag already exists for this player/game
        if (tags.some((t) => t.tag_name === trimmedName)) {
            setInputValue("");
            return;
        }

        post(`/fair_play/tags/game/${gameId}/player/${playerId}/`, {
            tag_name: trimmedName,
        })
            .then(
                (response: { id: number; tag_id: number; tag_name: string; created: boolean }) => {
                    setTags([
                        ...tags,
                        {
                            id: response.id,
                            tag_id: response.tag_id,
                            tag_name: response.tag_name,
                            created: new Date().toISOString(),
                            created_by: null,
                        },
                    ]);
                    // Add to allTags if it's a new tag
                    if (!allTags.some((t) => t.id === response.tag_id)) {
                        setAllTags([...allTags, { id: response.tag_id, name: response.tag_name }]);
                    }
                    setInputValue("");
                },
            )
            .catch(errorAlerter);
    };

    const removeTag = (tagId: number, _tagName: string) => {
        del(`/fair_play/tags/game/${gameId}/player/${playerId}/`, {
            tag_id: tagId,
        })
            .then(() => {
                setTags(tags.filter((t) => t.tag_id !== tagId));
            })
            .catch(errorAlerter);
    };

    if (loading) {
        return (
            <div className="PlayerTagInput">
                <div className="loading">
                    <i className="fa fa-spinner fa-spin" />
                </div>
            </div>
        );
    }

    const existingTagNames = new Set(tags.map((t) => t.tag_name));
    const availableTags = allTags
        .filter((t) => !existingTagNames.has(t.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="PlayerTagInput">
            <div className="tags-header">
                <span className="tag-label">{_("Tags")}</span>
                <div className="tag-dropdown-container" ref={dropdownRef}>
                    <button
                        type="button"
                        className="add-tag-button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        title={_("Add Tag")}
                    >
                        <i className="fa fa-plus" />
                    </button>
                    {showDropdown && (
                        <div className="tag-dropdown">
                            <div className="tag-list">
                                {availableTags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        className="tag-option"
                                        onClick={() => addTag(tag.name)}
                                    >
                                        {tag.name}
                                    </div>
                                ))}
                                {availableTags.length === 0 && (
                                    <div className="no-tags-available">
                                        {_("No more tags available")}
                                    </div>
                                )}
                            </div>
                            <div className="new-tag-input">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && inputValue.trim()) {
                                            e.preventDefault();
                                            addTag(inputValue);
                                        }
                                    }}
                                    placeholder={_("Create new tag...")}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="tags-container">
                {tags.length === 0 && <span className="no-tags-message">{_("No tags")}</span>}
                {tags.map((tag) => (
                    <span key={tag.id} className="tag">
                        {tag.tag_name}
                        <button
                            className="remove-tag"
                            onClick={() => removeTag(tag.tag_id, tag.tag_name)}
                            title={_("Remove tag")}
                        >
                            <i className="fa fa-times" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
}
