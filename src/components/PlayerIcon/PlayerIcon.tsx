/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import * as player_cache from "player_cache";
import { errorLogger } from "misc";

interface PlayerIconProps {
    id?: number;
    user?: any;
    size: number | string;
    className?: string;
}

export function icon_size_url(url: string, size: number): string {
    return url.replace(/-[0-9]+.png$/, `-${size}.png`).replace(/s=[0-9]+/, `s=${size}`);
}

export async function getPlayerIconURL(id: number, size: number): Promise<string> {
    return player_cache.fetch(id, ["icon"]).then((user) => icon_size_url(user.icon, size));
}

export function PlayerIcon(props: PlayerIconProps): JSX.Element {
    const [url, setUrl] = React.useState<string | null>(null);

    const subscriber = React.useRef<player_cache.Subscriber>();

    React.useEffect(() => {
        const id = getId(props);
        if (!id) {
            setUrl(null);
            return;
        }

        const user = player_cache.lookup(id);
        const size = typeof props.size === "number" ? props.size : parseInt(props.size);
        const new_url = user && user.icon ? icon_size_url(user.icon, size) : null;
        setUrl(new_url);

        if (!url) {
            fetchIconUrl(id, props);
        }

        subscriber.current = new player_cache.Subscriber((user) => fetchIconUrl(user.id, props));
        subscriber.current.on(id);

        let cancelled = false;

        return () => {
            cancelled = true;
            subscriber.current.off(subscriber.current.players());
            delete subscriber.current;
        };

        function fetchIconUrl(id: number, props: PlayerIconProps): void {
            getPlayerIconURL(id, parseInt(`${props.size}`))
                .then((url) => {
                    if (!cancelled) {
                        setUrl(url);
                    }
                })
                .catch(errorLogger);
        }
    }, [props.id, props.size]);

    if (url) {
        return (
            <img
                className={`PlayerIcon PlayerIcon-${props.size} ${props.className || ""}`}
                src={url}
            />
        );
    }

    return <span className={`PlayerIcon PlayerIcon-${props.size} ${props.className || ""}`} />;
}

function getId(props: PlayerIconProps): number {
    let ret = parseInt(props.id || (props.user && (props.user.id || props.user.user_id)));
    if (isNaN(ret)) {
        ret = null;
    }
    return ret;
}
