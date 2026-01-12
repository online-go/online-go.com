/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";
import { GobanMovesArray } from "goban";

export interface MoveLabel {
    move_number: number;
    streak?: number | boolean;
    blur?: number;
    score_loss?: number;
    [key: string]: number | string | boolean | undefined;
}

export interface GameTimingsProps {
    moves: GobanMovesArray;
    start_time: number;
    end_time?: number;
    free_handicap_placement: boolean;
    handicap: number;
    black_id: number;
    white_id: number;
    onFinalActionCalculated?: (final_action_timing: moment.Duration) => void;
    simul_black?: boolean | null;
    simul_white?: boolean | null;
    blackFairPlayLabels?: MoveLabel[] | null;
    whiteFairPlayLabels?: MoveLabel[] | null;
}

export function GameTimings(_props: GameTimingsProps): React.ReactElement {
    return <div>Not implemented</div>;
}
