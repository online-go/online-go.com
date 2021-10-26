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

interface StepsProperties {
    completed: number;
    selected?: number;
    total?: number;
    className?: string;
    children?: any;
    minWidth?: string;
    onChange?: (selected: number) => void;
    // user?: any,
    // callback?: ()=>any,
}

export const Steps = (props: StepsProperties) => {
    const children = (Array.isArray(props.children) ? props.children : (props.children ? [props.children] : [])).concat([]);
    if (props.total) {
        while (children.length < props.total) {
            children.push(<span/>);
        }
    }

    return (
        <div className={"Steps " + (props.className || "")}>
            {children.map((element, idx) => {
                let title;
                try {
                    title = element.props.title || (idx + 1);
                } catch (e) {
                    console.error(e);
                    title = (idx + 1);
                }

                let cls = "StepContainer";

                if (idx <= props.completed) {
                    cls += " CompletedStepContainer";
                }

                if (idx === props.completed) {
                    cls += " LastCompletedStepContainer";
                }

                if (idx === props.selected) {
                    cls += " SelectedStepContainer";
                }

                return (
                    <div key={idx} className={cls} style={{minWidth: props.minWidth || "auto"}}>
                        <div className="title-row">
                            <span className="title-left"/>
                            <span className={"title-text" + (props.onChange ? " clickable" : "")} onClick={() => (props.onChange ? props.onChange(idx) : 0)} >{title}</span>
                            <span className="title-right"/>
                        </div>
                        <div className="step-contents">
                            {element}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
