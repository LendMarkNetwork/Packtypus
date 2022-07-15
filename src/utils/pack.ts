import type { UploadedFile } from 'express-fileupload';

export const getHash = (pack: UploadedFile) => {
    // @ts-expect-error types are not correct
    return pack.sha1;
}