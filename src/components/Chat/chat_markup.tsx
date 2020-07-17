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
import {Link} from "react-router-dom";
import {Player} from "Player";
import {profanity_filter} from "profanity_filter";

const global_replacements = [
    // spam mitigation
    // replace tsumegodojo.worldpress.com urls with tsumegododo.worldpress.com as spam mitigation
    {split: /(https?:\/\/\S*tsumegodojo\S*)/gi, pattern: /(https?:\/\/[^\s\/]*)(tsumegodojo)(\S*)/gi, replacement: (m, idx) => (<a key={idx} target="_blank" href={m[1] + "tsumegododo" + m[3]}>{m[1] + "tsumegododo" + m[3]}</a>)},
    {split: /(\S*tsumegodojo\S*)/gi, pattern: /(\S*)(tsumegodojo)(\S*)/gi, replacement: (m, idx) => (m[1] + "tsumegododo" + m[3])},
    // Match github
    {split: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/pull\/[0-9]+(?:\/|\b))/gi,
        pattern: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/pull\/([0-9]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<a key={idx} target="_blank" href={`https://github.com/online-go/online-go.com/pull/${m[2]}`}>{"GH-" + m[2]}</a>)},
    {split: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/issues\/[0-9]+(?:\/|\b))/gi,
        pattern: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/issues\/([0-9]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<a key={idx} target="_blank" href={`https://github.com/online-go/online-go.com/issues/${m[2]}`}>{"GH-" + m[2]}</a>)},
    {split: /\b((?:gh|pr|issue)[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b((?:gh|pr|issue))[- ]?(?:#)?([0-9]+)\b/gi, replacement: (m, idx) => (<a key={idx} target="_blank" href={`https://github.com/online-go/online-go.com/issues/${m[2]}`}>{m[1] + '-' + m[2]}</a>)},
    // links to the wiki
    {split: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/wiki\/(?:[^\/<> ]+)(?:\/|\b))/gi,
        pattern: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/wiki\/([^\/<> ]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<a key={idx} href={m[1]}>{"wiki: " + m[2].replace(/-/gi, " ").replace(/#/gi, " — ")}</a>)},
    {split: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/wiki#(?:[^\/<> ]+)(?:\/|\b))/gi,
        pattern: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/wiki#([^\/<> ]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<a key={idx} href={m[1]}>{"wiki: TOC " + m[2].replace(/-/gi, " ").replace(/#/gi, " — ")}</a>)},
    // Match forum links
    {split: /\b(https?:\/\/forums\.online-go\.com\/t\/[a-zA-Z0-9-]+\/[0-9]+(?:\/[0-9]+)?(?:\?[^\/<> ]+)?(?:\/|\b))/gi,
        pattern: /\b(https?:\/\/forums\.online-go\.com\/t\/([a-zA-Z0-9-]+)\/[0-9]+(?:\/[0-9]+)?(?:\?[^\/<> ]+)?(?:\/|\b))/gi,
        replacement: (m, idx) => (<a key={idx} target="_blank" href={m[1]}>{(m[2]).replace(/(\-)/gi, " ")}</a>)},
    // Match online-go links
    // user profiles
    {split: /\b((?:player|user) ?(?:#)?[0-9]+)\b/gi, pattern: /\b(player|user) ?(?:#)?([0-9]+)\b/gi, replacement: (m, idx) => (<Player key={idx} user={{id: Number(m[2])}} rank={false} noextracontrols />)},
    {split: /\b((?:player |user )?https?:\/\/online-go\.com(?:\/player|\/user\/view)\/[0-9]+(?:\/[^\/<> ]+)*(?:\/|\b))/gi,
        pattern: /\b((player |user )?https?:\/\/online-go\.com(?:\/player|\/user\/view)\/([0-9]+)(?:\/[^\/<> ]+)*(?:\/|\b))/gi,
        replacement: (m, idx) => (<Player key={idx} user={{id: Number(m[3])}} rank={false} noextracontrols />)},
    {split: /\b((?:player |user )?https?:\/\/online-go\.com\/(?:u|user(?!\/(?:view|settings|supporter|verifyEmail)))\/(?:[^\/<> ]+)(?:\/|\b))/gi,
        pattern: /\b((player |user )?https?:\/\/online-go\.com\/(?:u|user(?!\/(?:view|settings|supporter|verifyEmail)))\/([^\/<> ]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<Player key={idx} user={{"id": -1, username: m[3]}} rank={false} noextracontrols />)},
    {split: /(@"[^"\/]+(?:\/[0-9]+)?")/gi,
        pattern: /(@"([^"\/]+)(?:\/([0-9]+))?")/gi,
        replacement: (m, idx) => (<Player key={idx} user={(m[3] ? {id: Number(m[3])} : {username: m[2]})} rank={false} noextracontrols />)},
    {split: /(%%%PLAYER-[0-9]+%%%)/g, pattern: /(%%%PLAYER-([0-9]+)%%%)/g, replacement: (m, idx) => (<Player key={idx} user={parseInt(m[2])}/>)},
    // games
    {split: /\b((?:game)[- ]?(?:#)?[0-9]{3,})/gi, pattern: /(\bgame)[- ]?(?:#)?([0-9]{3,})/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/game/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
    {split: /\b((?:game )?https?:\/\/online-go\.com\/game(?:\/view)?\/[0-9]+(?:\/|\b))/gi,
        pattern: /\b((game )?https?:\/\/online-go\.com\/game(?:\/view)?\/([0-9]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/game/${m[3]}`}>{(m[2] ? m[2] : "game ") + m[3]}</Link>)},
    // reviews
    {split: /(^##[0-9]{3,}|[ ]##[0-9]{3,})/gi, pattern: /(^##([0-9]{3,})|([ ])##([0-9]{3,}))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/review/${m[2] || ""}${m[4] || ""}`}>{`${m[3] || ""}review ${m[2] || ""}${m[4] || ""}`}</Link>)},
    {split: /\b(review[- ]?(?:#)?[0-9]{3,})/gi, pattern: /\b(review)[- ]?(?:#)?([0-9]{3,})/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/review/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
    {split: /\b((?:review )?https?:\/\/online-go\.com\/review(?:\/view)?\/[0-9]+(?:\/|\b))/gi,
        pattern: /\b((review )?https?:\/\/online-go\.com\/review(?:\/view)?\/([0-9]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/review/${m[3]}`}>{(m[2] ? m[2] : "review ") + m[3]}</Link>)},
    // demos
    {split: /\b((?:demo )?https?:\/\/online-go\.com\/demo(?:\/view)?\/[0-9]+(?:\/|\b))/gi,
        pattern: /\b((demo )?https?:\/\/online-go\.com\/demo(?:\/view)?\/([0-9]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/demo/${m[3]}`}>{(m[2] ? m[2] : "demo ") + m[3]}</Link>)},
    {split: /\b(demo[- ]?(?:#)?[0-9]{3,})/gi, pattern: /\b(demo)[- ]?(?:#)?([0-9]{3,})/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/demo/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
    // joseki
    {split: /\b(joseki[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b(joseki)[- ]?(?:#)?([0-9]+)/gi, replacement: (m, idx) => (<Link key={idx} to={`/joseki/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
    {split: /\b((?:joseki )?https?:\/\/online-go\.com\/joseki\/[0-9]+(?:\/|\b))/gi,
        pattern: /\b((?:joseki )?https?:\/\/online-go\.com\/joseki\/([0-9]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/joseki/${m[2]}`}>{"joseki " + m[2]}</Link>)},
    // library
    {split: /\b((?:library )?https?:\/\/online-go\.com\/library\/[0-9]+(?:\/[0-9]+)?(?:\/|\b))/gi,
        pattern: /\b((joseki )?https?:\/\/online-go\.com\/library\/([0-9]+)(?:\/([0-9]+))?(?:\/|\b))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/library/${m[3]}` + (m[4] ? `/` + m[4] : ``)}>{"library" + (m[4] ? " " + m[4] : "") + " of player " + m[3]}</Link>)},
    // groups
    {split: /\b(group[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b(group)[- ]?(?:#)?([0-9]+)/gi, replacement: (m, idx) => (<Link key={idx} to={`/group/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
    {split: /\b((?:group )?https?:\/\/online-go\.com\/group\/[0-9]+(?:\/[^\/<> ]+)*)/gi,
        pattern: /\b((group )?https?:\/\/online-go\.com\/group\/([0-9]+)(?:\/[^\/<> ]+)*)/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/group/${m[3]}`}>{(m[2] ? m[2] : "group ") + m[3]}</Link>)},
    // tournaments
    {split: /\b(tournament[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b(tournament)[- ]?(?:#)?([0-9]+)/gi, replacement: (m, idx) => (<Link key={idx} to={`/tournament/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
    {split: /\b((?:tournament )?https?:\/\/online-go\.com\/tournaments?\/[0-9]+(?:\/|\b))/gi,
        pattern: /\b((tournament )?https?:\/\/online-go\.com\/tournaments?\/([0-9]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/tournament/${m[3]}`}>{(m[2] ? m[2] : "tournament ") + m[3]}</Link>)},
    {split: /\b((?:tournament |tournament-record )?https?:\/\/online-go\.com\/tournament-records?\/[0-9]+(?:\/[^\/<> ]+)*(?:\/|\b))/gi,
        pattern: /\b((tournament |tournament-record )?https?:\/\/online-go\.com\/tournament-records?\/([0-9]+)(?:\/[^\/<> ]+)*(?:\/|\b))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/tournament-records/${m[3]}`}>{(m[2] ? m[2] : "tournament-record ") + m[3]}</Link>)},
    // ladders
    {split: /\b(ladder[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b(ladder)[- ]?(?:#)?([0-9]+)/gi, replacement: (m, idx) => (<Link key={idx} to={`/ladder/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
    {split: /\b((?:ladder )?https?:\/\/online-go\.com\/ladder\/[0-9]+(?:\/|\b))/gi,
        pattern: /\b((ladder )?https?:\/\/online-go\.com\/ladder\/([0-9]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/ladder/${m[3]}`}>{(m[2] ? m[2] : "ladder") + '-' + m[3]}</Link>)},
    // puzzles
    {split: /\b(puzzle[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b(puzzle)[- ]?(?:#)?([0-9]+)/gi, replacement: (m, idx) => (<Link key={idx} to={`/puzzle/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
    {split: /\b((?:puzzle )?https?:\/\/online-go\.com\/puzzle\/[0-9]+(?:\/|\b))/gi,
        pattern: /\b((puzzle )?https?:\/\/online-go\.com\/puzzle\/([0-9]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/puzzle/${m[3]}`}>{(m[2] ? m[2] : "puzzle ") + m[3]}</Link>)},
    // learning-hub
    {split: /\b((?:tutorial )?https?:\/\/online-go\.com\/(?:(?:docs\/)?learn-to-play-go|learning-hub)\/[-a-z]+(?:\/[0-9]+)?(?:\/|\b))/gi,
        pattern: /\b((tutorial )?https?:\/\/online-go\.com\/(?:(?:docs\/)?learn-to-play-go|learning-hub)\/([-a-z]+)(?:\/([0-9]+))?(?:\/|\b))/gi,
        replacement: (m, idx) => (<Link key={idx} to={`/learn-to-play-go/${m[3]}` + (m[4] ? `/` + m[4] : ``)}>{(m[2] ? m[2] : "tutorial ") + m[3] + (m[4] ? " exercise " + (Number(m[4]) + 1) : "")}</Link>)},
    // links to senseis
    {split: /\b(https?:\/\/senseis\.xmp\.net\/\?(?:[^\/<> ]+)*(?:\/|\b))/gi,
        pattern: /\b(https?:\/\/senseis\.xmp\.net\/\?([^\/<> ]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<a key={idx} target='_blank' href={m[1]}>{"senseis: " + m[2]}</a>)},
    // mails
    {split: /([^<> ]{1,64}[@][^<> ]+[.][^<> ]+)/gi,  pattern: /([^<> ]{1,64}[@][^<> ]+[.][^<> ]+)/gi,  replacement: (m, idx) => (<a key={idx} target="_blank" href={"mailto:" + m[1]}>{m[1]}</a>)},
    // general urls
    // replaces any url not matched above
    {split: /(https?:\/\/(?!online-go\.com\/)[^<> ]+)/gi, pattern: /(https?:\/\/(?!online-go\.com\/)[^<> ]+)/gi, replacement: (m, idx) => (<a key={idx} target="_blank" href={m[1]}>{m[1]}</a>)},
    {split: /\b(https?:\/\/online-go\.com\/(?:sign-in|register|overview|play|chat|observe-games|joseki(?!\/[0-9])|player\/settings|player\/supporter|settings|user\/(?:settings|supporter|verifyEmail)|supporter|support|donate|groups|group\/create|tournament\/new(?:\/[0-9]+)?|tournaments(?!\/[0-9])|ladders|puzzles|leaderboards?|developer|admin(?:\/merchant_log)?|announcement-center|moderator|learning-hub(?!\/[-a-z])|(?:docs\/)?learn-to-play-go(?!\/[-a-z])|(?:docs\/)?crash-course-learn-to-play-go(?:\/[0-9]+)?|dev\/(?:styling|goban-test)|docs\/(?:about|privacy-policy|terms-of-service|contact-information|refund-policy|go-rules-comparison-matrix|team|other-go-resources)|2019usgc|usgc2019|api\/[^<> ]+|termination-api\/[^<> ]+)(?:\/|\b))/gi,
        pattern: /\b(https?:\/\/online-go\.com\/(?:sign-in|register|overview|play|chat|observe-games|joseki(?!\/[0-9])|player\/settings|player\/supporter|settings|user\/(?:settings|supporter|verifyEmail)|supporter|support|donate|groups|group\/create|tournament\/new(?:\/[0-9]+)?|tournaments(?!\/[0-9])|ladders|puzzles|leaderboards?|developer|admin(?:\/merchant_log)?|announcement-center|moderator|learning-hub(?!\/[-a-z])|(?:docs\/)?learn-to-play-go(?!\/[-a-z])|(?:docs\/)?crash-course-learn-to-play-go(?:\/[0-9]+)?|dev\/(?:styling|goban-test)|docs\/(?:about|privacy-policy|terms-of-service|contact-information|refund-policy|go-rules-comparison-matrix|team|other-go-resources)|2019usgc|usgc2019|api\/[^<> ]+|termination-api\/[^<> ]+)(?:\/|\b))/gi,
        replacement: (m, idx) => (<a key={idx} target="_blank" href={m[1]}>{m[1]}</a>)}
];

export function chat_markup(body: string, extra_pattern_replacements?: Array<{split: RegExp; pattern: RegExp; replacement: ((m: any, idx: number) => any)}>): Array<JSX.Element> {
    let replacements = global_replacements;


    if (extra_pattern_replacements) {
        replacements = replacements.concat(extra_pattern_replacements);
    }

    let ret = [profanity_filter(body)];
    for (let r of replacements) {
        ret = [].concat.apply([], ret.map((text_fragment) => {
            return text_fragment.split(r.split);
        }));
    }

    for (let i = 0; i < ret.length; ++i) {
        let fragment = ret[i];
        let matched = false;
        for (let r of replacements) {
            let m = r.pattern.exec(fragment);
            if (m) {
                ret[i] = r.replacement(m, i);
                matched = true;
                break;
            }
        }
        if (!matched) {
            ret[i] = <span key={i}>{ret[i]}</span>;
        }
    }

    return ret;
}
