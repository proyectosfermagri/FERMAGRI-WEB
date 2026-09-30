import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

test('API real: sesión, permisos, MIME, subida, publicación y preservación ante 402', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fermagri-http-'));
    let blocked = false;
    const upstream = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.headers.authorization === 'Bearer expired') {
            res.writeHead(401).end('{}');
        } else if (req.url === '/auth/v1/user') {
            res.end(JSON.stringify({id: req.headers.authorization === 'Bearer admin' ? 'allowed-id' : 'other-id'}));
        } else if (blocked) {
            res.writeHead(402).end('{}');
        } else if (req.headers.range !== '0-999') {
            res.end('[]');
        } else {
            res.end(JSON.stringify(req.url.startsWith('/rest/v1/productos')
                ? [{id:1,nombre:'Urea',formula_interna:'secret'}, {id:2,nombre:'Humic',categoria:'Orgánicos'}]
                : [{id:1,title:'Slide',orden:1}]));
        }
    }).listen(0, '127.0.0.1');
    await once(upstream, 'listening');
    const reservation = http.createServer().listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    const port = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));
    let php;
    try {
        await fs.cp(new URL('../api', import.meta.url), path.join(root, 'api'), {recursive:true, filter: src=>!src.endsWith('/config.php')});
        await fs.mkdir(path.join(root, 'media'));
        await fs.mkdir(path.join(root, 'data'));
        await fs.writeFile(path.join(root, 'api/config.php'), `<?php return [
            'supabase_url'=>'http://127.0.0.1:${upstream.address().port}',
            'supabase_key'=>'test-public-key', 'admin_ids'=>['allowed-id'], 'site_origin'=>'https://fermagri.com'];`);
        php = spawn(process.env.PHP_BIN || 'php', ['-S', `127.0.0.1:${port}`, '-t', root]);
        await new Promise((resolve, reject) => {
            php.once('error', reject);
            php.once('exit', code => reject(Error('PHP terminó: ' + code)));
            php.stderr.on('data', data => { if (data.toString().includes('Development Server')) resolve(); });
        });
        const request = (action, token='admin', body, origin='https://fermagri.com') => fetch(`http://127.0.0.1:${port}/api/catalog.php?action=${action}`, {
            method:'POST', headers:{Origin:origin, ...(token ? {Authorization:'Bearer ' + token} : {})}, body,
        });
        assert.equal((await request('publish', '')).status, 401);
        assert.equal((await request('publish', 'expired')).status, 401);
        assert.equal((await request('publish', 'other')).status, 403);
        assert.equal((await request('publish', 'admin', undefined, 'https://evil.example')).status, 403);
        assert.equal((await request('upload')).status, 422);
        const bad = new FormData();
        bad.append('file', new Blob(['<?php echo "bad"; ?>']), 'x.php');
        assert.equal((await request('upload', 'admin', bad)).status, 415);
        const pdf = new FormData();
        pdf.append('file', new Blob(['%PDF-1.4\n%%EOF'], {type:'application/pdf'}), '../../x.php');
        const uploaded = await request('upload', 'admin', pdf);
        assert.equal(uploaded.status, 200);
        const {url} = await uploaded.json();
        assert.match(url, /^media\/[a-f0-9]{64}\.pdf$/);
        assert.equal(await fs.readFile(path.join(root, url), 'utf8'), '%PDF-1.4\n%%EOF');
        assert.equal((await request('publish')).status, 200);
        const before = await fs.readFile(path.join(root, 'data/catalogo.json'), 'utf8');
        const data = JSON.parse(before);
        assert.equal(data.productos.length, 1);
        assert.equal(data.productos[0].formula_interna, undefined);
        assert.equal(data.slides.length, 1);
        blocked = true;
        assert.equal((await request('publish')).status, 503);
        assert.equal(await fs.readFile(path.join(root, 'data/catalogo.json'), 'utf8'), before);
        blocked = false;
        await fs.writeFile(path.join(root, 'data/media-map.json'), JSON.stringify({'old-url':'media/'+'a'.repeat(64)+'.webp'}));
        assert.equal((await request('publish')).status, 500);
        assert.equal(await fs.readFile(path.join(root, 'data/catalogo.json'), 'utf8'), before);
    } finally {
        if (php && php.exitCode === null) { php.kill(); await once(php, 'exit'); }
        upstream.closeAllConnections();
        await new Promise(resolve => upstream.close(resolve));
        await fs.rm(root, {recursive:true, force:true});
    }
});
