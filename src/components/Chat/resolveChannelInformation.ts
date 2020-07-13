/*
 * Copyright (C) 2012-2020  Online-Go.com
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

import { get } from "requests";
import { errorLogger } from 'misc';

export interface ChannelInformation {
    group_id?: number;
    tournament_id?: number;
    name: string;
    icon?: string;
    banner?: string;
    short_description?: string;
    description?: string;
}


let cache:{[channel: string]: ChannelInformation} = {};
let resolvers:{[channel: string]: Promise<ChannelInformation>} = {};

export function cachedChannelInformation(channel:string):ChannelInformation | null {
    if (channel in cache) {
        return cache[channel];
    }
    return null;
}

export function updateCachedChannelInformation(channel: string, info:ChannelInformation):void {
    cache[channel] = info;
}

export function resolveChannelInformation(channel:string):Promise<ChannelInformation> {
    if (channel in cache) {
        return Promise.resolve(cache[channel]);
    }

    if (channel in resolvers) {
        return resolvers[channel];
    }


    let resolver:Promise<ChannelInformation>;

    let ret:ChannelInformation = {
        name: channel
    };

    {
        let m = channel.match(/^group-([0-9]+)$/);
        if (m) {
            ret.group_id = parseInt(m[1]);
        }
    }

    {
        let m = channel.match(/^tournament-([0-9]+)$/);
        if (m) {
            ret.tournament_id = parseInt(m[1]);
        }
    }

    if (ret.group_id) {
        resolver = new Promise<ChannelInformation>((resolve, reject) => {
            get(`/termination-api/group/${ret.group_id}`)
            .then((res:any):ChannelInformation => {
                ret.name = res.name;
                ret.icon = res.icon;
                ret.banner = res.banner;
                ret.short_description = res.short_description;
                ret.description = res.description;
                updateCachedChannelInformation(channel, ret);
                delete resolvers[channel];
                resolve(ret);
                return ret;
            })
            .catch(reject);
        });
    } else if (ret.tournament_id) {
        updateCachedChannelInformation(channel, ret);
        resolver = Promise.resolve(ret);
    } else {
        updateCachedChannelInformation(channel, ret);
        resolver = Promise.resolve(ret);
    }


    return resolvers[channel] = resolver;
}
