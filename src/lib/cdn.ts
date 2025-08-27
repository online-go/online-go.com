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

/* Takes an image url or an image hash and returns a URL for the image.
 *
 * Background:
 * We are migrating between CDNs for our user uploaded images as well
 * as transitioning between storing full URLs for things like profile
 * pictures and other user uploaded images, to storing just the hash
 * and then constructing the URL from the hash.
 *
 * However we have a lot of stored full urls that are now invalid, this
 * function is a helper to handle both the case of rewriting the old
 * url scheme to the new one, and also to handle the case of taking
 * a hash and returning a URL for the image.
 */

const valid_sizes = [15, 16, 32, 64, 80, 96, 128, 256, 512];
type ImageSize = number | "original";

export function user_uploads_url(url_or_hash: string, size?: ImageSize): string;
export function user_uploads_url(url_or_hash: undefined, size?: ImageSize): null;
export function user_uploads_url(url_or_hash: null, size?: ImageSize): null;
export function user_uploads_url(
    url_or_hash: string | undefined | null,
    size: ImageSize = 64,
): string | null {
    if (!url_or_hash) {
        return null;
    }

    if (!url_or_hash.includes("rackcdn")) {
        return url_or_hash;
    }

    if (size !== "original" && !valid_sizes.includes(size as number)) {
        throw new Error(`Invalid size: ${size}`);
    }
    const hash = get_image_hash(url_or_hash);
    if (!hash) {
        console.warn("Invalid image url: ", url_or_hash);
        return url_or_hash;
    }

    if (size === "original") {
        return `https://user-uploads.online-go.com/${hash}.png`;
    }
    return `https://user-uploads.online-go.com/${hash}-${size}.png`;
}

function get_image_hash(url_or_hash: string): string | null {
    if (url_or_hash.startsWith("https://")) {
        const hash = url_or_hash.replace(".png", "").split("/").pop()?.split("-")[0];
        if (hash && /^[0-9a-fA-F]{16,32}$/.test(hash)) {
            return hash;
        }
    } else if (/^[0-9a-fA-F]{16,32}$/.test(url_or_hash)) {
        return url_or_hash;
    }

    return null;
}
