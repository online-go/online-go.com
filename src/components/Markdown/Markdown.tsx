/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import * as markdownit from "markdown-it";
import * as sanitizeHtml from 'sanitize-html';

interface MarkdownProps {
    source: string;
}

const md = markdownit({
    html: true,
    linkify: true,
    typographer: true,
});

function sanitize(src) {
    return sanitizeHtml(src, {
        allowedTags: false, /* this means "all" */
        allowedAttributes: {
            '*': ['href', 'align', 'style', 'bgcolor', 'alt', 'src', 'width', 'height', 'class', 'rel']
        },
        allowedStyles: {
            '*': {
                'background-color': [/.*/],
                'border': [/.*/],
                'border-radius': [/.*/],
                'border-color': [/.*/],
                'box-shadow': [/.*/],
                'color': [/.*/],
                'font': [/.*/],
                'font-family': [/.*/],
                'font-size': [/.*/],
                'margin': [/.*/],
                'margin-bottom': [/.*/],
                'margin-left': [/.*/],
                'margin-right': [/.*/],
                'margin-top': [/.*/],
                'padding': [/.*/],
                'padding-bottom': [/.*/],
                'padding-left': [/.*/],
                'padding-right': [/.*/],
                'padding-top': [/.*/],
                'text-align': [/.*/],
            }
        },
        transformTags: {
            'script': 'error',
            'iframe': 'error',
            'style': 'error',
            'a': (tagName, attribs) => {
                attribs['rel'] = 'noopener';
                return { tagName, attribs };
            }
        }
    });
}

export class Markdown extends React.PureComponent<MarkdownProps, {html}> {
    constructor(props) {
        super(props);
        this.state = {
            html: this.props.source ? sanitize(md.render(this.massage(this.props.source))) : ""
        };
    }

    massage(source: string): string {
        source = source.split('\n').map((l) => l.replace(/^(#+)([a-zA-Z0-9])/, "$1 $2")).join('\n');
        return source;
    }

    UNSAFE_componentWillReceiveProps(next_props) {{{
        if (next_props.source !== this.props.source) {
            this.setState({
                html: next_props.source ? sanitize(md.render(this.massage(next_props.source))) : ""
            });
        }
    }}}

    render() {
        return (
            <div dangerouslySetInnerHTML={ {__html: this.state.html } } />
        );
    }
}
