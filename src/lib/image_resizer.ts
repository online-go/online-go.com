/*
 * Copyright (C) 2012-2017  Online-Go.com
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

interface IResizeImageOptions {
    maxSize: number;
    file: File;
}

export function image_resizer(file: File, max_width: number, max_height?: number): Promise<File> {
    if (!max_height) {
        max_height = max_width;
    }

    console.log(file);
    window["file"] = file;

    const reader = new FileReader();
    const image = new Image();
    const canvas = document.createElement("canvas");
    const dataURItoBlob = (dataURI: string) => {
        const bytes = dataURI.split(",")[0].indexOf("base64") >= 0 ?
            atob(dataURI.split(",")[1]) :
            decodeURIComponent(dataURI.split(",")[1]);
        const mime = dataURI.split(",")[0].split(":")[1].split(";")[0];
        const max = bytes.length;
        const ia = new Uint8Array(max);
        for (let i = 0; i < max; i++) {
            ia[i] = bytes.charCodeAt(i);
        }
        return new Blob([ia], {type: mime});
    };
    const resize = (): File => {
        let width = image.width;
        let height = image.height;
        let aspect = width / height;

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
        canvas.getContext("2d").drawImage(image, 0, 0, width, height);
        let dataUrl = canvas.toDataURL("image/png");
        let blob: any = dataURItoBlob(dataUrl);
        //blob.lastModifiedDate = file.lastModifiedDate;
        blob.lastModified = file.lastModified;
        blob.name = file.name;
        return blob as File;
    };

    return new Promise<File>((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            reject(new Error(`Unrecognized image format ${file.type}`));
            return;
        }

        reader.onload = (readerEvent: any) => {
            image.onload = () => resolve(resize());
            image.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
    });
}
