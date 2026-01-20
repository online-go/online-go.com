/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";

export function Moderator(): React.ReactElement {
    return <div>Not implemented</div>;
}

export interface IPDetailsProperties {
    ip: string;
    details: {
        traits: {
            is_hosting_provider: boolean;
            is_anonymous: boolean;
        };
    };
}

export function IPDetails({ ip }: IPDetailsProperties): React.ReactElement {
    return <span>{ip}</span>;
}
