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
import * as data from "@/lib/data";
import { _, interpolate, llm_pgettext, pgettext } from "@/lib/translate";
import { post, get, del, put } from "@/lib/requests";
import { PaginatedTable } from "@/components/PaginatedTable";
import { Card } from "@/components/material";
import { UIPush } from "@/components/UIPush";
import { errorAlerter } from "@/lib/misc";
import { Player } from "@/components/Player";
import moment from "moment";
import { useUser } from "@/lib/hooks";
import { alert } from "@/lib/swal_config";
import { languages, current_language } from "@/lib/translate";
import { SYSTEM_TEMPLATES } from "@/lib/announcement_templates";
import { LoadingButton } from "@/components/LoadingButton";
import {
    AnnouncementEntry as SharedAnnouncementEntry,
    isValidUrlOrPath,
    DEFAULT_ANNOUNCEMENT_LANG,
} from "@/lib/announcement_utils";

moment.relativeTimeThreshold("m", 59);

// Constants for better maintainability
const DURATION_MULTIPLIER = 1000; // Convert seconds to milliseconds
const DURATION_BUFFER = 1000; // Extra buffer for expiration

// Duration limits by announcement type and user role (in seconds)
const DURATION_LIMITS = {
    stream: 43200, // 12 hours
    event: 86400 * 14, // 14 days
    superuser_default: 86400 * 7, // 7 days
    regular_announcer: 86400 - 1, // just under 24 hours
} as const;

// Common duration options (in seconds)
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;
const HALF_HOUR = 1800;

// Use shared type from announcement_utils
type AnnouncementEntry = SharedAnnouncementEntry;

const all_duration_options = [
    900,
    1800,
    2700,
    3600,
    5400,
    7200,
    9000,
    10800,
    12600,
    14400,
    16200,
    18000,
    19800,
    21600,

    86400,
    86400 * 2,
    86400 * 3,
    86400 * 5,
    86400 * 6,
    86400 * 7,
    // Extended durations for event announcements
    86400 * 10,
    86400 * 14,
];

if (process.env.NODE_ENV === "development") {
    all_duration_options.unshift(60);
    all_duration_options.unshift(5);
}

export function AnnouncementCenter(): React.ReactElement {
    const user = useUser();
    const [announcementType, setAnnouncementType] = React.useState(
        user.is_superuser ? "system" : data.get("announcement.last-type", "stream"),
    );
    // Using entries system for all content
    const [entries, setEntries] = React.useState<AnnouncementEntry[]>([
        { link: "", [current_language || DEFAULT_ANNOUNCEMENT_LANG]: "" },
    ]);
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [selectedTemplate, setSelectedTemplate] = React.useState<string>("");
    const [duration_idx, setDurationIdx] = React.useState(
        data.get("announcement.last-duration", 4),
    );
    const [translatingEntries, setTranslatingEntries] = React.useState<Set<number>>(new Set());

    const duration_options = React.useMemo(() => {
        const maxDuration =
            announcementType === "stream"
                ? DURATION_LIMITS.stream
                : announcementType === "event"
                  ? DURATION_LIMITS.event
                  : user.is_superuser
                    ? DURATION_LIMITS.superuser_default
                    : DURATION_LIMITS.regular_announcer;

        return all_duration_options.filter((x) => x <= maxDuration);
    }, [announcementType, user.is_superuser]);

    // Adjust duration_idx when duration_options change
    React.useEffect(() => {
        // If current duration_idx is out of bounds, set it to the last valid index
        if (duration_idx >= duration_options.length) {
            setDurationIdx(duration_options.length - 1);
        }
    }, [duration_options, duration_idx]);
    const [announcements, setAnnouncements] = React.useState<any[]>([]);

    React.useEffect(() => {
        window.document.title = _("Announcement Center");
        refresh();
    }, []);

    // Handle system template selection
    React.useEffect(() => {
        if (selectedTemplate && announcementType === "system") {
            const template = SYSTEM_TEMPLATES.find((t) => t.id === selectedTemplate);
            if (template) {
                // Create an entry with only supported language translations
                const entry: AnnouncementEntry = { link: "" };

                // Only add translations for languages we actually support
                Object.keys(template.translations).forEach((lang) => {
                    // Check if this language is in our supported languages list
                    if (lang in languages) {
                        entry[lang] = template.translations[lang];
                    }
                });

                // Ensure we have at least the current language or English
                if (Object.keys(entry).length === 1) {
                    // Only 'link' key exists, add English as fallback
                    entry.en = template.translations.en || "";
                }

                setEntries([entry]);

                // Find the closest duration index
                const targetDuration = template.duration;
                const closestIdx = duration_options.reduce((prev, curr, idx) => {
                    return Math.abs(curr - targetDuration) <
                        Math.abs(duration_options[prev] - targetDuration)
                        ? idx
                        : prev;
                }, 0);
                setDurationIdx(closestIdx);
            }
        }
    }, [selectedTemplate, announcementType]);

    const addEntry = React.useCallback((): void => {
        const lang = current_language || DEFAULT_ANNOUNCEMENT_LANG;
        const newEntry: AnnouncementEntry = { link: "", [lang]: "" };
        setEntries((prev) => [...prev, newEntry]);
    }, []);

    const removeEntry = (index: number): void => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const updateEntry = (index: number, field: string, value: string): void => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEntries(newEntries);
    };

    const addTranslation = (index: number): void => {
        const newEntries = [...entries];
        const entry = newEntries[index];

        // Find a language that doesn't have a translation yet
        const availableLanguages = Object.keys(languages).filter(
            (lang) => lang !== "debug" && lang !== "auto" && !(lang in entry),
        );

        if (availableLanguages.length > 0) {
            // Add first available language with empty string
            const newLang = availableLanguages[0];
            newEntries[index] = { ...entry, [newLang]: "" };
            setEntries(newEntries);
        }
    };

    const removeTranslation = (index: number, lang: string): void => {
        const newEntries = [...entries];
        const entry = newEntries[index];

        // Count how many translations exist (excluding 'link')
        const translationCount = Object.keys(entry).filter((key) => key !== "link").length;

        // Don't allow removing the last translation
        if (translationCount > 1) {
            delete newEntries[index][lang];
            setEntries(newEntries);
        }
    };

    const updateTranslationLanguage = (index: number, oldLang: string, newLang: string): void => {
        const newEntries = [...entries];
        const value = newEntries[index][oldLang];
        delete newEntries[index][oldLang];
        newEntries[index][newLang] = value;
        setEntries(newEntries);
    };

    const translateEntry = async (index: number): Promise<void> => {
        // Prevent multiple simultaneous translations of the same entry
        if (translatingEntries.has(index)) {
            return;
        }

        const entry = entries[index];

        // Find the source text (prefer English, or first available language with text)
        let sourceText = entry.en;

        if (!sourceText) {
            // Find first language with text
            const langWithText = Object.keys(entry).find((k) => k !== "link" && entry[k]);
            if (langWithText) {
                sourceText = entry[langWithText];
            }
        }

        if (!sourceText) {
            return;
        }

        // Get all languages that need translation
        const languagesToTranslate = Object.keys(languages).filter(
            (lang) => lang !== "debug" && lang !== "auto" && !entry[lang],
        );

        if (languagesToTranslate.length === 0) {
            return;
        }

        // Mark this entry as being translated
        setTranslatingEntries((prev) => new Set(prev).add(index));

        try {
            // Call translation API for each language
            const translationPromises = languagesToTranslate.map(async (targetLang) => {
                try {
                    const response = await post("/termination-api/translate", {
                        source: sourceText, // The text to translate
                        language: targetLang, // The target language
                    });
                    // Response format: {"source_language":"EN","target_language":"VI","source_text":"test","target_text":"kiểm tra"} // cspell:disable-line
                    return { lang: targetLang, text: response.target_text };
                } catch {
                    return null;
                }
            });

            const translations = await Promise.all(translationPromises);

            // Filter out failed translations and update the entry
            const successfulTranslations = translations.filter((t) => t !== null);

            if (successfulTranslations.length > 0) {
                const newEntries = [...entries];
                successfulTranslations.forEach((translation) => {
                    if (translation && translation.text) {
                        newEntries[index][translation.lang] = translation.text;
                    }
                });
                setEntries(newEntries);
            }
        } catch (error) {
            errorAlerter(error);
        } finally {
            // Remove this entry from the translating set
            setTranslatingEntries((prev) => {
                const newSet = new Set(prev);
                newSet.delete(index);
                return newSet;
            });
        }
    };

    const clearTranslations = (index: number): void => {
        const entry = entries[index];

        // Find the first non-empty text (prefer current language, then English)
        const primaryText =
            entry[current_language || DEFAULT_ANNOUNCEMENT_LANG] ||
            entry.en ||
            Object.keys(entry).find((k) => k !== "link" && entry[k]) ||
            "";
        const primaryLang = entry[current_language || DEFAULT_ANNOUNCEMENT_LANG]
            ? current_language || DEFAULT_ANNOUNCEMENT_LANG
            : entry.en
              ? DEFAULT_ANNOUNCEMENT_LANG
              : Object.keys(entry).find((k) => k !== "link" && entry[k]) ||
                DEFAULT_ANNOUNCEMENT_LANG;

        // Clear all language texts except the primary one (but keep the keys)
        const newEntries = [...entries];
        Object.keys(entry).forEach((key) => {
            if (key !== "link" && key !== primaryLang) {
                // Set to empty string instead of deleting
                newEntries[index][key] = "";
            }
        });

        // Ensure the primary language has the text
        newEntries[index][primaryLang] = primaryText;
        setEntries(newEntries);
    };

    const create = (): void => {
        const duration = duration_options[duration_idx] * DURATION_MULTIPLIER + DURATION_BUFFER;
        const expiration = moment.utc(Date.now() + duration).format("YYYY-MM-DD HH:mm:ss Z");
        data.set("announcement.last-type", announcementType);
        data.set("announcement.last-duration", duration_idx);

        // Filter out entries that have no text content (but allow empty URLs)
        const validEntries = entries.filter((e) => {
            // Check if entry has at least one non-empty text translation
            return Object.keys(e).some((key) => key !== "link" && e[key]);
        });

        // Use first entry's text as the main text for backward compatibility
        const mainText = validEntries.length > 0 && validEntries[0].en ? validEntries[0].en : "";

        const payload: any = {
            type: announcementType,
            user_ids: "",
            text: mainText,
            entries: validEntries,
            expiration,
            // Keep backward compatibility
            link: validEntries.length > 0 ? validEntries[0].link : "",
        };

        if (editingId) {
            put(`announcements/${editingId}`, payload)
                .then(() => {
                    setEditingId(null);
                    setEntries([{ link: "", [current_language || DEFAULT_ANNOUNCEMENT_LANG]: "" }]);
                    setSelectedTemplate("");
                    refresh();
                })
                .catch(errorAlerter);
        } else {
            post("announcements", payload)
                .then(() => {
                    setEntries([{ link: "", [current_language || DEFAULT_ANNOUNCEMENT_LANG]: "" }]);
                    setSelectedTemplate("");
                    refresh();
                })
                .catch(errorAlerter);
        }
    };

    const refresh = React.useCallback((): void => {
        get("announcements")
            .then((list) => {
                setAnnouncements(list);
            })
            .catch(errorAlerter);
    }, []);

    const deleteAnnouncement = (announcement: any): void => {
        alert
            .fire({
                text: _("Are you sure you want to delete this announcement?"),
                showCancelButton: true,
                confirmButtonText: _("Delete"),
                cancelButtonText: _("Cancel"),
            })
            .then(({ value: confirmed }) => {
                if (confirmed) {
                    del(`announcements/${announcement.id}`).then(refresh).catch(errorAlerter);
                }
            })
            .catch(() => {
                // User cancelled, do nothing
            });
    };

    const editAnnouncement = (announcement: any): void => {
        setEditingId(announcement.id);
        setAnnouncementType(announcement.type);

        // Load entries
        if (announcement.entries && announcement.entries.length > 0) {
            setEntries(announcement.entries);
        } else if (announcement.link) {
            // Backward compatibility with single link
            setEntries([{ link: announcement.link, en: "Link" }]);
        } else {
            setEntries([]);
        }

        // Set duration based on expiration
        const remaining = moment(announcement.expiration).diff(moment(), "seconds");
        const closestIdx = duration_options.reduce((prev, curr, idx) => {
            return Math.abs(curr - remaining) < Math.abs(duration_options[prev] - remaining)
                ? idx
                : prev;
        }, 0);
        setDurationIdx(closestIdx);
    };

    const cancelEdit = (): void => {
        setEditingId(null);
        setEntries([{ link: "", [current_language || DEFAULT_ANNOUNCEMENT_LANG]: "" }]);
        setSelectedTemplate("");
    };

    let can_create = true;

    // Check if at least one entry has text content
    can_create &&= entries.some((e) => Object.keys(e).some((key) => key !== "link" && e[key]));

    // Validate all entries (URLs are optional now)
    const hasInvalidEntries = entries.some((entry) => !isValidUrlOrPath(entry.link));

    if (hasInvalidEntries && !user.is_moderator) {
        can_create = false;
    }

    return (
        <div className="AnnouncementCenter container">
            <UIPush event="refresh" channel="announcement-center" action={refresh} />
            <Card>
                <h3>{editingId ? _("Edit Announcement") : _("Create Announcement")}</h3>
                <dl className="horizontal">
                    <dt>Type</dt>
                    {user.is_superuser ? (
                        <dd>
                            <select
                                value={announcementType}
                                onChange={(e) => {
                                    setAnnouncementType(e.target.value);
                                    setSelectedTemplate("");
                                }}
                            >
                                <option value="system">System</option>
                                <option value="stream">Stream</option>
                                <option value="event">Event</option>
                                <option value="advertisement">Advertisement</option>
                                <option value="tournament">Tournament</option>
                                <option value="non-supporter">Non-Supporters</option>
                                <option value="uservoice">Uservoice</option>
                            </select>
                        </dd>
                    ) : user.is_moderator ? (
                        <dd>
                            <select
                                value={announcementType}
                                onChange={(e) => {
                                    setAnnouncementType(e.target.value);
                                    setSelectedTemplate("");
                                }}
                            >
                                <option value="system">System</option>
                                <option value="stream">Stream</option>
                                <option value="event">Event</option>
                                <option value="advertisement">Advertisement</option>
                            </select>
                        </dd>
                    ) : (
                        <dd>
                            <select
                                value={announcementType}
                                onChange={(e) => {
                                    setAnnouncementType(e.target.value);
                                    setSelectedTemplate("");
                                }}
                            >
                                <option value="stream">Stream</option>
                                <option value="event">Event</option>
                            </select>
                        </dd>
                    )}

                    {announcementType === "system" && user.is_moderator && (
                        <>
                            <dt>{_("Template")}</dt>
                            <dd>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                >
                                    <option value="">-- Select Template --</option>
                                    {SYSTEM_TEMPLATES.map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </dd>
                        </>
                    )}

                    <dt>{_("Duration")}</dt>
                    <dd>
                        <div className="duration">
                            <input
                                type="range"
                                min={0}
                                max={duration_options.length - 1}
                                value={duration_idx}
                                onChange={(e) => {
                                    setDurationIdx(parseInt(e.target.value));
                                }}
                            />
                            <span className="text">
                                {duration_options[duration_idx] > SECONDS_PER_HOUR &&
                                duration_options[duration_idx] % SECONDS_PER_HOUR === HALF_HOUR
                                    ? interpolate(_("%s hours"), [
                                          (
                                              duration_options[duration_idx] / SECONDS_PER_HOUR
                                          ).toFixed(1),
                                      ])
                                    : duration_options[duration_idx] >= SECONDS_PER_DAY
                                      ? interpolate(_("%s days"), [
                                            Math.round(
                                                duration_options[duration_idx] / SECONDS_PER_DAY,
                                            ),
                                        ])
                                      : moment
                                            .duration(duration_options[duration_idx], "seconds")
                                            .humanize(false, { h: 24, m: 59, s: 59 })}
                            </span>
                        </div>
                        {announcementType === "event" &&
                            duration_options[duration_idx] > SECONDS_PER_DAY * 7 && (
                                <div
                                    style={{ fontSize: "0.9em", marginTop: "0.5em", color: "#666" }}
                                >
                                    {_("Event announcements can be up to 14 days")}
                                </div>
                            )}
                    </dd>

                    <dt>{_("Content")}</dt>
                    <dd>
                        <div className="links-container-v2">
                            <div className="links-list-v2">
                                {entries.map((entry, index) => {
                                    // Get all languages that have translations for this entry (including empty ones)
                                    const translatedLanguages = Object.keys(entry).filter(
                                        (key) => key !== "link",
                                    );

                                    return (
                                        <div key={index} className="link-item-v3">
                                            {/* Translations list without indent */}
                                            <div className="link-translations">
                                                {translatedLanguages.map((lang) => (
                                                    <div key={lang} className="translation-row">
                                                        <select
                                                            className="language-selector"
                                                            value={lang}
                                                            onChange={(e) => {
                                                                const newLang = e.target.value;
                                                                if (newLang !== lang) {
                                                                    updateTranslationLanguage(
                                                                        index,
                                                                        lang,
                                                                        newLang,
                                                                    );
                                                                }
                                                            }}
                                                            title={_("Display language")}
                                                        >
                                                            {[
                                                                "en",
                                                                ...Object.keys(languages).filter(
                                                                    (l) =>
                                                                        l !== "en" &&
                                                                        l !== "debug" &&
                                                                        l !== "auto",
                                                                ),
                                                            ].map((l) => (
                                                                <option
                                                                    key={l}
                                                                    value={l}
                                                                    disabled={
                                                                        l !== lang && !!entry[l]
                                                                    }
                                                                >
                                                                    {l.toUpperCase()} -{" "}
                                                                    {languages[l] || l}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <input
                                                            type="text"
                                                            value={entry[lang] || ""}
                                                            onChange={(e) =>
                                                                updateEntry(
                                                                    index,
                                                                    lang,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder={_("Text")}
                                                            className="link-text-input-v3"
                                                        />

                                                        <button
                                                            className="reject xs"
                                                            onClick={() =>
                                                                removeTranslation(index, lang)
                                                            }
                                                            title={
                                                                translatedLanguages.length === 1
                                                                    ? _(
                                                                          "Cannot remove last translation",
                                                                      )
                                                                    : _("Remove translation")
                                                            }
                                                            aria-label={
                                                                translatedLanguages.length === 1
                                                                    ? _(
                                                                          "Cannot remove last translation",
                                                                      )
                                                                    : _("Remove translation")
                                                            }
                                                            disabled={
                                                                translatedLanguages.length === 1
                                                            }
                                                        >
                                                            <i
                                                                className="fa fa-trash-o"
                                                                aria-hidden="true"
                                                            />
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* URL field below the first text field */}
                                                <div className="link-url-row">
                                                    <input
                                                        type="text"
                                                        value={entry.link || ""}
                                                        onChange={(e) =>
                                                            updateEntry(
                                                                index,
                                                                "link",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={_(
                                                            "URL or path (optional) - e.g., /game/123 or https://...",
                                                        )}
                                                        className="link-url-input-v3"
                                                    />
                                                    <button
                                                        className="reject xs"
                                                        onClick={() => removeEntry(index)}
                                                        title={_("Remove link")}
                                                        aria-label={_("Remove link")}
                                                    >
                                                        <i
                                                            className="fa fa-trash-o"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                </div>

                                                <div className="translation-actions">
                                                    <button
                                                        className="xs"
                                                        onClick={() => addTranslation(index)}
                                                        title={_("Add translation")}
                                                    >
                                                        <i className="fa fa-plus" />{" "}
                                                        {_("Add translation")}
                                                    </button>

                                                    <LoadingButton
                                                        className="primary xs"
                                                        onClick={() => translateEntry(index)}
                                                        title={_("Auto-translate to all languages")}
                                                        loading={translatingEntries.has(index)}
                                                        disabled={translatingEntries.has(index)}
                                                        icon={<i className="fa fa-language" />}
                                                    >
                                                        {_("Translate")}
                                                    </LoadingButton>

                                                    <button
                                                        className="xs"
                                                        onClick={() => clearTranslations(index)}
                                                        title={_(
                                                            "Clear all translations except the first",
                                                        )}
                                                    >
                                                        <i className="fa fa-eraser" /> {_("Clear")}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="link-actions-v2">
                                <button className="primary sm" onClick={addEntry}>
                                    <i className="fa fa-plus" /> {_("Add Content")}
                                </button>
                            </div>
                        </div>
                    </dd>

                    <dt></dt>
                    <dd>
                        <div style={{ display: "flex", gap: "1em" }}>
                            <button className="primary" disabled={!can_create} onClick={create}>
                                {editingId ? _("Update announcement") : _("Create announcement")}
                            </button>
                            {editingId && (
                                <button className="reject" onClick={cancelEdit}>
                                    {_("Cancel")}
                                </button>
                            )}
                        </div>
                        <div className="note">
                            {llm_pgettext(
                                "Note to announcers",
                                "One announcement per event or stream, please use multiple content lines for multiple links, and use the edit feature to update them as needed.",
                            )}
                        </div>
                    </dd>
                </dl>

                {hasInvalidEntries && !user.is_moderator && (
                    <div style={{ color: "red", marginTop: "1em" }}>
                        {_("Please ensure all entries have valid URLs")}
                    </div>
                )}

                <div className="announcements-grid">
                    {announcements.map((announcement) => {
                        // Determine announcement type color scheme
                        const typeColorClass =
                            announcement.type === "system"
                                ? "type-system"
                                : announcement.type === "event"
                                  ? "type-event"
                                  : announcement.type === "stream"
                                    ? "type-stream"
                                    : "type-default";

                        // Check if user can edit this announcement
                        const canEdit =
                            user.is_moderator ||
                            (user.is_announcer && user.id === announcement.creator.id);

                        // Gather all unique languages from entries
                        const entryLanguages = new Set<string>();
                        if (announcement.entries) {
                            announcement.entries.forEach((entry: AnnouncementEntry) => {
                                Object.keys(entry).forEach((key) => {
                                    if (key !== "link" && entry[key]) {
                                        entryLanguages.add(key);
                                    }
                                });
                            });
                        }

                        return (
                            <div
                                className={`announcement-card ${typeColorClass}`}
                                key={announcement.id}
                            >
                                {/* Header Section */}
                                <div className="card-header">
                                    <div className="header-left">
                                        <div className="type-indicator">
                                            <i
                                                className={
                                                    announcement.type === "system"
                                                        ? "fa fa-cog"
                                                        : announcement.type === "event"
                                                          ? "fa fa-calendar"
                                                          : announcement.type === "stream"
                                                            ? "fa fa-video-camera"
                                                            : "fa fa-bullhorn"
                                                }
                                            />
                                            <span className="type-label">
                                                {announcement.type === "system"
                                                    ? pgettext("Announcement type", "System")
                                                    : announcement.type === "event"
                                                      ? pgettext("Announcement type", "Event")
                                                      : announcement.type === "stream"
                                                        ? pgettext(
                                                              "Announcement type (video stream)",
                                                              "Stream",
                                                          )
                                                        : announcement.type}
                                            </span>
                                        </div>
                                        {entryLanguages.size > 0 && (
                                            <div className="languages-indicator">
                                                <i className="fa fa-globe" />
                                                <div className="language-tags">
                                                    {Array.from(entryLanguages).map((lang) => (
                                                        <span key={lang} className="language-tag">
                                                            {languages[lang] || lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="header-right">
                                        {canEdit && (
                                            <div className="action-buttons">
                                                <button
                                                    className="xs"
                                                    onClick={() => editAnnouncement(announcement)}
                                                    title={_("Edit announcement")}
                                                >
                                                    <i className="fa fa-pencil" />
                                                    <span className="btn-text">{_("Edit")}</span>
                                                </button>
                                                <button
                                                    className="reject xs"
                                                    onClick={() => deleteAnnouncement(announcement)}
                                                    title={_("Delete announcement")}
                                                >
                                                    <i className="fa fa-trash-o" />
                                                    <span className="btn-text">{_("Delete")}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="card-content">
                                    <div className="announcement-message">
                                        {announcement.text}
                                        {announcement.language &&
                                            announcement.language !== "en" && (
                                                <span className="primary-language-badge">
                                                    {languages[announcement.language] ||
                                                        announcement.language}
                                                </span>
                                            )}
                                    </div>

                                    {/* Multi-entry links section */}
                                    {announcement.entries && announcement.entries.length > 0 && (
                                        <div className="entries-section">
                                            <div className="entries-grid">
                                                {announcement.entries.map(
                                                    (entry: AnnouncementEntry, idx: number) => {
                                                        // Get all translations for this entry
                                                        const translations = Object.keys(entry)
                                                            .filter(
                                                                (key) =>
                                                                    key !== "link" && entry[key],
                                                            )
                                                            .map((key) => ({
                                                                lang: key,
                                                                text: entry[key],
                                                            }));

                                                        return (
                                                            <div key={idx} className="entry-item">
                                                                <a
                                                                    href={entry.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="entry-link"
                                                                >
                                                                    <i className="fa fa-external-link" />
                                                                    <div className="entry-content">
                                                                        <span className="entry-primary-text">
                                                                            {entry.en || entry.link}
                                                                        </span>
                                                                        {translations.length >
                                                                            1 && (
                                                                            <div className="entry-translations">
                                                                                {translations
                                                                                    .filter(
                                                                                        (t) =>
                                                                                            t.lang !==
                                                                                            "en",
                                                                                    )
                                                                                    .map((t) => (
                                                                                        <span
                                                                                            key={
                                                                                                t.lang
                                                                                            }
                                                                                            className="translation-item"
                                                                                        >
                                                                                            <span className="lang-code">
                                                                                                {
                                                                                                    t.lang
                                                                                                }
                                                                                                :
                                                                                            </span>{" "}
                                                                                            {t.text}
                                                                                        </span>
                                                                                    ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </a>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Legacy single link */}
                                    {!announcement.entries && announcement.link && (
                                        <div className="legacy-link">
                                            <a
                                                href={announcement.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="single-link"
                                            >
                                                <i className="fa fa-external-link" />
                                                {announcement.link}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Section */}
                                <div className="card-footer">
                                    <div className="creator-info">
                                        <Player user={announcement.creator} />
                                    </div>
                                    <div className="meta-info">
                                        <div className="expiration-info">
                                            <i className="fa fa-clock-o" />
                                            <span>
                                                {_("Expires")}{" "}
                                                {moment(announcement.expiration).fromNow()}
                                            </span>
                                        </div>
                                        {announcement.edit_count > 0 && (
                                            <div className="edit-info">
                                                <i className="fa fa-history" />
                                                <span>
                                                    {announcement.edit_count}{" "}
                                                    {announcement.edit_count === 1
                                                        ? _("edit")
                                                        : _("edits")}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card>
                <h3>{_("Announcement History")}</h3>

                <PaginatedTable
                    className="announcement-history"
                    source={`announcements/history`}
                    orderBy={["-timestamp"]}
                    columns={[
                        {
                            header: "Time",
                            className: "",
                            render: (a) => moment(a.timestamp).format("YYYY-MM-DD LTS"),
                        },
                        {
                            header: "Duration",
                            className: "",
                            render: (a) => {
                                const ms = moment(a.expiration).diff(moment(a.timestamp));
                                const d = moment.duration(ms);
                                return Math.floor(d.asHours()) + moment.utc(ms).format(":mm");
                            },
                        },
                        {
                            header: "Type",
                            className: "announcement-type ",
                            render: (a) => {
                                switch (a.type) {
                                    case "system":
                                        return pgettext("Announcement type", "System");
                                    case "event":
                                        return pgettext("Announcement type", "Event");
                                    case "stream":
                                        return pgettext(
                                            "Announcement type (video stream)",
                                            "Stream",
                                        );
                                }
                                return a.type;
                            },
                        },
                        {
                            header: "Player",
                            className: "",
                            render: (a) => <Player user={a.creator} />,
                        },
                        { header: "Message", className: "", render: (a) => a.text },
                        {
                            header: "Links",
                            className: "",
                            render: (a) => {
                                if (a.entries && a.entries.length > 0) {
                                    return (
                                        <div>
                                            {a.entries.map(
                                                (entry: AnnouncementEntry, idx: number) => (
                                                    <div key={idx}>
                                                        <a href={entry.link} target="_blank">
                                                            {entry.en || entry.link}
                                                        </a>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    );
                                }
                                if (a.link) {
                                    return <a href={a.link}>{a.link}</a>;
                                }
                                return null;
                            },
                        },
                    ]}
                />
            </Card>
        </div>
    );
}
