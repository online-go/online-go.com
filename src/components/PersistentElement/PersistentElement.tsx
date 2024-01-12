/*
 * Copyright (C)  Online-Go.com
 *
 * program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";

interface PersistentElementProps {
    elt: HTMLElement | JQuery;
    className?: string;
    /** hash of new props to put on the element */
    extra_props?: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
}

export function PersistentElement(props: PersistentElementProps): JSX.Element {
    const container = React.useRef<HTMLDivElement>(null);

    React.useEffect((): (() => void) | void => {
        if (container.current) {
            const elt = props.elt instanceof jQuery ? (props.elt as any)[0] : props.elt;
            if (elt) {
                const cont = container.current;
                cont.appendChild(elt);
                return () => {
                    cont.removeChild(elt);
                };
            }
        }
    }, [container.current, props.elt]);

    return <div className={props.className || ""} {...props.extra_props} ref={container} />;
}
