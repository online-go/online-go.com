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
import { Link } from "react-router-dom";
import {
    AnnouncementEntry as AnnouncementEntryType,
    getLocalizedText,
    isExternalUrl,
} from "@/lib/announcement_utils";

interface AnnouncementEntryProps {
    entry: AnnouncementEntryType;
    ariaLabel?: string;
}

/**
 * Renders a single announcement entry with proper link handling
 */
export const AnnouncementEntry: React.FC<AnnouncementEntryProps> = React.memo(
    ({ entry, ariaLabel }) => {
        const localizedText = getLocalizedText(entry);

        if (!localizedText) {
            return null;
        }

        if (entry.link) {
            if (isExternalUrl(entry.link)) {
                return (
                    <a
                        href={entry.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={ariaLabel || `${localizedText} (opens in new tab)`}
                    >
                        {localizedText}
                    </a>
                );
            } else {
                return (
                    <Link to={entry.link} aria-label={ariaLabel || localizedText}>
                        {localizedText}
                    </Link>
                );
            }
        }

        return <span>{localizedText}</span>;
    },
);
AnnouncementEntry.displayName = "AnnouncementEntry";
