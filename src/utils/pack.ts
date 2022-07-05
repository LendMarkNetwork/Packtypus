import crypto from 'crypto';

export const getHash = (pack: string) => {
    const hash = crypto.createHash('sha1').update(pack).digest('hex');
    return hash
}