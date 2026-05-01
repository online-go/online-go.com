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
import Select, { MultiValue, SingleValue } from "react-select";

import { _, pgettext } from "@/lib/translate";
import { get, post } from "@/lib/requests";
import { Markdown } from "@/components/Markdown";
import { openModal } from "@/components/Modal";
import { JosekiSourceModal } from "@/components/JosekiSourceModal";
import { JosekiTagSelector, OJEJosekiTag } from "@/components/JosekiTagSelector";
import { joseki_sources_url, applyJosekiMarkdown, MoveCategory } from "./joseki-utils";

type DescriptionView = "edit" | "preview";
type StringOption = { value: string; label: string };
type SourceOption = { value: string | number; label: string };

export interface EditProps {
    node_id: number;
    description: string;
    category: string;
    variation_label: string;
    joseki_source_id: number;
    available_tags: OJEJosekiTag[];
    tags: Array<{ description: string; id: number; [key: string]: string | number }>;
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

function currentMarksInDescription(
    description: string,
): Array<{ label: string; position: string }> {
    if (description === null) {
        return [];
    }

    const mark_matches = description.match(/<[A-Z]:[A-Z][0-9]{1,2}>/gm);
    const current_marks: Array<{ label: string; position: string }> = [];

    if (mark_matches) {
        mark_matches.forEach((mark) => {
            const extract = mark.match(/<([A-Z]):([A-Z][0-9]{1,2})>/);
            if (extract) {
                current_marks.push({ label: extract[1], position: extract[2] });
            }
        });
    }

    return current_marks;
}

export function EditPane(props: EditProps): React.ReactElement {
    const [move_category, set_move_category] = React.useState(
        props.category === "new" ? Object.keys(MoveCategory)[0] : props.category,
    );
    const [new_description, set_new_description] = React.useState(props.description);
    const [joseki_source_list, set_joseki_source_list] = React.useState<
        { id: number | string; description: string }[]
    >([]);
    const [joseki_source, set_joseki_source] = React.useState<string | number>(
        props.joseki_source_id,
    );
    const [tags, set_tags] = React.useState<{ label: string; value: number }[]>(
        props.tags === null ? [] : props.tags.map((t) => ({ label: t.description, value: t.id })),
    );
    const [variation_label, set_variation_label] = React.useState(props.variation_label || "1");
    const [description_view, set_description_view] = React.useState<DescriptionView>("edit");

    const prev_node_id = React.useRef(props.node_id);

    React.useEffect(() => {
        get(joseki_sources_url)
            .then((body) => {
                set_joseki_source_list([{ id: "none", description: "(unknown)" }, ...body.sources]);
            })
            .catch((r) => {
                console.log("Sources GET failed:", r);
            });
    }, []);

    // Reset edit-form state when the active node changes (e.g. user clicks
    // a different stone on the board).
    React.useEffect(() => {
        if (props.node_id !== prev_node_id.current) {
            prev_node_id.current = props.node_id;
            set_move_category(
                props.category === "new" ? Object.keys(MoveCategory)[0] : props.category,
            );
            set_new_description(props.description);
            set_joseki_source(props.joseki_source_id);
            set_tags(
                props.tags === null
                    ? []
                    : props.tags.map((t) => ({ label: t.description, value: t.id })),
            );
            set_variation_label(props.variation_label || "1");
        }
    }, [
        props.node_id,
        props.category,
        props.description,
        props.joseki_source_id,
        props.tags,
        props.variation_label,
    ]);

    const onTypeChange = React.useCallback((opt: SingleValue<StringOption>) => {
        if (opt) {
            set_move_category(opt.value);
        }
    }, []);

    const onSourceChange = React.useCallback((opt: SingleValue<SourceOption>) => {
        set_joseki_source(opt?.value ?? "none");
    }, []);

    const onTagChange = React.useCallback((e: MultiValue<OJEJosekiTag>) => {
        set_tags(e as unknown as { label: string; value: number }[]);
    }, []);

    const handleEditInput = React.useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const desc = e.target.value;
            props.update_marks(currentMarksInDescription(desc));
            set_new_description(desc);
        },
        [props.update_marks],
    );

    const addJosekiSource = React.useCallback(
        (description: string, url: string) => {
            post(joseki_sources_url, {
                source: { description: description, url: url, contributor: props.contributor },
            })
                .then((body) => {
                    const new_source = {
                        id: body.source.id,
                        description: body.source.description,
                    };
                    set_joseki_source_list((prev) => [new_source, ...prev]);
                    set_joseki_source(new_source.id);
                })
                .catch((r) => {
                    console.log("Sources POST failed:", r);
                });
        },
        [props.contributor],
    );

    const promptForJosekiSource = React.useCallback(() => {
        openModal(<JosekiSourceModal add_joseki_source={addJosekiSource} fastDismiss />);
    }, [addJosekiSource]);

    const saveNewInfo = React.useCallback(() => {
        props.save_new_info(
            move_category,
            variation_label,
            tags.map((t) => t.value),
            new_description,
            joseki_source !== "none" ? String(joseki_source) : undefined,
            currentMarksInDescription(new_description),
        );
    }, [props.save_new_info, move_category, variation_label, tags, new_description, joseki_source]);

    const onLabelChange = React.useCallback((opt: SingleValue<StringOption>) => {
        if (opt) {
            set_variation_label(opt.value);
        }
    }, []);

    const categoryOptions: StringOption[] = Object.entries(MoveCategory).map(([key, value]) => ({
        value: key,
        label: pgettext("Joseki move category", value as string),
    }));

    if (move_category !== "new" && !(move_category in MoveCategory)) {
        categoryOptions.unshift({
            value: move_category,
            label: pgettext("Joseki move category", move_category),
        });
    }

    const selectedCategory =
        categoryOptions.find((o) => o.value === move_category) ?? categoryOptions[0];

    const labelOptions: StringOption[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "_"].map(
        (l) => ({ value: l, label: l }),
    );
    const selectedLabel = labelOptions.find((o) => o.value === variation_label) ?? labelOptions[0];

    const sourceOptions: SourceOption[] = joseki_source_list.map((s) => ({
        value: s.id,
        label: _(s.description),
    }));
    const selectedSource = sourceOptions.find((o) => o.value === joseki_source) ?? null;

    const preview = applyJosekiMarkdown(new_description);

    return (
        <div className="edit-container">
            <div className="move-attributes">
                <div className="move-type-selection">
                    <span>{_("This sequence is")}:</span>
                    <Select
                        className="joseki-edit-select"
                        classNamePrefix="ogs-react-select"
                        value={selectedCategory}
                        options={categoryOptions}
                        onChange={onTypeChange}
                        isSearchable={false}
                    />
                </div>
                <div className="variation-order-select">
                    <span>{_("Variation label")}:</span>
                    <Select
                        className="joseki-edit-select"
                        classNamePrefix="ogs-react-select"
                        value={selectedLabel}
                        options={labelOptions}
                        onChange={onLabelChange}
                        isSearchable={false}
                    />
                </div>

                <div className="joseki-source-edit">
                    <div>{_("Source")}:</div>
                    <div className="joseki-source-edit-controls">
                        <Select
                            className="joseki-edit-select"
                            classNamePrefix="ogs-react-select"
                            value={selectedSource}
                            options={sourceOptions}
                            onChange={onSourceChange}
                            isSearchable={true}
                            placeholder={_("(unknown)")}
                        />
                        <i className="fa fa-plus-circle" onClick={promptForJosekiSource} />
                    </div>
                </div>
                <div className="tag-edit">
                    <div>{_("Tags")}:</div>
                    <JosekiTagSelector
                        available_tags={props.available_tags}
                        selected_tags={tags as unknown as OJEJosekiTag[]}
                        on_tag_update={onTagChange}
                    />
                </div>
            </div>
            <div className="description-edit">
                <div className="description-edit-tabs">
                    <button
                        className={
                            "description-edit-tab" + (description_view === "edit" ? " active" : "")
                        }
                        onClick={() => set_description_view("edit")}
                    >
                        {pgettext("Joseki position description editor tab", "Edit")}
                    </button>
                    <button
                        className={
                            "description-edit-tab" +
                            (description_view === "preview" ? " active" : "")
                        }
                        onClick={() => set_description_view("preview")}
                    >
                        {pgettext("Joseki position description preview tab", "Preview")}
                    </button>
                </div>

                {description_view === "edit" ? (
                    <textarea
                        className="description-textarea"
                        onChange={handleEditInput}
                        value={new_description}
                        placeholder={_("Position description")}
                    />
                ) : new_description.length !== 0 ? (
                    <Markdown className="description-preview" source={preview} />
                ) : (
                    <div className="description-preview edit-label">
                        ({_("position description")})
                    </div>
                )}

                <div className="description-edit-save">
                    <button className="xs primary" onClick={saveNewInfo}>
                        {_("Save")}
                    </button>
                </div>
            </div>
        </div>
    );
}
