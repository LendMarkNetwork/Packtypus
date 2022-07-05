import { fetch } from 'undici';
import { readFile } from 'fs/promises';
import FormData from 'form-data';

const formData = new FormData();

const pack = await readFile('./pack.zip');
formData.append('pack', pack, 'pack.zip');
formData.append('id', 98989)

const res = await fetch('http://localhost:8080/upload', {
    method: 'POST',
    headers: {
        ...formData.getHeaders()
    },
    body: formData.getBuffer()
}).catch(() => {})

console.log((await res.json()))