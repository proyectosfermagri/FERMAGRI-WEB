import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

test('el administrador no guarda una subida fallida y reintenta publicar sin duplicar filas', async () => {
    const html = await fs.readFile(new URL('../admin.html', import.meta.url), 'utf8');
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
    const elements = {};
    const element = id => elements[id] ||= {value:'',files:[],style:{},textContent:'',innerHTML:'',disabled:false};
    let writes = 0, publications = 0, uploadFails = true, publishFails = true, session = null;
    const sb = {
        auth: {getSession:async () => ({data:{session}}), onAuthStateChange(){}},
        from:() => ({insert:async () => {writes++; return {};},delete:() => ({eq:async () => {writes++; return {};}})})
    };
    const context = vm.createContext({
        window:{}, console, FormData, AbortSignal,
        document:{getElementById:element,querySelector:element},
        supabase:{createClient:()=>sb}, alert(){}, confirm:()=>true,
        fetch:async url => {
            if (url.includes('upload')) return new Response(JSON.stringify(uploadFails ? {error:'archivo rechazado'} : {url:'media/'+'a'.repeat(64)+'.pdf'}), {status:uploadFails?415:200});
            publications++;
            return new Response(JSON.stringify(publishFails ? {error:'Supabase bloqueado'} : {productos:64,slides:5}), {status:publishFails?503:200});
        },
    });
    vm.runInContext(script, context);
    await new Promise(resolve=>setImmediate(resolve)); // checkAuth inicial, sin sesión.
    session = {access_token:'admin'};
    context.loadProducts = context.loadSlides = () => {};
    const event = {preventDefault(){}};
    element('file-saco').files = [new Blob(['png'])];
    await context.saveProduct(event);
    assert.equal(writes, 0);
    assert.equal(element('btn-save').disabled, false);
    element('file-saco').files = [];
    await context.saveProduct(event);
    assert.equal(writes, 1);
    assert.equal(publications, 1);
    assert.match(element('publish-status').textContent, /Publicación pendiente/);
    publishFails = false;
    assert.equal(await context.publishCatalog(), true);
    assert.equal(writes, 1);
    assert.match(element('publish-status').textContent, /Publicado: 64/);
    element('file-slide').files = [new Blob(['png'])];
    await context.saveSlide(event);
    assert.equal(writes, 1);
    assert.equal(element('btn-save-slide').disabled, false);
    element('file-slide').files = [];
    await context.saveSlide(event);
    await context.deleteSlide(1);
    await context.deleteProduct(2);
    assert.equal(writes, 4);
    assert.equal(publications, 5);
    uploadFails = false;
    await context.uploadIndividualPDF({files:[new File(['%PDF-1.4'], 'ficha.pdf')], value:''}, 'p-ficha', 'label-ficha');
    assert.match(element('p-ficha').value, /^media\//);
    assert.match(element('label-ficha').innerHTML, /Listo/);
    assert.equal(writes, 4); // Vincular el PDF requiere guardar el producto.
});
