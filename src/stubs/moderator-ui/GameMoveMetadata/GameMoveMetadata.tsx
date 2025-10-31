/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";
import type { GobanEngineConfig } from "goban";

export type GameMoveMetadataProps = {
    goban_config: GobanEngineConfig;
};

export type GameMoveMetadataT = (props: GameMoveMetadataProps) => React.ReactElement;

export const GameMoveMetadata: GameMoveMetadataT = (_props: GameMoveMetadataProps) => {
    return <div>Not implemented</div>;
};
