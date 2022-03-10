/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { post } from "requests";
import { current_language } from "translate";

interface AutoTranslateProps {
    source: string;
    className?: string;
}

interface Translation {
    source_language: string;
    source_text: string;
    target_language: string;
    target_text: string;
}

export function AutoTranslate({ source, className }: AutoTranslateProps): JSX.Element {
    const [translation, setTranslation] = React.useState<Translation>(null);

    React.useEffect(() => {
        auto_translate(source)
            .then((translation: Translation) => {
                setTranslation(translation);
            })
            .catch(console.error);
    }, [source]);

    return (
        <div className={`AutoTranslate ${className || ""}`}>
            {source}
            {((translation &&
                translation.target_language !== translation.source_language &&
                translation.target_text !== translation.source_text) ||
                null) && (
                <>
                    <div className="language-map">
                        {translation.source_language} =&gt; {translation.target_language}
                    </div>
                    <div className="translation">{translation.target_text}</div>
                </>
            )}
        </div>
    );
}

async function auto_translate(text: string): Promise<Translation> {
    const res = await post("/termination-api/translate", {
        source: text,
        language: current_language,
    });
    console.log("translation complete: ", res);
    return res;
}
