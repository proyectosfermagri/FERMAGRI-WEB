import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadCatalogoUtils() {
  const source = fs.readFileSync('catalogo-utils.js', 'utf8');
  const context = { Intl };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.catalogoUtils;
}

test('filtra Edaficos por categoria estricta sin incluir Master Protec', () => {
  const utils = loadCatalogoUtils();
  const productos = [
    { nombre: 'Master Protec N40', categoria: 'Master Protec', descripcion: ['uso edafico'] },
    { nombre: 'Nutricultivo Siembra', categoria: 'Edáficos' },
    { nombre: 'Urea Granular', categoria: 'Edáficos' },
  ];

  const resultado = utils.filterProductsByCategory(productos, 'Edaficos');

  assert.deepEqual(resultado.map((p) => p.nombre), [
    'Nutricultivo Siembra',
    'Urea Granular',
  ]);
});

test('ordena Edaficos alfabeticamente dentro de su grupo', () => {
  const utils = loadCatalogoUtils();
  const productos = [
    { nombre: 'Urea Granular', categoria: 'Edáficos' },
    { nombre: 'DAP', categoria: 'Edáficos' },
    { nombre: 'MAP FOSFATO MONOAMÓNICO', categoria: 'Edáficos' },
    { nombre: 'ESTA KIESERIT', categoria: 'Edáficos' },
  ];

  const resultado = utils.sortProductsForCatalog(productos, 'Edaficos');

  assert.deepEqual(resultado.map((p) => p.nombre), [
    'DAP',
    'ESTA KIESERIT',
    'MAP FOSFATO MONOAMÓNICO',
    'Urea Granular',
  ]);
});

test('mantiene Master Protec en su propia categoria', () => {
  const utils = loadCatalogoUtils();
  const productos = [
    { nombre: 'Master Protec N35', categoria: 'Master Protec' },
    { nombre: 'Master Protec N40', categoria: 'Master Protec' },
    { nombre: 'Nutricultivo Desarrollo', categoria: 'Edáficos' },
  ];

  const resultado = utils.filterProductsByCategory(productos, 'Master Protec');

  assert.deepEqual(resultado.map((p) => p.nombre), [
    'Master Protec N35',
    'Master Protec N40',
  ]);
});

test('mueve mezclas fisicas fuera de Edaficos a su nueva categoria', () => {
  const utils = loadCatalogoUtils();
  const productos = [
    { nombre: 'Nutricultivo Siembra', categoria: 'Edáficos' },
    { nombre: 'Nutricultivo Desarrollo', categoria: 'Edáficos' },
    { nombre: 'Nutricultivo Cacao', categoria: 'Edáficos' },
    { nombre: 'Nutricultivo Soca', categoria: 'Edáficos' },
    { nombre: 'Palmero Gold', categoria: 'Edáficos' },
    { nombre: 'Fercacao Gold', categoria: 'Edáficos' },
    { nombre: 'Platanero Gold', categoria: 'Edáficos' },
    { nombre: '10-30-10 PREMIUN', categoria: 'Edáficos' },
    { nombre: '8 -20-20  PREMIUN', categoria: 'Edáficos' },
    { nombre: '15-15-15 PREMIUN', categoria: 'Edáficos' },
    { nombre: 'Siembra Premiun', categoria: 'Edáficos' },
    { nombre: 'Desarrollo Premiun', categoria: 'Edáficos' },
    { nombre: 'NITROFOS 32 PREMIUM', categoria: 'Edáficos' },
    { nombre: 'Urea Granular', categoria: 'Edáficos' },
  ].map((product) => utils.applyCatalogCategoryOverrides(product));

  assert.deepEqual(
    utils.filterProductsByCategory(productos, 'Edaficos').map((p) => p.nombre),
    ['Urea Granular']
  );

  assert.deepEqual(
    utils.sortProductsForCatalog(
      utils.filterProductsByCategory(productos, 'Mezclas Físicas'),
      'Mezclas Físicas'
    ).map((p) => p.nombre),
    [
      '8 -20-20  PREMIUN',
      '10-30-10 PREMIUN',
      '15-15-15 PREMIUN',
      'Desarrollo Premiun',
      'Fercacao Gold',
      'NITROFOS 32 PREMIUM',
      'Nutricultivo Cacao',
      'Nutricultivo Desarrollo',
      'Nutricultivo Siembra',
      'Nutricultivo Soca',
      'Palmero Gold',
      'Platanero Gold',
      'Siembra Premiun',
    ]
  );
});

test('oculta Organicos de las vistas publicas del catalogo sin borrar la categoria', () => {
  const utils = loadCatalogoUtils();
  const productos = [
    { nombre: 'MicroAlgae', categoria: 'Organicos' },
    { nombre: 'Humic+', categoria: 'Orgánicos' },
    { nombre: 'Urea Granular', categoria: 'Edáficos' },
  ];

  assert.deepEqual(
    utils.filterVisibleProducts(productos).map((p) => p.nombre),
    ['Urea Granular']
  );

  assert.deepEqual(
    utils.filterProductsByCategory(productos, 'Todos').map((p) => p.nombre),
    ['Urea Granular']
  );

  assert.deepEqual(
    utils.filterProductsByCategory(productos, 'Organicos').map((p) => p.nombre),
    []
  );
});
