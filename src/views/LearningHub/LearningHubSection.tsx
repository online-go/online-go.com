/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {LearningPage, DummyPage} from './LearningPage';
import {getFirstUncompletedPage} from './util';

interface LearningHubSectionProperties {
    page: number;
    title: string;
    nextSection: string;
    section: string;
    pages: Array<typeof LearningPage>;
}

export abstract class LearningHubSection extends React.PureComponent<LearningHubSectionProperties, any> {
    constructor(props) {
        super(props);
    }

    static pages():Array<typeof LearningPage> {
        return [
            DummyPage,
            DummyPage,
            DummyPage,
        ];
    }
    static section():string { return "missing"; }
    static title():string { return "Missing"; }
    static subtext():string { return "Missing"; }

    render() {
        let page = this.props.page || getFirstUncompletedPage(this.props.section);
        page = Math.min(page, this.props.pages.length);
        page = Math.max(page, 0);
        let P:typeof LearningPage = this.props.pages[page];
        return <P
            title={this.props.title}
            npages={this.props.pages.length}
            curpage={page}
            section={this.props.section}
            nextSection={this.props.nextSection}
            />;
    }
}
