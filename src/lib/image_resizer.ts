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

import { allocateCanvasOrError, validateCanvas } from "goban";

export function image_resizer(
    file: File,
    max_width: number,
    max_height: number,
    max_file_size: number,
): Promise<File> {
    if (!max_height) {
        max_height = max_width;
    }

    console.log(file);
    window.file = file;

    const reader = new FileReader();
    const image = new Image();
    const canvas = allocateCanvasOrError();

    return new Promise<File>((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            reject(new Error(`Unrecognized image format ${file.type}`));
            return;
        }

        reader.onload = (readerEvent: any) => {
            image.onload = () => {
                let width = image.width;
                let height = image.height;
                const aspect = width / height;

                if (width > max_width) {
                    width = max_width;
                    height = width / aspect;
                }
                if (height > max_height) {
                    width = Math.min(width, max_height * aspect);
                    height = width / aspect;
                }
                width = Math.floor(width);
                height = Math.floor(height);

                canvas.width = width;
                canvas.height = height;
                validateCanvas(canvas);
                canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
                canvas.toBlob((blob: Blob | null) => {
                    if (!blob) {
                        reject("Failed to convert canvas to blob");
                        return;
                    }

                    const new_filename = file.name.replace(
                        /(\.[^\.]+)$/,
                        "-resized." + (blob.type === "image/webp" ? "webp" : "png"),
                    );

                    const ret = new File([blob], new_filename, {
                        type: blob.type,
                        lastModified: file.lastModified,
                    });

                    console.log(`File size was ${ret.size}.`, ret);

                    if (max_file_size && ret.size > max_file_size) {
                        const scale = Math.sqrt(max_file_size / ret.size) * 0.9;
                        console.log(
                            `Target size was ${ret.size}. Resizing to ${width * scale}x${
                                height * scale
                            } scale = ${scale}`,
                        );
                        resolve(
                            image_resizer(
                                ret,
                                Math.max(1, Math.floor(width * scale)),
                                Math.max(1, Math.floor(height * scale)),
                                max_file_size,
                            ),
                        );
                    } else {
                        resolve(ret);
                    }
                }, "image/webp");
            };
            image.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
    });
}
