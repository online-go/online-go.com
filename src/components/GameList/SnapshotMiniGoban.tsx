/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { MiniGoban, type MiniGobanProps } from "@/components/MiniGoban";
import { restoreGobanToOfficialTail, type GobanController } from "@/lib/GobanController";

interface SnapshotMiniGobanProps extends Omit<
    MiniGobanProps,
    "game_id" | "json" | "onGobanCreated"
> {
    game_id: number;
    snapshot: MiniGobanProps["json"] | null;
    onGobanCreated?: (goban_controller: GobanController) => void;
}

export function SnapshotMiniGoban(props: SnapshotMiniGobanProps): React.ReactElement {
    const [controller, setController] = React.useState<GobanController | null>(null);
    const { snapshot, onGobanCreated, ...miniGobanProps } = props;

    React.useEffect(() => {
        if (!controller || !snapshot) {
            return;
        }

        controller.goban.load(snapshot);
        restoreGobanToOfficialTail(controller.goban);
    }, [controller, snapshot]);

    return (
        <MiniGoban
            {...miniGobanProps}
            game_id={props.game_id}
            json={{ game_id: undefined }}
            onGobanCreated={(nextController) => {
                setController(nextController);
                onGobanCreated?.(nextController);
            }}
        />
    );
}
