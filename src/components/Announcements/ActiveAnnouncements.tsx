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
import { useLocation } from "react-router-dom";
import { interpolate, _, moment } from "@/lib/translate";
import { Card, PopupMenu, PopupMenuItem } from "@/components/material";
import { UIPush } from "@/components/UIPush";

import {
    active_announcements,
    announcement_event_emitter,
    announcementTypeMuted,
} from "./Announcements";
import { getBlocks, setAnnouncementBlock } from "../BlockPlayer";
import {
    activeAnnouncementsTracker,
    getDisplayableEntries,
    isAnnouncementAllTwitch,
    sortAnnouncements,
    isUserGameParticipant,
    shouldShowToGameParticipant,
    Announcement,
} from "@/lib/announcement_utils";
import { AnnouncementEntry } from "./AnnouncementEntry";

import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";

import { alert } from "@/lib/swal_config";
import "./ActiveAnnouncements.css";

// Holds the expirations dates of cleared announcements
const hard_cleared_announcements: { [id: number]: number } = data.get(
    "announcements.hard_cleared",
    {},
);
for (const k in hard_cleared_announcements) {
    if (hard_cleared_announcements[k] < Date.now()) {
        delete hard_cleared_announcements[k];
    }
}
data.set("announcements.hard_cleared", hard_cleared_announcements);

// Store announcement timeouts
const announcement_timeouts: { [id: number]: NodeJS.Timeout } = {};

export const ActiveAnnouncements: React.FC = React.memo(() => {
    const [updateCounter, forceUpdate] = React.useReducer((x) => x + 1, 0);
    const location = useLocation(); // Triggers re-render on navigation
    const [isGameParticipant, setIsGameParticipant] = React.useState(false);

    const clearAnnouncement = React.useCallback((id: number) => {
        hard_cleared_announcements[id] = Date.now() + 30 * 24 * 3600 * 1000;
        data.set("announcements.hard_cleared", hard_cleared_announcements);
        forceUpdate();
    }, []);

    // Handle new announcements from the server
    const announce = React.useCallback((announcement: Announcement) => {
        active_announcements[announcement.id] = announcement;
        announcement_event_emitter.emit("announcement", announcement);

        // Clear any existing timeout for this announcement
        if (announcement_timeouts[announcement.id]) {
            clearTimeout(announcement_timeouts[announcement.id]);
        }

        // Set new timeout based on expiration
        const timeUntilExpiration = moment(announcement.expiration).toDate().getTime() - Date.now();
        if (timeUntilExpiration > 0) {
            const timeout = setTimeout(() => {
                delete active_announcements[announcement.id];
                delete announcement_timeouts[announcement.id];
                forceUpdate();
            }, timeUntilExpiration);
            announcement_timeouts[announcement.id] = timeout;
        }
    }, []);

    // Handle retracted announcements from the server
    const retract = React.useCallback((announcement: Announcement) => {
        delete active_announcements[announcement.id];
        // Clear the timeout if it exists
        if (announcement_timeouts[announcement.id]) {
            clearTimeout(announcement_timeouts[announcement.id]);
            delete announcement_timeouts[announcement.id];
        }
        forceUpdate();
    }, []);

    // Register presence of ActiveAnnouncements
    React.useEffect(() => {
        activeAnnouncementsTracker.setPresent(true);
        return () => {
            activeAnnouncementsTracker.setPresent(false);
            // Clean up all timeouts when component unmounts
            for (const id in announcement_timeouts) {
                clearTimeout(announcement_timeouts[id]);
                delete announcement_timeouts[id];
            }
        };
    }, []);

    // Listen to announcement events
    React.useEffect(() => {
        const update = (_announcement?: Announcement) => {
            // When an announcement is updated, ensure we trigger a re-render
            // This handles both new announcements and updates to existing ones
            forceUpdate();
        };

        announcement_event_emitter.on("announcement", update);
        announcement_event_emitter.on("announcement-cleared", update);

        return () => {
            announcement_event_emitter.off("announcement", update);
            announcement_event_emitter.off("announcement-cleared", update);
        };
    }, []);

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

    // Filter and sort announcements
    const sortedAnnouncements = React.useMemo(() => {
        const lst: Announcement[] = [];

        for (const announcement_id in active_announcements) {
            // Create a new reference to ensure we get the latest announcement data
            const announcement = { ...active_announcements[announcement_id] };
            const is_hidden = announcement_id in hard_cleared_announcements;
            const creator_blocked = getBlocks(announcement.creator.id).block_announcements;
            const type_muted = announcementTypeMuted(announcement);

            // Hide non-system announcements if user is a game participant
            if (!shouldShowToGameParticipant(announcement, isGameParticipant)) {
                continue;
            }

            /* No longer show twitch announcements, they'll show up automatically on GoTV */
            const is_twitch = isAnnouncementAllTwitch(announcement);

            if (
                announcement.type !== "tournament" &&
                !is_hidden &&
                !creator_blocked &&
                !type_muted &&
                !is_twitch
            ) {
                lst.push(announcement);
            }
        }

        // Sort announcements: system first, then by id (oldest first)
        return sortAnnouncements(lst);
    }, [isGameParticipant, updateCounter]);

    if (sortedAnnouncements.length === 0) {
        return null;
    }

    return (
        <div className="ActiveAnnouncements-container">
            <Card className="ActiveAnnouncements">
                <UIPush event="retract" channel="announcements" action={retract} />
                <UIPush event="announcement" channel="announcements" action={announce} />
                <UIPush event="retract" action={retract} />
                <UIPush event="announcement" action={announce} />

                {sortedAnnouncements.map((announcement, idx) => {
                    const user = data.get("user");
                    const can_block_user =
                        user &&
                        !user.anonymous &&
                        user.id !== announcement.creator.id &&
                        announcement.creator.ui_class.indexOf("moderator") < 0;

                    const announcement_actions: PopupMenuItem[] = [
                        {
                            title: _("Hide this announcement"),
                            onClick: () => {
                                clearAnnouncement(announcement.id);
                                return;
                            },
                        },
                    ];

                    if (can_block_user) {
                        announcement_actions.push({
                            title: interpolate(_("Hide all from {{username}}"), {
                                username: announcement.creator.username,
                            }),
                            onClick: () => {
                                alert
                                    .fire({
                                        text: interpolate(
                                            _(
                                                "Are you sure you want to hide all announcements from {{name}}?",
                                            ),
                                            { name: announcement.creator.username },
                                        ),
                                        showCancelButton: true,
                                        confirmButtonText: _("Yes"),
                                        cancelButtonText: _("Cancel"),
                                    })
                                    .then(({ value: yes }) => {
                                        if (yes) {
                                            setAnnouncementBlock(announcement.creator.id, true);
                                            forceUpdate();
                                        }
                                    })
                                    .catch(() => 0);
                                return;
                            },
                        });
                    }

                    if (announcement.type === "stream") {
                        announcement_actions.push({
                            title: _("Hide stream announcements"),
                            onClick: () => {
                                alert
                                    .fire({
                                        text: _(
                                            "Are you sure you want to hide all announcements for streamers?",
                                        ),
                                        showCancelButton: true,
                                        confirmButtonText: _("Yes"),
                                        cancelButtonText: _("Cancel"),
                                    })
                                    .then(({ value: yes }) => {
                                        if (yes) {
                                            preferences.set("mute-stream-announcements", true);
                                            forceUpdate();
                                        }
                                    })
                                    .catch(() => 0);
                                return;
                            },
                        });
                    }

                    if (announcement.type === "event") {
                        announcement_actions.push({
                            title: _("Hide event announcements"),
                            onClick: () => {
                                alert
                                    .fire({
                                        text: _(
                                            "Are you sure you want to hide all event announcements?",
                                        ),
                                        showCancelButton: true,
                                        confirmButtonText: _("Yes"),
                                        cancelButtonText: _("Cancel"),
                                    })
                                    .then(({ value: yes }) => {
                                        if (yes) {
                                            preferences.set("mute-event-announcements", true);
                                            forceUpdate();
                                        }
                                    })
                                    .catch(() => 0);
                                return;
                            },
                        });
                    }

                    if (announcement.type === "advertisement") {
                        announcement_actions.push({
                            title: _("Hide go service advertisements"),
                            onClick: () => {
                                alert
                                    .fire({
                                        text: _(
                                            "Are you sure you want to hide all go related advertisements?",
                                        ),
                                        showCancelButton: true,
                                        confirmButtonText: _("Yes"),
                                        cancelButtonText: _("Cancel"),
                                    })
                                    .then(({ value: yes }) => {
                                        if (yes) {
                                            preferences.set("mute-event-announcements", true);
                                            forceUpdate();
                                        }
                                    })
                                    .catch(() => 0);
                                return;
                            },
                        });
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
                        <div className={`announcement announcement-${announcement.type}`} key={idx}>
                            <div className="announcement-content">
                                {displayableEntries.map((entry, entryIdx) => (
                                    <div className="announcement-entry" key={entryIdx}>
                                        <AnnouncementEntry entry={entry} />
                                    </div>
                                ))}
                                {announcement.type !== "system" && (
                                    <i className="announcement-creator">
                                        &nbsp;- {announcement.creator.username}
                                    </i>
                                )}
                            </div>
                            <PopupMenu list={announcement_actions}></PopupMenu>
                        </div>
                    );
                })}
            </Card>
        </div>
    );
});
