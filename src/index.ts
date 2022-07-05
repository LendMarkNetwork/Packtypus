import express from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';
import toml from 'toml';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import type { ConfigOptions } from './types/config';

const config: ConfigOptions = toml.parse(
	readFileSync(join(__dirname, '..', 'config.toml')).toString(),
);

const app = express();
app.set('trust proxy', true);
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));

app.post('/upload', (req, res) => {
    const ip: string = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    if (!config.whitelistedIps.includes(ip)) return res.status(401).json({ message: "Bad request" });
    if (!req.files.pack) return res.status(401).json({ message: "Bad request" });

    const spigotId = req.body.id;
    const pack: UploadedFile = req.files.pack as UploadedFile;

    // TODO: Finish url, sha1

    pack.mv(join(__dirname, '..', 'resources', 'pack.zip'), () => {
        return res.status(200).json({
            url: "",
            sha1: "",
        })
    })
})

app.get('/download', (req, res) => {
    // TODO: finish download
})

app.listen(config.port, () => {
	console.log('🚀 Server is running on port 8989');
});
