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

interface TabCompleteInputProperties {
    id?: string;
    placeholder: string;
    disabled?: boolean;
    onKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => boolean;
    className?: string;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    autoFocus?: boolean;
}

export const TabCompleteInput = React.forwardRef<HTMLInputElement, React.HTMLProps<HTMLInputElement>>(
    (props: TabCompleteInputProperties, ref): JSX.Element => {
        React.useEffect(() => {
            ($((ref as any).current) as any).nicknameTabComplete();
        }, [(ref as any).current]);

        return <input ref={ref} {...props} />;
    }
);
