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

import { moment } from "@/lib/translate";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { get } from "@/lib/requests";
import { UIPush } from "@/components/UIPush";
import { TypedEventEmitter } from "@/lib/TypedEventEmitter";
import { errorLogger } from "@/lib/misc";
import ITC from "@/lib/ITC";
import * as data from "@/lib/data";
import { getBlocks } from "../BlockPlayer";
import * as preferences from "@/lib/preferences";
import {
    activeAnnouncementsTracker,
    getDisplayableEntries,
    sortAnnouncements,
    isUserGameParticipant,
    shouldShowToGameParticipant,
    Announcement,
} from "@/lib/announcement_utils";
import { AnnouncementEntry } from "./AnnouncementEntry";

interface Events {
    announcement: any;
    "announcement-cleared": any;
}

// Re-export Announcement type from utils for backward compatibility
export type { Announcement } from "@/lib/announcement_utils";

export const announcement_event_emitter = new TypedEventEmitter<Events>();
export const active_announcements: { [id: number]: Announcement } = {};

export function announcementTypeMuted(announcement: Announcement): boolean {
    if (announcement.type === "stream" && preferences.get("mute-stream-announcements")) {
        return true;
    }
    if (announcement.type === "event" && preferences.get("mute-event-announcements")) {
        return true;
    }
    return false;
}

const announced: { [id: number]: Announcement } = {};
// Holds the expirations dates of cleared announcements
const cleared_announcements: { [id: number]: number } = data.get("announcements.cleared", {});
// Store announcement timeouts
const announcement_timeouts: { [id: number]: NodeJS.Timeout } = {};
for (const k in cleared_announcements) {
    if (cleared_announcements[k] < Date.now()) {
        delete cleared_announcements[k];
    }
}
data.set("announcements.cleared", cleared_announcements);

export const Announcements: React.FC = React.memo(() => {
    const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
    const location = useLocation(); // Triggers re-render on navigation
    const [isGameParticipant, setIsGameParticipant] = React.useState(false);
    const [hasActiveAnnouncements, setHasActiveAnnouncements] = React.useState(
        activeAnnouncementsTracker.getIsPresent(),
    );

    const clearAnnouncement = React.useCallback(
        (id: number, dont_send_clear_announcement: boolean) => {
            cleared_announcements[id] = Date.now() + 30 * 24 * 3600 * 1000;
            announcement_event_emitter.emit("announcement-cleared", announced[id]);
            data.set("announcements.cleared", cleared_announcements);

            if (!dont_send_clear_announcement) {
                ITC.send("clear-announcement", id);
            }

            setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id));
        },
        [],
    );

    const announce = React.useCallback(
        (announcement: Announcement) => {
            active_announcements[announcement.id] = announcement;

            // Check if this is an update to an existing announcement
            const isUpdate = announcement.id in announced;

            announcement_event_emitter.emit("announcement", announcement);

            if (announcement.id in cleared_announcements) {
                announcement_event_emitter.emit("announcement-cleared", announcement);
                return;
            }

            announcement.clear = () => clearAnnouncement(announcement.id, false);
            announced[announcement.id] = announcement;

            if (announcement.type !== "tournament") {
                if (isUpdate) {
                    // Update existing announcement
                    setAnnouncements((prev) =>
                        prev.map((a) => (a.id === announcement.id ? announcement : a)),
                    );
                } else {
                    // Add new announcement
                    setAnnouncements((prev) => [...prev, announcement]);
                }

                // Clear any existing timeout for this announcement
                if (announcement_timeouts[announcement.id]) {
                    clearTimeout(announcement_timeouts[announcement.id]);
                }

                // Set new timeout based on updated expiration
                const timeout = setTimeout(
                    () => {
                        clearAnnouncement(announcement.id, true);
                        delete active_announcements[announcement.id];
                        delete announcement_timeouts[announcement.id];
                    },
                    moment(announcement.expiration).toDate().getTime() - Date.now(),
                );
                announcement_timeouts[announcement.id] = timeout;
            } else {
                const t = moment(announcement.expiration).toDate().getTime() - Date.now();
                // Tournaments are announced 30 minutes prior, but allow
                // up to 5 minutes of clock skew.
                if (t > 0 && t < 35 * 60 * 1000) {
                    data.set("active-tournament", announcement);
                }
            }
        },
        [clearAnnouncement],
    );

    const retract = React.useCallback(
        (announcement: Announcement) => {
            clearAnnouncement(announcement.id, true);
        },
        [clearAnnouncement],
    );

    // Register ITC handler (only once on mount)
    React.useEffect(() => {
        ITC.register("clear-announcement", (id: number) => {
            console.log("ITC: Clearing announcement");
            clearAnnouncement(id, true);
        });
        // ITC registrations are global and don't need cleanup
    }, [clearAnnouncement]);

    // Listen for ActiveAnnouncements presence changes
    React.useEffect(() => {
        const handlePresenceChange = (present?: boolean) => {
            setHasActiveAnnouncements(present || false);
        };

        activeAnnouncementsTracker.on("presence-changed", handlePresenceChange);
        return () => {
            activeAnnouncementsTracker.off("presence-changed", handlePresenceChange);
        };
    }, []);

    // Load announcements on mount (only once)
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            /* Defer this get so we can load whatever page we're on first */
            get("announcements")
                .then((announcements) => {
                    for (const announcement of announcements) {
                        announce(announcement);
                    }
                })
                .catch(errorLogger);
        }, 20);

        return () => clearTimeout(timeout);
    }, []); // Empty dependency array - only fetch once on mount

    // Update game participant status when location changes or goban loads
    React.useEffect(() => {
        const checkParticipation = () => {
            const user = data.get("user");
            setIsGameParticipant(isUserGameParticipant(user?.id));
        };

        // Check after navigation with requestAnimationFrame
        const rafId = requestAnimationFrame(() => {
            checkParticipation();

            // Also listen for goban load event if goban exists
            const goban = (window as any).global_goban;
            if (goban?.on) {
                goban.on("load", checkParticipation);
            }
        });

        return () => {
            cancelAnimationFrame(rafId);
            // Clean up goban load listener
            const goban = (window as any).global_goban;
            if (goban?.off) {
                goban.off("load", checkParticipation);
            }
        };
    }, [location]); // Re-run when location changes

    // Sort announcements: system first, then by id (oldest first)
    const sortedAnnouncements = React.useMemo(
        () => sortAnnouncements(announcements),
        [announcements],
    );

    // Don't show if ActiveAnnouncements is present on the page
    if (hasActiveAnnouncements) {
        return null;
    }

    return (
        <div className="Announcements">
            <UIPush event="retract" channel="announcements" action={retract} />
            <UIPush event="announcement" channel="announcements" action={announce} />
            <UIPush event="retract" action={retract} />
            <UIPush event="announcement" action={announce} />

            {sortedAnnouncements.map((announcement, idx) => {
                const creator_blocked = getBlocks(announcement.creator.id).block_announcements;
                const type_muted = announcementTypeMuted(announcement);

                // Hide non-system announcements if user is a game participant
                if (!shouldShowToGameParticipant(announcement, isGameParticipant)) {
                    return null;
                }

                if (creator_blocked || type_muted) {
                    return null;
                }

                // All announcements should have entries now
                if (!announcement.entries || announcement.entries.length === 0) {
                    return null;
                }

                const displayableEntries = getDisplayableEntries(announcement);

                if (displayableEntries.length === 0) {
                    return null;
                }

                return (
                    <div
                        className={`announcement multi-link announcement-${announcement.type}`}
                        key={idx}
                        role="alert"
                        aria-live="polite"
                    >
                        <i
                            className="fa fa-times-circle"
                            onClick={announcement.clear}
                            role="button"
                            tabIndex={0}
                            aria-label="Dismiss announcement"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    announcement.clear?.();
                                }
                            }}
                        />
                        <div className="announcement-content">
                            {displayableEntries.map((entry, entryIdx) => (
                                <div className="announcement-entry" key={entryIdx}>
                                    <AnnouncementEntry entry={entry} />
                                </div>
                            ))}
                            {announcement.type !== "system" && (
                                <i className="announcement-creator">
                                    &nbsp; - {announcement.creator.username}
                                </i>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});
