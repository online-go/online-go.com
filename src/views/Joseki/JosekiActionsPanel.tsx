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
import { _ } from "@/lib/translate";
import "./JosekiActionsPanel.css";

interface JosekiActionsPanelProps {
    user_can_edit: boolean;
    user_can_administer: boolean;
    db_locked_down: boolean;
    edit_label: string;
    comment_count?: number;
    onOpenComments: () => void;
    onOpenChanges: () => void;
    onOpenEdit: () => void;
    onOpenAdmin: () => void;
    /** Each item dismisses the popover after firing its action; the
     *  popover container's click-to-close handler doesn't reach our content. */
    onClose: () => void;
}

export function JosekiActionsPanel(props: JosekiActionsPanelProps): React.ReactElement {
    const wrap = (action: () => void) => () => {
        action();
        props.onClose();
    };

    return (
        <div className="JosekiActionsPanel">
            <button className="JosekiActionsPanel-item" onClick={wrap(props.onOpenComments)}>
                <i className="fa fa-comment-o" />
                <span>{_("Comments")}</span>
                {!!props.comment_count && (
                    <span className="JosekiActionsPanel-count">{props.comment_count}</span>
                )}
            </button>

            <button className="JosekiActionsPanel-item" onClick={wrap(props.onOpenChanges)}>
                <i className="fa fa-history" />
                <span>{_("Position changes")}</span>
            </button>

            {props.user_can_edit && (
                <button
                    className={
                        "JosekiActionsPanel-item" + (props.db_locked_down ? " disabled" : "")
                    }
                    disabled={props.db_locked_down}
                    onClick={props.db_locked_down ? undefined : wrap(props.onOpenEdit)}
                >
                    <i className={"fa " + (props.db_locked_down ? "fa-lock" : "fa-pencil")} />
                    <span>{props.edit_label}</span>
                </button>
            )}

            <button className="JosekiActionsPanel-item" onClick={wrap(props.onOpenAdmin)}>
                <i className="fa fa-gavel" />
                <span>{props.user_can_administer ? _("Admin") : _("Updates")}</span>
            </button>
        </div>
    );
}
