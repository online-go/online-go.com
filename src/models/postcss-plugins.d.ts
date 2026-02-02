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

/* Type declarations for PostCSS plugins without built-in types */

declare module "postcss-comment" {
    import { Parser } from "postcss";
    const parser: Parser;
    export default parser;
}

declare module "postcss-import-ext-glob" {
    import { PluginCreator } from "postcss";
    const plugin: PluginCreator<Record<string, unknown>>;
    export default plugin;
}

declare module "postcss-mixins" {
    import { PluginCreator } from "postcss";
    interface MixinsOptions {
        mixins?: Record<string, unknown>;
        mixinsFiles?: string | string[];
        mixinsDir?: string | string[];
        silent?: boolean;
    }
    const plugin: PluginCreator<MixinsOptions>;
    export default plugin;
}

declare module "postcss-nested" {
    import { PluginCreator } from "postcss";
    interface NestedOptions {
        bubble?: string[];
        unwrap?: string[];
        preserveEmpty?: boolean;
    }
    const plugin: PluginCreator<NestedOptions>;
    export default plugin;
}

declare module "postcss-functions" {
    import { PluginCreator } from "postcss";
    interface FunctionsOptions {
        functions?: Record<string, (...args: string[]) => string>;
        glob?: string | string[];
    }
    const plugin: PluginCreator<FunctionsOptions>;
    export default plugin;
}

declare module "postcss-url" {
    import { PluginCreator } from "postcss";
    interface UrlOptions {
        url?: "copy" | "inline" | "rebase" | ((asset: unknown) => string);
        maxSize?: number;
        fallback?: unknown;
        ignoreFragmentWarning?: boolean;
        optimizeSvgEncode?: boolean;
        basePath?: string | string[];
        assetsPath?: string;
        useHash?: boolean;
        hashOptions?: unknown;
    }
    const plugin: PluginCreator<UrlOptions>;
    export default plugin;
}
