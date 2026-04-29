/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import { Player } from "@/components/Player";
import * as player_cache from "@/lib/player_cache";
import { pgettext } from "@/lib/translate";
import type { KibitzRoomSummary, KibitzRoomUser } from "@/models/kibitz";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
import "./KibitzRoomSettingsPopover.css";

type KibitzRoomSettingsPopoverView = "menu" | "edit-details";

interface KibitzRoomSettingsPopoverProps {
    room: KibitzRoomSummary;
    canEditRoom: boolean;
    canChangeBoard: boolean;
    onClose: () => void;
    onRequestChangeBoard: () => void;
    onDeleteRoom: () => Promise<boolean>;
    onSaveRoomDetails: (title: string, description: string) => Promise<boolean>;
}

export function KibitzRoomSettingsPopover({
    room,
    canEditRoom,
    canChangeBoard,
    onClose,
    onDeleteRoom,
    onRequestChangeBoard,
    onSaveRoomDetails,
}: KibitzRoomSettingsPopoverProps): React.ReactElement {
    const [view, setView] = React.useState<KibitzRoomSettingsPopoverView>("menu");
    const [roomTitle, setRoomTitle] = React.useState(room.title);
    const [roomDescription, setRoomDescription] = React.useState(room.description ?? "");
    const [saving, setSaving] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [deleting, setDeleting] = React.useState(false);
    const [owner, setOwner] = React.useState<KibitzRoomUser | null>(null);

    React.useEffect(() => {
        setView("menu");
        setRoomTitle(room.title);
        setRoomDescription(room.description ?? "");
        setSaving(false);
        setDeleting(false);
        setErrorMessage(null);
    }, [room.description, room.title, room.id]);

    React.useEffect(() => {
        let cancelled = false;

        if (canEditRoom || !room.creator_id) {
            setOwner(null);
            return undefined;
        }

        const cachedOwner = player_cache.lookup(room.creator_id);
        if (cachedOwner?.username) {
            setOwner({
                id: cachedOwner.id,
                username: cachedOwner.username,
                ranking: cachedOwner.ranking ?? 0,
                professional: cachedOwner.pro ?? false,
                ui_class: cachedOwner.ui_class ?? "",
                country: cachedOwner.country,
                icon: cachedOwner.icon,
            });
        }

        void player_cache
            .fetch(room.creator_id)
            .then((nextOwner) => {
                if (cancelled) {
                    return;
                }
                setOwner({
                    id: nextOwner.id,
                    username: nextOwner.username ?? "",
                    ranking: nextOwner.ranking ?? 0,
                    professional: nextOwner.pro ?? false,
                    ui_class: nextOwner.ui_class ?? "",
                    country: nextOwner.country,
                    icon: nextOwner.icon,
                });
            })
            .catch(() => {
                if (!cancelled) {
                    setOwner(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [canEditRoom, room.creator_id]);

    const onSave = React.useCallback(async () => {
        if (!canEditRoom || saving) {
            return;
        }

        setSaving(true);
        setErrorMessage(null);
        const saved = await onSaveRoomDetails(roomTitle, roomDescription);
        setSaving(false);

        if (saved) {
            onClose();
            return;
        }

        setErrorMessage(
            pgettext(
                "Error shown when room details fail to save in the Kibitz room settings popover",
                "Could not save room details.",
            ),
        );
    }, [canEditRoom, onClose, onSaveRoomDetails, roomDescription, roomTitle, saving]);

    const onDelete = React.useCallback(async () => {
        if (!canEditRoom || deleting) {
            return;
        }

        const confirmed = window.confirm(
            pgettext(
                "Confirmation for deleting a Kibitz room",
                "Delete this room? This cannot be undone.",
            ),
        );
        if (!confirmed) {
            return;
        }

        setDeleting(true);
        setErrorMessage(null);
        const deleted = await onDeleteRoom();
        setDeleting(false);

        if (deleted) {
            onClose();
            return;
        }

        setErrorMessage(
            pgettext(
                "Error shown when room deletion fails in the Kibitz room settings popover",
                "Could not delete room.",
            ),
        );
    }, [canEditRoom, deleting, onClose, onDeleteRoom]);

    return (
        <div className="KibitzRoomSettingsPopover">
            <div className="KibitzRoomSettingsPopover-title">
                {pgettext("Heading for the Kibitz room settings popover", "Room settings")}
            </div>
            {view === "menu" ? (
                <>
                    {canEditRoom ? (
                        <button
                            type="button"
                            className="KibitzRoomSettingsPopover-action"
                            onClick={() => {
                                setView("edit-details");
                            }}
                        >
                            {pgettext(
                                "Button label for editing Kibitz room details",
                                "Edit room details",
                            )}
                        </button>
                    ) : null}
                    {canChangeBoard ? (
                        <button
                            type="button"
                            className="KibitzRoomSettingsPopover-action"
                            onClick={() => {
                                onClose();
                                onRequestChangeBoard();
                            }}
                        >
                            {pgettext(
                                "Button label for changing the live Kibitz game",
                                "Change live game",
                            )}
                        </button>
                    ) : null}
                    {!canEditRoom && owner ? (
                        <div className="KibitzRoomSettingsPopover-owner">
                            <div className="KibitzRoomSettingsPopover-fieldLabel">
                                {pgettext(
                                    "Label for the room owner entry in the Kibitz settings popover",
                                    "Room owner",
                                )}
                            </div>
                            <div className="KibitzRoomSettingsPopover-ownerRow">
                                <KibitzUserAvatar
                                    user={owner}
                                    size={16}
                                    className="KibitzRoomSettingsPopover-ownerAvatar"
                                    iconClassName="KibitzRoomSettingsPopover-ownerAvatarIcon"
                                />
                                <Player user={owner} flag rank noextracontrols />
                            </div>
                        </div>
                    ) : null}
                    {!canEditRoom && !canChangeBoard ? (
                        <div className="KibitzRoomSettingsPopover-note">
                            {pgettext(
                                "Note shown when the Kibitz room settings popover has no actions available",
                                "You do not have room management access yet.",
                            )}
                        </div>
                    ) : null}
                    <button
                        type="button"
                        className="KibitzRoomSettingsPopover-secondaryAction"
                        onClick={onClose}
                    >
                        {pgettext(
                            "Button label for closing the Kibitz room settings popover",
                            "Close",
                        )}
                    </button>
                </>
            ) : (
                <>
                    <label
                        className="KibitzRoomSettingsPopover-fieldLabel"
                        htmlFor="kibitz-room-title"
                    >
                        {pgettext("Label for the Kibitz room title field", "Room name")}
                    </label>
                    <input
                        id="kibitz-room-title"
                        type="text"
                        value={roomTitle}
                        onChange={(event) => {
                            setRoomTitle(event.target.value);
                        }}
                        disabled={!canEditRoom}
                    />
                    <label
                        className="KibitzRoomSettingsPopover-fieldLabel"
                        htmlFor="kibitz-room-description"
                    >
                        {pgettext("Label for the Kibitz room description field", "Description")}
                    </label>
                    <textarea
                        id="kibitz-room-description"
                        value={roomDescription}
                        onChange={(event) => {
                            setRoomDescription(event.target.value);
                        }}
                        disabled={!canEditRoom}
                        rows={4}
                    />
                    {errorMessage ? (
                        <div className="KibitzRoomSettingsPopover-error">{errorMessage}</div>
                    ) : null}
                    {!canEditRoom ? (
                        <div className="KibitzRoomSettingsPopover-note">
                            {pgettext(
                                "Note shown when Kibitz room details cannot be edited",
                                "Room name and description are read-only for your role.",
                            )}
                        </div>
                    ) : null}
                    <div className="KibitzRoomSettingsPopover-actions">
                        <button
                            type="button"
                            className="KibitzRoomSettingsPopover-secondaryAction"
                            onClick={() => {
                                setView("menu");
                                setRoomTitle(room.title);
                                setRoomDescription(room.description ?? "");
                                setErrorMessage(null);
                            }}
                            disabled={saving}
                        >
                            {pgettext(
                                "Button label for canceling Kibitz room detail edits",
                                "Cancel",
                            )}
                        </button>
                        <button
                            type="button"
                            className="KibitzRoomSettingsPopover-action"
                            onClick={() => {
                                void onSave();
                            }}
                            disabled={!canEditRoom || saving}
                        >
                            {saving
                                ? pgettext(
                                      "Button label shown while saving Kibitz room details",
                                      "Saving...",
                                  )
                                : pgettext("Button label for saving Kibitz room details", "Save")}
                        </button>
                        <button
                            type="button"
                            className="KibitzRoomSettingsPopover-deleteAction"
                            onClick={() => {
                                void onDelete();
                            }}
                            disabled={!canEditRoom || deleting || saving}
                        >
                            {deleting
                                ? pgettext(
                                      "Button label shown while deleting a Kibitz room",
                                      "Deleting...",
                                  )
                                : pgettext("Button label for deleting a Kibitz room", "Delete")}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
