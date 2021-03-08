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
import { _, pgettext, interpolate } from "translate";
//import * as preferences from "preferences";

interface AchievementEntry {
    name: string;
    nth_time_awarded: number;
    timestamp: string;
    completed: boolean;
    progress: number;
}


interface AchievementListProps {
    list: Array<AchievementEntry>;
}

export function AchievementList({list}:AchievementListProps): JSX.Element {
    return (
        <div className='AchievementList'>
            {list.map(render_achievement_entry)}
        </div>
    );
}

function render_achievement_entry(entry:AchievementEntry): JSX.Element {
    var title = '';
    var description = '';

    switch (entry.name) {
        case 'wdc2021':
            title = 'Western Dan Challenge Contender';
            description = 'Played 100 or more games during the 2021 Western Dan Challenge';
            break;
    }

    return (
        <div key={entry.name + '-' + entry.nth_time_awarded} className={'AchievementEntry ' + entry.name}>
            <span className='icon' />
            <div className='achievement-info'>
                <div className='title'>{title}</div>
                <div className='description'>{description}</div>
            </div>
        </div>
    );
}

