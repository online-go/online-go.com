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
import { useData } from "@/lib/hooks";
import { pgettext } from "@/lib/translate";
import "./GobanCustomStoneUrlInput.css";

type StoneColor = "black" | "white";

interface GobanCustomStoneUrlInputProperties {
    color: StoneColor;
    urls: string[];
    setUrls: (urls: string[]) => void;
}

export function parseCustomStoneUrls(value: string): string[] {
    return Array.from(
        new Set(
            value
                .split(/\r?\n/)
                .map((url) => url.trim())
                .filter((url) => url.length > 0),
        ),
    );
}

export function GobanCustomStoneUrlInput({
    color,
    urls,
    setUrls,
}: GobanCustomStoneUrlInputProperties): React.ReactElement {
    const serialized_urls = urls.join("\n");
    const [draft, setDraft] = React.useState(serialized_urls);
    const last_emitted_urls = React.useRef(serialized_urls);
    const [variants_open, setVariantsOpen] = React.useState(urls.length > 1);
    const [canvas_enabled] = useData("experiments.canvas");

    React.useEffect(() => {
        if (serialized_urls !== last_emitted_urls.current) {
            last_emitted_urls.current = serialized_urls;
            setDraft(serialized_urls);
        }
    }, [serialized_urls]);

    React.useEffect(() => {
        if (urls.length > 1) {
            setVariantsOpen(true);
        }
    }, [urls.length]);

    const single_url_placeholder =
        color === "black"
            ? pgettext("A URL pointing to a custom black stone image", "Custom black stone URL")
            : pgettext("A URL pointing to a custom white stone image", "Custom white stone URL");
    const multiple_urls_placeholder =
        color === "black"
            ? pgettext(
                  "Custom black stone image URLs, one per line",
                  "Custom black stone URLs, one per line",
              )
            : pgettext(
                  "Custom white stone image URLs, one per line",
                  "Custom white stone URLs, one per line",
              );
    const reset_label =
        color === "black"
            ? pgettext("Reset all custom black stone image URLs", "Reset black stone URLs")
            : pgettext("Reset all custom white stone image URLs", "Reset white stone URLs");

    function updateUrls(value: string): void {
        setDraft(value);
        const next_urls = parseCustomStoneUrls(value);
        last_emitted_urls.current = next_urls.join("\n");
        setUrls(next_urls);
    }

    function resetUrls(): void {
        last_emitted_urls.current = "";
        setDraft("");
        setUrls([]);
        setVariantsOpen(false);
    }

    return (
        <div className="GobanCustomStoneUrlInput">
            <div className="custom-stone-url-selection">
                {variants_open ? (
                    <textarea
                        className="customStoneUrlSelector"
                        value={draft}
                        placeholder={multiple_urls_placeholder}
                        aria-label={multiple_urls_placeholder}
                        rows={Math.max(2, Math.min(6, draft.split("\n").length))}
                        onChange={(event) => updateUrls(event.target.value)}
                    />
                ) : (
                    <input
                        className="customStoneUrlSelector"
                        type="text"
                        value={draft}
                        placeholder={single_url_placeholder}
                        aria-label={single_url_placeholder}
                        onFocus={(event) => event.target.select()}
                        onChange={(event) => updateUrls(event.target.value)}
                    />
                )}
                <button
                    type="button"
                    className="color-reset"
                    title={reset_label}
                    aria-label={reset_label}
                    onClick={resetUrls}
                >
                    <i className="fa fa-undo" />
                </button>
            </div>
            {!variants_open && (
                <button
                    type="button"
                    className="add-variants"
                    onClick={() => setVariantsOpen(true)}
                >
                    {pgettext("Expand custom stone variant URL editor", "Add variants")}
                </button>
            )}
            {variants_open && (
                <small className="variant-help">
                    {pgettext("Custom stone URL list instructions", "One image URL per line.")}
                </small>
            )}
            {canvas_enabled === "enabled" && urls.length > 1 && (
                <small className="canvas-compatibility-note">
                    {pgettext(
                        "Legacy goban renderer custom stone limitation",
                        "The old canvas renderer uses only the first URL.",
                    )}
                </small>
            )}
        </div>
    );
}
