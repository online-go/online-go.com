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
import Switch from 'react-switch';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean, event: any, id: string) => void;

    width?: number;
    height?: number;
    uncheckedIcon?: JSX.Element | boolean;
    checkedIcon?: JSX.Element | boolean;
    id?: string;
    disabled?: boolean;
    className?: string;
}

export function Toggle(props: ToggleProps): JSX.Element {
    return (
        <span className={'Toggle ' + (props.checked ? 'on' : 'off')}>
            <Switch
                height={20}
                width={48}
                checkedIcon={false}
                uncheckedIcon={false}
                {...props}
            />
        </span>
    );

}
