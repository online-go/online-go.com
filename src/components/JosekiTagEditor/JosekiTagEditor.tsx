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

import { get, post, del } from "@/lib/requests";
import * as data from "@/lib/data";

// This is is a relic from when OJE was a separate project, and
// might have remained on a separate sever.
// Would be nice to tidy up and use the normal API.
const server_url = data.get("oje-url", "/oje/");

interface JosekiTagEditorProps {}

export function JosekiTagEditor(_props: JosekiTagEditorProps) {
    const [tags, setTags] = React.useState<rest_api.JosekiTag[]>([]);
    const [newTagLabel, setNewTagLabel] = React.useState("");
    const [newTagGroup, setNewTagGroup] = React.useState<number>(0);
    const [newTagSeq, setNewTagSeq] = React.useState<number>(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const loadTags = React.useCallback(async () => {
        try {
            const response = await get(server_url + "tags_counts");
            setTags(response.tags as rest_api.JosekiTag[]);
            setError(null);
        } catch (err) {
            setError(_("Failed to load tags"));
            console.error("Failed to load tags:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void loadTags();
    }, [loadTags]);

    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagLabel.trim()) {
            return;
        }

        try {
            const response = await post(server_url + "tags", {
                tag: {
                    description: newTagLabel.trim(),
                    group: newTagGroup,
                    seq: newTagSeq,
                },
            });
            const newTag = {
                description: response.description,
                id: response.id,
                group: response.group,
                seq: response.seq,
                count: 0,
            };
            const newTags = [...tags, newTag];
            setTags(newTags);
            setNewTagLabel("");
            setNewTagGroup(0);
            setNewTagSeq(0);
            setError(null);
        } catch (err) {
            setError("Failed to add tag (see console)");
            console.error("Failed to add tag:", err);
        }
    };

    const handleDeleteTag = async (tagId: number) => {
        try {
            await del(server_url + "tag?id=" + tagId);
            setTags(tags.filter((tag) => tag.id !== tagId));
            setError(null);
        } catch (err) {
            setError("Failed to delete tag (see console)");
            console.error("Failed to delete tag:", err);
        }
    };

    if (isLoading) {
        return <div>{_("Loading...")}</div>;
    }

    return (
        <div className="joseki-tag-editor">
            {error && <div className="error">{error}</div>}

            <div className="tags-table-container">
                <table className="tags-table">
                    <thead>
                        <tr>
                            <th>{_("Description")}</th>
                            <th>{_("Group")}</th>
                            <th>{_("Sequence")}</th>
                            <th>{_("Count")}</th>
                            <th>{_("Delete")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tags.map((tag) => (
                            <tr key={tag.id}>
                                <td>{tag.description}</td>
                                <td>{tag.group}</td>
                                <td>{tag.seq}</td>
                                <td>{tag.count}</td>
                                <td>
                                    {tag?.count === 0 && (
                                        <button
                                            className="delete-tag-button"
                                            onClick={() => handleDeleteTag(tag.id)}
                                            title={_("Delete tag")}
                                        >
                                            X
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <form onSubmit={handleAddTag} className="add-tag-form">
                <input
                    type="text"
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    placeholder={_("New tag description")}
                />
                <input
                    type="number"
                    value={newTagGroup}
                    onChange={(e) => setNewTagGroup(parseInt(e.target.value) || 0)}
                    placeholder={_("Group")}
                    min="0"
                />
                <input
                    type="number"
                    value={newTagSeq}
                    onChange={(e) => setNewTagSeq(parseInt(e.target.value) || 0)}
                    placeholder={_("Sequence")}
                    min="0"
                />
                <button type="submit">{_("Add Tag")}</button>
            </form>
        </div>
    );
}
