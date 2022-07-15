import express from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';
import toml from 'toml';
import { join } from 'node:path';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import type { ConfigOptions } from './types/config';
import { getHash } from './utils/pack';

const config: ConfigOptions = toml.parse(
	readFileSync(join(__dirname, '..', 'config.toml')).toString(),
);

const app = express();
app.set('trust proxy', true);
app.use(fileUpload({
    limits: { fileSize: 100000000 },
}));

app.post('/upload', (req, res) => {
    const ip: string = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    
    if (!config.whitelistedIps.includes(ip)) return res.status(401).json({ message: "Bad request" });
    if (!req.files.pack) return res.status(401).json({ message: "Bad request" });

    const spigotId = req.body?.id;
    const pack: UploadedFile = req.files.pack as UploadedFile;

    // TODO: handle spigotId
    const hash = getHash(pack.data.toString());
    const resourcePath = join(__dirname, '..', 'storage', hash);

    if (!existsSync(resourcePath)) mkdirSync(resourcePath);

    pack.mv(join(resourcePath, 'pack.zip'), () => {
        return res.status(200).json({
            url: `${config.url}pack.zip?id=${hash}`,
            sha1: hash,
        })
    })
        console.log("Pack uploaded from " + ip + " on " + `${config.url}pack.zip?id=${hash}`)
})

app.get('/pack.zip', (req, res) => {
    const id: string = (req.query as any)?.id as string;
    if (!id) return res.status(401).json({ message: "Bad request" });

    const resourcePath = join(__dirname, '..', 'storage', id);
    if (!existsSync(resourcePath)) return res.status(401).json({ message: "Bad request" });

    res.setHeader('content-type', 'application/zip');
    res.end(readFileSync(join(resourcePath, 'pack.zip')));
})

app.listen(config.port, () => {
	console.log('🚀 Server is running on port ' + config.port);
});
