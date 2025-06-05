/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";

export type AIDetectionProps = {};

export type AIDetectionT = (props: AIDetectionProps) => React.ReactElement;

export const AIDetection: AIDetectionT = (_props: AIDetectionProps) => {
    return (
        <div>
            <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/xvFZjo5PgG0?si=fi9TF9klw52tuC5e"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        </div>
    );
};
