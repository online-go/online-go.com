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
import { pgettext } from "@/lib/translate";
import type { KibitzVariationSummary } from "@/models/kibitz";
import "./KibitzVariationList.css";

interface KibitzVariationListProps {
    variations: KibitzVariationSummary[];
    onOpenVariation: (variationId: string) => void;
}

export function KibitzVariationList({
    variations,
    onOpenVariation,
}: KibitzVariationListProps): React.ReactElement {
    return (
        <div className="KibitzVariationList">
            <div className="variation-title">
                {pgettext("Heading for the variations list in kibitz", "Variations")}
            </div>
            {variations.length > 0 ? (
                <div className="variation-items">
                    {variations.map((variation) => (
                        <button
                            key={variation.id}
                            type="button"
                            className="variation-item"
                            onClick={() => onOpenVariation(variation.id)}
                        >
                            <span className="variation-name">
                                {variation.title ||
                                    pgettext(
                                        "Fallback title for an untitled variation in kibitz",
                                        "Untitled variation",
                                    )}
                            </span>
                            <span className="variation-meta">{variation.creator.username}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="variation-empty">
                    {pgettext(
                        "Empty state for the variations list in kibitz",
                        "No active variations yet.",
                    )}
                </div>
            )}
        </div>
    );
}
