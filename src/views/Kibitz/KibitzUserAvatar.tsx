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
import { PlayerIcon } from "@/components/PlayerIcon";
import type { KibitzRoomUser } from "@/models/kibitz";

interface KibitzUserAvatarProps {
    user?: KibitzRoomUser | null;
    size: number;
    className: string;
    iconClassName?: string;
}

export function KibitzUserAvatar({
    user,
    size,
    className,
    iconClassName,
}: KibitzUserAvatarProps): React.ReactElement {
    const username = user?.username ?? "";

    return (
        <span className={className} title={username} aria-hidden="true">
            <PlayerIcon user={user ?? undefined} size={size} className={iconClassName} />
        </span>
    );
}
