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
import {LearningHubSection} from './LearningHubSection';

export class Defend extends LearningHubSection {
    static pages():Array<typeof LearningPage> {
        return [
            DummyPage,
            DummyPage,
            DummyPage,
        ];
    }

    static section():string { return "defend"; }
    static title():string { return pgettext("Tutorial section name on learning how to defend", "Defend!"); }
    static subtext():string { return pgettext("Tutorial section subtext on learning how to defend", "Two eyes or death"); }
}
