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
import { _ } from "translate";
import { put, post } from "requests";
import { errorAlerter } from "misc";
import swal from "sweetalert2";

interface BotControlsProperties {
    bot_id: number;
    bot_apikey: string;
    bot_ai: string;
    onBotApiKeyChanged: (bot_apikey: string) => void;
    onBotAiChanged: (bot_ai: string) => void;
}

export function BotControls({
    bot_id,
    bot_apikey,
    bot_ai,
    onBotApiKeyChanged,
    onBotAiChanged,
}: BotControlsProperties) {
    const generateAPIKey = () => {
        if (
            !confirm(
                "Generating a new key will immediate invalidate the previous key, are you sure you wish to continue?",
            )
        ) {
            return;
        }
        post("ui/bot/generateAPIKey", { bot_id })
            .then((res: any) => onBotApiKeyChanged(res.bot_apikey))
            .catch(errorAlerter);
    };

    const saveBot = () => {
        put("ui/bot/saveBotInfo", { bot_id: bot_id, bot_ai: bot_ai })
            .then(() => {
                swal("Bot Engine updated").catch(swal.noop);
            })
            .catch(errorAlerter);
    };

    return (
        <div>
            <h2>{_("Bot Controls")}</h2>
            <div className="well">
                <h5>
                    {_("API Key")}
                    <button className="btn btn-xs btn-default" onClick={generateAPIKey}>
                        {_("Generate API Key")}
                    </button>
                </h5>
                <input type="text" className="form-control" value={bot_apikey} readOnly />
                <h5>{_("Bot Engine")}</h5>
                <input
                    type="text"
                    className="form-control"
                    placeholder={_("Engine Name")}
                    value={bot_ai || ""}
                    onChange={(event) => onBotAiChanged(event.target.value)}
                />
                <div style={{ textAlign: "right" }}>
                    <button className="btn btn-xs btn-default" onClick={saveBot}>
                        {_("Save")}
                    </button>
                </div>
            </div>
        </div>
    );
}
