import express from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';
import toml from 'toml';
import { join } from 'node:path';
import { readFileSync, mkdirSync, existsSync, createReadStream } from 'node:fs';
import type { ConfigOptions } from './types/config';
import { getHash } from './utils/pack';

const config: ConfigOptions = toml.parse(
	readFileSync(join(__dirname, '..', 'config.toml')).toString(),
);

const app = express();
app.set('trust proxy', true);
app.use(fileUpload({
    limits: { fileSize: 100000000 },
    hashAlgorithm: 'sha1',
}));

app.post('/upload', async(req, res) => {
    const ip: string = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    
    if (!config.whitelistedIps.includes(ip)) return res.status(401).json({ message: "Bad request" });
    if (!req.files.pack) return res.status(401).json({ message: "Bad request" });

    const spigotId = req.body?.id;
    const pack: UploadedFile = req.files.pack as UploadedFile;

    // TODO: handle spigotId
    const hash = await getHash(pack);
    const resourcePath = join(__dirname, '..', 'storage', hash);

    if (!existsSync(resourcePath)) mkdirSync(resourcePath);

    pack.mv(join(resourcePath, 'pack.zip'), () => {
        console.log("Pack uploaded from " + ip + " on " + `${config.url}/pack.zip?id=${hash}` + " with hash " + hash);

        return res.status(200).json({
            url: `${config.url}/pack.zip?id=${hash}`,
            sha1: hash,
        })
    })
})

app.get('/pack.zip', (req, res) => {
    const id: string = (req.query as any)?.id as string;
    if (!id) return res.status(401).json({ message: "Bad request" });

    const resourcePath = join(__dirname, '..', 'storage', id);
    if (!existsSync(resourcePath)) return res.status(401).json({ message: "Bad request" });

    const zip = readFileSync(join(resourcePath, 'pack.zip'));

    res.set({
        'Content-Disposition': 'attachment; filename="pack.zip"',
        'Content-Type': 'application/zip',
        'Content-Length': zip.length,
    })
    res.end(zip);
})

app.listen(config.port, () => {
	console.log('???? Server is running on port ' + config.port);
});
