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
import { PlayerCacheEntry } from "player_cache";
import { Player } from "Player";
import { getPrivateChat } from "PrivateChat";
import { alert } from "swal_config";
import { post, put } from "requests";
import { errorAlerter } from "misc";

interface TemplateEntry {
    message: string;
    show_warning_button: boolean;
}

interface MessageTemplates {
    [category: string]: { [title: string]: TemplateEntry };
}

export const WARNING_TEMPLATES: MessageTemplates = {
    "AI Use": {
        "AI use detected": {
            message: `Our systems have detected that you may be using AI assistance in your games.

Using such methods is considered cheating and is prohibited.

We ask that you resign from any ongoing games in which AI was used and refrain from seeking AI assistance in future games.

Any further use of AI will result in a ban.
`,
            show_warning_button: true,
        },
    },

    "Chat Abuse": {
        "Objectionable chat": {
            message: `Our team has observed that some of your recent comments have been harmful, threatening, abusive, defamatory, offensive, vulgar, obscene, libelous, hateful, or otherwise objectionable.

Such behavior is prohibited and violates our terms of service.

    https://online-go.com/docs/terms-of-service

We urge you to refrain from such actions in the future as they will not be tolerated.

Failure to comply with this warning will result in a ban.

Please maintain a respectful and courteous environment for all users.`,
            show_warning_button: true,
        },
    },

    Escaping: {
        "Escaped scoring phase, first time": {
            message: `It appears that you did not accept the score at the end of game #XXXXXXXX and allowed it to time out.

Players are required to end their games properly, because letting them timeout can make the opponent wait and prevent them from moving on to the next game.

Please ensure that you end your games properly by accepting the correct score immediately after passing.`,
            show_warning_button: true,
        },
        "Escaped scoring phase, second time": {
            message: `It appears that you did not accept the score at the end of game #XXXXXXXX and allowed it to time out, inconveniencing your opponent.

Our records show that you have been warned about this before, but it seems you have not managed to address it.  If you fail to address this problem, it will result a ban.

Please be mindful of others’ experiences and end games properly.`,
            show_warning_button: true,
        },
    },

    "Endgame Stalling": {
        "Endgame stalling, regular": {
            message: `It has come to our attention that you stalled at the end of game #XXXXXXXX.

This practice can be frustrating for your opponent and can prevent them from moving on to the next game.

We ask that you end your games properly by accepting the correct score immediately after passing.

Repeated failure to do so may result in a ban.`,
            show_warning_button: true,
        },
        "Endgame stalling, beginner": {
            message: `It appears that you delayed the end of game #XXXXXXXX, which can frustrate your opponent and prevent them from moving on to the next game.

Since you are a new player, no action will be taken against your account. We simply ask that you learn when to end a game.

Until you develop the experience to judge better, if your opponent passes and there are no open borders between your stones then you should also pass.

After passing, promptly accept the correct score.

Repeated failure to do so could lead to a ban.`,
            show_warning_button: true,
        },
    },

    Sandbagging: {
        "Losing intentionally": {
            message: `Our team has noticed that you have been resigning or abandoning ranked games even when you are winning.

This conduct is known as “sandbagging” and is prohibited.

The ranking system aims to reflect players’ skills. Manipulating it by sandbagging is fraud that undermines its credibility, frustrates other players, and can result in a ban.

We strongly advise you to refrain from sandbagging in your games.`,
            show_warning_button: true,
        },
    },

    "Timer Abuse": {
        "Abused ultra-blitz time settings": {
            message: `It appears that you have been abusing ultra-blitz time settings and deliberately stalling at the end of games to win unfairly. 

This conduct goes against the principles of fair play and can ruin the enjoyment of playing Go for others.

We ask that you avoid using such tactics in the future and focus on playing to the best of your abilities within the site rules.`,
            show_warning_button: true,
        },
    },
    Harrasment: {
        "Undo-harrasment": {
            message: `
This is a note to let you know that no player is obliged to accept an undo request, ever.

At OGS you are allowed to ask for an undo by pressing the undo button. If the person accepts that's great.  If they do not accept, that is the end of it.

Chasing people in chat about undos is viewed as harrasment, and harrasment is not allowed at OGS.

https://online-go.com/docs/terms-of-service
`,
            show_warning_button: true,
        },
    },
};

export const REPORTER_RESPONSE_TEMPLATES: MessageTemplates = {
    "Good Report": {
        "Warning given": {
            message: "Thank you for your report, the player has been given a warning.",
            show_warning_button: false,
        },
        "Reported player banned": {
            message: "Thank you for your report, the player has been banned.",
            show_warning_button: false,
        },
    },
    "Bad Report": {
        "No violation": {
            message:
                "Thank you for your report. We looked into it and found no behavior that violates our terms of service or community guidelines. But we’ll still keep an eye on the situation and take appropriate action if necessary. Thank you for helping keep OGS enjoyable for everyone. We appreciate it.",
            show_warning_button: false,
        },
        "No sandbagging": {
            message:
                "Thank you for bringing the possible instance of sandbagging to our attention. We looked into the report and found little evidence of deliberate underperformance. But we’ll still keep an eye on the situation and take appropriate action if necessary. Thank you for helping keep OGS enjoyable for everyone. We appreciate it.",
            show_warning_button: false,
        },
    },
    Chastise: {
        "Verbal abuse": {
            message:
                "Thanks for bringing the misbehavior to our attention. We also noticed that you were verbally harassing your opponent while this was going on. This kind of behavior is not acceptable either and will not be tolerated. We appreciate your help in keeping the game fair, but please refrain from using any kind of abusive language or behavior towards other players.",
            show_warning_button: true,
        },
    },
};

export function MessageTemplate({
    title,
    player,
    templates,
}: {
    title: string;
    player: PlayerCacheEntry;
    templates: MessageTemplates;
}): JSX.Element {
    const [selectedTemplate, setSelectedTemplate] = React.useState<string>("");
    const [template, setTemplate] = React.useState<TemplateEntry | null>(null);
    const [text, setText] = React.useState<string>("");

    React.useEffect(() => {
        if (selectedTemplate) {
            const arr = selectedTemplate.split("::");
            setTemplate(templates[arr[0]][arr[1]]);
            setText(templates[arr[0]][arr[1]].message);
        } else {
            setTemplate(null);
        }
    }, [selectedTemplate]);

    const clear = () => {
        setText("");
        setTemplate(null);
        setSelectedTemplate("");
    };

    const sendWarning = () => {
        post("moderation/warn", { user_id: player.id, text })
            .then(() => {
                void alert.fire("Warning sent");
            })
            .catch(errorAlerter);
        clear();
    };
    const sendSystemPM = () => {
        const pc = getPrivateChat(player.id, player.username);
        void alert.fire("Sent system PM to " + player.username);
        pc.sendChat(text, true);
        void put(`players/${player.id}/moderate`, {
            moderation_note: "Sent system PM: " + text,
        });

        clear();
    };
    const sendPM = () => {
        const pc = getPrivateChat(player.id, player.username);
        pc.open();
        pc.sendChat(text);
        void put(`players/${player.id}/moderate`, {
            moderation_note: "Sent private message: " + text,
        });
        clear();
    };

    return (
        <div className="MessageTemplate">
            <h3>
                {title}: <Player user={player} />
                <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                    <option value="">-- Select template --</option>
                    {Object.keys(templates).map((category) => (
                        <optgroup label={category} key={category}>
                            {Object.keys(templates[category]).map((title) => (
                                <option value={category + "::" + title} key={title}>
                                    {title}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </h3>

            <textarea value={text} onChange={(e) => setText(e.target.value)} />

            <div className="buttons">
                <button
                    onClick={sendWarning}
                    disabled={!text || (template && !template.show_warning_button)}
                >
                    Send Warning
                </button>
                <button onClick={sendSystemPM} disabled={!text}>
                    System PM
                </button>
                <button onClick={sendPM} disabled={!text}>
                    Personal PM
                </button>
            </div>
        </div>
    );
}
