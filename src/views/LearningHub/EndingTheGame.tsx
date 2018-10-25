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
import {_, pgettext, interpolate} from "translate";
import {LearningHubSectionProperties} from './LearningHubSectionProperties';

export class EndingTheGame extends React.PureComponent<LearningHubSectionProperties, any>  {
    pages:Array<typeof LearningPage>;
    constructor(props) {
        super(props);

        this.pages = [
            DummyPage,
            DummyPage,
            DummyPage,
        ];
    }

    render() {
        let page = this.props.page || 0;
        page = Math.min(page, this.pages.length);
        page = Math.max(page, 0);
        let P:typeof LearningPage = this.pages[page];
        return <P
            title={pgettext("tutorial section on ending the game", "Ending the game.")}
            npages={this.pages.length}
            curpage={page}
            nextSection={this.props.nextSection}
            />;
    }
}
