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

export interface KibitzDiscussionRoom {
    id: string;
    title: string;
}

/** The well-formed rooms of a kibitzGameDiscussed notification. The server
 *  lists only rooms that still exist when it sends the notification. */
export function kibitzDiscussionRooms(rooms: unknown): KibitzDiscussionRoom[] {
    if (!Array.isArray(rooms)) {
        return [];
    }
    return rooms.filter(
        (room): room is KibitzDiscussionRoom =>
            typeof room?.id === "string" &&
            /^[A-Za-z0-9_-]+$/.test(room.id) &&
            typeof room.title === "string" &&
            room.title.length > 0,
    );
}
