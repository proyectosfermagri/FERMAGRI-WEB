(function (global) {
    const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

    function stripHtml(value) {
        return String(value || '').replace(/<[^>]*>/g, ' ');
    }

    function normalizeText(value) {
        return stripHtml(value)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function normalizeCategory(value) {
        const normalized = normalizeText(value).replace(/-/g, ' ');
        if (normalized === 'edafico') return 'edaficos';
        if (normalized === 'master') return 'master protec';
        if (normalized === 'mezclas fisicas') return 'mezclas fisicas';
        return normalized;
    }

    function productName(product) {
        return stripHtml(product && product.nombre);
    }

    const hiddenPublicCategories = new Set([
        'organicos',
    ]);

    const mezclasFisicasNames = new Set([
        'nutricultivo siembra',
        'nutricultivo desarrollo',
        'nutricultivo cacao',
        'nutricultivo soca',
        'palmero gold',
        'fercacao gold',
        'platanero gold',
        '10-30-10 premiun',
        '8 -20-20 premiun',
        '8-20-20 premiun',
        '15-15-15 premiun',
        'siembra premiun',
        'desarrollo premiun',
        'nitrofos 32 premiun',
    ]);

    function normalizeProductNameForMatch(value) {
        return normalizeText(value)
            .replace(/premium/g, 'premiun')
            .replace(/\s+/g, ' ');
    }

    function isMezclaFisica(product) {
        return mezclasFisicasNames.has(normalizeProductNameForMatch(productName(product)));
    }

    function applyCatalogCategoryOverrides(product) {
        if (!product) return product;
        if (isMezclaFisica(product)) {
            return {
                ...product,
                categoria: 'Mezclas Físicas',
            };
        }

        return product;
    }

    function isProductVisible(product) {
        return !hiddenPublicCategories.has(normalizeCategory(product && product.categoria));
    }

    function filterVisibleProducts(products) {
        const list = Array.isArray(products) ? products : [];
        return list.filter(isProductVisible);
    }

    const categoryOrder = {
        'edaficos': 1,
        'mezclas fisicas': 2,
        'solubles': 3,
        'master protec': 4,
        'especializados': 5,
    };

    function compareByName(a, b) {
        return collator.compare(productName(a), productName(b));
    }

    function compareByCategoryThenName(a, b) {
        const categoryA = categoryOrder[normalizeCategory(a && a.categoria)] || 999;
        const categoryB = categoryOrder[normalizeCategory(b && b.categoria)] || 999;
        if (categoryA !== categoryB) return categoryA - categoryB;
        return compareByName(a, b);
    }

    function sortProductsForCatalog(products, activeCategory) {
        const category = normalizeCategory(activeCategory);
        const copy = Array.isArray(products) ? products.slice() : [];

        if (category === 'todos') {
            return copy.sort(compareByCategoryThenName);
        }

        return copy.sort(compareByName);
    }

    function filterProductsByCategory(products, category) {
        const normalizedCategory = normalizeCategory(category || 'Todos');
        const list = filterVisibleProducts(products);

        if (normalizedCategory === 'todos') return list.slice();

        return list.filter((product) => {
            return normalizeCategory(product && product.categoria) === normalizedCategory;
        });
    }

    global.catalogoUtils = {
        applyCatalogCategoryOverrides,
        filterProductsByCategory,
        filterVisibleProducts,
        normalizeCategory,
        normalizeText,
        sortProductsForCatalog,
    };
})(typeof window !== 'undefined' ? window : globalThis);
