import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

async function loader(fetch, timers = {}) {
    const window = {};
    vm.runInNewContext(await fs.readFile(new URL('../public-data.js', import.meta.url), 'utf8'), {
        window, fetch, AbortController, setTimeout, clearTimeout, URL, console, ...timers,
    });
    return window.fermagriData;
}
const snapshot = {version: 1, generated_at: '2026-09-30T00:00:00Z',
    productos: [{id: 7, nombre: 'Urea'}], slides: [{id: 1, title: 'Nobol', orden: 1}]};

test('catálogo y sliders usan una sola copia local sin contactar Supabase', async () => {
    const urls = [];
    const data = await loader(async url => { urls.push(url); return new Response(JSON.stringify(snapshot)); });
    const [products, slides] = await Promise.all([data.load('productos'), data.load('slides')]);
    assert.equal(products[0].nombre, 'Urea');
    assert.equal(slides[0].title, 'Nobol');
    assert.deepEqual(urls, ['data/catalogo.json']);
});
test('una lista vacía publicada es válida y no resucita registros remotos', async () => {
    const data = await loader(async () => new Response(JSON.stringify({...snapshot, slides: []})));
    assert.equal((await data.load('slides')).length, 0);
});
test('si falta o está corrupta la copia se consulta Supabase y se reporta su bloqueo', async () => {
    for (const bad of [new Response('missing', {status:404}), new Response('{}'), new Response(JSON.stringify({...snapshot,slides:[null]}))]) {
        let calls = 0;
        const data = await loader(async () => ++calls === 1 ? bad : new Response('{}', {status:402}));
        await assert.rejects(data.load('productos'), /402/);
        assert.equal(calls, 2);
    }
});
test('el fallback remoto funciona sin esperar a la librería de Supabase', async () => {
    let calls = 0;
    const data = await loader(async () => ++calls === 1
        ? new Response('missing', {status:404}) : new Response(JSON.stringify(snapshot.productos)));
    assert.equal((await data.load('productos'))[0].id, 7);
});
test('no permite solicitar tablas fuera del catálogo público', async () => {
    const data = await loader(() => { throw Error('No debería consultar la red'); });
    await assert.rejects(data.load('usuarios'), /Tabla/);
});
test('las peticiones tienen timeout y no esperan indefinidamente', async () => {
    let calls = 0;
    const data = await loader((url, {signal}) => {
        calls++;
        return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('timeout'))));
    }, {setTimeout: callback => setTimeout(callback, 5)});
    await assert.rejects(data.load('productos'), /timeout/);
    assert.equal(calls, 2);
});
