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
import {
    getOffenseType,
    getTemplatesForOffense,
    getCategoryLabel,
    TemplateCategory,
} from "./AppealTemplates";
import type { AppealTemplate } from "./AppealTemplates";
import "./TemplateSelector.css";

interface TemplateSelectorProps {
    banReason: string | null;
    currentText: string;
    onSelectTemplate: (text: string) => void;
}

const CATEGORY_ORDER: TemplateCategory[] = ["acknowledgment", "denial", "welcome_back"];

export function TemplateSelector({
    banReason,
    currentText,
    onSelectTemplate,
}: TemplateSelectorProps): React.ReactElement | null {
    const offenseType = getOffenseType(banReason);
    const templates = getTemplatesForOffense(offenseType);

    function handleChange(ev: React.ChangeEvent<HTMLSelectElement>) {
        const templateId = ev.target.value;
        if (!templateId) {
            return;
        }

        const template = templates.find((t) => t.id === templateId);
        if (!template) {
            return;
        }

        const hasExistingText = currentText.trim().length > 0;
        if (hasExistingText && !window.confirm("Replace the current message with this template?")) {
            // Reset the select back to placeholder
            ev.target.value = "";
            return;
        }

        onSelectTemplate(template.text);

        // Reset select to placeholder so it can be re-selected
        ev.target.value = "";
    }

    // Group templates by category, maintaining display order
    const grouped = new Map<TemplateCategory, AppealTemplate[]>();
    for (const category of CATEGORY_ORDER) {
        const matching = templates.filter((t) => t.category === category);
        if (matching.length > 0) {
            grouped.set(category, matching);
        }
    }

    return (
        <div className="TemplateSelector">
            <select onChange={handleChange} defaultValue="">
                <option value="" disabled>
                    Insert template...
                </option>
                {Array.from(grouped.entries()).map(([category, categoryTemplates]) => (
                    <optgroup key={category} label={getCategoryLabel(category)}>
                        {categoryTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.title}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
}
