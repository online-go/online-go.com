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

// These are the "templates for messages offered to full moderators"
//  ("canned messages" voted for by CMs are in CannedMessages.ts)

import * as React from "react";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { Player } from "@/components/Player";
import { getPrivateChat } from "@/components/PrivateChat";
import { alert } from "@/lib/swal_config";
import { post, put } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { toast } from "@/lib/toast";
import { useUser } from "@/lib/hooks";

interface TemplateEntry {
    message: string;
    show_warning_button: boolean;
}

interface MessageTemplates {
    [category: string]: { [title: string]: TemplateEntry };
}

export const WARNING_TEMPLATES: MessageTemplates = {
    "New user": {
        "Please resign instead of timing out": {
            message: `
                Hi, welcome to OGS!

                Please consider resigning games rather than letting them time
                out, as this is fairer to your opponents than making them wait for
                your clock to run out. Thank you.`,
            show_warning_button: true,
        },
    },

    Cheating: {
        "AI use detected": {
            message: `
                Our systems have detected that you may be using AI assistance
                in your games.

                Using such methods is considered cheating and is prohibited.

                We ask that you resign from any ongoing games in which AI was
                used and refrain from seeking AI assistance in future games.

                Any further use of AI will result in suspension of your account.`,
            show_warning_button: true,
        },
        "Score cheating": {
            message: `
            It appears that you delayed the end of game game #XXXXXXXX, by clicking
            on the board to change the score incorrectly.   This can frustrate your
            opponent and prevent them from moving on to the next game.

            After passing, please promptly accept the correct score.

            If you are unable to end games properly, your account may be suspended.

            If in doubt about this sort of situation. please ask for help in chat
            or the forums.
            `,
            show_warning_button: true,
        },
        "Score cheating, beginner": {
            message: `
            It appears that you delayed the end of game game #XXXXXXXX, by clicking
            on the board to change the score incorrectly.   This can frustrate your
            opponent and prevent them from moving on to the next game.

            Since you are a new player, no action will be taken against
            your account. We simply ask that you learn when to end a game.

            Until you develop the experience to judge better, if your
            opponent passes and there are no open borders between your
            stones then you should also pass.

            After passing, promptly accept the correct score.

            If in doubt about this sort of situation. please ask for help in chat
            or the forums.`,
            show_warning_button: true,
        },
    },

    "Chat Abuse": {
        "Objectionable chat": {
            message: `
We have noticed that some of your recent comments have not been in line with our community guidelines.

While this may not have been your intention, it is your responsibility to ensure that your comments are \
respectful and courteous to all users. Please review our terms of service and community guidelines:

https://online-go.com/docs/terms-of-service

We expect all users to maintain a positive and friendly environment. If you have any disagreements or concerns, \
please contact a moderator for assistance.

If you are unable to judge what is appropriate behavior, and this type of conduct continues, we will have no \
choice but to remove your chat privileges.

Thank you for your understanding and cooperation.`,
            show_warning_button: true,
        },
    },

    Escaping: {
        "Escaped mid-game, first time": {
            message: `
                It has come to our attention that you abandoned game #XXXXXXXX
                and allowed it to time out rather than resigning.

                Players are required to end their games properly, as letting them
                time out can cause opponents to wait unnecessarily and prevent them
                from moving on to the next game.

                Please ensure that you end your games properly by accepting the
                correct score immediately after passing or by resigning if you feel
                the position is hopeless. This helps maintain a positive gaming
                environment for everyone involved.`,
            show_warning_button: true,
        },
        "Escaped mid-game, second time": {
            message: `
                We have noticed that you abandoned game #XXXXXXXX,
                allowing it to time out instead of properly resigning.

                Our records indicate that you have been previously warned
                about this behavior. Failure to address this issue and continuing
                to abandon games will lead to suspension of your account.

                Please be considerate of your opponents' experiences and
                ensure you end games appropriately. This includes accepting the
                correct score after passing or resigning when you believe the
                position is hopeless.`,
            show_warning_button: true,
        },
        "Escaped scoring phase, first time": {
            message: `
                It appears that you did not accept the score at the end of game
                #XXXXXXXX and allowed it to time out.

                Players are required to end their games properly, because
                letting them timeout can make the opponent wait and prevent
                them from moving on to the next game.

                Please ensure that you end your games properly by accepting the
                correct score immediately after passing.`,
            show_warning_button: true,
        },
        "Escaped scoring phase, second time": {
            message: `
                It appears that you did not accept the score at the end of game
                #XXXXXXXX and allowed it to time out, inconveniencing your
                opponent.

                Our records show that you have been warned about this before,
                but it seems you have not managed to address it.  If you fail
                to address this problem, it will result in suspension of your account.

                Please be mindful of others’ experiences and end games properly.`,
            show_warning_button: true,
        },
        "Escaped without playing": {
            message: `
                Please cancel games you have joined but don't intend to play.

                Use the "cancel" button for this.

                This is fairer to your opponents than making them wait for
                your clock to run out.   There is no penalty to you (providing
                it used only occasionally)`,
            show_warning_button: true,
        },
    },

    "Endgame Stalling": {
        "Endgame stalling, regular": {
            message: `
                It has come to our attention that you stalled at the end of
                game #XXXXXXXX.

                This practice can be frustrating for your opponent and can
                prevent them from moving on to the next game.

                We ask that you end your games properly by accepting the
                correct score immediately after passing.

                Repeated failure to do so may result in suspension of your account.`,
            show_warning_button: true,
        },
        "Endgame stalling, beginner": {
            message: `
                It appears that you delayed the end of game #XXXXXXXX, which
                can frustrate your opponent and prevent them from moving on to
                the next game.

                Since you are a new player, no action will be taken against
                your account. We simply ask that you learn when to end a game.

                Until you develop the experience to judge better, if your
                opponent passes and there are no open borders between your
                stones then you should also pass.

                After passing, promptly accept the correct score.

                If in doubt about this sort of situation. please ask for help in chat
                or the forums.`,
            show_warning_button: true,
        },
    },

    Sandbagging: {
        "Losing intentionally": {
            message: `
                Our team has noticed that you have been resigning or abandoning
                ranked games even when you are winning.

                This conduct is known as “sandbagging” and is prohibited.

                The ranking system aims to reflect players’ skills.
                Manipulating it by sandbagging is fraud that undermines its
                credibility, frustrates other players, and can result in a suspension of your account.

                We strongly advise you to refrain from sandbagging in your games.`,
            show_warning_button: true,
        },
    },

    "Frequent Cancellation": {
        "Frequent cancellation": {
            message: `
                We have observed that you often cancel games. Cancellation is something that
                should happen rarely, it's an inconvenience to the other play.

                To respect other players' time, please only initiate games you plan to play.
                Additionally, remember to deactivate the auto-match finder if you can no longer commit
                to starting a new game. Your understanding and cooperation are appreciated.`,
            show_warning_button: true,
        },
        "Semi-frequent cancellation": {
            message: `
            Hi - this is a note to ask you to take care with the games that you accept, so that you're not
            needing to cancel quite so often.

            The cancel option is there for sparing use, but when you do that it frustrates your opponent,
            so please avoid it if you can.

            Thanks!`,
            show_warning_button: true,
        },
    },

    "Timer Abuse": {
        "Abused ultra-blitz time settings": {
            message: `
                It appears that you have been abusing ultra-blitz time settings
                and deliberately stalling at the end of games to win unfairly.

                This conduct goes against the principles of fair play and can
                ruin the enjoyment of playing Go for others.

                We ask that you avoid using such tactics in the future and
                focus on playing to the best of your abilities within the site
                rules.`,
            show_warning_button: true,
        },
    },
    Harassment: {
        "Undo-harassment": {
            message: `
Please note that our undo policy is as follows:

You are allowed to request an undo at any time and for any reason. However, please understand
that your opponent is **not required** to accept the undo request, regardless of the reason, including
unintentional misclicks, bugs, or any other circumstances.

If you were unaware, please note that scolding your opponent for their decision is considered a
form of harassment. If this continues, we will have no choice but to remove your chat privilege to
to protect other users from that.

For more information, please refer to our Terms of Service.

https://online-go.com/docs/terms-of-service`,
            show_warning_button: true,
        },
    },
};

export const REPORTER_RESPONSE_TEMPLATES: MessageTemplates = {
    "Good Report": {
        "Beginner escaper": {
            message: `
                Thanks for your report about #REPORTED, I have asked your newcomer opponent to be more
                respectful of people’s time.`,
            show_warning_button: false,
        },
        "Beginner end game scoring": {
            message: `
                Thanks for the report about #REPORTED. It seems you were playing against a
                complete beginner, so I have tried to explain that games should
                be ended correctly, to pass when their opponent pass and to
                trust the auto-score.`,
            show_warning_button: false,
        },
        "First warning given": {
            message: `
                Thank you for your report, #REPORTED has been given a formal warning.`,
            show_warning_button: false,
        },
        "First warning given - escaping": {
            message: `
                Thank you for your report, #REPORTED has been given a formal warning regarding escaping.`,
            show_warning_button: false,
        },
        "Final warning given": {
            message: `
                Thank you for your report, #REPORTED has been given a formal warning, and their account will be suspended if that continues.`,
            show_warning_button: false,
        },
        "Formal warning about chat abuse": {
            message: `
            Thanks for your report, #REPORTED has been given a formal warning, and their chat privileges at OGS will be removed if that behavior continues.`,
            show_warning_button: false,
        },
        "Chat banned": {
            message: `
            Thanks for your report, #REPORTED's chat privilege at OGS has been removed. Other users will no longer see any chat that they type.`,
            show_warning_button: false,
        },
        "Repeat offender banned": {
            message: `
                Thank you for your report about #REPORTED.  That repeat offender's account has been suspended.`,
            show_warning_button: false,
        },
        "Reported player banned": {
            message: `
                Thank you for your report about #REPORTED. That player's account has been suspended.`,
            show_warning_button: false,
        },
        "Contacted player": {
            message: `
                Thank you for your report about #REPORTED. I have contacted the player about it.`,
            show_warning_button: false,
        },
    },
    "Bad Report": {
        "No AI use": {
            message: `
                Thank you for your report about possible AI use by #REPORTED. Our detection tools did not flag any AI use in that game.
                If you think there’s something we’ve overlooked please file a new report with more details.`,
            show_warning_button: false,
        },
        "No sandbagging": {
            message: `
                Thank you for bringing the possible instance of sandbagging by #REPORTED to
                our attention. We looked into the report and found little
                evidence of deliberate losing on purpose. But we’ll still keep an
                eye on the situation and take appropriate action if necessary.
                Thank you for helping keep OGS enjoyable for everyone. We
                appreciate it.`,
            show_warning_button: false,
        },
        "No violation": {
            message: `
                Thank you for your report about #REPORTED. We looked into it and found no
                behavior that violates our terms of service or community
                guidelines. But we’ll still keep an eye on the situation and take
                appropriate action if necessary. Thank you for helping keep OGS
                enjoyable for everyone. We appreciate it.`,
            show_warning_button: false,
        },
        "Not escaping - using Cancel": {
            message: `
                Thanks for your report. Player are allowed to use the Cancel button to cancel a game that they have realized
                will not suit them, as long as they do not do that too often. I have reminded your opponent to use that sparingly.
                Thanks again.`,
            show_warning_button: false,
        },
    },
    Chastise: {
        "Duplicate reports": {
            message: `
            Thanks for your report.

            Please don't file multiple reports for the same thing - that creates a lot of work for us tidying up,
            which could be time spent better on other reports.

            We appreciate hearing about problems, but one report is enough for each incident -
            more than that will slow us down.

            Thanks!`,
            show_warning_button: true,
        },
        "Don't hassle about AI": {
            message: `
                If you suspect your opponent of using AI, please tell us and not them.
                When actual cheaters are warned about suspicion, they change their behavior,
                it makes it harder to detect.   Also, accusations of AI use feel like harassment,
                which is not allowed.  Please finish the game the best you can and report it - this
                provides the best evidence, and we will investigate`,
            show_warning_button: false,
        },
        "Verbal abuse": {
            message: `
                Thanks for bringing the misbehavior to our attention. We also
                noticed that you were verbally harassing your opponent while
                this was going on. This kind of behavior is not acceptable
                either and will not be tolerated. We appreciate your help in
                keeping the game fair, but please refrain from using any kind of
                abusive language or behavior towards other players.`,
            show_warning_button: true,
        },
    },
};

export function MessageTemplate({
    title,
    player,
    reported,
    templates,
    game_id,
    gpt,
    logByDefault,
    onSelect,
    onMessage,
}: {
    title: string;
    player: PlayerCacheEntry;
    reported: PlayerCacheEntry;
    templates: MessageTemplates;
    game_id: number | undefined;
    gpt: string | null;
    logByDefault: boolean;
    onSelect?: () => void | null;
    onMessage?: () => void | null;
}): React.ReactElement {
    const [uid] = React.useState(Math.random());
    const [selectedTemplate, setSelectedTemplate] = React.useState<string>(gpt ? "gpt" : "");
    const [template, setTemplate] = React.useState<TemplateEntry | null>(null);
    const [text, setText] = React.useState<string>(gpt ? gpt : "");
    const [log, setLog] = React.useState<boolean>(logByDefault);
    const user = useUser();

    React.useEffect(() => {
        if (selectedTemplate && selectedTemplate !== "gpt") {
            const arr = selectedTemplate.split("::");
            setTemplate(templates[arr[0]][arr[1]]);

            const msg = templates[arr[0]][arr[1]].message
                .trim()
                .replace(
                    /#XX+/g,
                    game_id ? `[${game_id.toString()}](/game/${game_id.toString()})` : "#XXXXXXXX",
                )
                .replace(/#REPORTED/, reported?.username ?? "that player")
                .replace(/\n[ \t]+/g, "\n")
                .replace(/[ \t]+\n/g, "\n")
                .replace(/([^\n])[\n]([^\n])/g, "$1 $2");
            setText(msg);
        } else if (selectedTemplate === "gpt") {
            setTemplate(null);
            setText(gpt ? gpt : "");
        } else {
            setTemplate(null);
        }
    }, [selectedTemplate, gpt, templates, game_id]);

    React.useEffect(() => {
        if (gpt && selectedTemplate === "" && text === "") {
            setSelectedTemplate("gpt");
            setText(gpt);
            setTemplate(null);
        }
    }, [gpt]);

    const clear = () => {
        setText("");
        setTemplate(null);
        setSelectedTemplate("");
    };

    const sendWarning = () => {
        post("moderation/warn", { user_id: player.id, text })
            .then(() => {
                toast(<div>Warning sent</div>, 2000);
            })
            .catch(errorAlerter);
        clear();
        if (onMessage) {
            onMessage();
        }
    };
    const sendSystemPM = () => {
        const pc = getPrivateChat(player.id, player.username);
        void alert.fire("Sent system PM to " + player.username);
        pc.sendChat(text, true);
        if (log) {
            void put(`players/${player.id}/moderate`, {
                moderation_note: "Sent system PM: " + text,
            });
        }

        clear();
        if (onMessage) {
            onMessage();
        }
    };
    const sendPM = () => {
        const pc = getPrivateChat(player.id, player.username);
        pc.open();
        pc.sendChat(text);
        if (log) {
            void put(`players/${player.id}/moderate`, {
                moderation_note: "Sent private message: " + text,
            });
        }
        clear();
        if (onMessage) {
            onMessage();
        }
    };

    const selectTemplate = (e: any) => {
        setSelectedTemplate(e);
        if (onSelect) {
            onSelect();
        }
    };

    return (
        <div className="MessageTemplate">
            <h3>
                {title}: <Player user={player} />
            </h3>
            <div className="top">
                <select value={selectedTemplate} onChange={(e) => selectTemplate(e.target.value)}>
                    <option value="">-- Select template --</option>
                    <optgroup label={"Automod"} key={"automod"}>
                        <option value="gpt">Automod's suggestion</option>
                    </optgroup>
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
                <button className="clear" onClick={clear}>
                    Clear
                </button>
                {(user.is_moderator || null) && (
                    <span className="log">
                        <label htmlFor={"log" + uid}>Log</label>
                        <input
                            type="checkbox"
                            id={"log" + uid}
                            checked={log}
                            onChange={(e) => setLog(e.target.checked)}
                        />
                    </span>
                )}
            </div>

            <textarea value={text} onChange={(e) => setText(e.target.value)} />

            <div className="buttons">
                <button
                    onClick={sendWarning}
                    disabled={(!text || (template && !template.show_warning_button)) ?? undefined}
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
