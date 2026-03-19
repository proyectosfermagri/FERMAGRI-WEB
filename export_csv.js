const fs = require('fs');
let content = fs.readFileSync('productos.js', 'utf8');

// Preparar el string para poder evaluarlo
let jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
let listadoProductos = eval(jsonStr);

let csv = 'ID,Nombre,Categoria,Imagen Saco,Imagen Textura,Descripcion,Dosis,Concentracion,Presentacion,Ficha PDF,Seguridad PDF\n';

listadoProductos.forEach(p => {
    let desc = p.descripcion.join('\n\n').replace(/"/g, '""');
    let row = [
        p.id,
        `"${p.nombre}"`,
        `"${p.categoria}"`,
        `"${p.imagen}"`,
        `"${p.textura}"`,
        `"${desc}"`,
        `"${p.dosis}"`,
        `"${p.concentracion}"`,
        `"${p.presentacion}"`,
        `"${p.ficha}"`,
        `"${p.seguridad}"`
    ];
    csv += row.join(',') + '\n';
});

fs.writeFileSync('Productos_Fermagri.csv', csv);
console.log('CSV Exported successfully.');
