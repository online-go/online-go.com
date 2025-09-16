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

import { current_language } from "@/lib/translate";
import { TypedEventEmitter } from "@/lib/TypedEventEmitter";

// Constants
export const URL_PROTOCOL_SEPARATOR = "://";
export const DEFAULT_ANNOUNCEMENT_LANG = "en";
export const TWITCH_DOMAIN = "twitch.tv";

// Shared interface for announcement entries
export interface AnnouncementEntry {
    link: string;
    [lang: string]: string; // Language-keyed text, e.g., en: "Board 1", ja: "ボード1"
}

export interface Announcement {
    id: number;
    expiration: number;
    type: string;
    creator: {
        id: number;
        username: string;
        ui_class: string;
    };
    clear?: () => void;
    entries: AnnouncementEntry[];
    edit_count?: number;
    language?: string;
}

/**
 * Gets localized text from an announcement entry based on user's language preferences.
 * Prioritizes current language, then browser languages, then falls back to English.
 * @param entry - The announcement entry to get text from
 * @returns The best matching localized text, or null if none found
 */
export function getLocalizedText(entry: AnnouncementEntry): string | null {
    // Try current language first
    const currentLang = current_language || DEFAULT_ANNOUNCEMENT_LANG;
    if (entry[currentLang]) {
        return entry[currentLang];
    }

    // Try browser languages
    if (typeof navigator !== "undefined" && navigator.languages) {
        for (const navLang of navigator.languages) {
            const shortLang = navLang.split("-")[0].toLowerCase();
            if (entry[shortLang]) {
                return entry[shortLang];
            }
            if (entry[navLang.toLowerCase()]) {
                return entry[navLang.toLowerCase()];
            }
        }
    }

    // Fallback to English if available
    if (entry.en) {
        return entry.en;
    }

    // Don't show announcements in languages the user doesn't understand
    // Return null instead of showing text in an unrelated language
    return null;
}

/**
 * Checks if a URL is external (contains protocol separator)
 * @param url - The URL to check
 * @returns True if the URL is external
 */
export function isExternalUrl(url: string): boolean {
    return url.indexOf(URL_PROTOCOL_SEPARATOR) > 0;
}

/**
 * Validates whether a string is a valid URL or internal path
 * @param urlOrPath - The string to validate
 * @returns True if valid URL or internal path (starting with /), or if empty
 */
export function isValidUrlOrPath(urlOrPath: string): boolean {
    if (!urlOrPath) {
        return true; // Empty is valid
    }

    // Check if it's a valid URL
    try {
        new URL(urlOrPath);
        return true;
    } catch {
        // Check if it's a valid internal route
        return urlOrPath.startsWith("/");
    }
}

// ActiveAnnouncementsTracker
interface ActiveAnnouncementsTrackerEvents {
    "presence-changed": boolean;
}

class ActiveAnnouncementsTracker extends TypedEventEmitter<ActiveAnnouncementsTrackerEvents> {
    private isPresent = false;

    setPresent(present: boolean): void {
        if (this.isPresent !== present) {
            this.isPresent = present;
            this.emit("presence-changed", present);
        }
    }

    getIsPresent(): boolean {
        return this.isPresent;
    }
}

export const activeAnnouncementsTracker = new ActiveAnnouncementsTracker();

/**
 * Checks if a URL contains a Twitch.tv link
 * @param url - The URL to check
 * @returns True if the URL contains twitch.tv
 */
export function isTwitchUrl(url: string | undefined): boolean {
    if (!url) {
        return false;
    }
    return url.toLowerCase().indexOf(TWITCH_DOMAIN) > 0;
}

/**
 * Checks if an announcement entry should be displayed
 * @param entry - The announcement entry to check
 * @returns True if the entry should be displayed
 */
export function isDisplayableEntry(entry: AnnouncementEntry): boolean {
    const text = getLocalizedText(entry);
    // Skip entries with no text
    if (!text) {
        return false;
    }
    // Skip twitch.tv links
    if (isTwitchUrl(entry.link)) {
        return false;
    }
    return true;
}

/**
 * Filters announcement entries to only include displayable ones
 * @param entries - The entries to filter
 * @returns Array of displayable entries
 */
export function getDisplayableEntries(
    entries: AnnouncementEntry[] | undefined,
): AnnouncementEntry[] {
    if (!entries || entries.length === 0) {
        return [];
    }
    return entries.filter(isDisplayableEntry);
}

/**
 * Checks if an announcement should be hidden due to Twitch links
 * @param announcement - The announcement to check
 * @returns True if the announcement contains only Twitch links and should be hidden
 */
export function isAnnouncementAllTwitch(announcement: Announcement): boolean {
    if (announcement.entries && announcement.entries.length > 0) {
        const displayableEntries = getDisplayableEntries(announcement.entries);
        // If all entries are filtered out (no displayable entries), it's all Twitch
        return displayableEntries.length === 0;
    }

    return false;
}

/**
 * Sorts announcements: system announcements first, then by ID (oldest first)
 * @param announcements - Array of announcements to sort
 * @returns Sorted array of announcements
 */
export function sortAnnouncements(announcements: Announcement[]): Announcement[] {
    return [...announcements].sort((a, b) => {
        // System announcements come first
        if (a.type === "system" && b.type !== "system") {
            return -1;
        }
        if (a.type !== "system" && b.type === "system") {
            return 1;
        }

        // Then sort by id (lower id = older = should appear first)
        return a.id - b.id;
    });
}

/**
 * Checks if a user is a participant in the current game
 * @param userId - The user's ID
 * @returns True if the user is a participant in the current game
 */
export function isUserGameParticipant(userId?: number): boolean {
    if (!userId) {
        return false;
    }
    return (window as any).global_goban?.engine?.isParticipant?.(userId) || false;
}

/**
 * Determines if an announcement should be shown to a game participant
 * @param announcement - The announcement to check
 * @param isParticipant - Whether the user is a game participant
 * @returns True if the announcement should be shown
 */
export function shouldShowToGameParticipant(
    announcement: Announcement,
    isParticipant: boolean,
): boolean {
    // Always show system announcements
    if (announcement.type === "system") {
        return true;
    }
    // Hide non-system announcements for game participants
    return !isParticipant;
}
