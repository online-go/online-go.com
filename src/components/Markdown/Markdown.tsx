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
import markdown_it from "markdown-it";
import sanitizeHtml from "sanitize-html";
//import moment from "moment";
import { profanity_filter } from "@/lib/profanity_filter";
import { localize_time_strings } from "@/lib/localize-time";

interface MarkdownProps {
    source?: string;
    className?: string;
}

interface MarkdownState {}

const md = markdown_it({
    html: true,
    linkify: true,
    typographer: true,
});

function sanitize(src: string) {
    return sanitizeHtml(src, {
        allowedTags: [
            "a",
            "article",
            "aside",
            "body",
            "br",
            "details",
            "div",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",

            "header",
            "hgroup",
            "hr",
            "footer",
            "nav",
            "p",
            "section",
            "span",
            "summary",

            "datalist",
            "fieldset",
            "label",
            "legend",
            "abbr",
            "acronym",
            "address",
            "b",
            "bdi",
            "bdo",
            "big",
            "blockquote",
            "center",
            "cite",
            "code",
            "del",
            "dfn",
            "em",
            "font",
            "i",
            "ins",
            "mark",
            "output",
            "pre",
            "progress",
            "q",
            "rp",
            "rt",
            "ruby",
            "s",
            "samp",
            "small",
            "strike",
            "strong",
            "sub",
            "sup",
            "tt",
            "u",
            "dd",
            "dir",
            "dl",
            "dt",
            "li",
            "ol",
            "menu",
            "ul",

            "caption",
            "col",
            "colgroup",
            "table",
            "tbody",
            "td",
            "tfoot",
            "thead",
            "th",
            "tr",

            "area",
            "audio",
            "embed",
            /* cspell:disable-next-line */
            "flgcaption",
            "figure",
            "img",
            "map",
            "source",
            "time",
            "video",
            "link",
        ],

        allowedAttributes: {
            "*": [
                "href",
                "align",
                "style",
                "bgcolor",
                "alt",
                "src",
                "width",
                "height",
                "class",
                "rel",
            ],
        },
        allowedStyles: {
            "*": {
                "background-color": [/.*/],
                border: [/.*/],
                "border-radius": [/.*/],
                "border-color": [/.*/],
                "box-shadow": [/.*/],
                color: [/.*/],
                font: [/.*/],
                "font-family": [/.*/],
                "font-size": [/.*/],
                margin: [/.*/],
                "margin-bottom": [/.*/],
                "margin-left": [/.*/],
                "margin-right": [/.*/],
                "margin-top": [/.*/],
                padding: [/.*/],
                "padding-bottom": [/.*/],
                "padding-left": [/.*/],
                "padding-right": [/.*/],
                "padding-top": [/.*/],
                "text-align": [/.*/],
            },
        },
        transformTags: {
            //'script': kill,
            //'iframe': kill,
            //'style': kill,
            a: (tagName, attribs) => {
                attribs["rel"] = "noopener";
                return { tagName, attribs };
            },
        },
    });
}

// this component is protected from calling sanitizeHtml to often by memoizing, below.

class _Markdown extends React.PureComponent<MarkdownProps, MarkdownState> {
    constructor(props: MarkdownProps) {
        super(props);
        this.state = {};
    }

    //
    preprocess(source: string): string {
        // Profanity filter
        source = profanity_filter(source);

        // Allow people to have #header style markdown for headers, markdown-it requires a space between
        source = source
            .split("\n")
            .map((l) => l.replace(/^(#+)([a-zA-Z0-9])/, "$1 $2"))
            .join("\n");

        // Support locale time replacements
        source = localize_time_strings(source);

        return source;
    }

    render() {
        const html = this.props.source
            ? sanitize(md.render(this.preprocess(this.props.source)))
            : "";

        return (
            <div
                className={this.props.className ? this.props.className : ""}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }
}

export const Markdown = React.memo(_Markdown);
