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

import * as React from "react";
import * as data from "data";
import { useEffect } from "react";
import { Flag } from "Flag";
import { browserHistory } from "ogsHistory";
import { shouldOpenNewTab, slugify } from 'misc';
import { ChatChannelProxy, global_channels, group_channels, tournament_channels } from 'chat_manager';

data.setDefault("chat.joined", {});

let proxies:{[channel:string]: ChatChannelProxy} = {};

function getProxy(channel):ChatChannelProxy | undefined {
    if (!(channel in proxies)) {
        //throw new Error(`Invalid channel: ${channel}`);
        return undefined;
    }
    return proxies[channel];
}


let set_channel_callbacks:{[id:string]: () => void} = {};

function setChannelCb(channel: string, name?: string): () => void {
    if (!(channel in set_channel_callbacks)) {
        set_channel_callbacks[channel] = () => {
            if (name) {
                browserHistory.push(`/chat/${channel}/${slugify(name)}`);
            } else {
                browserHistory.push(`/chat/${channel}`);
            }
        };
    }

    return set_channel_callbacks[channel];
}

interface ChatChannelListProperties {
    channel: string;
}

interface ChatChannelListState {
    joined_channels: Array<string>;
    active_channel: string;
    show_all_global_channels: boolean;
    show_all_group_channels: boolean;
    show_all_tournament_channels: boolean;
}

export function ChatChannelList({channel}:ChatChannelListProperties):JSX.Element {
    let joined_channels = data.get("chat.joined");
    //let [, refresh]:[number, (n:number) => void] = useState(0);

    useEffect(() => {
        for (let channel in joined_channels) {
            join(channel);
        }

        if (!(channel in joined_channels)) {
            join(channel);
        }

        return () => {
            console.log("Destructing channels");
            //channels[key].part();
        };
    }, []);


    function join(channel: string): void {
        //console.log("Should be joining", channel);
    }


    function chan_class(channel: string): string {
        return (channel in joined_channels ? " joined" : " unjoined") +
            (getProxy(channel)?.channel.unread_ct > 0 ? " unread" : "") +
            (getProxy(channel)?.channel.mentioned ? " mentioned" : "");
    }


    function user_count(channel: string):JSX.Element {
        let c = getProxy(channel)?.channel;
        if (!c) {
            return null;
        }
        if (c.unread_ct) {
            return <span className="unread-count" data-count={"(" + c.unread_ct + ")"} />;
        } else if (channel in joined_channels) {
            return <span className="unread-count" data-count="" />;
        }
        return null;
    }

    function setChannel(channel: string):void {
        console.log("Should be setting channel", channel);
    }

    let user = data.get('user');
    let user_country = user?.country || 'un';

    return (
        <div className='ChatChannelList'>
            {group_channels.map((chan) => (
                <div key={`group-${chan.id}`} onClick={setChannelCb(`group-${chan.id}`, chan.name)}
                    className={
                        (channel === `group-${chan.id}` ? "channel active" : "channel")
                        + chan_class("group-" + chan.id)
                    }
                >
                    <span className="channel-name">
                        <img className="icon" src={chan.icon}/> {chan.name}
                    </span>
                    {user_count("group-" + chan.id)}
                </div>
            ))}

            {tournament_channels.map((chan) => (
                <div key={`tournament-${chan.id}`} onClick={setChannelCb(`tournament-${chan.id}`, chan.name)}
                    className={
                        (channel === `tournament-${chan.id}` ? "channel active" : "channel")
                        + chan_class("tournament-" + chan.id)
                    }
                >
                    <span className="channel-name">
                        <i className="fa fa-trophy" /> {chan.name}
                    </span>
                    {user_count("tournament-" + chan.id)}
                </div>
            ))}

            {global_channels.map((chan) => (
                <div key={chan.id} onClick={setChannelCb(chan.id, chan.name)}
                    className={
                        (channel === chan.id ? "channel active" : "channel")
                        + chan_class(chan.id)
                    }
                >
                    <span className="channel-name">
                        <Flag country={chan.country} language={chan.language} user_country={user_country} /> {chan.name}
                    </span>
                    {user_count(chan.id)}
                </div>
            ))}
        </div>
    );
}
