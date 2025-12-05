/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";

export type PlayerTagInputProps = {
    playerId: number;
    gameId: number;
};

export type PlayerTagInputT = (props: PlayerTagInputProps) => React.ReactElement;

export const PlayerTagInput: PlayerTagInputT = (_props: PlayerTagInputProps) => {
    return <div>Not implemented</div>;
};
