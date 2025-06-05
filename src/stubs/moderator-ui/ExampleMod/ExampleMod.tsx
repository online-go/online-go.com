/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";

export type ExampleModProps = {
    test: string;
};

export type ExampleModT = (props: ExampleModProps) => React.ReactElement;

export const ExampleMod: ExampleModT = (_props: ExampleModProps) => {
    return <div>Not implemented</div>;
};
