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
import { pgettext, interpolate } from "translate";
import { socket } from "sockets";
import { TypedEventEmitter } from "TypedEventEmitter";
import { browserHistory } from "ogsHistory";
import { Toast, toast } from "toast";
import { AutomatchPreferencesBase, Size, Speed } from "./types";

interface Events {
    start: any;
    entry: any;
    cancel: any;
}

export type AutomatchPreferences = AutomatchPreferencesBase & {
    uuid: string;
    size_speed_options: Array<{ size: Size; speed: Speed }>;
};

class AutomatchToast extends React.PureComponent<{}, any> {
    timer: any;

    constructor(props: {}) {
        super(props);
        this.state = {
            start: Date.now(),
            elapsed: "00:00",
        };
    }

    componentDidMount() {
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.state.start) / 1000);
            const seconds = elapsed % 60;
            const minutes = Math.floor((elapsed - seconds) / 60);
            const display = seconds < 10 ? `${minutes}:0${seconds}` : `${minutes}:${seconds}`;
            this.setState({ elapsed: display });
        }, 1000);
    }
    componentWillUnmount() {
        clearInterval(this.timer);
    }

    render() {
        return (
            <div className="AutomatchToast">
                {interpolate(
                    pgettext("Automatch search message", "{{elapsed_time}} Finding a game..."),
                    {
                        elapsed_time: this.state.elapsed,
                    },
                )}
            </div>
        );
    }
}

class AutomatchManager extends TypedEventEmitter<Events> {
    active_live_automatcher?: AutomatchPreferences;
    active_correspondence_automatchers: { [id: string]: AutomatchPreferences } = {};
    last_find_match_uuid?: string;
    active_toast?: Toast;

    constructor() {
        super();
        socket.on("connect", () => {
            this.clearState();
            socket.send("automatch/list", {});
        });
        socket.on("disconnect", () => {
            this.clearState();
        });
        socket.on("automatch/start", this.onAutomatchStart);
        socket.on("automatch/entry", this.onAutomatchEntry);
        socket.on("automatch/cancel", this.onAutomatchCancel);
    }

    private onAutomatchEntry = (entry: AutomatchPreferences) => {
        if (!entry.timestamp) {
            entry.timestamp = Date.now();
        }

        for (const opt of entry.size_speed_options) {
            if (opt.speed === "correspondence") {
                this.active_correspondence_automatchers[entry.uuid] = entry;
            } else {
                this.active_live_automatcher = entry;
            }
        }

        this.emit("entry", entry);
    };
    private onAutomatchStart = (entry: { uuid: string; game_id: number }) => {
        this.remove(entry.uuid);

        if (entry.uuid === this.last_find_match_uuid) {
            browserHistory.push(`/game/view/${entry.game_id}`);
            //sfx.play("match_found");
        }

        this.emit("start", entry);
    };
    private onAutomatchCancel = (entry: { uuid: string }) => {
        if (!entry) {
            if (this.active_live_automatcher) {
                entry = this.active_live_automatcher;
            } else {
                return;
            }
        }
        this.remove(entry.uuid);
        this.emit("cancel", entry);
    };
    private remove(uuid: string) {
        if (this.active_live_automatcher && this.active_live_automatcher.uuid === uuid) {
            this.active_live_automatcher = undefined;
        }

        if (uuid === this.last_find_match_uuid) {
            if (this.active_toast) {
                this.active_toast.close();
                this.active_toast = undefined;
            }
        }

        delete this.active_correspondence_automatchers[uuid];
    }
    private clearState() {
        this.active_live_automatcher = undefined;
        this.active_correspondence_automatchers = {};
        this.last_find_match_uuid = undefined;
        if (this.active_toast) {
            this.active_toast.close();
            this.active_toast = undefined;
        }
    }

    public findMatch(preferences: AutomatchPreferences) {
        socket.send("automatch/find_match", preferences);

        /* live game? track it, and pop up our searching toast */
        if (
            preferences.size_speed_options.filter(
                (opt) => opt.speed === "blitz" || opt.speed === "live",
            ).length
        ) {
            this.last_find_match_uuid = preferences.uuid;
            if (this.active_toast) {
                this.active_toast.close();
                this.active_toast = undefined;
            }
            this.active_toast = toast(<AutomatchToast />);
        }
    }
    public cancel(uuid: string) {
        this.remove(uuid);
        socket.send("automatch/cancel", { uuid });
    }
}

export const automatch_manager = new AutomatchManager();
