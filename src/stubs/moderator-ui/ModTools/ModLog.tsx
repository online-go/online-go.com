/*
 * Copyright (C)  Online-Go.com
 *
 */

import * as React from "react";

export type ModLogProps = {
    user_id: number;
    groomData?: (data: rest_api.moderation.ModLogEntry[]) => rest_api.moderation.ModLogEntry[];
};

export function ModLog(_props: ModLogProps): React.ReactElement {
    return <div>Not implemented</div>;
}
