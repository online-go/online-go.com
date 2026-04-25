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
import { GobanController } from "@/lib/GobanController";
import { pgettext } from "@/lib/translate";
import "./KibitzNodeText.css";

interface KibitzNodeTextProps {
    controller: GobanController;
    editable: boolean;
    disabled?: boolean;
}

export function KibitzNodeText({
    controller,
    editable,
    disabled = false,
}: KibitzNodeTextProps): React.ReactElement {
    const [nodeText, setNodeText] = React.useState(controller.goban.engine.cur_move?.text ?? "");

    React.useEffect(() => {
        const syncNodeText = () => {
            setNodeText(controller.goban.engine.cur_move?.text ?? "");
        };

        controller.goban.on("load", syncNodeText);
        controller.goban.on("cur_move", syncNodeText);
        syncNodeText();

        return () => {
            controller.goban.off("load", syncNodeText);
            controller.goban.off("cur_move", syncNodeText);
        };
    }, [controller]);

    return (
        <textarea
            className={"form-control KibitzNodeText" + (editable ? " editable" : " read-only")}
            placeholder={pgettext(
                "Placeholder for Kibitz variation move-node comments",
                "Move comments...",
            )}
            rows={3}
            value={nodeText}
            onChange={(event) => {
                if (!editable) {
                    return;
                }

                const nextText = event.target.value;

                controller.goban.engine.cur_move.text = nextText;
                setNodeText(nextText);
                controller.goban.move_tree_redraw(true);
            }}
            readOnly={!editable}
            disabled={disabled}
        />
    );
}
